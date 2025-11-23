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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">Pit Window Optimization</CardTitle>
            <CardDescription>
              Monte Carlo simulation of multiple strategies with traffic-aware recommendations.
              Upload a race CSV replay to analyze pit stop scenarios and get AI-powered recommendations.
            </CardDescription>
          </CardHeader>
        </Card>
        <PitConsole />
      </div>
    </div>
  );
}


