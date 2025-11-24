// src/components/MultiSeriesPanel.tsx
import React from "react";
import { useFeature } from "@/featureFlags/FeatureProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Car, Timer, Sprout } from "lucide-react";

export default function MultiSeriesPanel() {
  const enabled = useFeature("impact_scaling_otherseries");

  if (!enabled) return null;

  const series = [
    { name: "GR Cup", cars: 1, icon: Car, color: "from-purple-500 to-purple-600" },
    { name: "GT4", cars: 7, icon: Car, color: "from-blue-500 to-blue-600" },
    { name: "Endurance", cars: 12, icon: Timer, color: "from-green-500 to-green-600" },
    { name: "Grassroots / Club", cars: 18, icon: Sprout, color: "from-emerald-500 to-emerald-600" },
  ];

  return (
    <Card className="bg-card/60 backdrop-blur-md border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Multi-Series Expansion</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Enables support for GT4, endurance racing, and grassroots data models.
        </p>
        <ul className="space-y-2">
          {series.map((s, idx) => {
            const Icon = s.icon;
            return (
              <li
                key={idx}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-md border border-border/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 bg-gradient-to-br ${s.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{s.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{s.cars} car models supported</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}


