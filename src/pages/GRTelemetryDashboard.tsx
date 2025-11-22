import React from 'react';
import { GRTelemetryComparison } from '@/components/GRTelemetryComparison';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function GRTelemetryDashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-xl font-bold">GR Telemetry Comparison</h1>
              <p className="text-sm text-muted-foreground">Real-time speed and G-force analysis</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto">
        <GRTelemetryComparison />
      </main>
    </div>
  );
}

