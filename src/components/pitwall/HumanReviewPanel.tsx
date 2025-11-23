// src/components/pitwall/HumanReviewPanel.tsx

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Edit, MessageSquare, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { reviewAgentDecision, type ReviewRequest, type AgentDecision } from "@/api/pitwall";
import { useToast } from "@/hooks/use-toast";

interface HumanReviewPanelProps {
  decision: AgentDecision;
  onReviewComplete?: () => void;
  showReviewStatus?: boolean;
}

export default function HumanReviewPanel({
  decision,
  onReviewComplete,
  showReviewStatus = true,
}: HumanReviewPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "modify" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [modifiedAction, setModifiedAction] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected" | "modified" | null>(null);
  const { toast } = useToast();

  const handleReview = async (action: "approve" | "reject" | "modify") => {
    setReviewAction(action);
    setModifiedAction(action === "modify" ? decision.action : "");
    setIsDialogOpen(true);
  };

  const submitReview = async () => {
    if (!reviewAction) return;

    if (!decision.decision_id) {
      toast({
        title: "Invalid decision",
        description: "Decision ID is missing. Cannot submit review.",
        variant: "destructive",
      });
      return;
    }

    if (reviewAction === "modify" && !modifiedAction.trim()) {
      toast({
        title: "Modification required",
        description: "Please provide a modified action when selecting 'Modify'",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewRequest: ReviewRequest = {
        action: reviewAction as "approve" | "reject" | "modify",
        feedback: feedback.trim() || undefined,
        reviewer: reviewer.trim() || undefined,
        modified_action: reviewAction === "modify" ? modifiedAction.trim() : undefined,
      };

      await reviewAgentDecision(decision.decision_id, reviewRequest);

      setReviewStatus(reviewAction === "approve" ? "approved" : reviewAction === "reject" ? "rejected" : "modified");
      setIsDialogOpen(false);
      
      toast({
        title: "Review submitted",
        description: `Decision ${reviewAction}d successfully`,
      });

      onReviewComplete?.();
    } catch (error) {
      console.error("Review submission error:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : "Failed to submit review. Please check your connection and try again.";
      toast({
        title: "Review failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsReview = 
    decision.risk_level === "critical" || 
    decision.risk_level === "aggressive" || 
    (decision.confidence < 0.7);

  if (showReviewStatus && reviewStatus) {
    return (
      <div className="mt-2 p-2 rounded-lg border bg-muted/50">
        <div className="flex items-center gap-2 text-sm">
          {reviewStatus === "approved" && (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">Approved</span>
            </>
          )}
          {reviewStatus === "rejected" && (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-600 font-medium">Rejected</span>
            </>
          )}
          {reviewStatus === "modified" && (
            <>
              <Edit className="w-4 h-4 text-blue-500" />
              <span className="text-blue-600 font-medium">Modified</span>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!needsReview && !showReviewStatus) {
    return null;
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {needsReview && !reviewStatus && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-400"
              onClick={() => handleReview("approve")}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400"
              onClick={() => handleReview("reject")}
            >
              <XCircle className="w-3 h-3 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400"
              onClick={() => handleReview("modify")}
            >
              <Edit className="w-3 h-3 mr-1" />
              Modify
            </Button>
          </>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === "approve" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {reviewAction === "reject" && <XCircle className="w-5 h-5 text-red-500" />}
              {reviewAction === "modify" && <Edit className="w-5 h-5 text-blue-500" />}
              {reviewAction === "approve" && "Approve Decision"}
              {reviewAction === "reject" && "Reject Decision"}
              {reviewAction === "modify" && "Modify Decision"}
            </DialogTitle>
            <DialogDescription>
              Review the agent decision and provide feedback
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Decision Summary */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="text-sm font-medium mb-1">Agent Decision:</div>
              <div className="text-sm text-muted-foreground">{decision.action}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {decision.risk_level}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {(decision.confidence * 100).toFixed(0)}% confidence
                </Badge>
              </div>
            </div>

            {/* Modified Action (if modifying) */}
            {reviewAction === "modify" && (
              <div className="space-y-2">
                <Label htmlFor="modified-action">Modified Action</Label>
                <Textarea
                  id="modified-action"
                  placeholder="Enter the modified action..."
                  value={modifiedAction}
                  onChange={(e) => setModifiedAction(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Reviewer Name */}
            <div className="space-y-2">
              <Label htmlFor="reviewer">Your Name (Optional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reviewer"
                  placeholder="Enter your name..."
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (Optional)</Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  id="feedback"
                  placeholder="Add any comments or feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={submitReview}
              disabled={isSubmitting || (reviewAction === "modify" && !modifiedAction.trim())}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {reviewAction === "approve" && "Approve"}
                  {reviewAction === "reject" && "Reject"}
                  {reviewAction === "modify" && "Save Modification"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


