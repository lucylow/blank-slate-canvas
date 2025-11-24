// src/pages/AgentReviewDashboard.tsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle2, 
  XCircle, 
  Edit, 
  AlertCircle, 
  RefreshCw, 
  Filter,
  User,
  Clock,
  TrendingDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  getPendingDecisions, 
  getReviewHistory,
  type AgentDecision,
  type HumanReview
} from "@/api/pitwall";
import HumanReviewPanel from "@/components/pitwall/HumanReviewPanel";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentReviewDashboard() {
  const [trackFilter, setTrackFilter] = useState<string>("");
  const [chassisFilter, setChassisFilter] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch pending decisions
  const { 
    data: pendingData, 
    isLoading: pendingLoading,
    error: pendingError,
    refetch: refetchPending
  } = useQuery({
    queryKey: ['pendingDecisions', trackFilter, chassisFilter, riskFilter],
    queryFn: () => getPendingDecisions(
      trackFilter || undefined,
      chassisFilter || undefined,
      riskFilter || undefined,
      100
    ),
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch review history
  const { 
    data: historyData, 
    isLoading: historyLoading,
    error: historyError
  } = useQuery({
    queryKey: ['reviewHistory'],
    queryFn: () => getReviewHistory(100),
    enabled: showHistory,
    retry: 2,
    retryDelay: 1000,
  });

  const handleReviewComplete = () => {
    refetchPending();
    queryClient.invalidateQueries({ queryKey: ['reviewHistory'] });
  };

  const pendingDecisions = pendingData?.decisions || [];
  const reviewHistory = historyData?.reviews || [];

  // Show error messages if queries fail
  useEffect(() => {
    if (pendingError) {
      toast({
        title: "Failed to load pending decisions",
        description: pendingError instanceof Error ? pendingError.message : "Unable to fetch pending decisions. Please try again.",
        variant: "destructive",
      });
    }
    if (historyError) {
      toast({
        title: "Failed to load review history",
        description: historyError instanceof Error ? historyError.message : "Unable to fetch review history. Please try again.",
        variant: "destructive",
      });
    }
  }, [pendingError, historyError, toast]);

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

  const getActionIcon = (action: string) => {
    switch (action) {
      case "approve":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "reject":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "modify":
        return <Edit className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Human-in-the-Loop Review</h1>
            <p className="text-muted-foreground">
              Review and approve AI agent decisions requiring human oversight
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? "Hide" : "Show"} History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchPending()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-card/80 backdrop-blur-lg border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="track-filter">Track</Label>
                <Input
                  id="track-filter"
                  placeholder="Filter by track..."
                  value={trackFilter}
                  onChange={(e) => setTrackFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chassis-filter">Chassis</Label>
                <Input
                  id="chassis-filter"
                  placeholder="Filter by chassis..."
                  value={chassisFilter}
                  onChange={(e) => setChassisFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk-filter">Risk Level</Label>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger id="risk-filter">
                    <SelectValue placeholder="All risk levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All risk levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="safe">Safe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <Card className="bg-card/80 backdrop-blur-lg border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Reviews</p>
                <p className="text-2xl font-bold">
                  {pendingLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    pendingDecisions.length
                  )}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-lg border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Critical Decisions</p>
                <p className="text-2xl font-bold">
                  {pendingLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    pendingDecisions.filter(d => d && (d.risk_level === "critical" || d.risk_level === undefined)).length
                  )}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-lg border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Reviews</p>
                <p className="text-2xl font-bold">
                  {historyLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    reviewHistory.length
                  )}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Decisions */}
      {!showHistory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/80 backdrop-blur-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Pending Decisions ({pendingDecisions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : pendingError ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <p className="text-lg font-medium mb-2">Error loading decisions</p>
                  <p className="text-sm mb-4">
                    {pendingError instanceof Error ? pendingError.message : "Failed to load pending decisions"}
                  </p>
                  <Button onClick={() => refetchPending()} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : pendingDecisions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No pending decisions</p>
                  <p className="text-sm">All agent decisions have been reviewed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDecisions
                    .filter((decision) => decision && decision.decision_id) // Filter out invalid decisions
                    .map((decision) => (
                    <motion.div
                      key={decision.decision_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-lg border ${getRiskColor(decision.risk_level || "moderate")}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {(decision as any).agent_type?.replace("_", " ") || decision.agent_id || decision.decision_type || "agent"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getRiskColor(decision.risk_level || "moderate")}`}
                            >
                              {decision.risk_level || "moderate"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {(() => {
                                try {
                                  if (decision.created_at) {
                                    const date = new Date(decision.created_at);
                                    return !isNaN(date.getTime()) ? date.toLocaleString() : "N/A";
                                  }
                                  if ((decision as any).timestamp) {
                                    const date = new Date((decision as any).timestamp);
                                    return !isNaN(date.getTime()) ? date.toLocaleString() : "N/A";
                                  }
                                  return "N/A";
                                } catch {
                                  return "N/A";
                                }
                              })()}
                            </span>
                          </div>
                          <h3 className="font-semibold mb-1">{decision.action ? String(decision.action) : "No action specified"}</h3>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="uppercase">{decision.track || "N/A"}</span>
                            <span>•</span>
                            <span>{decision.chassis || "N/A"}</span>
                            <span>•</span>
                            <span>
                              {decision.confidence !== undefined && decision.confidence !== null && typeof decision.confidence === 'number'
                                ? `${(decision.confidence * 100).toFixed(0)}% confidence`
                                : "Confidence N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {decision.reasoning && Array.isArray(decision.reasoning) && decision.reasoning.length > 0 && (
                        <div className="mt-3 mb-3 p-2 bg-muted/50 rounded text-sm">
                          <p className="font-medium mb-1">Reasoning:</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {decision.reasoning.slice(0, 3).map((reason, idx) => (
                              <li key={idx}>{typeof reason === 'string' ? reason : String(reason)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {decision.decision_id && (
                        <HumanReviewPanel
                          decision={decision as AgentDecision}
                          onReviewComplete={handleReviewComplete}
                          showReviewStatus={false}
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Review History */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/80 backdrop-blur-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Review History ({reviewHistory.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : historyError ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <p className="text-lg font-medium mb-2">Error loading review history</p>
                  <p className="text-sm">
                    {historyError instanceof Error ? historyError.message : "Failed to load review history"}
                  </p>
                </div>
              ) : reviewHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No review history</p>
                  <p className="text-sm">Reviews will appear here once decisions are reviewed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviewHistory
                    .filter((review) => review && review.decision_id) // Filter out invalid reviews
                    .map((review) => (
                    <motion.div
                      key={review.decision_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getActionIcon(review.action)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={
                                  review.action === "approve"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : review.action === "reject"
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                }
                              >
                                {review.action}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Decision ID: {review.decision_id ? review.decision_id.slice(0, 8) + "..." : "N/A"}
                              </span>
                            </div>
                            {review.modified_action && (
                              <p className="text-sm mb-1">
                                <span className="font-medium">Modified to:</span>{" "}
                                {review.modified_action}
                              </p>
                            )}
                            {review.feedback && (
                              <p className="text-sm text-muted-foreground mb-1">
                                {review.feedback}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                              {review.reviewer && (
                                <>
                                  <User className="w-3 h-3" />
                                  <span>{review.reviewer}</span>
                                </>
                              )}
                              {review.reviewed_at && (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {(() => {
                                      try {
                                        const date = new Date(review.reviewed_at);
                                        return !isNaN(date.getTime()) ? date.toLocaleString() : "N/A";
                                      } catch {
                                        return "N/A";
                                      }
                                    })()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}


