// src/components/GeminiFeaturesShowcase.tsx
// Showcase component highlighting all unique Gemini features

import React from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  Music,
  Globe,
  Brain,
  Zap,
  TrendingUp,
  Link as LinkIcon,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';

const features = [
  {
    icon: Video,
    title: 'Native Video Processing',
    description: 'Upload and analyze video files directly - OpenAI only supports images. Gemini can process video content frame-by-frame for comprehensive analysis.',
    badge: 'Gemini Only',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Music,
    title: 'Native Audio Processing',
    description: 'Upload audio files for transcription, analysis, and insights. Extract spoken content, analyze tone, and process audio data natively.',
    badge: 'Gemini Only',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Search,
    title: 'Google Search Grounding',
    description: 'Enable real-time web search to ground responses with current information. Get citations and sources automatically included in responses.',
    badge: 'Gemini Only',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Layers,
    title: '1M+ Token Context Windows',
    description: 'Process massive amounts of context - up to 1 million tokens. OpenAI maxes out at 128K. Perfect for analyzing entire codebases, large datasets, or extensive documentation.',
    badge: 'Gemini Pro',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: LinkIcon,
    title: 'URL Context Retrieval',
    description: 'Provide URLs and Gemini will automatically fetch, parse, and analyze web page content. No need to manually copy-paste content.',
    badge: 'Gemini Only',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: Sparkles,
    title: 'Unified Multimodal API',
    description: 'Single API call handles text, images, videos, audio, and URLs together. No need to process different media types separately.',
    badge: 'Gemini Exclusive',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
];

const comparisonFeatures = [
  {
    feature: 'Video Processing',
    gemini: true,
    openai: false,
  },
  {
    feature: 'Audio Processing',
    gemini: true,
    openai: false,
  },
  {
    feature: 'Google Search Grounding',
    gemini: true,
    openai: false,
  },
  {
    feature: 'URL Context Retrieval',
    gemini: true,
    openai: false,
  },
  {
    feature: 'Max Context Window',
    gemini: '1M+ tokens',
    openai: '128K tokens',
  },
  {
    feature: 'Image Processing',
    gemini: true,
    openai: true,
  },
  {
    feature: 'Multimodal API',
    gemini: 'Unified',
    openai: 'Separate APIs',
  },
];

export function GeminiFeaturesShowcase() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mb-4 shadow-xl shadow-primary/20">
          <Brain className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Gemini-Exclusive Features
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Leverage powerful capabilities not available in OpenAI models
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Gemini vs OpenAI Feature Comparison
          </CardTitle>
          <CardDescription>
            See how Gemini's unique features compare to OpenAI's capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold">Gemini</th>
                  <th className="text-center py-3 px-4 font-semibold">OpenAI</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((item, index) => (
                  <motion.tr
                    key={item.feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">{item.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {typeof item.gemini === 'boolean' ? (
                        item.gemini ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <Badge variant="default" className="bg-green-500/20 text-green-600 dark:text-green-400">
                          {item.gemini}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof item.openai === 'boolean' ? (
                        item.openai ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <Badge variant="outline">{item.openai}</Badge>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Use Cases */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Perfect For
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Video Analysis</div>
                  <div className="text-sm text-muted-foreground">
                    Analyze race footage, driver behavior, and track conditions from video
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Large Dataset Analysis</div>
                  <div className="text-sm text-muted-foreground">
                    Process entire race seasons or multiple tracks in one context window
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Web-Enhanced Insights</div>
                  <div className="text-sm text-muted-foreground">
                    Get real-time race data and track information with automatic citations
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Multimedia Content</div>
                  <div className="text-sm text-muted-foreground">
                    Combine text, images, videos, audio, and URLs in a single analysis
                  </div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Key Advantages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div>
                  <div className="font-medium">8x Larger Context</div>
                  <div className="text-sm text-muted-foreground">
                    Process 1M+ tokens vs OpenAI's 128K limit
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div>
                  <div className="font-medium">Native Media Support</div>
                  <div className="text-sm text-muted-foreground">
                    No need for external transcription or video processing tools
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div>
                  <div className="font-medium">Real-Time Grounding</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically fetch current information from Google Search
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div>
                  <div className="font-medium">Unified API</div>
                  <div className="text-sm text-muted-foreground">
                    One endpoint for all media types - simpler integration
                  </div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

