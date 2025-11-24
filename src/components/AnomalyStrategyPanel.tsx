// src/components/AnomalyStrategyPanel.tsx
import React from "react";
import { useFeature } from "@/featureFlags/FeatureProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, AlertCircle } from "lucide-react";

export default function AnomalyStrategyPanel() {
  const enabled = useFeature("impact_anomaly_strategy");

  if (!enabled) return null;

  return (
    <Card className="bg-card/60 backdrop-blur-md border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Anomaly-Driven Strategy Engine</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Detects smoke, debris, overheating, and recalculates pit strategy.
        </p>
        <div className="space-y-2">
          <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-md border-l-4 border-red-500">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">
                  {new Date().toLocaleTimeString()}
                </div>
                <div className="font-semibold text-sm capitalize">Smoke Detected</div>
                <div className="text-sm">Potential overheating at T12 - Strategy recalculation initiated</div>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-md border-l-4 border-orange-500">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">
                  {new Date(Date.now() - 8000).toLocaleTimeString()}
                </div>
                <div className="font-semibold text-sm capitalize">Debris Warning</div>
                <div className="text-sm">Possible carbon debris in racing line - Monitor closely</div>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-md border-l-4 border-yellow-500">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">
                  {new Date(Date.now() - 15000).toLocaleTimeString()}
                </div>
                <div className="font-semibold text-sm capitalize">Oversteer Spike</div>
                <div className="text-sm">Rear slip angle exceeded threshold - Tire wear accelerating</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


