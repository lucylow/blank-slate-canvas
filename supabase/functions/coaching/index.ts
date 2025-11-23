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

// Model endpoint helper (replace with your actual model service)
async function fetchModelPrediction(payload: any): Promise<any> {
  const MODEL_ENDPOINT = Deno.env.get('MODEL_ENDPOINT') || 'https://models.internal/predict';
  const MODEL_KEY = Deno.env.get('MODEL_KEY') || Deno.env.get('LOVABLE_API_KEY') || '';
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 800); // 800ms timeout for <200ms SLA
  
  try {
    const res = await fetch(`${MODEL_ENDPOINT}/infer/coaching`, {
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
    // Fallback to AI gateway if model endpoint fails
    return fetchAIFallback(payload);
  }
}

// Fallback to AI gateway
async function fetchAIFallback(payload: any): Promise<any> {
    // Validate environment variables
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
          content: 'You are a professional racing coach. Provide specific, actionable feedback based on driver performance data. Always respond with valid JSON only, no markdown.'
        },
        {
          role: 'user',
          content: `Analyze telemetry and provide coaching advice. Respond with JSON: { "adviceId": "uuid", "priority": "low|medium|high", "message": "coaching tip", "evidence": [{"time": "t", "metric": "name", "value": 0}], "confidence": 0.0-1.0 }`
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
    
    // Input validation per spec: { chassisId, lap, sector, telemetryWindow, modelVersion }
    if (!body.chassisId || !body.lap || !body.telemetryWindow) {
      return new Response(
        JSON.stringify({ error: 'bad_request', message: 'Missing required fields: chassisId, lap, telemetryWindow' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trim telemetry window to last 10 points for edge efficiency
    const telemetryWindow = Array.isArray(body.telemetryWindow) 
      ? body.telemetryWindow.slice(-10)
      : [];

    const payload = {
      chassisId: body.chassisId,
      lap: body.lap,
      sector: body.sector || null,
      telemetryWindow,
      modelVersion: body.modelVersion || 'v1.0',
      requestId: reqId,
    };

    // Call model with retry
    const prediction = await retryWithBackoff(
      () => fetchModelPrediction(payload),
      2,
      200
    );

    // Transform to spec output format: { adviceId, priority, message, evidence, confidence }
    const response = {
      requestId: reqId,
      adviceId: prediction.adviceId || reqId,
      priority: prediction.priority || 'medium',
      message: prediction.message || 'No specific coaching advice available.',
      evidence: prediction.evidence || [],
      confidence: prediction.confidence || 0.5,
      cached_until: null, // No caching for coaching (real-time)
    };

    // Structured logging for observability
    const latency = Date.now() - startTime;
    const logEntry = {
      service: 'coaching',
      requestId: reqId,
      chassisId: body.chassisId,
      latencyMs: latency,
      modelVersion: payload.modelVersion,
      confidence: response.confidence,
      outcome: 'success',
    };

    console.log(JSON.stringify(logEntry));

    // Store metrics in Supabase if available
    const supabase = createSupabaseClient();

    try {
      await supabase.from('api_logs').insert({
        endpoint: '/coaching',
        method: 'POST',
        request_body: { chassisId: body.chassisId, lap: body.lap },
        response_code: 200,
        latency_ms: latency,
      });
    } catch (dbError) {
      // Non-fatal: continue even if DB insert fails
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
      service: 'coaching',
      requestId: reqId,
      latencyMs: latency,
      outcome: 'error',
      error: errorMessage,
    }));

    // Return graceful error response
    return new Response(
      JSON.stringify({ 
        error: 'internal_error',
        requestId: reqId,
        message: 'Coaching analysis failed',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
