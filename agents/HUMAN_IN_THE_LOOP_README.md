# Human-in-the-Loop System for AI Agents

## Overview

The human-in-the-loop (HITL) system provides a comprehensive workflow for managing AI agent decisions that require human approval before execution. This system ensures that critical, high-risk, or low-confidence decisions are reviewed by humans before being acted upon.

## Features

### 1. **Configurable Approval Rules**
- Define rules based on decision type, confidence threshold, and risk level
- Different rules for different decision types (pit, anomaly, coach, strategy)
- Configurable timeouts and timeout policies

### 2. **Decision Status Management**
- **Pending**: Decision awaiting human review
- **Approved**: Human approved the decision
- **Rejected**: Human rejected the decision
- **Modified**: Human modified the decision
- **Expired**: Decision timed out
- **Auto-approved**: Automatically approved due to timeout
- **Auto-rejected**: Automatically rejected due to timeout

### 3. **Priority Queue**
- Decisions are prioritized based on risk level and urgency
- Higher priority decisions appear first in the review queue
- Critical safety issues get highest priority

### 4. **Timeout Handling**
- Configurable timeout per decision type
- Auto-approve or auto-reject policies
- Escalation and notification options
- Background monitor service ensures timeouts are handled

### 5. **Batch Operations**
- Review multiple decisions in a single operation
- Efficient for processing large backlogs

### 6. **Audit Trail**
- Complete history of all reviews
- Track review time, reviewer, and feedback
- Support for confidence overrides

## Configuration

Configuration is stored in `agents/config/hitl_config.json`:

```json
{
  "approval_rules": [
    {
      "decision_types": ["pit"],
      "min_confidence_threshold": 0.0,
      "max_confidence_threshold": 0.85,
      "risk_levels": ["critical", "aggressive"],
      "require_approval": true,
      "timeout_seconds": 300,
      "timeout_policy": "auto_approve",
      "priority": 10
    }
  ]
}
```

### Rule Fields

- **decision_types**: List of decision types this rule applies to
- **min_confidence_threshold**: Minimum confidence (decisions below this always require approval)
- **max_confidence_threshold**: Maximum confidence (decisions above this auto-approve)
- **risk_levels**: Risk levels that require approval (empty = all risk levels)
- **require_approval**: Whether decisions matching this rule require approval
- **timeout_seconds**: How long to wait before timeout
- **timeout_policy**: What to do on timeout ("auto_approve", "auto_reject", "escalate", "notify")
- **priority**: Priority score (higher = reviewed first)

## Usage

### Agent Integration

The system is automatically integrated into the agent decision flow:

```python
from agent_integration import DecisionAggregator

# Initialize with HITL enabled (default)
aggregator = DecisionAggregator(redis_url="redis://127.0.0.1:6379", enable_hitl=True)
await aggregator.connect()

# Decisions are automatically checked for approval requirements
aggregated = await aggregator.aggregate(decisions)
```

### API Endpoints

#### Get Pending Decisions
```http
GET /api/agents/decisions/pending?track=cota&chassis=GR86-01&limit=50
```

Returns decisions awaiting review, sorted by priority.

#### Review a Decision
```http
POST /api/agents/decisions/{decision_id}/review
Content-Type: application/json

{
  "action": "approve",
  "reviewer": "engineer-01",
  "feedback": "Looks good, proceed",
  "confidence_override": 0.90
}
```

Actions: `approve`, `reject`, `modify`, `defer`

#### Batch Review
```http
POST /api/agents/decisions/batch-review
Content-Type: application/json

{
  "reviews": [
    {
      "decision_id": "decision-001",
      "action": "approve",
      "feedback": "Approved"
    },
    {
      "decision_id": "decision-002",
      "action": "reject",
      "feedback": "Too risky"
    }
  ],
  "reviewer": "engineer-01"
}
```

#### Get Review History
```http
GET /api/agents/reviews/history?reviewer=engineer-01&limit=100
```

## Running the Timeout Monitor

The timeout monitor should run as a background service to ensure pending decisions are processed:

```bash
python agents/hitl_timeout_monitor.py
```

Or as a systemd service:

```ini
[Unit]
Description=HITL Timeout Monitor
After=redis.service

[Service]
Type=simple
User=pitwall
WorkingDirectory=/path/to/project
ExecStart=/usr/bin/python3 agents/hitl_timeout_monitor.py
Restart=always

[Install]
WantedBy=multi-user.target
```

## Architecture

### Components

1. **HumanInTheLoopManager**: Core manager class that handles all HITL operations
2. **DecisionAggregator**: Updated to check approval requirements before broadcasting
3. **Timeout Monitor**: Background service that handles expired decisions
4. **API Routes**: REST endpoints for human reviewers

### Data Flow

1. Agent makes decision → `AgentDecision`
2. Decision checked against approval rules → `requires_approval`
3. If approval required → Decision added to pending queue
4. Human reviews decision → Decision status updated
5. Approved decisions → Broadcast to system
6. Rejected decisions → Logged and discarded

### Redis Keys

- `pending_decision:{decision_id}`: Pending decision data
- `pending_decisions_queue`: Sorted set of pending decision IDs (by priority)
- `decision_status:{decision_id}`: Decision status and review info
- `review:{decision_id}`: Review details
- `insight:{decision_id}`: Full decision data

## Best Practices

1. **Set Appropriate Timeouts**: Critical decisions should have shorter timeouts
2. **Use Priority Wisely**: Safety issues should have highest priority
3. **Monitor Review Times**: Track how long decisions take to review
4. **Regular Audits**: Review the review history to improve rules
5. **Fallback Policies**: Always have a timeout policy (auto-approve for non-critical)

## Troubleshooting

### Decisions Not Appearing in Pending Queue

- Check that HITL is enabled in `DecisionAggregator`
- Verify approval rules match the decision characteristics
- Check Redis connectivity

### Timeouts Not Being Handled

- Ensure timeout monitor service is running
- Check `HITL_CHECK_INTERVAL` environment variable
- Verify Redis keys are not expiring too early

### Review Not Updating Status

- Check Redis connectivity
- Verify decision_id is correct
- Check logs for errors

## Future Enhancements

- [ ] Machine learning to learn from human reviews
- [ ] Multi-level approval workflows
- [ ] Integration with notification systems (email, Slack)
- [ ] Dashboard for reviewing decisions
- [ ] Analytics on review patterns
- [ ] Confidence calibration based on review history

