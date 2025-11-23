import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, TrendingUp, Target, Clock } from "lucide-react";

interface SectorAnalysis {
  sector: number;
  timeLost: number; // seconds
  issue: string;
  evidence?: string;
}

interface DriverCoachingCardProps {
  sectors?: SectorAnalysis[];
  consistency?: number; // 0-100
  anomalies?: Array<{
    type: "early_lift" | "lockup" | "understeer" | "overspeed" | "late_brake";
    sector: number;
    severity: "low" | "medium" | "high";
    timeImpact: number; // seconds
    description: string;
  }>;
  showDetails?: boolean;
}

/**
 * DriverCoachingCard - Research-backed driver performance analysis
 * 
 * Based on "AI Auto Insights" and anomaly detection research:
 * - Corner-by-corner/sector-by-sector performance analysis
 * - Identifies time loss locations
 * - Provides actionable coaching feedback
 * - Detects driving anomalies (lockups, early lifts, etc.)
 */
export const DriverCoachingCard: React.FC<DriverCoachingCardProps> = ({
  sectors,
  consistency,
  anomalies,
  showDetails = true,
}) => {
  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case "early_lift":
        return <TrendingDown className="w-4 h-4 text-yellow-600" />;
      case "lockup":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "understeer":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "overspeed":
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case "late_brake":
        return <Clock className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getAnomalyColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/20 text-red-600 border-red-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/50";
      case "low":
        return "bg-blue-500/20 text-blue-600 border-blue-500/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatAnomalyType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Mock data if not provided (for demo)
  const displaySectors = sectors || [
    { sector: 1, timeLost: 0.12, issue: "Early braking in Turn 3" },
    { sector: 2, timeLost: 0.31, issue: "Understeer in high-speed section" },
    { sector: 3, timeLost: 0.08, issue: "Late throttle application" },
  ];

  const displayAnomalies = anomalies || [
    {
      type: "early_lift" as const,
      sector: 2,
      severity: "medium" as const,
      timeImpact: 0.15,
      description: "Early throttle lift detected in Sector 2, Turn 5"
    },
    {
      type: "lockup" as const,
      sector: 1,
      severity: "high" as const,
      timeImpact: 0.22,
      description: "Front brake lockup in Sector 1, Turn 2"
    },
  ];

  const totalTimeLost = displaySectors.reduce((sum, s) => sum + s.timeLost, 0);

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Driver Coaching Insights
        </CardTitle>
        {consistency !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Consistency: <span className="font-semibold">{consistency.toFixed(1)}%</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Loss by Sector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">
              Time Lost by Sector
            </p>
            <Badge variant="outline" className="text-xs">
              Total: {totalTimeLost.toFixed(2)}s
            </Badge>
          </div>
          <div className="space-y-2">
            {displaySectors.map((sector) => (
              <div 
                key={sector.sector}
                className="flex items-center justify-between p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    S{sector.sector}
                  </Badge>
                  <span className="text-sm">{sector.issue}</span>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  -{sector.timeLost.toFixed(2)}s
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Anomalies Detected */}
        {showDetails && displayAnomalies.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Anomalies Detected
            </p>
            <div className="space-y-2">
              {displayAnomalies.map((anomaly, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-2 p-2 rounded-lg bg-accent/20 border border-border/50"
                >
                  <div className="mt-0.5">
                    {getAnomalyIcon(anomaly.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getAnomalyColor(anomaly.severity)}`}
                      >
                        {formatAnomalyType(anomaly.type)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        S{anomaly.sector}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {anomaly.description}
                    </p>
                    <p className="text-xs font-semibold text-red-600">
                      Impact: -{anomaly.timeImpact.toFixed(2)}s
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Feedback */}
        {totalTimeLost > 0 && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Recommended Focus
            </p>
            <p className="text-xs text-foreground">
              {displaySectors
                .sort((a, b) => b.timeLost - a.timeLost)[0]
                ?.issue || "Review telemetry for optimization opportunities"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



