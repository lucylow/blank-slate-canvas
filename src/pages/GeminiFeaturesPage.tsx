// src/pages/GeminiFeaturesPage.tsx
// Gemini AI Features Page - Focused on actual implementations

import { PageWithMiniTabs, type MiniTab } from '@/components/PageWithMiniTabs';
import { GeminiMultimodalInput } from '@/components/GeminiMultimodalInput';
import { GeminiZipMatcher } from '@/components/GeminiZipMatcher';
import { GeminiGrounding } from '@/components/GeminiGrounding';
import { processMultimodalInput } from '@/api/geminiMultimodal';
import { processMultimodalInputWithOpenAI } from '@/api/openaiMultimodal';
import type { GeminiMultimodalResponse } from '@/components/GeminiMultimodalInput';
import { Image, FileArchive, Search } from 'lucide-react';

export default function GeminiFeaturesPage() {
  const tabs: MiniTab[] = [
    { id: 'multimodal', label: 'Multimodal AI', icon: <Image className="h-4 w-4" /> },
    { id: 'dataset-matcher', label: 'Dataset Matcher', icon: <FileArchive className="h-4 w-4" /> },
    { id: 'grounding', label: 'Grounding', icon: <Search className="h-4 w-4" /> },
  ];

  return (
    <PageWithMiniTabs
      pageTitle="Gemini AI Features"
      pageSubtitle="Upload images, videos, audio, and text for AI analysis. Match and analyze race data across all 7 tracks."
      tabs={tabs}
      initial="multimodal"
    >
      {(active) => (
        <div className="space-y-6">
          {active === 'multimodal' && (
            <GeminiMultimodalInput onAnalyze={async (data) => {
              // Use OpenAI for video annotations, Gemini for other content
              if (data.videos && data.videos.length > 0) {
                try {
                  // Convert Gemini response format to OpenAI response format
                  const openAIResponse = await processMultimodalInputWithOpenAI({
                    text: data.text,
                    images: data.images,
                    videos: data.videos,
                    audio: data.audio,
                    urls: data.urls,
                    options: {
                      model: 'gpt-4o',
                      temperature: data.options.temperature,
                      maxTokens: data.options.maxTokens,
                    }
                  });
                  
                  // Convert OpenAI response to Gemini response format
                  const geminiResponse: GeminiMultimodalResponse = {
                    text: openAIResponse.text,
                    citations: undefined,
                    mediaAnalysis: openAIResponse.mediaAnalysis,
                    tokensUsed: openAIResponse.tokensUsed,
                  };
                  return geminiResponse;
                } catch (error) {
                  console.error('OpenAI video annotation error:', error);
                  // Fallback to Gemini if OpenAI fails
                  return await processMultimodalInput(data);
                }
              }
              // Use Gemini for non-video content
              return await processMultimodalInput(data);
            }} />
          )}

          {active === 'dataset-matcher' && (
            <GeminiZipMatcher />
          )}

          {active === 'grounding' && (
            <GeminiGrounding />
          )}
        </div>
      )}
    </PageWithMiniTabs>
  );
}
