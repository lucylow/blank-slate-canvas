/**
 * Anomaly Alerts Component
 * Displays real-time anomaly detection alerts
 */
import React, { useEffect, useState } from 'react';
import { Info, AlertCircle, AlertTriangle, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnomalyAlert, AnomalyDetectionResult } from '@/api/anomaly';
import { AnomalyWebSocket } from '@/api/anomaly';
import { useDemoMode } from '@/hooks/useDemoMode';

interface AnomalyAlertsProps {
  vehicleId: string;
  vehicleNumber?: number;
  maxAlerts?: number;
  autoDismiss?: boolean;
  dismissAfter?: number; // milliseconds
}

// Generate mock anomaly detection results
function generateMockAnomaly(vehicleId: string, vehicleNumber?: number): AnomalyDetectionResult {
  const anomalies = [
    {
      sensor: 'Brake Temperature',
      message: 'Brake temperature spike detected in Turn 5',
      severity: 'high' as const,
      features: ['brake_temp', 'deceleration_rate'],
    },
    {
      sensor: 'Tire Pressure',
      message: 'Unusual tire pressure variation detected',
      severity: 'medium' as const,
      features: ['tire_pressure_fl', 'tire_pressure_fr'],
    },
    {
      sensor: 'Steering Input',
      message: 'Abnormal steering pattern in sector 2',
      severity: 'medium' as const,
      features: ['steering_angle', 'lateral_g'],
    },
    {
      sensor: 'Engine RPM',
      message: 'RPM anomaly detected during acceleration',
      severity: 'low' as const,
      features: ['rpm', 'throttle_position'],
    },
  ];

  const anomaly = anomalies[Math.floor(Math.random() * anomalies.length)];
  const lap = Math.floor(Math.random() * 20) + 1;

  return {
    is_anomaly: true,
    anomaly_score: 0.65 + Math.random() * 0.3,
    alerts: [
      {
        type: 'ml_detected',
        sensor: anomaly.sensor,
        message: anomaly.message,
        severity: anomaly.severity,
        contributing_features: anomaly.features,
        score: 0.65 + Math.random() * 0.3,
      },
    ],
    timestamp: new Date().toISOString(),
    vehicle_id: vehicleId,
    vehicle_number: vehicleNumber,
    lap: lap,
  };
}

export function AnomalyAlerts({
  vehicleId,
  vehicleNumber,
  maxAlerts = 10,
  autoDismiss = true,
  dismissAfter = 10000,
}: AnomalyAlertsProps) {
  const [alerts, setAlerts] = useState<AnomalyDetectionResult[]>([]);
  const [ws, setWs] = useState<AnomalyWebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, generate mock anomalies periodically
      setConnected(true);
      
      // Generate initial mock anomalies
      const initialAlerts: AnomalyDetectionResult[] = [];
      const numInitial = Math.min(3, maxAlerts);
      for (let i = 0; i < numInitial; i++) {
        initialAlerts.push(generateMockAnomaly(vehicleId, vehicleNumber));
      }
      setAlerts(initialAlerts);

      // Generate new mock anomalies periodically
      const interval = setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance to generate new anomaly
          const newAnomaly = generateMockAnomaly(vehicleId, vehicleNumber);
          setAlerts((prev) => {
            const newAlerts = [newAnomaly, ...prev];
            return newAlerts.slice(0, maxAlerts);
          });
        }
      }, 5000); // Check every 5 seconds

      return () => {
        clearInterval(interval);
      };
    } else {
      // Create WebSocket connection for real mode
      const anomalyWs = new AnomalyWebSocket(vehicleId);
      
      anomalyWs.connect(
        (result) => {
          // Add new anomaly alert
          setAlerts((prev) => {
            const newAlerts = [result, ...prev];
            return newAlerts.slice(0, maxAlerts);
          });
        },
        (error) => {
          console.error('Anomaly WebSocket error:', error);
        },
        () => {
          setConnected(true);
        },
        () => {
          setConnected(false);
        }
      );

      setWs(anomalyWs);

      // Cleanup on unmount
      return () => {
        anomalyWs.disconnect();
      };
    }
  }, [vehicleId, maxAlerts, isDemoMode, vehicleNumber]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (!autoDismiss || alerts.length === 0) return;

    const timer = setTimeout(() => {
      setAlerts((prev) => prev.slice(0, -1));
    }, dismissAfter);

    return () => clearTimeout(timer);
  }, [alerts, autoDismiss, dismissAfter]);

  const dismissAlert = (index: number) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-500/50 bg-red-500/10';
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10';
      default:
        return 'border-blue-500/50 bg-blue-500/10';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Anomaly Detection
            <span className={`ml-2 w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-500'}`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isDemoMode
              ? 'Demo mode: Mock anomaly detection active'
              : connected
              ? 'Monitoring telemetry for anomalies...'
              : 'Connecting to anomaly detection service...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Anomaly Alerts ({alerts.length})
          <span className={`ml-2 w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-500'}`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <AnimatePresence>
          {alerts.map((alert, index) => (
            <motion.div
              key={`${alert.timestamp}-${index}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={`p-3 rounded-lg border ${getSeverityColor(
                  alert.alerts[0]?.severity || 'medium'
                )} relative`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.alerts[0]?.severity || 'medium')}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold">
                        {alert.alerts[0]?.sensor || 'Anomaly Detected'}
                      </p>
                      {alert.vehicle_number && (
                        <span className="text-xs text-muted-foreground">
                          Vehicle #{alert.vehicle_number}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {alert.alerts[0]?.message || 'Anomaly detected in telemetry data'}
                    </p>
                    {alert.alerts[0]?.contributing_features &&
                      alert.alerts[0].contributing_features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {alert.alerts[0].contributing_features.map((feature) => (
                            <span
                              key={feature}
                              className="text-xs px-2 py-0.5 rounded bg-background/50 border border-border/50"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        Score: {(alert.anomaly_score * 100).toFixed(1)}%
                      </span>
                      {alert.lap && (
                        <span className="text-xs text-muted-foreground">• Lap {alert.lap}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        • {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => dismissAlert(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

