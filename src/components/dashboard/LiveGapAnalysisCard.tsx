import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, AlertCircle, Target } from "lucide-react";
import { DashboardData } from "@/lib/types";

interface LiveGapAnalysisCardProps {
  gapAnalysis?: DashboardData["gap_analysis"];
  performance?: DashboardData["performance"];
}

/**
 * Live Gap Analysis Card
 * 
 * Monitors real-time gaps to competitors and calculates:
 * - Gap to leader
 * - Gap to car ahead/behind
 * - Overtaking opportunities
 * - Closing rate analysis
 */
export const LiveGapAnalysisCard: React.FC<LiveGapAnalysisCardProps> = ({
  gapAnalysis,
  performance,
}) => {
  // Mock data if not provided
  const displayGapAnalysis = gapAnalysis || {
    position: 3,
    gap_to_leader: "+2.346s",
    gap_to_ahead: "+0.856s",
    gap_to_behind: "-0.432s",
    overtaking_opportunity: true,
    under_pressure: false,
    closing_rate_ahead: "+0.12s/lap",
  };

  const parseGap = (gap: string | null | undefined): number => {
    if (!gap) return 0;
    const match = gap.match(/[+-]?(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const gapToLeader = parseGap(displayGapAnalysis.gap_to_leader);
  const gapToAhead = parseGap(displayGapAnalysis.gap_to_ahead);
  const gapToBehind = parseGap(displayGapAnalysis.gap_to_behind);

  const getGapColor = (gap: number, isPositive: boolean) => {
    if (gap < 1.0) return "text-green-500";
    if (gap < 3.0) return "text-yellow-500";
    return isPositive ? "text-red-500" : "text-blue-500";
  };

  const getOvertakingWindow = () => {
    if (gapToAhead < 1.0) {
      return {
        available: true,
        message: "Overtaking window open - within DRS range",
        color: "bg-green-500/10 text-green-600 border-green-500/20",
      };
    }
    if (gapToAhead < 2.0) {
      return {
        available: true,
        message: "Approaching overtaking range",
        color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      };
    }
    return {
      available: false,
      message: "Gap too large for immediate overtake",
      color: "bg-muted text-muted-foreground",
    };
  };

  const overtakingWindow = getOvertakingWindow();

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Live Gap Analysis
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Real-time competitor positioning and overtaking opportunities
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Position and Gap to Leader */}
        <div className="p-3 rounded-lg bg-accent/30 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Position</span>
            </div>
            <Badge variant="outline" className="text-lg font-bold">
              P{displayGapAnalysis.position}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Gap to Leader</span>
            <span className={`text-lg font-bold font-mono ${getGapColor(gapToLeader, true)}`}>
              {displayGapAnalysis.gap_to_leader}
            </span>
          </div>
        </div>

        {/* Gaps to Adjacent Cars */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-accent/30 border border-border/50">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-muted-foreground">Gap Ahead</span>
            </div>
            <div className={`text-sm font-bold font-mono ${getGapColor(gapToAhead, true)}`}>
              {displayGapAnalysis.gap_to_ahead || "N/A"}
            </div>
            {displayGapAnalysis.closing_rate_ahead && (
              <div className="text-xs text-muted-foreground mt-1">
                Closing: {displayGapAnalysis.closing_rate_ahead}
              </div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-accent/30 border border-border/50">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-red-500" />
              <span className="text-xs text-muted-foreground">Gap Behind</span>
            </div>
            <div className={`text-sm font-bold font-mono ${getGapColor(gapToBehind, false)}`}>
              {displayGapAnalysis.gap_to_behind || "N/A"}
            </div>
          </div>
        </div>

        {/* Overtaking Opportunity */}
        {displayGapAnalysis.overtaking_opportunity && (
          <div className={`p-3 rounded-lg border ${overtakingWindow.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">Overtaking Opportunity</span>
            </div>
            <p className="text-xs mt-1">{overtakingWindow.message}</p>
            {gapToAhead < 1.0 && (
              <div className="mt-2 text-xs">
                <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500/50">
                  DRS Available
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Under Pressure */}
        {displayGapAnalysis.under_pressure && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-semibold text-yellow-600">Under Pressure</span>
            </div>
            <p className="text-xs text-yellow-600">
              Car behind is within 1.0s - defend position
            </p>
          </div>
        )}

        {/* Strategic Insights */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Strategic Insights
          </p>
          <div className="space-y-1.5 text-xs">
            {displayGapAnalysis.overtaking_opportunity && gapToAhead < 1.0 && (
              <div className="p-2 rounded bg-accent/20">
                <span className="text-muted-foreground">Recommendation: </span>
                <span className="font-semibold">
                  Push for overtake - gap closing rapidly
                </span>
              </div>
            )}
            {displayGapAnalysis.under_pressure && (
              <div className="p-2 rounded bg-accent/20">
                <span className="text-muted-foreground">Recommendation: </span>
                <span className="font-semibold">
                  Defend position - maintain consistent pace
                </span>
              </div>
            )}
            {!displayGapAnalysis.overtaking_opportunity && !displayGapAnalysis.under_pressure && (
              <div className="p-2 rounded bg-accent/20">
                <span className="text-muted-foreground">Status: </span>
                <span className="font-semibold">
                  Maintain current pace - no immediate action needed
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};



