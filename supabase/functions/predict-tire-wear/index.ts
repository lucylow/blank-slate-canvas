import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Environment variable validation
function getEnvVar(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Create Supabase client with validation
function createSupabaseClient() {
  const url = getEnvVar('SUPABASE_URL');
  const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();
  
  try {
    // Validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { car_number, track_id, current_lap, telemetry_data } = requestBody;

    // Validate required fields
    if (!car_number || !track_id || !current_lap || !telemetry_data) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['car_number', 'track_id', 'current_lap', 'telemetry_data']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate environment variables
    const LOVABLE_API_KEY = getEnvVar('LOVABLE_API_KEY');

    // Call Lovable AI for tire wear prediction
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert motorsports tire engineer. Analyze telemetry and predict tire wear. Always respond with valid JSON only, no markdown.'
          },
          {
            role: 'user',
            content: `Analyze this telemetry data and predict tire wear:
- Speed: ${telemetry_data.speed} kph
- Throttle: ${telemetry_data.throttle_position}%
- Brake Pressure: ${telemetry_data.brake_pressure} bar
- Lateral G: ${telemetry_data.lateral_g}G
- Longitudinal G: ${telemetry_data.longitudinal_g}G
- Tire Temperature: ${telemetry_data.tire_temp}°C
- Tire Pressure: ${telemetry_data.tire_pressure} psi
- Current Lap: ${current_lap}/15
- Track: ${track_id}

Predict:
1. Current tire wear percentage (0-100)
2. Laps until performance cliff (>85% wear)
3. Confidence (0-1)
4. Per-sector breakdown (S1/S2/S3)
5. Top 3 factors affecting wear with impact scores

Respond ONLY with valid JSON:
{
  "tire_wear_percent": <number>,
  "laps_until_cliff": <number>,
  "confidence": <number>,
  "top_factors": [{"factor": "name", "impact": <0-1>, "current_value": "value"}],
  "sector_analysis": {"sector_1": "percent + description", "sector_2": "percent + description", "sector_3": "percent + description"}
}`
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const data = await aiResponse.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from response (handle potential markdown formatting)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    const prediction = JSON.parse(jsonMatch[0]);

    // Transform to match TirePredictionResponse interface
    const response = {
      chassis: `car-${car_number}`,
      track: track_id,
      predicted_loss_per_lap_s: prediction.tire_wear_percent / 100, // Convert percent to seconds approximation
      laps_until_0_5s_loss: prediction.laps_until_cliff || 10,
      recommended_pit_lap: current_lap + (prediction.laps_until_cliff || 10),
      feature_scores: prediction.top_factors?.map((f: { factor?: string; impact?: number }) => ({
        name: f.factor || 'unknown',
        score: f.impact || 0
      })) || [],
      explanation: [
        `Tire wear: ${prediction.tire_wear_percent}%`,
        prediction.sector_analysis?.sector_1 || '',
        prediction.sector_analysis?.sector_2 || '',
        prediction.sector_analysis?.sector_3 || ''
      ].filter(Boolean),
      meta: {
        model_version: 'gemini-2.5-flash',
        generated_at: new Date().toISOString(),
        demo: false,
        confidence: prediction.confidence
      }
    };

    // Store in database
    const supabase = createSupabaseClient();

    // Insert prediction with error handling
    const { error: insertError } = await supabase.from('tire_predictions').insert({
      car_number,
      lap_number: current_lap,
      wear_percent: prediction.tire_wear_percent,
      laps_until_cliff: prediction.laps_until_cliff,
      confidence: prediction.confidence,
      sector_1_wear: parseFloat(prediction.sector_analysis?.sector_1?.match(/[\d.]+/)?.[0] || '0'),
      sector_2_wear: parseFloat(prediction.sector_analysis?.sector_2?.match(/[\d.]+/)?.[0] || '0'),
      sector_3_wear: parseFloat(prediction.sector_analysis?.sector_3?.match(/[\d.]+/)?.[0] || '0'),
      top_factors: prediction.top_factors,
    });

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Don't fail the request if logging fails
    }

    // Log API call (non-blocking)
    const latency = Date.now() - startTime;
    supabase.from('api_logs').insert({
      endpoint: '/predict-tire-wear',
      method: 'POST',
      request_body: { car_number, track_id, current_lap },
      response_code: 200,
      latency_ms: latency,
    }).catch((error) => {
      console.error('Failed to log API call:', error);
    });

    console.log(`Tire prediction completed in ${latency}ms`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Tire prediction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Prediction failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
