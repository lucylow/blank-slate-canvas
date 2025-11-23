import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Target,
  Clock,
  BarChart3,
  Zap,
  Award,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getSplitDeltas, type SplitDeltaResponse } from "@/api/pitwall";

interface LivePerformanceComparisonProps {
  track?: string;
  race?: number;
  vehicles?: number[];
  refVehicle?: number;
  className?: string;
}

interface ComparisonData {
  vehicleNumber: number;
  position: number;
  gapToLeader: string;
  gapToRef: string | null;
  deltaS1: number | null;
  deltaS2: number | null;
  deltaS3: number | null;
  predictedFinish: string;
  tireHealth: number;
  performanceScore: number;
}

/**
 * Live Performance Comparison Component
 * 
 * Compares multiple vehicles in real-time:
 * - Sector-by-sector deltas
 * - Gap analysis
 * - Performance trends
 * - Competitive positioning
 */
export const LivePerformanceComparison: React.FC<LivePerformanceComparisonProps> = ({
  track = "sebring",
  race = 1,
  vehicles = [7, 13, 22, 46],
  refVehicle = 7,
  className = "",
}) => {
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'gap' | 'sectors' | 'performance'>('gap');

  // Fetch split deltas
  const { data: splitData, isLoading } = useQuery<SplitDeltaResponse>({
    queryKey: ["split-deltas", track, race, vehicles.join(','), refVehicle],
    queryFn: () => getSplitDeltas(track, race, vehicles, refVehicle),
    enabled: !!track && !!race && vehicles.length > 0,
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: 1,
  });

  useEffect(() => {
    if (splitData?.delta_data) {
      // Process delta data into comparison format
      const processed: ComparisonData[] = vehicles.map((vehicle, index) => {
        const vehicleDeltas = splitData.delta_data.filter(
          d => d.compare_car === vehicle
        );
        
        // Calculate average deltas
        const avgDeltaS1 = vehicleDeltas.length > 0
          ? vehicleDeltas.reduce((sum, d) => sum + (d.delta_S1 || 0), 0) / vehicleDeltas.length
          : null;
        const avgDeltaS2 = vehicleDeltas.length > 0
          ? vehicleDeltas.reduce((sum, d) => sum + (d.delta_S2 || 0), 0) / vehicleDeltas.length
          : null;
        const avgDeltaS3 = vehicleDeltas.length > 0
          ? vehicleDeltas.reduce((sum, d) => sum + (d.delta_S3 || 0), 0) / vehicleDeltas.length
          : null;

        // Calculate total delta
        const totalDelta = (avgDeltaS1 || 0) + (avgDeltaS2 || 0) + (avgDeltaS3 || 0);
        
        // Simulate additional data (in production, this comes from live stream)
        const gapToRef = vehicle === refVehicle ? null : `${totalDelta > 0 ? '+' : ''}${totalDelta.toFixed(2)}s`;
        
        // Calculate performance score (lower is better for gaps)
        const performanceScore = Math.max(0, Math.min(100, 100 - Math.abs(totalDelta * 10)));
        
        return {
          vehicleNumber: vehicle,
          position: index + 1,
          gapToLeader: index === 0 ? "0.000s" : `+${(totalDelta * (index)).toFixed(3)}s`,
          gapToRef: gapToRef,
          deltaS1: avgDeltaS1,
          deltaS2: avgDeltaS2,
          deltaS3: avgDeltaS3,
          predictedFinish: `P${index + 1}`,
          tireHealth: 75 + Math.random() * 20, // Simulated
          performanceScore,
        };
      });

      setComparisonData(processed.sort((a, b) => a.position - b.position));
    }
  }, [splitData, vehicles, refVehicle]);

  const getDeltaColor = (delta: number | null) => {
    if (delta === null) return "text-muted-foreground";
    if (delta > 0.1) return "text-green-500"; // Faster
    if (delta < -0.1) return "text-red-500"; // Slower
    return "text-yellow-500"; // Similar
  };

  const formatDelta = (delta: number | null) => {
    if (delta === null) return "N/A";
    const sign = delta > 0 ? "+" : "";
    return `${sign}${delta.toFixed(3)}s`;
  };

  const metrics = [
    { id: 'gap' as const, label: 'Gaps', icon: Target },
    { id: 'sectors' as const, label: 'Sectors', icon: BarChart3 },
    { id: 'performance' as const, label: 'Performance', icon: TrendingUp },
  ];

  return (
    <Card className={`border-border/50 bg-card/60 backdrop-blur-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Live Performance Comparison
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {vehicles.length} vehicles
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metric Selector */}
        <div className="flex gap-2 border-b border-border/50 pb-3">
          {metrics.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedMetric === metric.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <metric.icon className="w-4 h-4" />
              {metric.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="w-6 h-6 mx-auto mb-2 animate-pulse" />
            <p className="text-sm">Loading comparison data...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {selectedMetric === 'gap' && (
              <motion.div
                key="gap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 px-2">
                  <span>Vehicle</span>
                  <span>Gap to Leader</span>
                  <span>Gap to Ref</span>
                  <span>Position</span>
                </div>
                {comparisonData.map((data, index) => (
                  <motion.div
                    key={data.vehicleNumber}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg border ${
                      data.vehicleNumber === refVehicle
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-accent/20 border-border/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {data.vehicleNumber === refVehicle ? (
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            #{data.vehicleNumber}
                          </Badge>
                        ) : (
                          <Badge variant="outline">#{data.vehicleNumber}</Badge>
                        )}
                        {index === 0 && (
                          <Award className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm font-mono">
                        <span className={index === 0 ? 'font-bold' : ''}>
                          {data.gapToLeader}
                        </span>
                        <span className={getDeltaColor(
                          data.gapToRef ? parseFloat(data.gapToRef) : null
                        )}>
                          {data.gapToRef || '—'}
                        </span>
                        <Badge variant="outline" className="font-mono">
                          {data.predictedFinish}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {selectedMetric === 'sectors' && (
              <motion.div
                key="sectors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground mb-2 px-2">
                  <span>Vehicle</span>
                  <span className="text-center">S1 Δ</span>
                  <span className="text-center">S2 Δ</span>
                  <span className="text-center">S3 Δ</span>
                  <span className="text-center">Total</span>
                </div>
                {comparisonData.map((data, index) => {
                  const totalDelta = (data.deltaS1 || 0) + (data.deltaS2 || 0) + (data.deltaS3 || 0);
                  return (
                    <motion.div
                      key={data.vehicleNumber}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border grid grid-cols-5 gap-2 items-center ${
                        data.vehicleNumber === refVehicle
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-accent/20 border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={data.vehicleNumber === refVehicle ? "default" : "outline"}>
                          #{data.vehicleNumber}
                        </Badge>
                      </div>
                      <div className={`text-sm font-mono text-center ${getDeltaColor(data.deltaS1)}`}>
                        {formatDelta(data.deltaS1)}
                      </div>
                      <div className={`text-sm font-mono text-center ${getDeltaColor(data.deltaS2)}`}>
                        {formatDelta(data.deltaS2)}
                      </div>
                      <div className={`text-sm font-mono text-center ${getDeltaColor(data.deltaS3)}`}>
                        {formatDelta(data.deltaS3)}
                      </div>
                      <div className={`text-sm font-mono font-bold text-center ${getDeltaColor(totalDelta)}`}>
                        {formatDelta(totalDelta)}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {selectedMetric === 'performance' && (
              <motion.div
                key="performance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {comparisonData.map((data, index) => (
                  <motion.div
                    key={data.vehicleNumber}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg border ${
                      data.vehicleNumber === refVehicle
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-accent/20 border-border/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={data.vehicleNumber === refVehicle ? "default" : "outline"}>
                          #{data.vehicleNumber}
                        </Badge>
                        <span className="text-sm font-medium">
                          {data.predictedFinish}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <>
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-500 font-medium">Leader</span>
                          </>
                        )}
                        {data.gapToRef && parseFloat(data.gapToRef) < 0 && (
                          <>
                            <TrendingDown className="w-4 h-4 text-red-500" />
                            <span className="text-xs text-red-500 font-medium">Slower</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Performance Score</span>
                          <span className="text-sm font-bold">{data.performanceScore.toFixed(0)}%</span>
                        </div>
                        <Progress value={data.performanceScore} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Tire Health</span>
                          <span className="text-sm font-bold">{data.tireHealth.toFixed(0)}%</span>
                        </div>
                        <Progress 
                          value={data.tireHealth} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {comparisonData.length > 0 && (
          <div className="pt-3 border-t border-border/50 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Reference vehicle: #{refVehicle} • Updates every 5 seconds
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
