// src/api/openaiMultimodal.ts
// OpenAI Multimodal API service for text, image, and video processing
// For video annotations, extracts key frames and uses GPT-4 Vision

import type { MediaFile, URLContext } from '@/components/GeminiMultimodalInput';

const OPENAI_API_KEY = 
  import.meta.env.OPENAI ||
  import.meta.env.VITE_OPENAI_API_KEY || 
  import.meta.env.OPENAI_API_KEY ||
  (typeof window !== 'undefined' && (window as any).__OPENAI_API_KEY__) ||
  '';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per file
const REQUEST_TIMEOUT = 300000; // 5 minutes for video processing
const MAX_VIDEO_FRAMES = 10; // Maximum number of frames to extract from video

export interface OpenAIMultimodalResponse {
  text: string;
  mediaAnalysis?: {
    image?: Array<{ id: string; analysis: string }>;
    video?: Array<{ id: string; analysis: string; frames?: number }>;
    audio?: Array<{ id: string; analysis: string }>;
  };
  tokensUsed?: number;
}

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
 * Extract key frames from video
 * Returns array of base64-encoded frame images
 */
async function extractVideoFrames(
  videoFile: File,
  maxFrames: number = MAX_VIDEO_FRAMES
): Promise<Array<{ base64: string; timestamp: number }>> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoFile);
    const frames: Array<{ base64: string; timestamp: number }> = [];

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const frameInterval = Math.max(1, duration / maxFrames);
      
      let framesExtracted = 0;
      let currentTime = 0;

      const extractFrame = () => {
        if (framesExtracted >= maxFrames || currentTime >= duration) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }

        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          frames.push({
            base64,
            timestamp: currentTime,
          });
          framesExtracted++;
          currentTime += frameInterval;
          extractFrame();
        } else {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to create canvas context'));
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video'));
      };

      extractFrame();
    };

    video.src = url;
  });
}

/**
 * Process multimodal input with OpenAI API
 */
export async function processMultimodalInputWithOpenAI(
  data: {
    text: string;
    images: MediaFile[];
    videos: MediaFile[];
    audio: MediaFile[];
    urls: URLContext[];
    options: {
      model: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';
      temperature: number;
      maxTokens: number;
    };
  }
): Promise<OpenAIMultimodalResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add "OpenAI" secret in Lovable.');
  }

  const { text, images, videos, audio, urls, options } = data;
  const model = options.model || 'gpt-4o';

  // Build messages array for OpenAI API
  const messages: any[] = [
    {
      role: 'system',
      content: `You are an expert motorsports analyst specializing in race video analysis. 
      Analyze the provided images and video frames to identify key moments, driving techniques, 
      racing lines, overtakes, defensive moves, incidents, and performance opportunities. 
      Provide detailed annotations and insights.`
    }
  ];

  const contentParts: any[] = [];

  // Add text prompt
  if (text.trim()) {
    contentParts.push({
      type: 'text',
      text: text.trim()
    });
  }

  // Add images
  for (const imageFile of images) {
    if (imageFile.file.size > MAX_FILE_SIZE) {
      throw new Error(`Image ${imageFile.file.name} exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }
    const base64 = await fileToBase64(imageFile.file);
    const mimeType = imageFile.file.type || 'image/jpeg';
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: `data:${mimeType};base64,${base64}`
      }
    });
  }

  // Process videos by extracting frames
  const videoAnalyses: Array<{ id: string; analysis: string; frames?: number }> = [];
  for (const videoFile of videos) {
    if (videoFile.file.size > MAX_FILE_SIZE * 2) {
      throw new Error(`Video ${videoFile.file.name} exceeds ${MAX_FILE_SIZE * 2 / 1024 / 1024}MB limit`);
    }

    try {
      // Extract frames from video
      const frames = await extractVideoFrames(videoFile.file, MAX_VIDEO_FRAMES);
      
      if (frames.length === 0) {
        throw new Error(`Failed to extract frames from ${videoFile.file.name}`);
      }

      // Add frames to content
      contentParts.push({
        type: 'text',
        text: `\n\nAnalyzing video: ${videoFile.file.name} (${frames.length} key frames extracted)\n`
      });

      // Add each frame as an image
      for (const frame of frames) {
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${frame.base64}`
          }
        });
      }

      // Add instruction for video analysis
      contentParts.push({
        type: 'text',
        text: `\nPlease analyze these ${frames.length} key frames from the video "${videoFile.file.name}". 
        Identify key moments, driving techniques, racing lines, overtakes, defensive moves, incidents, 
        or performance opportunities. Provide detailed annotations for this video segment.`
      });
    } catch (error) {
      console.error(`Error processing video ${videoFile.file.name}:`, error);
      contentParts.push({
        type: 'text',
        text: `\nNote: Could not process video ${videoFile.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  // Add URL contexts as text
  if (urls.length > 0) {
    let urlContextText = '\n\nURL Context:\n';
    for (const urlContext of urls) {
      urlContextText += `\n--- ${urlContext.url} ---\n`;
      if (urlContext.title) {
        urlContextText += `Title: ${urlContext.title}\n`;
      }
      urlContextText += `[URL content will be analyzed]\n`;
    }
    contentParts.push({
      type: 'text',
      text: urlContextText
    });
  }

  if (contentParts.length === 0) {
    throw new Error('No content provided. Please add text, images, videos, or URLs.');
  }

  // Note: OpenAI doesn't support audio directly, so we'll skip it for now
  if (audio.length > 0) {
    contentParts.push({
      type: 'text',
      text: `\n\nNote: ${audio.length} audio file(s) provided but OpenAI API doesn't support direct audio processing. 
      Consider using Whisper API for transcription separately.`
    });
  }

  // Build the user message with all content
  messages.push({
    role: 'user',
    content: contentParts
  });

  // Make API request
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: { message: 'Unknown error' } 
      }));
      throw new Error(
        `OpenAI API error (${response.status}): ${error.error?.message || response.statusText}`
      );
    }

    const result = await response.json();
    const message = result.choices?.[0]?.message;
    
    if (!message) {
      throw new Error('No response from OpenAI API');
    }

    const responseText = message.content || '';

    if (!responseText) {
      throw new Error('Empty response from OpenAI API');
    }

    // Extract usage metadata
    const tokensUsed = result.usage?.total_tokens;

    // Parse video analyses from response
    // For now, we'll include all videos in a single analysis
    const mediaAnalysis: OpenAIMultimodalResponse['mediaAnalysis'] = {};
    
    if (images.length > 0) {
      mediaAnalysis.image = images.map((img, idx) => ({
        id: img.id,
        analysis: `Image ${idx + 1}: ${img.file.name} analyzed`
      }));
    }

    if (videos.length > 0) {
      mediaAnalysis.video = videos.map((vid) => ({
        id: vid.id,
        analysis: responseText, // Full analysis for all videos
        frames: MAX_VIDEO_FRAMES
      }));
    }

    return {
      text: responseText,
      mediaAnalysis: Object.keys(mediaAnalysis).length > 0 ? mediaAnalysis : undefined,
      tokensUsed,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: Processing took too long. Try reducing file sizes or using a faster model.');
    }
    console.error('OpenAI multimodal processing error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred during processing';
    throw new Error(`Failed to process content: ${errorMessage}`);
  }
}

