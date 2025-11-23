import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Brain,
  Gauge,
  Award,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  type: "opportunity" | "warning" | "success" | "info";
  title: string;
  description: string;
  value: string | number;
  trend?: "up" | "down" | "stable";
  confidence?: number;
  actionable?: boolean;
}

interface Metric {
  label: string;
  value: number | string;
  unit?: string;
  trend?: "up" | "down" | "stable";
  change?: number;
  target?: number;
  status?: "excellent" | "good" | "warning" | "critical";
}

interface DataIntelligenceCardProps {
  className?: string;
  insights?: Insight[];
  metrics?: Metric[];
  performanceScore?: number;
  title?: string;
}

export const DataIntelligenceCard: React.FC<DataIntelligenceCardProps> = ({
  className = "",
  insights = [],
  metrics = [],
  performanceScore = 85,
  title = "Data Intelligence",
}) => {
  // Generate sample insights if none provided
  const defaultInsights: Insight[] = useMemo(
    () => [
      {
        id: "1",
        type: "opportunity",
        title: "Overtaking Opportunity",
        description: "Gap closing rapidly in Sector 2 - optimal window in next 2 laps",
        value: "2 laps",
        trend: "up",
        confidence: 87,
        actionable: true,
      },
      {
        id: "2",
        type: "warning",
        title: "Tire Degradation Alert",
        description: "Front-left tire wear accelerating - consider pit window adjustment",
        value: "15%",
        trend: "down",
        confidence: 92,
        actionable: true,
      },
      {
        id: "3",
        type: "success",
        title: "Consistency Improvement",
        description: "Lap time variance reduced by 0.15s over last 5 laps",
        value: "+12%",
        trend: "up",
        confidence: 78,
        actionable: false,
      },
      {
        id: "4",
        type: "info",
        title: "Fuel Strategy Optimal",
        description: "Current fuel consumption aligns with predicted pit window",
        value: "On track",
        trend: "stable",
        confidence: 95,
        actionable: false,
      },
    ],
    []
  );

  // Generate sample metrics if none provided
  const defaultMetrics: Metric[] = useMemo(
    () => [
      {
        label: "Performance Score",
        value: performanceScore,
        unit: "%",
        trend: performanceScore > 80 ? "up" : "down",
        change: 2.5,
        status: performanceScore >= 80 ? "excellent" : performanceScore >= 60 ? "good" : "warning",
      },
      {
        label: "Lap Consistency",
        value: 94.2,
        unit: "%",
        trend: "up",
        change: 1.2,
        status: "excellent",
      },
      {
        label: "Tire Life Remaining",
        value: 68,
        unit: "%",
        trend: "down",
        change: -3.1,
        status: "good",
      },
      {
        label: "Gap to Leader",
        value: 2.34,
        unit: "s",
        trend: "down",
        change: -0.45,
        status: "good",
      },
    ],
    [performanceScore]
  );

  const displayInsights = insights.length > 0 ? insights : defaultInsights;
  const displayMetrics = metrics.length > 0 ? metrics : defaultMetrics;

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "opportunity":
        return <Zap className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4" />;
      case "info":
        return <Brain className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: Insight["type"]) => {
    switch (type) {
      case "opportunity":
        return "bg-blue-500/10 border-blue-500/30 text-blue-600";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-600";
      case "success":
        return "bg-green-500/10 border-green-500/30 text-green-600";
      case "info":
        return "bg-purple-500/10 border-purple-500/30 text-purple-600";
    }
  };

  const getStatusColor = (status?: Metric["status"]) => {
    switch (status) {
      case "excellent":
        return "text-green-500";
      case "good":
        return "text-blue-500";
      case "warning":
        return "text-yellow-500";
      case "critical":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getTrendIcon = (trend?: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="w-3.5 h-3.5" />;
    if (trend === "down") return <TrendingDown className="w-3.5 h-3.5" />;
    return null;
  };

  return (
    <Card className={cn("border-border/50 bg-card/80 backdrop-blur-md shadow-xl", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            {title}
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <Activity className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {displayMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
                {metric.trend && (
                  <motion.div
                    animate={{ y: metric.trend === "up" ? [-2, 2, -2] : [2, -2, 2] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className={cn(
                      "flex items-center gap-1",
                      metric.trend === "up" ? "text-green-500" : metric.trend === "down" ? "text-red-500" : "text-muted-foreground"
                    )}
                  >
                    {getTrendIcon(metric.trend)}
                  </motion.div>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <motion.span
                  key={metric.value}
                  initial={{ scale: 1.2, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={cn("text-2xl font-bold font-mono", getStatusColor(metric.status))}
                >
                  {typeof metric.value === "number" ? metric.value.toFixed(metric.unit === "%" ? 1 : 2) : metric.value}
                </motion.span>
                {metric.unit && (
                  <span className="text-xs text-muted-foreground">{metric.unit}</span>
                )}
                {metric.change !== undefined && (
                  <span
                    className={cn(
                      "text-xs font-semibold flex items-center gap-0.5",
                      metric.change > 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {metric.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(metric.change).toFixed(1)}
                  </span>
                )}
              </div>
              {metric.target && (
                <div className="mt-2">
                  <Progress
                    value={(Number(metric.value) / metric.target) * 100}
                    className="h-1.5"
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* AI Insights */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              AI-Generated Insights
            </h3>
            <Badge variant="outline" className="text-xs">
              {displayInsights.length} insights
            </Badge>
          </div>
          <div className="space-y-2">
            {displayInsights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-300 hover:shadow-md",
                  getInsightColor(insight.type),
                  insight.actionable && "cursor-pointer hover:scale-[1.02]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold">{insight.title}</h4>
                      {insight.confidence && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-background/50 border-border/50"
                        >
                          {insight.confidence}% confidence
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs opacity-90 mb-2 leading-relaxed">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{insight.value}</span>
                      {insight.actionable && (
                        <Badge variant="outline" className="text-xs bg-background/50">
                          Actionable
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Overall Performance
            </span>
            <span className={cn("text-lg font-bold", getStatusColor(displayMetrics[0]?.status))}>
              {performanceScore}%
            </span>
          </div>
          <Progress value={performanceScore} className="h-2" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Based on telemetry, consistency, and strategic positioning</span>
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              Top 15%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


