// src/pages/PitWindowOptimization.tsx
import React from "react";
import PitConsole from "@/components/PitConsole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * Pit Window Optimization Page
 * 
 * Monte Carlo simulation of multiple strategies with traffic-aware recommendations.
 * 
 * Features:
 * - Upload race CSV replays
 * - Simulate pit stop scenarios
 * - Compare naive vs model-based predictions
 * - Get recommended pit windows
 */
export default function PitWindowOptimization() {
  return (
    <main role="main" className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="max-w-6xl mx-auto py-16 px-6">
        <Card className="mb-6 bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle className="text-3xl lg:text-4xl font-extrabold leading-tight">Pit Window Optimization</CardTitle>
            <CardDescription className="text-gray-300">
              Monte Carlo simulation of multiple strategies with traffic-aware recommendations.
              Upload a race CSV replay to analyze pit stop scenarios and get AI-powered recommendations.
            </CardDescription>
          </CardHeader>
        </Card>
        <PitConsole />
      </section>
    </main>
  );
}


