import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { session_id, car_number, metrics } = await req.json();

    if (!session_id) {
      throw new Error('Missing session_id');
    }

    // Get session info
    const { data: session } = await supabase
      .from('race_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (!session) {
      throw new Error('Session not found');
    }

    // Aggregate telemetry data
    const aggregated = await aggregateTelemetryData(supabase, session_id, car_number, metrics);

    // Analyze tire wear trends
    const tireAnalysis = await analyzeTireWear(supabase, session_id, car_number);

    // Generate pit recommendations
    const pitRecommendations = await generatePitRecommendations(supabase, session_id, car_number, tireAnalysis);

    // Calculate driver performance metrics
    const driverMetrics = await calculateDriverMetrics(supabase, session_id, car_number);

    const response = {
      session_id,
      car_number,
      aggregated_telemetry: aggregated,
      tire_analysis: tireAnalysis,
      pit_recommendations: pitRecommendations,
      driver_metrics: driverMetrics,
      timestamp: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analytics aggregator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function aggregateTelemetryData(supabase: any, sessionId: string, carNumber?: number, metrics?: string[]) {
  let query = supabase
    .from('driver_telemetry')
    .select('*')
    .eq('race_session_id', sessionId);

  if (carNumber) {
    query = query.eq('car_number', carNumber);
  }

  const { data: telemetry } = await query.order('timestamp', { ascending: false }).limit(1000);

  if (!telemetry || telemetry.length === 0) {
    return null;
  }

  // Group by lap
  const lapData = telemetry.reduce((acc, t) => {
    if (!acc[t.lap_number]) {
      acc[t.lap_number] = [];
    }
    acc[t.lap_number].push(t);
    return acc;
  }, {} as Record<number, any[]>);

  // Calculate per-lap statistics
  const lapStats = Object.entries(lapData).map(([lap, data]) => ({
    lap: parseInt(lap),
    avg_speed: data.reduce((sum, d) => sum + (d.speed || 0), 0) / data.length,
    max_speed: Math.max(...data.map(d => d.speed || 0)),
    avg_throttle: data.reduce((sum, d) => sum + (d.throttle_position || 0), 0) / data.length,
    avg_brake: data.reduce((sum, d) => sum + (d.brake_pressure || 0), 0) / data.length,
    max_lateral_g: Math.max(...data.map(d => Math.abs(d.lateral_g || 0))),
    max_longitudinal_g: Math.max(...data.map(d => Math.abs(d.longitudinal_g || 0))),
    avg_tire_temp: data.reduce((sum, d) => 
      sum + ((d.tire_temp_front_left || 0) + (d.tire_temp_front_right || 0) + 
             (d.tire_temp_rear_left || 0) + (d.tire_temp_rear_right || 0)) / 4, 0
    ) / data.length,
    data_points: data.length,
  }));

  return {
    total_laps: Object.keys(lapData).length,
    total_data_points: telemetry.length,
    lap_statistics: lapStats,
    overall: {
      avg_speed: lapStats.reduce((sum, l) => sum + l.avg_speed, 0) / lapStats.length,
      peak_speed: Math.max(...lapStats.map(l => l.max_speed)),
      avg_tire_temp: lapStats.reduce((sum, l) => sum + l.avg_tire_temp, 0) / lapStats.length,
    },
  };
}

async function analyzeTireWear(supabase: any, sessionId: string, carNumber?: number) {
  let query = supabase
    .from('tire_predictions')
    .select('*')
    .eq('race_session_id', sessionId);

  if (carNumber) {
    query = query.eq('car_number', carNumber);
  }

  const { data: predictions } = await query.order('lap_number', { ascending: true });

  if (!predictions || predictions.length === 0) {
    return null;
  }

  // Analyze wear trends
  const wearProgression = predictions.map(p => ({
    lap: p.lap_number,
    wear_percent: p.wear_percent,
    laps_until_cliff: p.laps_until_cliff,
    confidence: p.confidence,
  }));

  // Calculate wear rate
  const wearRate = predictions.length > 1 
    ? (predictions[predictions.length - 1].wear_percent - predictions[0].wear_percent) / predictions.length
    : 0;

  return {
    current_wear: predictions[predictions.length - 1].wear_percent,
    wear_rate_per_lap: Math.round(wearRate * 100) / 100,
    estimated_cliff_lap: predictions[predictions.length - 1].laps_until_cliff 
      ? predictions[predictions.length - 1].lap_number + predictions[predictions.length - 1].laps_until_cliff
      : null,
    wear_progression: wearProgression,
    prediction_count: predictions.length,
  };
}

async function generatePitRecommendations(supabase: any, sessionId: string, carNumber?: number, tireAnalysis?: any) {
  if (!tireAnalysis || !tireAnalysis.estimated_cliff_lap) {
    return null;
  }

  const { data: session } = await supabase
    .from('race_sessions')
    .select('total_laps')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return null;
  }

  const currentLap = tireAnalysis.wear_progression[tireAnalysis.wear_progression.length - 1].lap;
  const cliffLap = tireAnalysis.estimated_cliff_lap;
  const totalLaps = session.total_laps;

  // Calculate optimal pit window
  const optimalPitStart = Math.max(currentLap + 1, cliffLap - 3);
  const optimalPitEnd = Math.min(cliffLap + 1, totalLaps - 2);

  return {
    recommended_pit_lap: Math.round((optimalPitStart + optimalPitEnd) / 2),
    window_start: optimalPitStart,
    window_end: optimalPitEnd,
    urgency: cliffLap - currentLap <= 3 ? 'high' : cliffLap - currentLap <= 5 ? 'medium' : 'low',
    reason: `Tire cliff estimated at lap ${cliffLap}. Current wear: ${tireAnalysis.current_wear}%`,
  };
}

async function calculateDriverMetrics(supabase: any, sessionId: string, carNumber?: number) {
  let query = supabase
    .from('driver_telemetry')
    .select('*')
    .eq('race_session_id', sessionId);

  if (carNumber) {
    query = query.eq('car_number', carNumber);
  }

  const { data: telemetry } = await query.order('timestamp', { ascending: false }).limit(500);

  if (!telemetry || telemetry.length === 0) {
    return null;
  }

  // Calculate smoothness metrics
  const throttleChanges = telemetry.slice(0, -1).map((t, i) => 
    Math.abs((t.throttle_position || 0) - (telemetry[i + 1].throttle_position || 0))
  );
  const brakeChanges = telemetry.slice(0, -1).map((t, i) => 
    Math.abs((t.brake_pressure || 0) - (telemetry[i + 1].brake_pressure || 0))
  );

  const throttleSmoothness = 1 - (throttleChanges.reduce((sum, c) => sum + c, 0) / throttleChanges.length);
  const brakeSmoothness = 1 - (brakeChanges.reduce((sum, c) => sum + c, 0) / brakeChanges.length / 100);

  // Calculate aggression metrics
  const hardBraking = telemetry.filter(t => (t.brake_pressure || 0) > 80).length / telemetry.length;
  const highGForce = telemetry.filter(t => 
    Math.abs(t.lateral_g || 0) > 1.5 || Math.abs(t.longitudinal_g || 0) > 1.5
  ).length / telemetry.length;

  return {
    throttle_smoothness: Math.round(Math.max(0, Math.min(1, throttleSmoothness)) * 100) / 100,
    brake_smoothness: Math.round(Math.max(0, Math.min(1, brakeSmoothness)) * 100) / 100,
    aggression_score: Math.round((hardBraking + highGForce) * 50) / 100,
    data_points_analyzed: telemetry.length,
  };
}
