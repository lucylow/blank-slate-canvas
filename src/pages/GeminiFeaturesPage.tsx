// src/pages/GeminiFeaturesPage.tsx
// Gemini AI Features Page - Focused on actual implementations

import { PageWithMiniTabs, type MiniTab } from '@/components/PageWithMiniTabs';
import { GeminiMultimodalInput } from '@/components/GeminiMultimodalInput';
import { GeminiZipMatcher } from '@/components/GeminiZipMatcher';
import { GeminiGrounding } from '@/components/GeminiGrounding';
import { processMultimodalInput } from '@/api/geminiMultimodal';
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
            <GeminiMultimodalInput onAnalyze={processMultimodalInput} />
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
