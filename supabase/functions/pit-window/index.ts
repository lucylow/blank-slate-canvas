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
    const { car_number, track, lap, gap_to_leader, tire_wear, total_laps = 15 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call Lovable AI for pit strategy
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
            content: 'You are a professional race strategist. Analyze race data and recommend optimal pit timing. Always respond with valid JSON only, no markdown.'
          },
          {
            role: 'user',
            content: `Race strategy analysis:

Current situation:
- Car Number: ${car_number}
- Track: ${track}
- Current Lap: ${lap}/${total_laps}
- Gap to Leader: ${gap_to_leader}s
- Tire Wear: ${tire_wear}%
- Remaining Laps: ${total_laps - lap}

Recommend optimal pit timing:
1. Best pit lap
2. Window (±1 lap from optimal)
3. Win probability (0-1)
4. Risk level (LOW/MEDIUM/HIGH)
5. Expected time saved (seconds)
6. Brief strategic explanation

Respond ONLY with valid JSON:
{
  "pit_lap": <number>,
  "window_start": <number>,
  "window_end": <number>,
  "probability": <0-1>,
  "risk_level": "LOW|MEDIUM|HIGH",
  "time_saved_sec": <number>,
  "explanation": "brief explanation"
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
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    const recommendation = JSON.parse(jsonMatch[0]);

    // Store recommendation in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: insertError } = await supabase.from('pit_recommendations').insert({
      car_number,
      current_lap: lap,
      recommended_pit_lap: recommendation.pit_lap,
      window_start: recommendation.window_start,
      window_end: recommendation.window_end,
      probability: recommendation.probability,
      risk_level: recommendation.risk_level,
      time_saved_sec: recommendation.time_saved_sec,
      explanation: recommendation.explanation,
    });

    if (insertError) {
      console.error('Database insert error:', insertError);
    }

    // Log API call
    const latency = Date.now() - startTime;
    await supabase.from('api_logs').insert({
      endpoint: '/pit-window',
      method: 'POST',
      request_body: { car_number, track, lap },
      response_code: 200,
      latency_ms: latency,
    });

    console.log(`Pit recommendation completed in ${latency}ms`);

    return new Response(JSON.stringify(recommendation), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Pit recommendation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Recommendation failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
