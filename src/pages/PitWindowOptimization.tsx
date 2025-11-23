// src/pages/PitWindowOptimization.tsx
import React, { useState } from "react";
import PitConsole from "@/components/PitConsole";
import MonteCarloVisualization, { type MonteCarloSimulationData } from "@/components/MonteCarloVisualization";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Activity, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
 * - Interactive Monte Carlo visualization with data analysis
 */
export default function PitWindowOptimization() {
  const [monteCarloData, setMonteCarloData] = useState<MonteCarloSimulationData | null>(null);
  const [activeTab, setActiveTab] = useState<"console" | "visualization">("console");

  return (
    <main role="main" className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="max-w-7xl mx-auto py-16 px-6">
        <Card className="mb-6 bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <CardTitle className="text-3xl lg:text-4xl font-extrabold leading-tight">
              Pit Window Optimization
            </CardTitle>
            <CardDescription className="text-gray-300">
              Monte Carlo simulation of multiple strategies with traffic-aware recommendations.
              Upload a race CSV replay to analyze pit stop scenarios and get AI-powered recommendations
              with interactive data visualization.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="console" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Pit Console
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Monte Carlo Analysis
              {monteCarloData && (
                <Badge variant="default" className="ml-1 bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="console" className="space-y-6">
            <PitConsole 
              onSimulationComplete={(data) => {
                setMonteCarloData(data);
                // Auto-switch to visualization tab when data is ready
                if (data) {
                  setTimeout(() => setActiveTab("visualization"), 500);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="visualization" className="space-y-6">
            <MonteCarloVisualization 
              data={monteCarloData}
              onRefresh={() => {
                // Trigger re-simulation
                setMonteCarloData(null);
                setActiveTab("console");
              }}
            />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}


