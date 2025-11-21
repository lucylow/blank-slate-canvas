// src/components/pitwall/AIAgentDecisions.tsx

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, AlertTriangle, Target, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HumanReviewPanel from "./HumanReviewPanel";

export interface AgentDecision {
  decision_id: string;
  agent_id: string;
  agent_type: string;
  track: string;
  chassis: string;
  vehicle_number?: number;
  timestamp: string;
  decision_type: "pit" | "coach" | "anomaly" | "strategy" | "prediction";
  action: string;
  confidence: number;
  risk_level: "safe" | "moderate" | "aggressive" | "critical";
  reasoning: string[];
  evidence?: Record<string, unknown>;
  alternatives?: Array<{
    action: string;
    risk: string;
    rationale: string;
  }>;
}

interface AIAgentDecisionsProps {
  decisions: AgentDecision[];
  onDecisionClick?: (decision: AgentDecision) => void;
  maxDisplay?: number;
  enableHumanReview?: boolean;
  onReviewComplete?: () => void;
}

const getDecisionIcon = (type: string) => {
  switch (type) {
    case "pit":
      return <Target className="w-4 h-4" />;
    case "anomaly":
      return <AlertTriangle className="w-4 h-4" />;
    case "coach":
      return <TrendingUp className="w-4 h-4" />;
    case "strategy":
      return <Bot className="w-4 h-4" />;
    case "prediction":
      return <Clock className="w-4 h-4" />;
    default:
      return <Bot className="w-4 h-4" />;
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "critical":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "aggressive":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "moderate":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "safe":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const getAgentTypeColor = (type: string) => {
  switch (type) {
    case "strategist":
      return "bg-blue-500/20 text-blue-400";
    case "coach":
      return "bg-purple-500/20 text-purple-400";
    case "anomaly_detective":
      return "bg-red-500/20 text-red-400";
    case "predictor":
      return "bg-cyan-500/20 text-cyan-400";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function AIAgentDecisions({
  decisions,
  onDecisionClick,
  maxDisplay = 10,
  enableHumanReview = true,
  onReviewComplete,
}: AIAgentDecisionsProps) {
  const displayedDecisions = decisions.slice(0, maxDisplay);

  if (decisions.length === 0) {
    return (
      <Card className="bg-card/80 backdrop-blur-lg border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="w-5 h-5 text-primary" />
            AI Agent Decisions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No agent decisions available</p>
            <p className="text-xs mt-2">Agents will appear here when analyzing telemetry</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <span>AI Agent Decisions</span>
            <Badge variant="secondary" className="ml-2">
              {decisions.length}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
        <AnimatePresence>
          {displayedDecisions.map((decision, index) => (
            <motion.div
              key={decision.decision_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div
                className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                  getRiskColor(decision.risk_level)
                }`}
                onClick={() => onDecisionClick?.(decision)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {getDecisionIcon(decision.decision_type)}
                    <Badge
                      variant="outline"
                      className={`text-xs ${getAgentTypeColor(decision.agent_type)}`}
                    >
                      {decision.agent_type.replace("_", " ")}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getRiskColor(decision.risk_level)}`}
                    >
                      {decision.risk_level}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(decision.timestamp).toLocaleTimeString()}
                    </span>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Action */}
                <div className="mb-2">
                  <p className="text-sm font-semibold text-foreground">{decision.action}</p>
                </div>

                {/* Track and Chassis */}
                <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
                  <span className="uppercase font-medium">{decision.track}</span>
                  <span>•</span>
                  <span>{decision.chassis}</span>
                  {decision.vehicle_number && (
                    <>
                      <span>•</span>
                      <span>#{decision.vehicle_number}</span>
                    </>
                  )}
                </div>

                {/* Reasoning Preview */}
                {decision.reasoning && decision.reasoning.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Reasoning:</p>
                    <ul className="space-y-1">
                      {decision.reasoning.slice(0, 2).map((reason, idx) => (
                        <li key={idx} className="text-xs flex items-start gap-2">
                          <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
                          <span className="text-muted-foreground">{reason}</span>
                        </li>
                      ))}
                      {decision.reasoning.length > 2 && (
                        <li className="text-xs text-muted-foreground italic">
                          +{decision.reasoning.length - 2} more reasons
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Confidence */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${decision.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold">
                      {(decision.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Human Review Panel */}
                {enableHumanReview && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <HumanReviewPanel
                      decision={decision}
                      onReviewComplete={onReviewComplete}
                      showReviewStatus={true}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {decisions.length > maxDisplay && (
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Showing {maxDisplay} of {decisions.length} decisions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

