// src/components/DriverCoachPanel.tsx
import React from "react";
import { useFeature } from "@/featureFlags/FeatureProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp } from "lucide-react";

export default function DriverCoachPanel() {
  const enabled = useFeature("impact_driver_coaching");

  if (!enabled) return null;

  return (
    <Card className="bg-card/60 backdrop-blur-md border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Driver Coaching AI</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Real-time feedback from AI based on corner data & tire stress.
        </p>
        <div className="space-y-2">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-muted-foreground mb-1">
              {new Date().toLocaleTimeString()}
            </div>
            <div className="font-semibold text-sm">Corner T1</div>
            <div className="text-sm">Brake release too aggressive - lift 5% earlier</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-200 dark:border-green-800">
            <div className="text-xs text-muted-foreground mb-1">
              {new Date(Date.now() - 5000).toLocaleTimeString()}
            </div>
            <div className="font-semibold text-sm">Corner T6</div>
            <div className="text-sm">Car rotation good — maintain current approach</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-muted-foreground mb-1">
              {new Date(Date.now() - 10000).toLocaleTimeString()}
            </div>
            <div className="font-semibold text-sm">Corner T12</div>
            <div className="text-sm">Tire stress elevated — lift 2% mid-corner</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


