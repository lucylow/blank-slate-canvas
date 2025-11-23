// src/pages/GeminiFeaturesPage.tsx
// Gemini AI Features Page - Showcase, Multimodal, and Zip Matcher

import { PageWithMiniTabs, type MiniTab } from '@/components/PageWithMiniTabs';
import { GeminiFeaturesShowcase } from '@/components/GeminiFeaturesShowcase';
import { GeminiMultimodalInput } from '@/components/GeminiMultimodalInput';
import { GeminiZipMatcher } from '@/components/GeminiZipMatcher';
import { processMultimodalInput } from '@/api/geminiMultimodal';
import { Brain, Sparkles, Key, Settings, Image, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function GeminiFeaturesPage() {
  const tabs: MiniTab[] = [
    { id: 'overview', label: 'Overview', icon: <Brain className="h-4 w-4" /> },
    { id: 'api-keys', label: 'API Keys', icon: <Key className="h-4 w-4" /> },
    { id: 'multimodal', label: 'Multimodal', icon: <Image className="h-4 w-4" /> },
    { id: 'grounding', label: 'Grounding', icon: <Globe className="h-4 w-4" /> },
  ];

  return (
    <PageWithMiniTabs
      pageTitle="Gemini AI Features"
      pageSubtitle="Leverage Google's Gemini AI for multimodal analysis, video processing, audio transcription, and massive dataset matching across all 7 GR Cup tracks"
      tabs={tabs}
      initial="overview"
    >
      {(active) => (
        <div className="space-y-6">
          {active === 'overview' && (
            <Card className="border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Gemini Capabilities</h2>
                </div>
                <GeminiFeaturesShowcase />
              </CardContent>
            </Card>
          )}

          {active === 'api-keys' && (
            <Card className="border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Key className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">API Keys & Configuration</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Configure your Gemini API keys and model settings. External API keys are required to enable Gemini features.
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      API keys should be configured in Settings → External APIs → Keys & Secrets
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {active === 'multimodal' && (
            <Card className="border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Image className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Multimodal AI Analysis</h2>
                </div>
                <GeminiMultimodalInput onAnalyze={processMultimodalInput} />
              </CardContent>
            </Card>
          )}

          {active === 'grounding' && (
            <Card className="border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">7 Track Dataset Matcher</h2>
                </div>
                <GeminiZipMatcher />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageWithMiniTabs>
  );
}

