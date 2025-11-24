import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ConfidenceIndicatorProps {
  confidence?: number; // 0-1 or 0-100
  ciLower?: Record<string, number>;
  ciUpper?: Record<string, number>;
  modelVersion?: string;
  showDetails?: boolean;
}

/**
 * ConfidenceIndicator - Research-backed trust metrics
 * 
 * Based on "The Algorithms on the Pit Wall" research:
 * - Shows confidence levels (high/medium/low)
 * - Displays confidence intervals for uncertainty quantification
 * - Includes model version for reproducibility
 */
export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  ciLower,
  ciUpper,
  modelVersion,
  showDetails = true,
}) => {
  // Normalize confidence to 0-100
  const confidencePercent = confidence !== undefined 
    ? (confidence <= 1 ? confidence * 100 : confidence)
    : null;

  const getConfidenceLevel = (conf: number): { label: string; color: string; icon: React.ReactNode } => {
    if (conf >= 80) {
      return {
        label: "High",
        color: "bg-green-500/20 text-green-600 border-green-500/50",
        icon: <CheckCircle2 className="w-4 h-4" />
      };
    } else if (conf >= 60) {
      return {
        label: "Medium",
        color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/50",
        icon: <Info className="w-4 h-4" />
      };
    } else {
      return {
        label: "Low",
        color: "bg-red-500/20 text-red-600 border-red-500/50",
        icon: <AlertCircle className="w-4 h-4" />
      };
    }
  };

  const confidenceLevel = confidencePercent !== null 
    ? getConfidenceLevel(confidencePercent)
    : null;

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          Model Confidence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {confidencePercent !== null && confidenceLevel && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confidence Level</span>
                <Badge 
                  variant="outline" 
                  className={confidenceLevel.color}
                >
                  {confidenceLevel.icon}
                  <span className="ml-1">{confidenceLevel.label}</span>
                </Badge>
              </div>
              <Progress 
                value={confidencePercent} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground text-right">
                {confidencePercent.toFixed(1)}%
              </div>
            </div>

            {showDetails && (ciLower || ciUpper) && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Uncertainty Bands (95% CI)
                </p>
                <div className="space-y-1.5 text-xs">
                  {ciLower && Object.entries(ciLower).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-mono">
                        {ciUpper?.[key] !== undefined 
                          ? `${value.toFixed(1)} - ${ciUpper[key].toFixed(1)}`
                          : `±${value.toFixed(1)}`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modelVersion && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Model: <span className="font-mono">{modelVersion}</span>
                </p>
              </div>
            )}
          </>
        )}

        {confidencePercent === null && (
          <p className="text-sm text-muted-foreground italic">
            Confidence metrics not available
          </p>
        )}
      </CardContent>
    </Card>
  );
};




