// src/components/GeminiFeaturesShowcase.tsx
// Showcase component highlighting A.I. features

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
    title: 'Video Processing',
    description: 'Upload and analyze video files directly. Process video content frame-by-frame for comprehensive analysis of race footage, driver behavior, and track conditions.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Music,
    title: 'Audio Processing',
    description: 'Upload audio files for transcription, analysis, and insights. Extract spoken content, analyze tone, and process audio data natively.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: ImageIcon,
    title: 'Image Analysis',
    description: 'Analyze images, charts, and visual data. Perfect for processing telemetry graphs, track maps, and race photography.',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
  {
    icon: Search,
    title: 'Web Search Grounding',
    description: 'Enable real-time web search to ground responses with current information. Get citations and sources automatically included in responses.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Layers,
    title: 'Large Context Windows',
    description: 'Process massive amounts of context - up to 1 million tokens. Perfect for analyzing entire race seasons, multiple tracks, or extensive documentation in one go.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: LinkIcon,
    title: 'URL Context Retrieval',
    description: 'Provide URLs and automatically fetch, parse, and analyze web page content. No need to manually copy-paste content.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: Sparkles,
    title: 'Unified Multimodal API',
    description: 'Single API call handles text, images, videos, audio, and URLs together. No need to process different media types separately.',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  {
    icon: Brain,
    title: 'Advanced Race Data Analysis',
    description: 'Leverage advanced A.I. models for predictive insights, strategic recommendations, and comprehensive race data analysis.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    description: 'Get predictive insights for tire wear, pit strategies, and race outcomes based on historical data and real-time telemetry.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
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
          A.I. Features
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Powerful A.I. capabilities for race data analysis, multimodal processing, and strategic insights
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
                  <div className="font-medium">Massive Context Windows</div>
                  <div className="text-sm text-muted-foreground">
                    Process up to 1M+ tokens for analyzing entire race seasons or multiple tracks
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

