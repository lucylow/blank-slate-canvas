import React from "react";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { ExplainabilityCard } from "./ExplainabilityCard";
import { DriverCoachingCard } from "./DriverCoachingCard";
import { CompetitorModelingCard } from "./CompetitorModelingCard";
import type { TireWearData } from "@/api/pitwall";

interface ResearchBackedFeaturesProps {
  tireWear?: TireWearData;
  currentLap?: number;
  vehicleNumber?: number;
}

/**
 * ResearchBackedFeatures - Container component for all research-backed AI features
 * 
 * This component integrates:
 * 1. Confidence/Uncertainty indicators (trust metrics)
 * 2. Explainability (feature attribution)
 * 3. Driver coaching insights (anomaly detection)
 * 4. Competitor modeling (strategic advantage)
 * 
 * Based on research from:
 * - "The Algorithms on the Pit Wall" (BoxThisLap)
 * - "Explainable Time Series Prediction of Tyre Energy" (arXiv)
 * - "AI Auto Insights" (Coach Dave Academy)
 * - Industry practice (Mercia AI, F1 strategy)
 */
export const ResearchBackedFeatures: React.FC<ResearchBackedFeaturesProps> = ({
  tireWear,
  currentLap = 12,
  vehicleNumber,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Confidence & Explainability Row */}
        <ConfidenceIndicator
          confidence={tireWear?.confidence}
          ciLower={tireWear?.ci_lower}
          ciUpper={tireWear?.ci_upper}
          modelVersion={tireWear?.model_version}
        />
        <ExplainabilityCard
          topFeatures={tireWear?.top_features}
          maxFeatures={3}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Driver Coaching & Competitor Modeling Row */}
        <DriverCoachingCard
          consistency={95.2}
          showDetails={true}
        />
        <CompetitorModelingCard
          currentLap={currentLap}
          showUndercutWindow={true}
        />
      </div>
    </div>
  );
};



