import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ExplainabilityCardProps {
  topFeatures?: Record<string, number>; // Feature name -> importance score
  maxFeatures?: number;
  showImpact?: boolean;
}

/**
 * ExplainabilityCard - Research-backed feature attribution
 * 
 * Based on "Explainable Time Series Prediction of Tyre Energy in Formula One Race Strategy":
 * - Shows top N features influencing predictions
 * - Displays feature importance scores
 * - Provides actionable insights for engineers
 */
export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({
  topFeatures,
  maxFeatures = 3,
  showImpact = true,
}) => {
  if (!topFeatures || Object.keys(topFeatures).length === 0) {
    return (
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Feature Attribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            Feature importance data not available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort features by absolute importance and take top N
  const sortedFeatures = Object.entries(topFeatures)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .slice(0, maxFeatures);

  // Normalize scores to 0-100 for display
  const maxScore = Math.max(...sortedFeatures.map(([, score]) => Math.abs(score)));
  const normalizedFeatures = sortedFeatures.map(([name, score]) => ({
    name,
    score,
    normalized: maxScore > 0 ? (Math.abs(score) / maxScore) * 100 : 0,
    isPositive: score > 0,
  }));

  const getFeatureIcon = (isPositive: boolean) => {
    if (isPositive) {
      return <TrendingUp className="w-3 h-3 text-green-600" />;
    } else if (isPositive === false) {
      return <TrendingDown className="w-3 h-3 text-red-600" />;
    }
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const formatFeatureName = (name: string): string => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          Top {maxFeatures} Influencing Features
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Features most impacting this prediction
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {normalizedFeatures.map(({ name, score, normalized, isPositive }, index) => (
          <div key={name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="text-xs px-1.5 py-0.5"
                >
                  #{index + 1}
                </Badge>
                <span className="text-sm font-medium">
                  {formatFeatureName(name)}
                </span>
                {getFeatureIcon(isPositive)}
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {score > 0 ? '+' : ''}{score.toFixed(2)}
              </span>
            </div>
            <Progress 
              value={normalized} 
              className="h-1.5"
            />
            {showImpact && (
              <p className="text-xs text-muted-foreground italic">
                {isPositive 
                  ? "Increases predicted wear/degradation"
                  : "Decreases predicted wear/degradation"
                }
              </p>
            )}
          </div>
        ))}

        <div className="pt-2 border-t border-border/50 mt-4">
          <p className="text-xs text-muted-foreground">
            <Info className="w-3 h-3 inline mr-1" />
            Higher absolute scores indicate stronger influence on the prediction
          </p>
        </div>
      </CardContent>
    </Card>
  );
};


