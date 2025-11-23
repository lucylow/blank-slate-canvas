// src/components/DemoButton.tsx
// Reusable Demo button component that enables demo mode and loads demo data

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useDemoMode } from "@/hooks/useDemoMode";
import { getDemoData } from "@/api/demo";
import { useToast } from "@/hooks/use-toast";

interface DemoButtonProps {
  /** Optional callback when demo data is loaded successfully */
  onDemoLoaded?: (data: unknown) => void;
  /** Optional additional class names */
  className?: string;
  /** Button size variant */
  size?: "default" | "sm" | "lg" | "icon";
  /** Button variant */
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

/**
 * Demo Button Component
 * 
 * Enables demo mode and loads demo data from demo_data.json
 * Perfect for showcasing the application with real demo data
 */
export function DemoButton({ 
  onDemoLoaded, 
  className = "",
  size = "default",
  variant = "outline"
}: DemoButtonProps) {
  const { isDemoMode, setIsDemoMode } = useDemoMode();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleDemoClick = async () => {
    // If already in demo mode, just show a message
    if (isDemoMode) {
      toast({
        title: "Demo Mode Already Active",
        description: "Demo mode is already enabled. Comprehensive mock data is available for all 7 tracks with AI agent decisions, time series, and tire predictions.",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    setHasLoaded(false);

    try {
      // Enable demo mode first
      setIsDemoMode(true);

      // Generate comprehensive mock data for all tracks
      // This includes: AI agent decisions, time series, tire predictions, and telemetry
      const { generateAllTracksMockData } = await import("@/lib/mockDemoData");
      const mockData = generateAllTracksMockData();
      
      // Count totals for display
      const totalDecisions = Object.values(mockData.agentDecisions).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
      const totalTimeSeries = Object.values(mockData.timeSeries).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
      const totalPredictions = Object.values(mockData.tirePredictions).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
      const totalTelemetry = Object.values(mockData.telemetry).reduce(
        (sum, arr) => sum + arr.length,
        0
      );

      setHasLoaded(true);
      
      // Show success toast with comprehensive data summary
      toast({
        title: "Demo Mode Enabled - Comprehensive Mock Data Loaded",
        description: `Generated mock data for all 7 tracks: ${totalDecisions} AI agent decisions, ${totalTimeSeries} time series points, ${totalPredictions} tire predictions, ${totalTelemetry} telemetry points. All 7 AI agents are simulated.`,
        duration: 5000,
      });

      // Call optional callback with mock data structure
      if (onDemoLoaded) {
        onDemoLoaded({
          meta: {
            count: totalTelemetry,
            tracks_available: 7,
            source: "mock_generator",
            loaded_at: new Date().toISOString(),
          },
          mockData: mockData,
        });
      }
    } catch (error) {
      console.error("Failed to generate mock demo data:", error);
      
      // Still enable demo mode even if data generation fails
      setIsDemoMode(true);
      
      toast({
        title: "Demo Mode Enabled",
        description: error instanceof Error ? error.message : "Failed to generate mock data, but demo mode is enabled",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If already in demo mode, show active state
  if (isDemoMode && !isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`${className} bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20`}
        onClick={handleDemoClick}
        title="Demo mode is active. Click to reload demo data."
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Demo Active
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDemoClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading Demo...
        </>
      ) : (
        <>
          <Play className="w-4 h-4 mr-2" />
          Demo
        </>
      )}
    </Button>
  );
}

