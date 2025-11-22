import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, TrendingUp, Target, Zap, Activity } from "lucide-react";
import {
  getFingerprint,
  getAlerts,
  getCoachingPlan,
  processTelemetry,
  type DriverFingerprint,
  type CoachingAlert,
  type CoachingPlan,
  type TelemetryRequest,
} from "@/api/driverFingerprint";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getBackendUrl } from "@/utils/backendUrl";

interface DriverFingerprintDashboardProps {
  driverId: string;
  onReplay?: (evidence: any) => void;
}

export default function DriverFingerprintDashboard({
  driverId,
  onReplay,
}: DriverFingerprintDashboardProps) {
  const [fingerprint, setFingerprint] = useState<DriverFingerprint | null>(null);
  const [alerts, setAlerts] = useState<CoachingAlert[]>([]);
  const [coachingPlan, setCoachingPlan] = useState<CoachingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket for real-time updates
  const backendUrl = getBackendUrl();
  const wsUrl = backendUrl
    ? backendUrl.replace(/^http/, "ws") + `/ws/drivers/${driverId}/fingerprint`
    : "";
  const ws = useWebSocket(wsUrl);

  useEffect(() => {
    loadDriverData();
  }, [driverId]);

  useEffect(() => {
    if (ws.messages.length > 0) {
      const lastMessage = ws.messages[ws.messages.length - 1];
      if (lastMessage && typeof lastMessage === "object") {
        const data = lastMessage as any;
        if (data.type === "fingerprint_update") {
          setFingerprint(data.fingerprint);
          setAlerts(data.alerts || []);
        } else if (data.type === "coaching_alert") {
          setAlerts((prev) => [data.alert, ...prev]);
        }
      }
    }
  }, [ws.messages]);

  const loadDriverData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [fpRes, alertsRes, planRes] = await Promise.allSettled([
        getFingerprint(driverId),
        getAlerts(driverId),
        getCoachingPlan(driverId),
      ]);

      if (fpRes.status === "fulfilled") {
        setFingerprint(fpRes.value);
      } else if (fpRes.reason?.message?.includes("No fingerprint found")) {
        // This is okay - driver might not have data yet
        setFingerprint(null);
      }

      if (alertsRes.status === "fulfilled") {
        setAlerts(alertsRes.value);
      }

      if (planRes.status === "fulfilled") {
        setCoachingPlan(planRes.value);
      } else if (planRes.reason?.message?.includes("No coaching plan")) {
        // This is okay
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load driver data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading driver fingerprint...</span>
        </CardContent>
      </Card>
    );
  }

  if (error && !fingerprint) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <Button onClick={loadDriverData} className="mt-4" variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Driver Performance Analysis</h2>
          <p className="text-muted-foreground">Driver #{driverId}</p>
        </div>
        <Button onClick={loadDriverData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Score Card */}
        {fingerprint && (
          <ScoreCard fingerprint={fingerprint} />
        )}

        {/* Coaching Alerts */}
        <AlertsPanel alerts={alerts} />
      </div>

      {/* Feature Radar Chart */}
      {fingerprint && (
        <FeatureRadarChart features={fingerprint.features} />
      )}

      {/* Coaching Plan */}
      {coachingPlan && (
        <CoachingPlanPanel plan={coachingPlan} />
      )}

      {!fingerprint && !error && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No fingerprint data available for this driver yet. Process telemetry data to generate a fingerprint.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScoreCard({ fingerprint }: { fingerprint: DriverFingerprint }) {
  const score = fingerprint.features.overall_score || 0;
  const scorePercent = Math.round(score * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Overall Performance Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${score * 351.86} 351.86`}
                className="text-primary"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{scorePercent}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <ScoreBreakdownItem
            label="Braking"
            value={fingerprint.features.braking_consistency || 0}
          />
          <ScoreBreakdownItem
            label="Throttle"
            value={fingerprint.features.throttle_smoothness || 0}
          />
          <ScoreBreakdownItem
            label="Cornering"
            value={fingerprint.features.cornering_style || 0}
          />
          <ScoreBreakdownItem
            label="Consistency"
            value={fingerprint.features.lap_consistency || 0}
          />
          <ScoreBreakdownItem
            label="Tire Management"
            value={1 - (fingerprint.features.tire_stress_index || 0.5)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBreakdownItem({ label, value }: { label: string; value: number }) {
  const percent = Math.round(value * 100);
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 flex-1 mx-4">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-sm font-medium w-12 text-right">{percent}%</span>
      </div>
    </div>
  );
}

function AlertsPanel({ alerts }: { alerts: CoachingAlert[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          Coaching Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No current alerts - great driving!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertCard({ alert }: { alert: CoachingAlert }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-blue-500";
      case "low":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityVariant = (priority: string): "destructive" | "default" | "secondary" => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(alert.priority)}`} />
          <Badge variant={getPriorityVariant(alert.priority)} className="text-xs">
            {alert.priority}
          </Badge>
          <span className="text-xs text-muted-foreground">{alert.category}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(alert.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm font-medium">{alert.message}</p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {alert.confidence !== undefined && (
          <span>Confidence: {Math.round(alert.confidence * 100)}%</span>
        )}
        <span>Area: {alert.improvement_area.replace(/_/g, " ")}</span>
      </div>
    </div>
  );
}

function FeatureRadarChart({ features }: { features: DriverFingerprint["features"] }) {
  const featureData = [
    { subject: "Braking", value: (features.braking_consistency || 0.5) * 100 },
    { subject: "Throttle", value: (features.throttle_smoothness || 0.5) * 100 },
    { subject: "Cornering", value: (features.cornering_style || 0.5) * 100 },
    { subject: "Consistency", value: (features.lap_consistency || 0.5) * 100 },
    { subject: "Tire Mgmt", value: (1 - (features.tire_stress_index || 0.5)) * 100 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Driving Style Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {featureData.map((feature) => (
            <div key={feature.subject} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{feature.subject}</span>
                <span className="text-muted-foreground">{Math.round(feature.value)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${feature.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CoachingPlanPanel({ plan }: { plan: CoachingPlan }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Personalized Coaching Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Priority Areas</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {plan.priority_areas.map((area, index) => (
                  <li key={index}>{area.replace(/_/g, " ")}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Weekly Focus</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {plan.weekly_focus.map((focus, index) => (
                  <li key={index}>{focus}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Practice Drills</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {plan.specific_drills.map((drill, index) => (
                  <li key={index}>{drill}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Target Metrics</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Score:</span>
                  <span className="font-medium">
                    {Math.round(plan.progress_metrics.target_overall_score * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Braking Consistency:</span>
                  <span className="font-medium">
                    {Math.round(plan.progress_metrics.target_braking_consistency * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Throttle Smoothness:</span>
                  <span className="font-medium">
                    {Math.round(plan.progress_metrics.target_throttle_smoothness * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Lap Consistency:</span>
                  <span className="font-medium">
                    {Math.round(plan.progress_metrics.target_lap_consistency * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

