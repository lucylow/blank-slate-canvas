-- Fix search_path security warnings for database functions
CREATE OR REPLACE FUNCTION get_lap_statistics(
  p_session_id UUID,
  p_car_number INTEGER,
  p_lap_number INTEGER
)
RETURNS TABLE (
  avg_speed NUMERIC,
  max_speed NUMERIC,
  avg_throttle NUMERIC,
  avg_brake NUMERIC,
  max_lateral_g NUMERIC,
  max_longitudinal_g NUMERIC,
  avg_tire_temp NUMERIC,
  data_points BIGINT
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(speed)::NUMERIC AS avg_speed,
    MAX(speed)::NUMERIC AS max_speed,
    AVG(throttle_position)::NUMERIC AS avg_throttle,
    AVG(brake_pressure)::NUMERIC AS avg_brake,
    MAX(ABS(lateral_g))::NUMERIC AS max_lateral_g,
    MAX(ABS(longitudinal_g))::NUMERIC AS max_longitudinal_g,
    AVG((tire_temp_front_left + tire_temp_front_right + tire_temp_rear_left + tire_temp_rear_right) / 4.0)::NUMERIC AS avg_tire_temp,
    COUNT(*)::BIGINT AS data_points
  FROM driver_telemetry
  WHERE race_session_id = p_session_id
    AND car_number = p_car_number
    AND lap_number = p_lap_number;
END;
$$;

CREATE OR REPLACE FUNCTION analyze_tire_degradation(
  p_session_id UUID,
  p_car_number INTEGER
)
RETURNS TABLE (
  lap_number INTEGER,
  wear_percent NUMERIC,
  wear_rate NUMERIC,
  laps_until_cliff INTEGER,
  confidence NUMERIC
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH wear_data AS (
    SELECT
      tp.lap_number,
      tp.wear_percent,
      LAG(tp.wear_percent) OVER (ORDER BY tp.lap_number) AS prev_wear,
      tp.laps_until_cliff,
      tp.confidence
    FROM tire_predictions tp
    WHERE tp.race_session_id = p_session_id
      AND tp.car_number = p_car_number
    ORDER BY tp.lap_number
  )
  SELECT
    wd.lap_number,
    wd.wear_percent,
    COALESCE(wd.wear_percent - wd.prev_wear, 0)::NUMERIC AS wear_rate,
    wd.laps_until_cliff,
    wd.confidence
  FROM wear_data wd;
END;
$$;

CREATE OR REPLACE FUNCTION compare_drivers_realtime(
  p_session_id UUID,
  p_car_numbers INTEGER[]
)
RETURNS TABLE (
  car_number INTEGER,
  avg_speed NUMERIC,
  avg_lap_time NUMERIC,
  consistency_score NUMERIC,
  tire_wear NUMERIC,
  position_estimate INTEGER
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH driver_stats AS (
    SELECT
      dt.car_number,
      AVG(dt.speed)::NUMERIC AS avg_speed,
      COUNT(DISTINCT dt.lap_number)::NUMERIC AS total_laps
    FROM driver_telemetry dt
    WHERE dt.race_session_id = p_session_id
      AND dt.car_number = ANY(p_car_numbers)
    GROUP BY dt.car_number
  ),
  tire_stats AS (
    SELECT
      tp.car_number,
      MAX(tp.wear_percent)::NUMERIC AS current_wear
    FROM tire_predictions tp
    WHERE tp.race_session_id = p_session_id
      AND tp.car_number = ANY(p_car_numbers)
    GROUP BY tp.car_number
  )
  SELECT
    ds.car_number,
    ds.avg_speed,
    NULL::NUMERIC AS avg_lap_time,
    0.85::NUMERIC AS consistency_score,
    COALESCE(ts.current_wear, 0)::NUMERIC AS tire_wear,
    ROW_NUMBER() OVER (ORDER BY ds.avg_speed DESC)::INTEGER AS position_estimate
  FROM driver_stats ds
  LEFT JOIN tire_stats ts ON ds.car_number = ts.car_number
  ORDER BY ds.avg_speed DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_session_summary(p_session_id UUID)
RETURNS TABLE (
  total_laps INTEGER,
  active_cars INTEGER,
  total_telemetry_points BIGINT,
  total_predictions INTEGER,
  session_duration INTERVAL
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT total_laps FROM race_sessions WHERE id = p_session_id),
    (SELECT COUNT(DISTINCT car_number)::INTEGER FROM driver_telemetry WHERE race_session_id = p_session_id),
    (SELECT COUNT(*)::BIGINT FROM driver_telemetry WHERE race_session_id = p_session_id),
    (SELECT COUNT(*)::INTEGER FROM tire_predictions WHERE race_session_id = p_session_id),
    (SELECT MAX(timestamp) - MIN(timestamp) FROM driver_telemetry WHERE race_session_id = p_session_id);
END;
$$;