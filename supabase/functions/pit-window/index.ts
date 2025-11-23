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
  try {
    const url = getEnvVar('SUPABASE_URL');
    const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
    return createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    // Return a client with empty strings - operations will fail gracefully
    return createClient('', '');
  }
}

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  initialDelay = 200
): Promise<T> {
  let lastError: Error;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError!;
}

// Model endpoint helper
async function fetchModelPrediction(payload: any): Promise<any> {
  const MODEL_ENDPOINT = Deno.env.get('MODEL_ENDPOINT') || 'https://models.internal/predict';
  const MODEL_KEY = Deno.env.get('MODEL_KEY') || Deno.env.get('LOVABLE_API_KEY') || '';
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200); // 1200ms timeout for <300ms SLA
  
  try {
    const res = await fetch(`${MODEL_ENDPOINT}/infer/pit_window`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': MODEL_KEY,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`Model endpoint error: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    // Fallback to AI gateway
    return fetchAIFallback(payload);
  }
}

// Fallback to AI gateway
async function fetchAIFallback(payload: any): Promise<any> {
  const LOVABLE_API_KEY = getEnvVar('LOVABLE_API_KEY');

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
          content: `Analyze pit strategy. Respond with JSON: { "recommendedWindow": [lapStart, lapEnd], "expectedGainSeconds": 0, "confidence": 0.0-1.0, "scenarios": [{"label": "name", "totalTime": 0}] }`
        }
      ]
    }),
  });

  if (!aiResponse.ok) {
    throw new Error(`AI gateway error: ${aiResponse.status}`);
  }

  const data = await aiResponse.json();
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid AI response format');
  }
  
  return JSON.parse(jsonMatch[0]);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const reqId = crypto.randomUUID?.() ?? String(Math.floor(Math.random() * 1e9));
  
  try {
    const body = await req.json();
    
    // Input validation per spec: { sessionMeta, chassisId, lapNumber, remainingLaps, pitLossSeconds, currentTireState, competitorPositions }
    if (!body.chassisId || body.lapNumber === undefined || body.remainingLaps === undefined) {
      return new Response(
        JSON.stringify({ error: 'bad_request', message: 'Missing required fields: chassisId, lapNumber, remainingLaps' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = {
      sessionMeta: body.sessionMeta || {},
      chassisId: body.chassisId,
      lapNumber: body.lapNumber,
      remainingLaps: body.remainingLaps,
      pitLossSeconds: body.pitLossSeconds || 25,
      currentTireState: body.currentTireState || {},
      competitorPositions: body.competitorPositions || [],
      requestId: reqId,
    };

    // Call model with retry
    const prediction = await retryWithBackoff(
      () => fetchModelPrediction(payload),
      2,
      200
    );

    // Transform to spec output format: { recommendedWindow, expectedGainSeconds, confidence, scenarios }
    const response = {
      requestId: reqId,
      recommendedWindow: prediction.recommendedWindow || null,
      expectedGainSeconds: prediction.expectedGainSeconds || 0,
      confidence: prediction.confidence || 0.5,
      scenarios: prediction.scenarios || [],
      cached_until: null,
    };

    // Structured logging
    const latency = Date.now() - startTime;
    const logEntry = {
      service: 'pit-window',
      requestId: reqId,
      chassisId: body.chassisId,
      latencyMs: latency,
      confidence: response.confidence,
      scenario_count: response.scenarios.length,
      outcome: 'success',
    };

    console.log(JSON.stringify(logEntry));

    // Store metrics
    const supabase = createSupabaseClient();

    try {
      await supabase.from('api_logs').insert({
        endpoint: '/pit-window',
        method: 'POST',
        request_body: { chassisId: body.chassisId, lapNumber: body.lapNumber },
        response_code: 200,
        latency_ms: latency,
      });
    } catch (dbError) {
      console.error('DB log insert failed:', dbError);
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log error
    console.error(JSON.stringify({
      service: 'pit-window',
      requestId: reqId,
      latencyMs: latency,
      outcome: 'error',
      error: errorMessage,
    }));

    // Graceful fallback per spec
    return new Response(
      JSON.stringify({ 
        requestId: reqId,
        recommendedWindow: null,
        reason: 'timeout',
        safeFallback: 'defer to manual',
        expectedGainSeconds: 0,
        confidence: 0,
        scenarios: [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
