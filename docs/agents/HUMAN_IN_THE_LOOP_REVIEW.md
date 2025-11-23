# Human-in-the-Loop Mock Data Review

## Executive Summary

This document reviews the current state of human-in-the-loop (HITL) mock data and workflows in the PitWall AI agents system. The review identifies gaps, provides recommendations, and suggests mock data structures for implementing human review/approval workflows.

## Current State Analysis

### 1. Existing Mock Data Files

#### `agents/example-insight.json`
- **Purpose**: Example insight update from agents
- **Structure**: Contains insight with recommendations, evidence, and metadata
- **HITL Status**: ❌ No approval/review fields
- **Key Fields**:
  - `id`, `title`, `severity`, `score`
  - `recommendation` (one_liner, bullets, voiceover_script)
  - `evidence` (telemetry traces)
  - `timestamp`

#### `agents/example-insight-update.json`
- **Purpose**: Simplified insight update format
- **Structure**: Minimal insight structure with predictions and explanation
- **HITL Status**: ❌ No approval/review fields
- **Key Fields**:
  - `task_id`, `insight_id`
  - `predictions`, `explanation`
  - `created_at`

### 2. Message Schemas (`agents/types/message-schemas.ts`)

**Current Schema Analysis**:
- ✅ Well-defined `Insight` interface
- ✅ `AgentResult` interface for agent outputs
- ❌ **Missing**: Approval status fields
- ❌ **Missing**: Review workflow states
- ❌ **Missing**: Human reviewer metadata
- ❌ **Missing**: Feedback/override mechanisms

### 3. Agent Decision Flow

**Current Flow** (from `agents/ai_agents.py`):
```
Telemetry → Agent Processing → AgentDecision → Delivery → Broadcast
```

**Missing HITL Integration Points**:
- No approval gate before delivery
- No review queue for high-severity decisions
- No feedback loop for human corrections
- No audit trail for human overrides

## Recommendations

### 1. Enhanced Insight Schema with HITL Support

Add the following fields to the `Insight` interface:

```typescript
export interface Insight {
  // ... existing fields ...
  
  // HITL Fields
  approval_status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  requires_review: boolean;
  review_priority: 'low' | 'medium' | 'high' | 'critical';
  reviewer_id?: string;
  reviewed_at?: string;
  review_notes?: string;
  human_override?: {
    action: 'approved' | 'rejected' | 'modified';
    reason: string;
    modified_recommendation?: InsightRecommendation;
    timestamp: string;
  };
  auto_approval_threshold?: number; // Confidence score threshold
}
```

### 2. Mock Data Examples

#### Example: High-Severity Insight Requiring Review

```json
{
  "type": "insight_update",
  "data": {
    "id": "insight-1705789200.123",
    "title": "Critical Tire Degradation - Immediate Pit Required",
    "severity": "high",
    "score": 0.85,
    "explanation": "Predicted tire loss: 0.85s per lap. Estimated 0.8 laps until 0.5s cumulative loss.",
    "approval_status": "pending",
    "requires_review": true,
    "review_priority": "critical",
    "auto_approval_threshold": 0.75,
    "top_features": [
      {
        "name": "tire_stress_s2",
        "value": 0.85,
        "importance": 0.45
      }
    ],
    "recommendation": {
      "one_liner": "URGENT: Pit immediately on next lap (Lap 8)",
      "bullets": [
        "Immediate pit required: Lap 8",
        "Estimated time saved: 4.2s",
        "Risk of tire failure: HIGH"
      ],
      "voiceover_script": "URGENT: Pit immediately on next lap. Immediate pit required: Lap 8. Estimated time saved: 4.2s. Risk of tire failure: HIGH."
    },
    "evidence": [
      {
        "meta_time": "2025-01-20T15:30:45.123Z",
        "lap": 7,
        "sector": "S2",
        "sample_idx": 1234,
        "trace": {
          "speed_kmh": 185.3,
          "lateral_g": 1.4,
          "tire_stress": 0.95
        }
      }
    ],
    "model_version": "tire-v1.0",
    "timestamp": "2025-01-20T15:30:50.000Z"
  },
  "timestamp": "2025-01-20T15:30:50.000Z"
}
```

