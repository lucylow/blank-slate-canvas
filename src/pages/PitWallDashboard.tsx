// src/pages/PitWallDashboard.tsx

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flag, Wifi, WifiOff, Activity, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TrackSelector, { TRACKS } from "../components/TrackSelector";
import LiveMapSVG from "../components/LiveMapSVG";
import PredictionPanel from "../components/PredictionPanel";
import { useWebSocket } from "../hooks/useWebSocket";
import MultiTrackSummary from "../components/MultiTrackSummary";
import { DemoModeToggle } from "../components/DemoModeToggle";
import { useDemoMode } from "../hooks/useDemoMode";
import { getWsUrl } from "@/utils/wsUrl";

export default function PitWallDashboard() {
  const [track, setTrack] = useState(TRACKS[0]);
  const { isDemoMode } = useDemoMode();
  
  // Use the centralized WebSocket URL helper
  const wsUrl = isDemoMode ? '' : getWsUrl('/ws');
  const { connected, messages, messageCount } = useWebSocket(wsUrl, {
    batchMs: 80,
    maxBuffer: 2000,
    maxMessages: 500,
  });
  // derive last telemetry point for car position
  const lastPoint = useMemo(() => messages.length ? messages[messages.length-1] : null, [messages]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                <Flag className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  PitWall <span className="text-primary">A.I.</span> Dashboard
                </h1>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  Real-time analysis across 7 tracks
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <DemoModeToggle />
              <Badge 
                variant={connected || isDemoMode ? "default" : "secondary"}
                className={`flex items-center gap-2 px-4 py-2 ${
                  connected || isDemoMode
                    ? "bg-primary/20 text-primary border-primary/30" 
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDemoMode ? (
                  <>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                    <Activity className="w-4 h-4" />
                    <span className="font-semibold">DEMO</span>
                  </>
                ) : connected ? (
                  <>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                    <Wifi className="w-4 h-4" />
                    <span className="font-semibold">LIVE</span>
                    {messageCount > 0 && (
                      <span className="text-xs ml-1">({messageCount})</span>
                    )}
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span>Offline</span>
                  </>
                )}
              </Badge>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Track Map and Charts */}
          <section className="col-span-1 lg:col-span-2 space-y-6">
            {/* Track Selector and Stats */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card/60 backdrop-blur-md rounded-xl border border-border/50 shadow-lg"
            >
              <TrackSelector value={track} onChange={setTrack} />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    <span className="text-muted-foreground">Telemetry: </span>
                    <span className="font-bold text-foreground">{messages.length}</span>
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Track Map */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-2xl shadow-black/20 overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Live Track Map
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-card via-card/95 to-card/90 p-6">
                    <LiveMapSVG 
                      track={track} 
                      lapdist={lastPoint?.lapdist_m ?? 0} 
                      totalMeters={lastPoint?.track_total_m ?? 6515} 
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Charts and Prediction Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="md:col-span-2"
              >
                <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-xl h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Real-time Time Series
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-40 flex items-center justify-center bg-muted/20 rounded-lg border border-border/50">
                      <p className="text-sm text-muted-foreground">
                        Chart implementation placeholder
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="md:col-span-1"
              >
                <PredictionPanel track={track} />
              </motion.div>
            </div>
          </section>

          {/* Right Sidebar - Multi Track Summary */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <MultiTrackSummary chassis="GR86-DEMO-01" />
          </motion.aside>
        </div>
      </main>
    </div>
  );
}

