// src/api/geminiMultimodal.ts
// Gemini Multimodal API service for text, image, video, audio, and URL processing

import type { MediaFile, URLContext, GeminiMultimodalResponse } from '@/components/GeminiMultimodalInput';

const GEMINI_API_KEY = 
  import.meta.env.GEMINI ||
  import.meta.env.VITE_GEMINI_API_KEY || 
  import.meta.env.GEMINI_API_KEY ||
  '';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODELS = {
  flash: 'gemini-2.0-flash-exp',
  flashStable: 'gemini-2.0-flash',
  pro: 'gemini-1.5-pro',
  proLatest: 'gemini-1.5-pro-latest',
} as const;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per file
const REQUEST_TIMEOUT = 300000; // 5 minutes for video/audio processing

/**
 * Convert file to base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Fetch URL content (simplified - in production, use proper backend endpoint)
 */
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(`/api/proxy-url?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Failed to fetch URL');
    return await response.text();
  } catch (error) {
    // Fallback: just return the URL as context
    console.warn('Failed to fetch URL content:', error);
    return `URL: ${url}\nContent: [Unable to fetch - will be processed by Gemini]`;
  }
}

/**
 * Process multimodal input with Gemini API
 */
export async function processMultimodalInput(
  data: {
    text: string;
    images: MediaFile[];
    videos: MediaFile[];
    audio: MediaFile[];
    urls: URLContext[];
    options: {
      enableGrounding: boolean;
      model: 'flash' | 'flashStable' | 'pro' | 'proLatest';
      temperature: number;
      maxTokens: number;
    };
  }
): Promise<GeminiMultimodalResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please add "GEMINI" secret in Lovable.');
  }

  const { text, images, videos, audio, urls, options } = data;
  const modelName = GEMINI_MODELS[options.model];

  // Build parts array for multimodal content
  const parts: any[] = [];

  // Add text prompt
  if (text.trim()) {
    parts.push({ text: text.trim() });
  }

  // Add images
  for (const imageFile of images) {
    if (imageFile.file.size > MAX_FILE_SIZE) {
      throw new Error(`Image ${imageFile.file.name} exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }
    const base64 = await fileToBase64(imageFile.file);
    const mimeType = imageFile.file.type || 'image/jpeg';
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64,
      },
    });
  }

  // Add videos
  for (const videoFile of videos) {
    if (videoFile.file.size > MAX_FILE_SIZE * 2) {
      throw new Error(`Video ${videoFile.file.name} exceeds ${MAX_FILE_SIZE * 2 / 1024 / 1024}MB limit`);
    }
    const base64 = await fileToBase64(videoFile.file);
    const mimeType = videoFile.file.type || 'video/mp4';
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64,
      },
    });
  }

  // Add audio
  for (const audioFile of audio) {
    if (audioFile.file.size > MAX_FILE_SIZE * 2) {
      throw new Error(`Audio ${audioFile.file.name} exceeds ${MAX_FILE_SIZE * 2 / 1024 / 1024}MB limit`);
    }
    const base64 = await fileToBase64(audioFile.file);
    const mimeType = audioFile.file.type || 'audio/mpeg';
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64,
      },
    });
  }

  // Add URL contexts
  let urlContextText = '';
  if (urls.length > 0) {
    urlContextText = '\n\nURL Context:\n';
    for (const urlContext of urls) {
      try {
        const content = await fetchUrlContent(urlContext.url);
        urlContextText += `\n--- ${urlContext.url} ---\n${content}\n`;
      } catch (error) {
        urlContextText += `\n--- ${urlContext.url} ---\n[Error fetching content]\n`;
      }
    }
    parts.push({ text: urlContextText });
  }

  if (parts.length === 0) {
    throw new Error('No content provided. Please add text, images, videos, audio, or URLs.');
  }

  // Build request
  const requestBody: any = {
    contents: [{ parts }],
    generationConfig: {
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
    },
  };

  // Add grounding configuration
  if (options.enableGrounding) {
    requestBody.groundingConfig = {
      groundingChunkRetrievalConfig: {
        disableAttribution: false,
        maxChunks: 15,
        similarityTopK: 10,
      },
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: 'MODE_DYNAMIC',
          dynamicThreshold: 0.3,
        },
      },
    };
  }

  const url = `${GEMINI_BASE_URL}/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: { message: 'Unknown error' } 
      }));
      throw new Error(
        `Gemini API error (${response.status}): ${error.error?.message || response.statusText}`
      );
    }

    const result = await response.json();
    const candidate = result.candidates?.[0];
    
    if (!candidate) {
      throw new Error('No response candidate from Gemini API');
    }

    const contentParts = candidate?.content?.parts || [];
    let responseText = '';
    
    for (const part of contentParts) {
      if (part.text) {
        responseText += part.text;
      }
    }

    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    // Extract citations
    const citations: Array<{ uri: string; title: string }> = [];
    if (candidate?.groundingMetadata?.groundingChunks) {
      candidate.groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web && !citations.find(c => c.uri === chunk.web.uri)) {
          citations.push({
            uri: chunk.web.uri,
            title: chunk.web.title || chunk.web.uri,
          });
        }
      });
    }

    // Extract usage metadata
    const tokensUsed = result.usageMetadata?.totalTokenCount;

    return {
      text: responseText,
      citations: citations.length > 0 ? citations : undefined,
      tokensUsed,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: Processing took too long. Try reducing file sizes or using a faster model.');
    }
    console.error('Gemini multimodal processing error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred during processing';
    throw new Error(`Failed to process content: ${errorMessage}`);
  }
}

