// src/components/DemoLauncher.tsx

import React from "react";
import { motion } from "framer-motion";
import { Play, ExternalLink, Terminal, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const DemoLauncher: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto max-w-4xl"
    >
      <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b border-border/50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Live Demo</CardTitle>
              <CardDescription className="mt-1">
                Experience PitWall AI with real-time telemetry data
              </CardDescription>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Start the local demo server to replay a telemetry stream and drive the PitWall UI via WebSocket connection.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
            >
              <a href="/pitwall">
                <Play className="w-4 h-4 mr-2" />
                Open Demo Dashboard
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105"
            >
              <a
                href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/dashboard/live?track=road_america&race=1&vehicle=7&lap=12`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Test API Endpoint
              </a>
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-start gap-3">
              <Terminal className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-1">Quick Start</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Run the demo server in your terminal:
                </p>
                <code className="block text-xs bg-background px-3 py-2 rounded border border-border/50 font-mono text-foreground">
                  npm run demo-server
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Then open the demo dashboard to see live telemetry streaming.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DemoLauncher;

