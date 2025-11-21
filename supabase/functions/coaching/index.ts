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
    const { car_number } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get driver profile
    const { data: profile, error: profileError } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('car_number', car_number)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ 
          error: 'Driver profile not found', 
          message: `No profile exists for car #${car_number}. Create a profile first.` 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call Lovable AI for coaching
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
            content: 'You are a professional racing coach. Provide specific, actionable feedback based on driver performance data. Always respond with valid JSON only, no markdown.'
          },
          {
            role: 'user',
            content: `Driver Performance Analysis for Car #${car_number}:

Performance Metrics:
- Consistency Score: ${profile.consistency_score} (lower = more stable)
- Average Lap Time: ${profile.avg_lap_time}s
- Fastest Lap: ${profile.fastest_lap_time}s
- Strongest Sector: ${profile.strongest_sector}
- Weakest Sector: ${profile.weakest_sector}
- Brake Aggression: ${profile.brake_aggression}/10
- Throttle Smoothness: ${profile.throttle_smoothness}/10

Provide ONE specific, actionable coaching recommendation for the next race that will have the most impact.

Respond with JSON:
{
  "recommendation": "specific actionable tip with technical details",
  "expected_improvement": "+X.Xs lap time improvement",
  "sector_focus": "${profile.weakest_sector || 'sector_1'}",
  "priority": "HIGH|MEDIUM|LOW",
  "technique": "specific driving technique to practice"
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
    
    const coaching = JSON.parse(jsonMatch[0]);

    // Update driver profile with coaching tip
    const { error: updateError } = await supabase
      .from('driver_profiles')
      .update({ 
        coaching_tip: coaching.recommendation,
        updated_at: new Date().toISOString()
      })
      .eq('car_number', car_number);

    if (updateError) {
      console.error('Profile update error:', updateError);
    }

    // Log API call
    const latency = Date.now() - startTime;
    await supabase.from('api_logs').insert({
      endpoint: '/coaching',
      method: 'POST',
      request_body: { car_number },
      response_code: 200,
      latency_ms: latency,
    });

    console.log(`Coaching analysis completed in ${latency}ms`);

    return new Response(JSON.stringify(coaching), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Coaching error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Coaching analysis failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
