// src/pages/GeminiFeaturesPage.tsx
// Gemini AI Features Page - Showcase, Multimodal, and Zip Matcher

import { RouteLayout } from '@/components/layout/RouteLayout';
import { GeminiFeaturesShowcase } from '@/components/GeminiFeaturesShowcase';
import { GeminiMultimodalInput } from '@/components/GeminiMultimodalInput';
import { GeminiZipMatcher } from '@/components/GeminiZipMatcher';
import { processMultimodalInput } from '@/api/geminiMultimodal';
import { Brain, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function GeminiFeaturesPage() {
  return (
    <RouteLayout>
      <div className="container mx-auto py-8 space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mb-4 shadow-xl shadow-primary/20">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Gemini AI Features
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Leverage Google's Gemini AI for multimodal analysis, video processing, audio transcription, 
            and massive dataset matching across all 7 GR Cup tracks.
          </p>
        </div>

        {/* Features Showcase Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Gemini Capabilities</h2>
          </div>
          <Card className="border-primary/30">
            <CardContent className="p-6">
              <GeminiFeaturesShowcase />
            </CardContent>
          </Card>
        </section>

        {/* Multimodal Input Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Multimodal AI Analysis</h2>
          </div>
          <Card className="border-primary/30">
            <CardContent className="p-6">
              <GeminiMultimodalInput onAnalyze={processMultimodalInput} />
            </CardContent>
          </Card>
        </section>

        {/* Zip Matcher Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">7 Track Dataset Matcher</h2>
          </div>
          <Card className="border-primary/30">
            <CardContent className="p-6">
              <GeminiZipMatcher />
            </CardContent>
          </Card>
        </section>
      </div>
    </RouteLayout>
  );
}

