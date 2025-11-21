// src/components/pitwall/RealTimeTimeSeriesChart.tsx
// Real-time time series chart for telemetry data from 7 tracks

import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Gauge, Zap, Activity, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TelemetryMessage {
  [key: string]: unknown;
  timestamp?: string | number;
  telemetry_name?: string;
  telemetry_value?: number;
  vehicle_number?: number;
  lap?: number;
  track?: string;
}

interface ChartDataPoint {
  time: number;
  timestamp: string;
  [metric: string]: number | string;
}

interface MetricConfig {
  key: string;
  label: string;
  color: string;
  unit?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: "speed",
    label: "Speed",
    color: "hsl(var(--chart-1))",
    unit: " km/h",
    icon: Zap,
  },
  {
    key: "accx_can",
    label: "Longitudinal G",
    color: "hsl(var(--chart-2))",
    unit: " G",
    icon: TrendingUp,
  },
  {
    key: "accy_can",
    label: "Lateral G",
    color: "hsl(var(--chart-3))",
    unit: " G",
    icon: Activity,
  },
  {
    key: "pbrake_f",
    label: "Brake Pressure",
    color: "hsl(var(--chart-4))",
    unit: " bar",
    icon: Gauge,
  },
  {
    key: "ath",
    label: "Throttle",
    color: "hsl(var(--chart-5))",
    unit: " %",
    icon: Activity,
  },
  {
    key: "nmot",
    label: "RPM",
    color: "hsl(var(--primary))",
    unit: " rpm",
  },
];

interface Props {
  messages: unknown[];
  maxDataPoints?: number;
  height?: number;
}

export default function RealTimeTimeSeriesChart({ 
  messages, 
  maxDataPoints = 200,
  height = 300 
}: Props) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["speed", "accx_can", "accy_can"]);
  const [timeWindow, setTimeWindow] = useState<number>(60); // seconds

  // Process messages into chart data
  const chartData = useMemo(() => {
    if (!messages || messages.length === 0) {
      return [];
    }

    // Group messages by timestamp
    const timeMap = new Map<number, ChartDataPoint>();

    messages.forEach((msg) => {
      if (!msg || typeof msg !== "object") return;

      const message = msg as TelemetryMessage;
      
      // Extract timestamp
      let timestamp: number;
      if (message.timestamp) {
        if (typeof message.timestamp === "string") {
          timestamp = new Date(message.timestamp).getTime();
        } else {
          timestamp = message.timestamp as number;
        }
      } else {
        timestamp = Date.now();
      }

      // Get or create data point for this timestamp
      let dataPoint = timeMap.get(timestamp);
      if (!dataPoint) {
        dataPoint = {
          time: timestamp,
          timestamp: new Date(timestamp).toLocaleTimeString(),
        };
        timeMap.set(timestamp, dataPoint);
      }

      // Extract telemetry values
      // Handle long format (telemetry_name + telemetry_value)
      if (message.telemetry_name && typeof message.telemetry_value === "number") {
        const metricKey = message.telemetry_name as string;
        // Map common telemetry names to our metric keys
        const metricMap: Record<string, string> = {
          "Speed": "speed",
          "speed": "speed",
          "accx_can": "accx_can",
          "accy_can": "accy_can",
          "pbrake_f": "pbrake_f",
          "pbrake_r": "pbrake_f", // Use front brake as representative
          "ath": "ath",
          "nmot": "nmot",
          "gear": "gear",
        };

        const mappedKey = metricMap[metricKey] || metricKey;
        if (METRIC_CONFIGS.some((m) => m.key === mappedKey)) {
          dataPoint[mappedKey] = message.telemetry_value;
        }
      }

      // Handle wide format (direct fields)
      METRIC_CONFIGS.forEach((config) => {
        if (message[config.key] !== undefined && typeof message[config.key] === "number") {
          dataPoint[config.key] = message[config.key] as number;
        }
      });
    });

    // Convert to array and sort by time
    let data = Array.from(timeMap.values()).sort((a, b) => a.time - b.time);

    // Apply time window filter
    if (timeWindow > 0) {
      const cutoffTime = Date.now() - timeWindow * 1000;
      data = data.filter((point) => point.time >= cutoffTime);
    }

    // Limit to maxDataPoints (keep most recent)
    if (data.length > maxDataPoints) {
      data = data.slice(-maxDataPoints);
    }

    return data;
  }, [messages, timeWindow, maxDataPoints]);

  // Toggle metric selection
  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricKey)
        ? prev.filter((m) => m !== metricKey)
        : [...prev, metricKey]
    );
  };

  // Chart configuration
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    METRIC_CONFIGS.forEach((metric) => {
      config[metric.key] = {
        label: metric.label,
        color: metric.color,
      };
    });
    return config;
  }, []);

  // Get visible metrics
  const visibleMetrics = METRIC_CONFIGS.filter((m) => selectedMetrics.includes(m.key));

  return (
    <div className="w-full space-y-4">
      {/* Metric Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Metrics:</span>
        {METRIC_CONFIGS.map((metric) => {
          const isSelected = selectedMetrics.includes(metric.key);
          const Icon = metric.icon;
          return (
            <Button
              key={metric.key}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 text-xs",
                isSelected && "bg-primary text-primary-foreground"
              )}
              onClick={() => toggleMetric(metric.key)}
            >
              {Icon && <Icon className="w-3 h-3 mr-1" />}
              {metric.label}
            </Button>
          );
        })}
      </div>

      {/* Time Window Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Time Window:</span>
        {[30, 60, 120, 300].map((seconds) => (
          <Button
            key={seconds}
            variant={timeWindow === seconds ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setTimeWindow(seconds)}
          >
            {seconds}s
          </Button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: `${height}px` }}>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground">
              Waiting for telemetry data...
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  
                  return (
                    <ChartTooltipContent
                      active={active}
                      payload={payload}
                      labelFormatter={(value) => `Time: ${value}`}
                      formatter={(value, name) => {
                        const metric = METRIC_CONFIGS.find((m) => m.key === name);
                        const unit = metric?.unit || "";
                        return [`${Number(value).toFixed(2)}${unit}`, metric?.label || name];
                      }}
                    />
                  );
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                iconType="line"
                formatter={(value) => {
                  const metric = METRIC_CONFIGS.find((m) => m.key === value);
                  return metric?.label || value;
                }}
              />
              {visibleMetrics.map((metric) => (
                <Line
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  stroke={metric.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </div>

      {/* Stats */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {visibleMetrics.map((metric) => {
            const values = chartData
              .map((d) => d[metric.key] as number)
              .filter((v) => typeof v === "number" && !isNaN(v));
            
            if (values.length === 0) return null;

            const max = Math.max(...values);
            const min = Math.min(...values);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;

            return (
              <div
                key={metric.key}
                className="p-2 bg-muted/30 rounded border border-border/50"
              >
                <div className="font-medium text-muted-foreground mb-1">
                  {metric.label}
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max:</span>
                    <span className="font-mono font-semibold">
                      {max.toFixed(1)}{metric.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg:</span>
                    <span className="font-mono">
                      {avg.toFixed(1)}{metric.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min:</span>
                    <span className="font-mono">
                      {min.toFixed(1)}{metric.unit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