#### Example: Auto-Approved Low-Risk Insight

```json
{
  "type": "insight_update",
  "data": {
    "id": "insight-1705789300.456",
    "title": "Moderate Tire Wear Detected",
    "severity": "low",
    "score": 0.25,
    "explanation": "Predicted tire loss: 0.25s per lap. Estimated 2.0 laps until 0.5s cumulative loss.",
    "approval_status": "auto_approved",
    "requires_review": false,
    "review_priority": "low",
    "auto_approval_threshold": 0.75,
    "top_features": [
      {
        "name": "tire_stress_s2",
        "value": 0.25,
        "importance": 0.20
      }
    ],
    "recommendation": {
      "one_liner": "Monitor tire wear - pit window opening in 2-3 laps",
      "bullets": [
        "Optimal pit window: Lap 10-12",
        "Continue monitoring",
        "No immediate action required"
      ],
      "voiceover_script": "Monitor tire wear - pit window opening in 2-3 laps. Optimal pit window: Lap 10-12. Continue monitoring. No immediate action required."
    },
    "evidence": [],
    "model_version": "tire-v1.0",
    "timestamp": "2025-01-20T15:31:50.000Z"
  },
  "timestamp": "2025-01-20T15:31:50.000Z"
}
```

#### Example: Human-Reviewed and Overridden Insight

```json
{
  "type": "insight_update",
  "data": {
    "id": "insight-1705789400.789",
    "title": "Tire Degradation Detected",
    "severity": "high",
    "score": 0.65,
    "explanation": "Predicted tire loss: 0.65s per lap. Estimated 0.77 laps until 0.5s cumulative loss.",
    "approval_status": "approved",
    "requires_review": true,
    "review_priority": "high",
    "reviewer_id": "engineer-001",
    "reviewed_at": "2025-01-20T15:32:15.000Z",
    "review_notes": "Reviewed telemetry - driver reports good tire feel. Deferring pit stop by 1 lap.",
    "human_override": {
      "action": "modified",
      "reason": "Driver feedback contradicts model prediction",
      "modified_recommendation": {
        "one_liner": "Monitor closely - pit on Lap 9 (1 lap delay)",
        "bullets": [
          "Deferred pit stop: Lap 9 (was Lap 8)",
          "Driver reports good tire feel",
          "Monitor for next 2 laps"
        ],
        "voiceover_script": "Monitor closely - pit on Lap 9. Deferred pit stop: Lap 9. Driver reports good tire feel. Monitor for next 2 laps."
      },
      "timestamp": "2025-01-20T15:32:15.000Z"
    },
    "top_features": [
      {
        "name": "tire_stress_s2",
        "value": 0.65,
        "importance": 0.38
      }
    ],
    "recommendation": {
      "one_liner": "Recommendation: Pit on lap 8 (optimal window)",
      "bullets": [
        "Optimal pit window: Lap 8",
        "Estimated time saved: 2.3s",
        "Monitor tire stress in sectors 2 and 3"
      ],
      "voiceover_script": "Recommendation: Pit on lap 8 (optimal window). Optimal pit window: Lap 8. Estimated time saved: 2.3s. Monitor tire stress in sectors 2 and 3."
    },
    "evidence": [],
    "model_version": "tire-v1.0",
    "timestamp": "2025-01-20T15:32:00.000Z"
  },
  "timestamp": "2025-01-20T15:32:00.000Z"
}
```

### 3. Review Queue Mock Data

