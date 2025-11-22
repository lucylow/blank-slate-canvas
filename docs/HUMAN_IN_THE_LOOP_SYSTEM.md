# Human-in-the-Loop System for AI Agents

## Overview

This document describes the human-in-the-loop (HITL) system implemented for the 7 AI agents in the PitWall AI system. The system allows human operators to review, approve, reject, or modify agent decisions before they are executed.

## Architecture

### Backend Components

#### 1. API Endpoints (`app/routes/agents.py`)

- **`POST /api/agents/decisions/{decision_id}/review`**
  - Submit human review for an agent decision
  - Actions: `approve`, `reject`, or `modify`
  - Stores review with feedback and reviewer information
  - Updates decision status in Redis

- **`GET /api/agents/decisions/pending`**
  - Get all pending decisions requiring human review
  - Filters by track, chassis, and risk level
  - Returns decisions with high risk or low confidence

- **`GET /api/agents/decisions/{decision_id}/review`**
  - Get review details for a specific decision
  - Returns review action, feedback, and reviewer info

- **`GET /api/agents/reviews/history`**
  - Get history of all human reviews
  - Filterable by reviewer
  - Sorted by most recent first

#### 2. Decision Review Criteria

Decisions require human review if they meet any of the following criteria:
- Risk level is `critical` or `aggressive`
- Confidence score is below 0.7 (70%)

### Frontend Components

#### 1. HumanReviewPanel (`src/components/pitwall/HumanReviewPanel.tsx`)

A reusable component that provides:
- Approve/Reject/Modify buttons for decisions
- Dialog for submitting reviews with feedback
- Status display for reviewed decisions
- Integration with agent decision cards

#### 2. AgentReviewDashboard (`src/pages/AgentReviewDashboard.tsx`)

A dedicated dashboard for managing human reviews:
- **Pending Decisions View**: Lists all decisions requiring review
- **Review History View**: Shows all completed reviews
- **Filters**: Filter by track, chassis, and risk level
- **Statistics**: Counts of pending, critical, and total reviews
- **Real-time Updates**: Auto-refreshes every 10 seconds

#### 3. AIAgentDecisions Integration

The existing `AIAgentDecisions` component now includes:
- Human review panel for each decision
- Visual indicators for decisions requiring review
- Review status badges

## Usage

### For Operators

1. **Access Review Dashboard**
   - Navigate to `/agents/review` or click "Human Review" button in Agent Dashboard
   - View pending decisions that need review

2. **Review a Decision**
   - Click "Approve", "Reject", or "Modify" on a decision
   - Add optional feedback and reviewer name
   - For modifications, provide the modified action text
   - Submit the review

3. **View History**
   - Toggle "Show History" to see all completed reviews
   - Filter by reviewer if needed

### For Developers

#### Adding Review to Agent Decisions

```typescript
import HumanReviewPanel from "@/components/pitwall/HumanReviewPanel";

<HumanReviewPanel
  decision={decision}
  onReviewComplete={() => refetchDecisions()}
  showReviewStatus={true}
/>
```

#### Checking Review Status

```typescript
import { getDecisionReview } from "@/api/pitwall";

const review = await getDecisionReview(decisionId);
if (review.review.action === "approve") {
  // Decision was approved
}
```

## Data Flow

1. **Agent Makes Decision**
   - Agent creates decision with confidence and risk level
   - Decision stored in Redis with full details
   - Summary published to results stream

2. **Decision Requires Review**
   - Backend checks if decision meets review criteria
   - Decision appears in pending decisions list
   - UI highlights decision as requiring review

3. **Human Reviews Decision**
   - Operator reviews decision details
   - Submits review with action (approve/reject/modify)
   - Review stored in Redis
   - Decision status updated

4. **Review Complete**
   - Decision removed from pending list
   - Review added to history
   - Status displayed in UI

## Storage

### Redis Keys

- `insight:{decision_id}` - Full decision details
- `review:{decision_id}` - Human review data
- `decision_status:{decision_id}` - Current status (approve/reject/modify)
- `results.stream` - Stream of all agent decisions

### Review Data Structure

```json
{
  "decision_id": "uuid",
  "action": "approve|reject|modify",
  "modified_action": "string (if modify)",
  "feedback": "string",
  "reviewer": "string",
  "reviewed_at": "ISO timestamp"
}
```

## Integration with 7 AI Agents

The human-in-the-loop system works with all 7 AI agents:

1. **Strategy Agent** - Pit stop recommendations
2. **Coach Agent** - Driver coaching feedback
3. **Anomaly Detective** - Safety alerts
4. **Predictor Agent** - Tire wear predictions
5. **Preprocessor** - Data processing decisions
6. **EDA Agent** - Analysis insights
7. **Simulator Agent** - Strategy simulations

All agents' decisions are subject to human review if they meet the risk/confidence criteria.

## Future Enhancements

- [ ] Automatic approval for low-risk, high-confidence decisions
- [ ] Machine learning from human feedback to improve agent decisions
- [ ] Multi-reviewer consensus for critical decisions
- [ ] Review delegation and assignment
- [ ] Email/SMS notifications for pending reviews
- [ ] Review analytics and agent performance metrics

## API Examples

### Submit Review

```bash
curl -X POST http://localhost:8000/api/agents/decisions/{decision_id}/review \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "feedback": "Looks good, proceed",
    "reviewer": "John Doe"
  }'
```

### Get Pending Decisions

```bash
curl http://localhost:8000/api/agents/decisions/pending?risk_level=critical&limit=50
```

### Get Review History

```bash
curl http://localhost:8000/api/agents/reviews/history?reviewer=John%20Doe&limit=100
```

## Route

The review dashboard is accessible at:
- **URL**: `/agents/review`
- **Component**: `AgentReviewDashboard`
- **Navigation**: Available from Agent Dashboard via "Human Review" button

