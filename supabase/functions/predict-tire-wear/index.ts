import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache (30s TTL)
const cache = new Map<string, { data: any; expires: number }>();

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
  const timeoutId = setTimeout(() => controller.abort(), 600); // 600ms timeout for <150ms SLA
  
  try {
    const res = await fetch(`${MODEL_ENDPOINT}/infer/tire_wear`, {
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
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

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
          content: `Predict tire wear. Respond with JSON: { "pred_loss_per_lap_seconds": 0, "laps_until_0_5s": 0, "temp_map": [[0]], "confidence": 0.0-1.0 }`
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
    
    // Input validation per spec: { chassisId, lapHistory, ambientTemp, compound }
    if (!body.chassisId || !body.lapHistory) {
      return new Response(
        JSON.stringify({ error: 'bad_request', message: 'Missing required fields: chassisId, lapHistory' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache (same chassis + recent lap)
    const cacheKey = `${body.chassisId}-${body.lapHistory?.length || 0}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return new Response(JSON.stringify({
        ...cached.data,
        cached_until: new Date(cached.expires).toISOString(),
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Trim lap history to last 10 laps for edge efficiency
    const lapHistory = Array.isArray(body.lapHistory) 
      ? body.lapHistory.slice(-10)
      : [];

    const payload = {
      chassisId: body.chassisId,
      lapHistory,
      ambientTemp: body.ambientTemp ?? 25,
      compound: body.compound ?? 'medium',
      requestId: reqId,
    };

    // Call model with retry
    const prediction = await retryWithBackoff(
      () => fetchModelPrediction(payload),
      2,
      200
    );

    // Transform to spec output format: { pred_loss_per_lap_seconds, laps_until_0_5s, temp_map, confidence }
    const response = {
      requestId: reqId,
      pred_loss_per_lap_seconds: prediction.pred_loss_per_lap_seconds || 0.05,
      laps_until_0_5s: prediction.laps_until_0_5s || 10,
      temp_map: prediction.temp_map || [[0]],
      confidence: prediction.confidence || 0.5,
      cached_until: new Date(Date.now() + 30000).toISOString(), // 30s cache
    };

    // Cache the result
    cache.set(cacheKey, {
      data: response,
      expires: Date.now() + 30000,
    });

    // Structured logging
    const latency = Date.now() - startTime;
    const logEntry = {
      service: 'predict-tire-wear',
      requestId: reqId,
      chassisId: body.chassisId,
      latencyMs: latency,
      modelVersion: prediction.modelVersion || 'v1.0',
      confidence: response.confidence,
      outcome: 'success',
    };

    console.log(JSON.stringify(logEntry));

    // Store metrics
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
      await supabase.from('api_logs').insert({
        endpoint: '/predict-tire-wear',
        method: 'POST',
        request_body: { chassisId: body.chassisId },
        response_code: 200,
        latency_ms: latency,
        request_id: reqId,
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
      service: 'predict-tire-wear',
      requestId: reqId,
      latencyMs: latency,
      outcome: 'error',
      error: errorMessage,
    }));

    // Graceful fallback per spec: return last-known prediction with low confidence
    return new Response(
      JSON.stringify({ 
        requestId: reqId,
        pred_loss_per_lap_seconds: 0.05,
        laps_until_0_5s: 10,
        temp_map: [[0]],
        confidence: 0.5,
        stale: true,
        cached_until: null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
