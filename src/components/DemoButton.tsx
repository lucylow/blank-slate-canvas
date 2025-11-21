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
    setIsLoading(true);
    setHasLoaded(false);

    try {
      // Enable demo mode first
      setIsDemoMode(true);

      // Load demo data from demo_data.json
      const demoData = await getDemoData();

      setHasLoaded(true);
      
      // Show success toast
      toast({
        title: "Demo Mode Enabled",
        description: `Loaded ${demoData.meta?.count || 0} demo data points from ${demoData.meta?.tracks_available || 0} tracks`,
        duration: 3000,
      });

      // Call optional callback
      if (onDemoLoaded) {
        onDemoLoaded(demoData);
      }
    } catch (error) {
      console.error("Failed to load demo data:", error);
      
      // Still enable demo mode even if data loading fails
      setIsDemoMode(true);
      
      toast({
        title: "Demo Mode Enabled",
        description: error instanceof Error ? error.message : "Failed to load demo data, but demo mode is enabled",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If already in demo mode and loaded, show checkmark
  if (isDemoMode && hasLoaded && !isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`${className} bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20`}
        disabled
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
      disabled={isLoading || (isDemoMode && hasLoaded)}
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

