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

    const { telemetry, session_id } = await req.json();

    if (!telemetry || !telemetry.car_number) {
      throw new Error('Missing required telemetry data');
    }

    // Insert telemetry data
    const { data: telemetryData, error: telemetryError } = await supabase
      .from('driver_telemetry')
      .insert({
        race_session_id: session_id,
        car_number: telemetry.car_number,
        lap_number: telemetry.lap_number,
        speed: telemetry.speed,
        throttle_position: telemetry.throttle_position,
        brake_pressure: telemetry.brake_pressure,
        lateral_g: telemetry.lateral_g,
        longitudinal_g: telemetry.longitudinal_g,
        tire_temp_front_left: telemetry.tire_temp_front_left,
        tire_temp_front_right: telemetry.tire_temp_front_right,
        tire_temp_rear_left: telemetry.tire_temp_rear_left,
        tire_temp_rear_right: telemetry.tire_temp_rear_right,
        tire_pressure_fl: telemetry.tire_pressure_fl,
        tire_pressure_fr: telemetry.tire_pressure_fr,
        tire_pressure_rl: telemetry.tire_pressure_rl,
        tire_pressure_rr: telemetry.tire_pressure_rr,
        steering_angle: telemetry.steering_angle,
      })
      .select()
      .single();

    if (telemetryError) {
      console.error('Telemetry insert error:', telemetryError);
      throw telemetryError;
    }

    // Calculate real-time analytics
    const analytics = await calculateRealtimeAnalytics(supabase, telemetry.car_number, telemetry.lap_number, session_id);

    // Broadcast to real-time channel
    await supabase.channel('telemetry-updates').send({
      type: 'broadcast',
      event: 'telemetry-processed',
      payload: {
        telemetry: telemetryData,
        analytics,
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        telemetry: telemetryData,
        analytics,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing telemetry:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function calculateRealtimeAnalytics(supabase: any, carNumber: number, lapNumber: number, sessionId: string) {
  // Get recent telemetry for this car
  const { data: recentTelemetry } = await supabase
    .from('driver_telemetry')
    .select('*')
    .eq('car_number', carNumber)
    .eq('race_session_id', sessionId)
    .gte('lap_number', Math.max(1, lapNumber - 5))
    .order('timestamp', { ascending: false })
    .limit(100);

  if (!recentTelemetry || recentTelemetry.length === 0) {
    return null;
  }

  // Calculate averages and trends
  const avgSpeed = recentTelemetry.reduce((sum: number, t: any) => sum + (t.speed || 0), 0) / recentTelemetry.length;
  const avgThrottle = recentTelemetry.reduce((sum: number, t: any) => sum + (t.throttle_position || 0), 0) / recentTelemetry.length;
  const avgBrake = recentTelemetry.reduce((sum: number, t: any) => sum + (t.brake_pressure || 0), 0) / recentTelemetry.length;
  
  const avgTireTemp = (
    recentTelemetry.reduce((sum: number, t: any) => sum + (t.tire_temp_front_left || 0) + (t.tire_temp_front_right || 0) + 
                                            (t.tire_temp_rear_left || 0) + (t.tire_temp_rear_right || 0), 0) / 
    (recentTelemetry.length * 4)
  );

  return {
    car_number: carNumber,
    lap_number: lapNumber,
    avg_speed: Math.round(avgSpeed * 10) / 10,
    avg_throttle: Math.round(avgThrottle * 100) / 100,
    avg_brake: Math.round(avgBrake * 100) / 100,
    avg_tire_temp: Math.round(avgTireTemp),
    data_points: recentTelemetry.length,
    calculated_at: new Date().toISOString(),
  };
}
