# Human-in-the-Loop Mock Data Summary

## Quick Reference

This document provides a quick overview of the human-in-the-loop (HITL) mock data files created for the PitWall AI agents system.

## Mock Data Files

### 1. `example-insight-with-review.json`
**Purpose**: High-severity insight requiring human review  
**Key Features**:
- `approval_status: "pending"`
- `requires_review: true`
- `review_priority: "critical"`
- High confidence score (0.85) triggering review requirement

**Use Case**: Testing review queue workflows, critical decision handling

### 2. `example-insight-auto-approved.json`
**Purpose**: Low-risk insight that auto-approves  
**Key Features**:
- `approval_status: "auto_approved"`
- `requires_review: false`
- Low severity, below auto-approval threshold

**Use Case**: Testing auto-approval logic, low-priority decision handling

### 3. `example-insight-human-override.json`
**Purpose**: Insight that was reviewed and modified by human  
**Key Features**:
- `approval_status: "approved"`
- `human_override` object with modification details
- Original vs. modified recommendation comparison

**Use Case**: Testing human override workflows, feedback integration

### 4. `example-review-queue.json`
**Purpose**: Review queue state snapshot  
**Key Features**:
- `pending_reviews` array
- `recently_reviewed` array
- Queue metrics (total pending, average review time, etc.)

**Use Case**: Testing review queue UI, monitoring review workflows

### 5. `example-human-feedback.json`
**Purpose**: Human feedback on an insight  
**Key Features**:
- Feedback action (approved/rejected/modified)
- Confidence adjustment
- Learning notes for model improvement

**Use Case**: Testing feedback loops, model learning from human input

## Approval Status Values

| Status | Description | Auto-Broadcast |
|--------|-------------|----------------|
| `pending` | Awaiting human review | ❌ No |
| `approved` | Reviewed and approved by human | ✅ Yes |
| `rejected` | Reviewed and rejected by human | ❌ No |
| `auto_approved` | Auto-approved (below threshold) | ✅ Yes |

## Review Priority Levels

| Priority | Description | Typical Review Time |
|---------|-------------|---------------------|
| `low` | Informational, no immediate action | Auto-approve |
| `medium` | Requires review but not urgent | < 2 minutes |
| `high` | Important decision, review soon | < 1 minute |
| `critical` | Urgent decision, immediate review | < 30 seconds |

## Integration Points

### 1. Delivery Agent
The delivery agent should check `approval_status` before broadcasting:
```javascript
if (insight.approval_status === 'pending') {
  // Route to review queue
  await routeToReviewQueue(insight);
} else if (insight.approval_status === 'approved' || insight.approval_status === 'auto_approved') {
  // Broadcast to clients
  broadcast(insight);
}
```

### 2. Review Queue Manager
Maintains queue of pending reviews:
```javascript
// Add to queue
await addToReviewQueue(insight);

// Get next item
const nextReview = await getNextReviewItem(priority);

// Process review
await processReview(insightId, reviewerId, action, notes);
```

### 3. Human Feedback Handler
Processes human feedback and updates insights:
```javascript
// Submit feedback
await submitFeedback(feedback);

// Update insight with override
await updateInsightWithOverride(insightId, override);

// Learn from feedback
await learnFromFeedback(feedback);
```

## Testing Scenarios

### Scenario 1: Auto-Approval Flow
1. Agent generates low-severity insight
2. System checks `auto_approval_threshold`
3. Insight auto-approves
4. Insight broadcasts immediately

**Mock Data**: `example-insight-auto-approved.json`

### Scenario 2: Review Required Flow
1. Agent generates high-severity insight
2. System checks `requires_review: true`
3. Insight added to review queue
4. Human reviews and approves/rejects/modifies
5. Updated insight broadcasts

**Mock Data**: `example-insight-with-review.json` → `example-insight-human-override.json`

### Scenario 3: Human Override Flow
1. Agent generates insight with recommendation
2. Human reviews and disagrees
3. Human provides feedback and modified recommendation
4. System updates insight with override
5. Override broadcasts with audit trail

**Mock Data**: `example-insight-human-override.json`, `example-human-feedback.json`

## Next Steps

1. ✅ Mock data files created
2. ⏳ Update message schemas (`agents/types/message-schemas.ts`)
3. ⏳ Enhance delivery agent with review logic
4. ⏳ Create review queue manager
5. ⏳ Add human feedback endpoints
6. ⏳ Update frontend to display review queue
7. ⏳ Implement feedback learning mechanism

## Related Documents

- `HUMAN_IN_THE_LOOP_REVIEW.md` - Detailed review and recommendations
- `agents/types/message-schemas.ts` - TypeScript type definitions
- `agents/delivery/delivery-agent.js` - Delivery agent implementation