```json
{
  "type": "review_queue_update",
  "data": {
    "queue_id": "review-queue-001",
    "pending_reviews": [
      {
        "insight_id": "insight-1705789200.123",
        "title": "Critical Tire Degradation - Immediate Pit Required",
        "severity": "high",
        "priority": "critical",
        "created_at": "2025-01-20T15:30:50.000Z",
        "time_in_queue_seconds": 45,
        "agent_type": "predictor",
        "track": "cota",
        "chassis": "GR86-002"
      },
      {
        "insight_id": "insight-1705789400.789",
        "title": "Tire Degradation Detected",
        "severity": "high",
        "priority": "high",
        "created_at": "2025-01-20T15:32:00.000Z",
        "time_in_queue_seconds": 15,
        "agent_type": "strategy",
        "track": "cota",
        "chassis": "GR86-002"
      }
    ],
    "recently_reviewed": [
      {
        "insight_id": "insight-1705789300.456",
        "status": "auto_approved",
        "reviewed_at": "2025-01-20T15:31:50.000Z",
        "reviewer_id": "system"
      }
    ],
    "timestamp": "2025-01-20T15:32:15.000Z"
  },
  "timestamp": "2025-01-20T15:32:15.000Z"
}
```

### 4. Human Feedback Mock Data

```json
{
  "type": "human_feedback",
  "data": {
    "feedback_id": "feedback-001",
    "insight_id": "insight-1705789400.789",
    "reviewer_id": "engineer-001",
    "action": "modified",
    "reason": "Driver feedback contradicts model prediction - tires feel good",
    "confidence_adjustment": -0.15,
    "modified_recommendation": {
      "one_liner": "Monitor closely - pit on Lap 9 (1 lap delay)",
      "bullets": [
        "Deferred pit stop: Lap 9 (was Lap 8)",
        "Driver reports good tire feel",
        "Monitor for next 2 laps"
      ],
      "voiceover_script": "Monitor closely - pit on Lap 9. Deferred pit stop: Lap 9. Driver reports good tire feel. Monitor for next 2 laps."
    },
    "learning_note": "Driver feedback valuable - consider adding driver input to model",
    "timestamp": "2025-01-20T15:32:15.000Z"
  },
  "timestamp": "2025-01-20T15:32:15.000Z"
}
```

## Implementation Recommendations

### 1. Update Message Schemas

Add HITL-related interfaces to `agents/types/message-schemas.ts`:

```typescript
export interface ReviewStatus {
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  requires_review: boolean;
  review_priority: 'low' | 'medium' | 'high' | 'critical';
  reviewer_id?: string;
  reviewed_at?: string;
  review_notes?: string;
}

export interface HumanOverride {
  action: 'approved' | 'rejected' | 'modified';
  reason: string;
  modified_recommendation?: InsightRecommendation;
  timestamp: string;
  reviewer_id: string;
}

export interface ReviewQueueItem {
  insight_id: string;
  title: string;
  severity: string;
  priority: string;
  created_at: string;
  time_in_queue_seconds: number;
  agent_type: string;
  track: string;
  chassis: string;
}
```

### 2. Update Delivery Agent

Enhance `agents/delivery/delivery-agent.js` to:
- Check `approval_status` before broadcasting
- Route pending reviews to review queue
- Handle human feedback and overrides
- Maintain review queue state

### 3. Create Review Agent (Optional)

A dedicated review agent could:
- Monitor review queue
- Escalate critical items
- Track review metrics
- Learn from human feedback

## Testing Recommendations

### Mock Data Test Scenarios

1. **Auto-Approval Test**: Low-risk insights auto-approve
2. **Review Required Test**: High-severity insights require review
3. **Human Override Test**: Human modifies recommendation
4. **Review Timeout Test**: Unreviewed insights after timeout
5. **Feedback Loop Test**: Human feedback improves future predictions

## Conclusion

The current agent system lacks explicit human-in-the-loop workflows. The recommendations above provide:
- ✅ Enhanced mock data structures
- ✅ Review workflow support
- ✅ Human override mechanisms
- ✅ Audit trail for decisions
- ✅ Learning from human feedback

**Next Steps**:
1. Implement enhanced message schemas
2. Update delivery agent with review logic
3. Create review queue management
4. Add human feedback endpoints
5. Update mock data files with HITL examples

