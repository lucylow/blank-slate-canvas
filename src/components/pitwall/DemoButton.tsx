// src/components/pitwall/DemoButton.tsx

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, CheckCircle2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface DemoData {
  agents?: Array<{
    id: string;
    type: string;
    name: string;
    status: string;
  }>;
  decisions?: Array<{
    decision_id: string;
    agent_id: string;
    agent_type: string;
    track: string;
    chassis: string;
    timestamp: string;
    decision_type: string;
    action: string;
    confidence: number;
    risk_level: string;
    reasoning: string[];
    evidence?: Record<string, unknown>;
  }>;
  insights?: Array<{
    insight_id: string;
    agent_id: string;
    track: string;
    title: string;
    summary: string;
    confidence: number;
    priority: string;
  }>;
  meta?: {
    total_agents?: number;
    total_decisions?: number;
    tracks_covered?: string[];
  };
}

interface DemoButtonProps {
  onLoadDemo: (data: DemoData) => void;
  className?: string;
}

export default function DemoButton({ onLoadDemo, className }: DemoButtonProps) {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDemoData = async () => {
    setLoading(true);
    setError(null);
    setLoaded(false);

    try {
      // Load AI agents demo data
      const response = await fetch("/demo_data/ai_agents_demo.json");
      if (!response.ok) {
        throw new Error(`Failed to load demo data: ${response.statusText}`);
      }

      const data: DemoData = await response.json();
      
      // Simulate loading delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 800));

      onLoadDemo(data);
      setLoaded(true);
      
      // Reset loaded state after 3 seconds
      setTimeout(() => setLoaded(false), 3000);
    } catch (err) {
      console.error("Error loading demo data:", err);
      setError(err instanceof Error ? err.message : "Failed to load demo data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={loadDemoData}
        disabled={loading}
        className="relative overflow-hidden"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading Demo Data...
          </>
        ) : loaded ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Demo Loaded!
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Load AI Agents Demo
          </>
        )}
      </Button>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}

      {loaded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-2 flex items-center gap-2"
        >
          <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
            <Bot className="w-3 h-3 mr-1" />
            AI Agents Active
          </Badge>
        </motion.div>
      )}
    </div>
  );
}

