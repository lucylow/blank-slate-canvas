// src/components/ImpactTabs.tsx
// Tabs UI + connect to WS + show events

import React, { useEffect, useState, useRef } from "react";
import { connectAgentWS } from "@/lib/agentWSClient";
import { fetchFlags } from "@/lib/backendClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, AlertTriangle, Globe } from "lucide-react";
import { useFeatureManager } from "@/featureFlags/FeatureProvider";

export default function ImpactTabs() {
  const [events, setEvents] = useState<any[]>([]);
  const wsRef = useRef<any>(null);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const { syncWithBackend } = useFeatureManager();

  useEffect(() => {
    // Load initial flags via REST
    fetchFlags()
      .then((f) => {
        setFlags(f);
        syncWithBackend(); // Sync with FeatureProvider
      })
      .catch(() => {});

    // Connect WS
    const ws = connectAgentWS({
      onEvent: (payload) => {
        setEvents((prev) => [payload, ...prev].slice(0, 30));
      },
      onFlags: (payload) => {
        setFlags(payload);
        syncWithBackend();
      },
      onOpen: () => {
        console.log("Agent WebSocket connected");
      },
    });
    wsRef.current = ws;

    return () => {
      try {
        ws.close();
      } catch (e) {
        // ignore
      }
    };
  }, [syncWithBackend]);

  // Filter events per tab
  const coachingEvents = events.filter(
    (e) => e.agent === "explainer" || e.agent === "predictor"
  );
  const anomalyEvents = events.filter((e) => e.agent === "anomaly");
  const multiSeriesEvents = events.filter(
    (e) => e.agent === "simulator" || e.agent === "predictor"
  );

  return (
    <Card className="bg-card/60 backdrop-blur-md border-border/50">
      <CardHeader>
        <CardTitle>Impact Features - Live Agent Events</CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time insights from AI agents (WebSocket connected: {wsRef.current?.isConnected() ? "Yes" : "No"})
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="coaching" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="coaching" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Driver Coaching
            </TabsTrigger>
            <TabsTrigger value="anomaly" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Anomaly Strategy
            </TabsTrigger>
            <TabsTrigger value="multi" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Multi-Series
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coaching" className="mt-4">
            <div>
              <h3 className="font-semibold mb-3">Coaching Insights (live)</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {coachingEvents.length === 0 && (
                  <div className="text-muted-foreground text-sm p-4 text-center bg-muted/50 rounded-md">
                    No coaching events yet — sim running...
                  </div>
                )}
                {coachingEvents.slice(0, 6).map((ev, i) => (
                  <div
                    key={i}
                    className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800"
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {ev.ts ? new Date(ev.ts).toLocaleTimeString() : "Just now"}
                    </div>
                    <div className="font-semibold text-sm mb-1">
                      {ev.insight || ev.type || ev.agent}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {JSON.stringify(ev).slice(0, 140)}
                      {JSON.stringify(ev).length > 140 ? "…" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="anomaly" className="mt-4">
            <div>
              <h3 className="font-semibold mb-3">Anomaly & Safety Events</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {anomalyEvents.length === 0 && (
                  <div className="text-muted-foreground text-sm p-4 text-center bg-muted/50 rounded-md">
                    No anomalies detected yet...
                  </div>
                )}
                {anomalyEvents.map((ev, i) => (
                  <div
                    key={i}
                    className="p-3 bg-red-50 dark:bg-red-950/30 rounded-md border-l-4 border-red-500"
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {ev.ts ? new Date(ev.ts).toLocaleTimeString() : "Just now"}
                    </div>
                    <div className="font-semibold text-sm mb-1">{ev.insight || ev.type}</div>
                    <div className="text-sm text-muted-foreground">
                      {ev.detail || JSON.stringify(ev).slice(0, 120)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="multi" className="mt-4">
            <div>
              <h3 className="font-semibold mb-3">Multi-Series / Sim Events</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {multiSeriesEvents.length === 0 && (
                  <div className="text-muted-foreground text-sm p-4 text-center bg-muted/50 rounded-md">
                    No simulation events yet...
                  </div>
                )}
                {multiSeriesEvents.map((ev, i) => (
                  <div
                    key={i}
                    className="p-3 bg-muted/50 rounded-md border border-border/30"
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {ev.ts ? new Date(ev.ts).toLocaleTimeString() : "Just now"}
                    </div>
                    <div className="font-semibold text-sm mb-1">
                      {ev.insight || ev.agent}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {JSON.stringify(ev).slice(0, 120)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

