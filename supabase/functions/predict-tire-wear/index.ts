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

  const startTime = Date.now();
  
  try {
    const { car_number, track_id, current_lap, telemetry_data } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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

    // Store in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: insertError } = await supabase.from('tire_predictions').insert({
      car_number,
      lap_number: current_lap,
      wear_percent: prediction.tire_wear_percent,
      laps_until_cliff: prediction.laps_until_cliff,
      confidence: prediction.confidence,
      sector_1_wear: parseFloat(prediction.sector_analysis.sector_1.match(/[\d.]+/)?.[0] || '0'),
      sector_2_wear: parseFloat(prediction.sector_analysis.sector_2.match(/[\d.]+/)?.[0] || '0'),
      sector_3_wear: parseFloat(prediction.sector_analysis.sector_3.match(/[\d.]+/)?.[0] || '0'),
      top_factors: prediction.top_factors,
    });

    if (insertError) {
      console.error('Database insert error:', insertError);
    }

    // Log API call
    const latency = Date.now() - startTime;
    await supabase.from('api_logs').insert({
      endpoint: '/predict-tire-wear',
      method: 'POST',
      request_body: { car_number, track_id, current_lap },
      response_code: 200,
      latency_ms: latency,
    });

    console.log(`Tire prediction completed in ${latency}ms`);

    return new Response(JSON.stringify(prediction), {
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
