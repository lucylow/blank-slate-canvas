import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  AlertTriangle, 
  Info,
  Bell,
  X,
  CheckCircle2,
  Clock,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DashboardData } from "@/api/pitwall";

interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  source?: string;
  action?: string;
}

interface RealTimeAlertsProps {
  data?: DashboardData | null;
  connected?: boolean;
  className?: string;
}

/**
 * Real-Time Alerts Component
 * 
 * Displays live alerts and notifications based on:
 * - Tire wear thresholds
 * - Performance degradation
 * - Gap analysis warnings
 * - Strategy recommendations
 */
export const RealTimeAlerts: React.FC<RealTimeAlertsProps> = ({
  data,
  connected = false,
  className = "",
}) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [maxAlerts, setMaxAlerts] = useState(5);

  // Generate alerts based on dashboard data
  useEffect(() => {
    if (!data || !connected) return;

    const newAlerts: AlertItem[] = [];

    // Check tire wear
    if (data.tire_wear) {
      const avgWear = (
        data.tire_wear.front_left +
        data.tire_wear.front_right +
        data.tire_wear.rear_left +
        data.tire_wear.rear_right
      ) / 4;

      if (avgWear > 80) {
        newAlerts.push({
          id: `tire-critical-${Date.now()}`,
          type: 'critical',
          title: 'Critical Tire Wear',
          message: `Average tire wear at ${avgWear.toFixed(1)}%. Pit stop strongly recommended.`,
          timestamp: new Date(),
          acknowledged: false,
          source: 'Tire Wear Monitor',
          action: 'Consider immediate pit stop',
        });
      } else if (avgWear > 65) {
        newAlerts.push({
          id: `tire-warning-${Date.now()}`,
          type: 'warning',
          title: 'High Tire Wear',
          message: `Tire wear at ${avgWear.toFixed(1)}%. Monitor closely for pit window.`,
          timestamp: new Date(),
          acknowledged: false,
          source: 'Tire Wear Monitor',
        });
      }

      if (data.tire_wear.predicted_laps_remaining !== undefined && 
          data.tire_wear.predicted_laps_remaining <= 3) {
        newAlerts.push({
          id: `tire-laps-${Date.now()}`,
          type: 'warning',
          title: 'Low Tire Life',
          message: `Only ${data.tire_wear.predicted_laps_remaining} laps remaining before significant degradation.`,
          timestamp: new Date(),
          acknowledged: false,
          source: 'Predictive Model',
          action: 'Plan pit stop within 2-3 laps',
        });
      }

      // Check for tire wear imbalance
      const wearVariance = Math.max(
        Math.abs(data.tire_wear.front_left - data.tire_wear.front_right),
        Math.abs(data.tire_wear.rear_left - data.tire_wear.rear_right),
        Math.abs(data.tire_wear.front_left - data.tire_wear.rear_left),
      );

      if (wearVariance > 15) {
        newAlerts.push({
          id: `tire-imbalance-${Date.now()}`,
          type: 'warning',
          title: 'Tire Wear Imbalance',
          message: `Uneven tire wear detected (${wearVariance.toFixed(1)}% variance). Check suspension setup.`,
          timestamp: new Date(),
          acknowledged: false,
          source: 'Tire Analysis',
        });
      }
    }

    // Check gap analysis
    if (data.gap_analysis) {
      if (data.gap_analysis.under_pressure) {
        newAlerts.push({
          id: `pressure-${Date.now()}`,
          type: 'warning',
          title: 'Under Pressure',
          message: data.gap_analysis.gap_to_behind 
            ? `Car behind closing (${data.gap_analysis.gap_to_behind} gap). Defend position.`
            : 'Car behind close. Maintain defensive line.',
          timestamp: new Date(),
          acknowledged: false,
          source: 'Gap Analysis',
        });
      }

      if (data.gap_analysis.overtaking_opportunity) {
        newAlerts.push({
          id: `overtake-${Date.now()}`,
          type: 'info',
          title: 'Overtaking Opportunity',
          message: data.gap_analysis.gap_to_ahead
            ? `Closing on car ahead (${data.gap_analysis.gap_to_ahead} gap). Look for passing zone.`
            : 'Overtaking opportunity detected. Prepare for pass.',
          timestamp: new Date(),
          acknowledged: false,
          source: 'Gap Analysis',
          action: 'Monitor closing rate',
        });
      }
    }

    // Check performance
    if (data.performance) {
      const currentLapTime = parseFloat(data.performance.current_lap.replace(/[^0-9.]/g, ''));
      const bestLapTime = parseFloat(data.performance.best_lap.replace(/[^0-9.]/g, ''));
      
      if (currentLapTime && bestLapTime && currentLapTime > bestLapTime + 2) {
        newAlerts.push({
          id: `slow-lap-${Date.now()}`,
          type: 'warning',
          title: 'Slow Lap Detected',
          message: `Current lap ${(currentLapTime - bestLapTime).toFixed(2)}s slower than best. Check for issues.`,
          timestamp: new Date(),
          acknowledged: false,
          source: 'Performance Monitor',
        });
      }
    }

    // Add strategic recommendations
    if (data.tire_wear?.pit_window_optimal && data.tire_wear.pit_window_optimal.length > 0) {
      const pitWindow = data.tire_wear.pit_window_optimal;
      const currentLap = data.lap || 0;
      
      if (currentLap >= pitWindow[0] && currentLap <= pitWindow[1]) {
        newAlerts.push({
          id: `pit-window-${Date.now()}`,
          type: 'info',
          title: 'Optimal Pit Window Open',
          message: `Currently in optimal pit window (Laps ${pitWindow[0]}-${pitWindow[1]}). Consider pitting now.`,
          timestamp: new Date(),
          acknowledged: false,
          source: 'Strategy Optimizer',
          action: 'Review pit strategy',
        });
      }
    }

    // Update alerts (only add new unique alerts)
    setAlerts(prev => {
      const existingIds = new Set(prev.map(a => a.id.split('-').slice(0, -1).join('-')));
      const newUniqueAlerts = newAlerts.filter(
        alert => !existingIds.has(alert.id.split('-').slice(0, -1).join('-'))
      );
      
      return [...prev, ...newUniqueAlerts]
        .sort((a, b) => {
          const priority = { critical: 0, warning: 1, info: 2, success: 3 };
          return priority[a.type] - priority[b.type];
        })
        .slice(0, maxAlerts);
    });
  }, [data, connected, maxAlerts]);

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
  };

  const getAlertStyles = (type: AlertItem['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/20 text-red-600';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600';
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-600';
    }
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const unacknowledgedAlerts = useMemo(() => {
    return alerts.filter(alert => !alert.acknowledged);
  }, [alerts]);

  const criticalAlerts = useMemo(() => {
    return unacknowledgedAlerts.filter(alert => alert.type === 'critical');
  }, [unacknowledgedAlerts]);

  if (!connected) {
    return (
      <Card className={`border-border/50 bg-card/60 backdrop-blur-sm ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Real-Time Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Offline</AlertTitle>
            <AlertDescription>
              Alerts will appear when connected to live data stream.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-border/50 bg-card/60 backdrop-blur-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Real-Time Alerts
            {criticalAlerts.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Badge variant="destructive" className="ml-2">
                  {criticalAlerts.length}
                </Badge>
              </motion.div>
            )}
          </CardTitle>
          {unacknowledgedAlerts.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {unacknowledgedAlerts.length} active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <AnimatePresence mode="popLayout">
          {unacknowledgedAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 text-muted-foreground"
            >
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">All Systems Normal</p>
              <p className="text-xs mt-1">No alerts at this time</p>
            </motion.div>
          ) : (
            unacknowledgedAlerts.slice(0, maxAlerts).map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                layout
                className={`p-3 rounded-lg border ${getAlertStyles(alert.type)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{alert.title}</p>
                        {alert.source && (
                          <Badge variant="outline" className="text-xs">
                            {alert.source}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs opacity-90 mb-1">{alert.message}</p>
                      {alert.action && (
                        <p className="text-xs font-medium opacity-75 flex items-center gap-1 mt-1">
                          <Zap className="w-3 h-3" />
                          {alert.action}
                        </p>
                      )}
                      <p className="text-xs opacity-60 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-background/50"
                    aria-label="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
