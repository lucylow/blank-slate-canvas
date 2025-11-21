-- Race sessions table
CREATE TABLE IF NOT EXISTS race_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id VARCHAR(50) NOT NULL,
  track_name VARCHAR(100) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_laps INT NOT NULL,
  conditions VARCHAR(255),
  weather_temp DECIMAL(5,1),
  track_temp DECIMAL(5,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver telemetry data
CREATE TABLE IF NOT EXISTS driver_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_session_id UUID REFERENCES race_sessions(id) ON DELETE CASCADE,
  car_number INT NOT NULL,
  lap_number INT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  speed DECIMAL(6,1),
  throttle_position DECIMAL(5,2),
  brake_pressure DECIMAL(5,2),
  lateral_g DECIMAL(4,2),
  longitudinal_g DECIMAL(4,2),
  tire_temp_front_left INT,
  tire_temp_front_right INT,
  tire_temp_rear_left INT,
  tire_temp_rear_right INT,
  tire_pressure_fl DECIMAL(5,2),
  tire_pressure_fr DECIMAL(5,2),
  tire_pressure_rl DECIMAL(5,2),
  tire_pressure_rr DECIMAL(5,2),
  steering_angle DECIMAL(6,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_race_car ON driver_telemetry(race_session_id, car_number);
CREATE INDEX IF NOT EXISTS idx_telemetry_lap ON driver_telemetry(race_session_id, lap_number);

-- Tire predictions from AI
CREATE TABLE IF NOT EXISTS tire_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_session_id UUID REFERENCES race_sessions(id) ON DELETE CASCADE,
  car_number INT NOT NULL,
  lap_number INT NOT NULL,
  wear_percent DECIMAL(5,2) NOT NULL,
  laps_until_cliff INT,
  confidence DECIMAL(3,2),
  sector_1_wear DECIMAL(5,2),
  sector_2_wear DECIMAL(5,2),
  sector_3_wear DECIMAL(5,2),
  top_factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prediction ON tire_predictions(race_session_id, car_number, lap_number);

-- Pit recommendations
CREATE TABLE IF NOT EXISTS pit_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_session_id UUID REFERENCES race_sessions(id) ON DELETE CASCADE,
  car_number INT NOT NULL,
  current_lap INT NOT NULL,
  recommended_pit_lap INT NOT NULL,
  window_start INT,
  window_end INT,
  probability DECIMAL(3,2),
  risk_level VARCHAR(20),
  time_saved_sec DECIMAL(5,2),
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendation ON pit_recommendations(race_session_id, car_number);

-- Driver profiles
CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_number INT UNIQUE NOT NULL,
  consistency_score DECIMAL(5,2),
  peak_pace_lap INT,
  avg_lap_time DECIMAL(7,3),
  fastest_lap_time DECIMAL(7,3),
  brake_aggression DECIMAL(3,2),
  throttle_smoothness DECIMAL(3,2),
  strongest_sector VARCHAR(20),
  weakest_sector VARCHAR(20),
  coaching_tip TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API request logs for monitoring
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  request_body JSONB,
  response_code INT,
  latency_ms INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_endpoint_time ON api_logs(endpoint, created_at);

-- Enable RLS for all tables
ALTER TABLE race_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE tire_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pit_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (hackathon demo purposes)
CREATE POLICY "Public read access" ON race_sessions FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON race_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON driver_telemetry FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON driver_telemetry FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON tire_predictions FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON tire_predictions FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON pit_recommendations FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON pit_recommendations FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON driver_profiles FOR SELECT USING (true);
CREATE POLICY "Public insert/update access" ON driver_profiles FOR ALL USING (true);

CREATE POLICY "Public read access" ON api_logs FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON api_logs FOR INSERT WITH CHECK (true);