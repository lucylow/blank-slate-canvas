// src/pages/AnomalyDetectionPage.tsx
// Anomaly Detection Page

import { RouteLayout } from '@/components/layout/RouteLayout';
import { AlertCircle, Activity, Wifi, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkAnomalyHealth } from '@/api/anomaly';

export default function AnomalyDetectionPage() {
  const [showHealth, setShowHealth] = useState(false);

  const { data: anomalyHealth, refetch: refetchAnomalyHealth, isLoading } = useQuery({
    queryKey: ['anomaly-health'],
    queryFn: checkAnomalyHealth,
    enabled: showHealth,
    retry: 1,
  });

  return (
    <RouteLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mb-4 shadow-xl shadow-red-500/20">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Real-Time Anomaly Detection
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AI-powered anomaly detection for telemetry data with real-time alerts and ML-based pattern recognition
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-border/50 hover:border-red-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <CardTitle>Critical Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Detect critical sensor anomalies in real-time with configurable thresholds and rate-of-change monitoring.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Threshold-based detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Rate-of-change monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>ML-based pattern detection</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-red-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-6 h-6 text-red-500" />
                <CardTitle>Batch Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Analyze entire race sessions with batch processing and automatic model retraining.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Full race analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Anomaly statistics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Top anomalous sensors</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-red-500/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Wifi className="w-6 h-6 text-red-500" />
                <CardTitle>WebSocket Stream</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Real-time anomaly alerts via WebSocket for live race monitoring and instant notifications.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Live anomaly stream</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Per-vehicle monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Automatic reconnection</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Service Health Check */}
        <div className="text-center space-y-4">
          <Button 
            onClick={() => {
              setShowHealth(true);
              refetchAnomalyHealth();
            }}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            disabled={isLoading}
          >
            {anomalyHealth ? 'Refresh Service Health' : 'Check Service Health'}
          </Button>
          
          {anomalyHealth && (
            <Card className="mt-6 max-w-2xl mx-auto border-border/50">
              <CardHeader>
                <CardTitle>Anomaly Detection Service Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold text-green-500">{anomalyHealth.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PyOD Available</p>
                    <p className="text-lg font-semibold">{anomalyHealth.pyod_available ? '✅ Yes' : '❌ No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Connections</p>
                    <p className="text-lg font-semibold">{anomalyHealth.active_connections || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RouteLayout>
  );
}

