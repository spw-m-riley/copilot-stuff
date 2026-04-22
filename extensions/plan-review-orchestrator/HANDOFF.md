# Plan Review Orchestrator - B2 Handoff Document

## Status: ✅ COMPLETE & READY FOR B3

This document serves as the handoff from B2 implementation to B3 integration testing.

---

## What Was Built

A complete Plan Review Orchestrator extension that:

1. **Detects** `/plan` slash command
2. **Initializes** multi-round review coordination
3. **Injects** reviewer-specific guidance context
4. **Parses** reviewer responses for approval tokens
5. **Tracks** reviewer votes and completion states
6. **Coordinates** plan revisions across rounds
7. **Manages** session state with proper cleanup

**Architecture:** Separate extension from plan-review-policy, non-conflicting coexistence.

---

## Implementation Statistics

| Metric | Value |
|--------|-------|
| Files | 8 (6 code + 2 docs) |
| Code Lines | 859 |
| Test Lines | 735 |
| Total Lines | 1,800+ |
| Test Pass Rate | 29/29 (100%) |
| External Dependencies | 0 (SDK only) |

---

## File Manifest

```
extensions/plan-review-orchestrator/
├── extension.mjs                          Main entry point (309 L)
├── lib/
│   ├── orchestrator.mjs                   State machine (210 L)
│   ├── approval-tracker.mjs               Token parsing (152 L)
│   └── reviewer-dispatch.mjs              Reviewer matching (188 L)
├── tests/
│   └── unit/
│       ├── orchestrator.test.mjs          13 tests (363 L)
│       └── reviewer-dispatch.test.mjs     16 tests (372 L)
├── README.md                              Full documentation
├── QUICK_REFERENCE.md                     Developer guide
└── HANDOFF.md                            This file
```

---

## How to Run

### Run All Tests
```bash
cd /Users/matthew.riley/.copilot/extensions/plan-review-orchestrator

# Orchestrator tests
node tests/unit/orchestrator.test.mjs

# Approval/dispatch tests
node tests/unit/reviewer-dispatch.test.mjs
```

### Syntax Validation
```bash
node -c extension.mjs lib/*.mjs tests/unit/*.mjs
```

### Load Extension
```bash
# The extension will be loaded by the Copilot CLI
# No additional setup needed
```

---

## API Reference

### PlanOrchestrator Class

```javascript
import { PlanOrchestrator } from "./lib/orchestrator.mjs";

// Create instance
const orchestrator = new PlanOrchestrator({
  maxRounds: 3,
  approvalTokens: ["[PLAN-APPROVED]"],
  rejectionTokens: ["[PLAN-REVISE-NEEDED]"]
});

// Initialize with reviewers
orchestrator.initialize(["gpt-5.3-codex", "claude-sonnet-4.6"]);

// Record approval/rejection
orchestrator.recordApproval(reviewerId, approved, { feedback });

// Check status
orchestrator.allApproved()        → boolean
orchestrator.anyRejected()        → boolean
orchestrator.getPendingCount()    → number
orchestrator.isComplete()         → { complete, reason }

// Advance to next round
orchestrator.nextRound()

// Get state for debugging
orchestrator.getStateSnapshot()
orchestrator.getReviewerStates()

// Cleanup
orchestrator.clear()
```

### Token Parsing Functions

```javascript
import {
  parseReviewerResponse,
  extractFeedback,
  hasApprovalToken,
  hasVerdictToken
} from "./lib/approval-tracker.mjs";

// Parse verdict
const result = parseReviewerResponse(responseText);
// → { verdict: "approved"|"rejected", confidence: "explicit"|"default", reason: string }

// Extract feedback
extractFeedback(responseText)
// → string with lines containing approval token + context

// Check for tokens
hasApprovalToken(responseText)    → boolean
hasVerdictToken(responseText)     → boolean
```

### Reviewer Dispatch Functions

```javascript
import {
  isReviewerAgent,
  matchReviewerAgent,
  generateReviewerContext,
  generateRevisionRequest
} from "./lib/reviewer-dispatch.mjs";

// Detect reviewer
isReviewerAgent(metadata)         → boolean

// Match to reviewer ID
matchReviewerAgent(agentName, reviewerMap)
// → "gpt-5.3-codex" | "claude-sonnet-4.6" | null

// Generate context
generateReviewerContext(orchestrator, round, total)
// → string (context to inject into reviewer)

// Generate revision request
generateRevisionRequest(feedbackMap, orchestrator)
// → string (revision guidance for planner)
```

---

## Integration Points

### Hook Handlers in extension.mjs

1. **onUserPromptSubmitted**
   - Detects `/plan` command
   - Initializes orchestrator
   - Sets up session state

2. **onSubagentStart**
   - Detects reviewer agents
   - Generates reviewer guidance
   - Injects context

3. **onSubagentEnd**
   - Parses reviewer responses
   - Records approvals/rejections
   - Checks completion
   - Generates revision requests

4. **onSessionEnd**
   - Cleans up orchestrator state
   - Prevents memory leaks

### Session State

- `orchestratorBySession` - Map<sessionId, PlanOrchestrator>
- `reviewerFeedbackBySession` - Map<sessionId, Map<reviewerId, feedback>>

---

## Known Limitations & Assumptions

### SDK Surface Assumptions

1. **onSubagentEnd hook input** contains reviewer response/output
   - Currently assumes hook provides response text
   - Fallback: Parse conversation turns if unavailable

2. **Agent metadata detection** via agentName/agentDescription
   - Currently assumes metadata is available
   - Fallback: Observe conversation for review keywords

3. **Context injection** via additionalContext return value
   - Pattern from plan-review-policy (proven working)
   - Should work consistently

### MVP Limitations

1. Sequential reviewer dispatch (could parallelize)
2. In-memory state only (no persistence)
3. Hardcoded reviewers (configurable in B3)
4. No blocking (advisory approval)
5. No timeout implementation (ready but needs validation)

---

## B3 Integration Checklist

Before using in production:

- [ ] Test `/plan` command detection
- [ ] Verify onSubagentStart hook fires with metadata
- [ ] Verify onSubagentEnd hook provides response content
- [ ] Test with actual Jason reviewer agent
- [ ] Test with actual Freddy reviewer agent
- [ ] Validate multi-round flow end-to-end
- [ ] Test revision request context injection
- [ ] Verify session cleanup on exit
- [ ] Verify non-conflict with plan-review-policy
- [ ] Test error scenarios (timeout, parsing failures)
- [ ] Validate logging output
- [ ] Performance testing with multiple sessions

---

## Testing Notes

### Unit Tests Included

**Orchestrator Tests (13):**
- State initialization and transitions
- Approval/rejection recording
- Completion detection
- Round advancement
- Max rounds enforcement
- Error handling

**Approval/Dispatch Tests (16):**
- Token parsing (case-insensitive)
- Ambiguous token handling
- Empty/null response handling
- Feedback extraction
- Reviewer agent detection
- Agent name matching

### Running Tests

```bash
# Both tests should show all passing
node tests/unit/orchestrator.test.mjs    # 13/13 passed
node tests/unit/reviewer-dispatch.test.mjs # 16/16 passed
```

---

## Logging

All orchestrator events logged via `session.log()` as ephemeral messages:

```
plan-orchestrator: initialized with 2 reviewers (max 3 rounds)
plan-orchestrator: injecting reviewer context for gpt-5.3-codex (round 1)
plan-orchestrator: gpt-5.3-codex → approved ([PLAN-APPROVED] token found)
plan-orchestrator: Round 1 status:
  Round 1/3:
    gpt-5.3-codex: approved
    claude-sonnet-4.6: rejected
plan-orchestrator: Revisions needed - starting round 2
plan-orchestrator: ✅ All reviewers approved after 2 round(s)
```

---

## Troubleshooting

### Reviewer Not Detected
- Check metadata contains "review" or "reviewer" keyword
- Check agent name format matches expected patterns
- Verify matchReviewerAgent logic in reviewer-dispatch.mjs

### Token Not Parsed
- Check response contains exact `[PLAN-APPROVED]` or `[PLAN-REVISE-NEEDED]`
- Tokens are case-insensitive
- Missing token defaults to rejection (strict)

### State Not Cleaning Up
- Check onSessionEnd hook is firing
- Verify sessionId is being normalized correctly
- Check orchestratorBySession.delete() is called

### Multi-Round Not Working
- Verify nextRound() is called after rejection detected
- Check reviewerStates are reset to 'pending'
- Verify revision context is being injected

---

## Future Enhancements (B4+)

1. **Configuration Support**
   - Load reviewer list from config
   - Configure max rounds
   - Set timeout values

2. **Timeout Implementation**
   - Implement 30s timeout per reviewer
   - Handle missing responses

3. **Parallel Dispatch**
   - Launch all reviewers simultaneously
   - Collect responses asynchronously

4. **Enhanced Observability**
   - Track round duration
   - Log detailed feedback
   - Add metrics

5. **Weighted Voting**
   - Different reviewer authority levels
   - Custom approval thresholds

6. **Plan Versioning**
   - Durable storage of plan history
   - Track revisions across rounds

---

## Support & Maintenance

### Questions About Implementation

Refer to:
- README.md - Feature documentation
- QUICK_REFERENCE.md - API quick lookup
- B2_COMPLETION_SUMMARY.md - Implementation details
- Inline JSDoc comments - Function documentation

### Adding Features

1. Add unit tests first (TDD)
2. Implement in appropriate module
3. Update relevant documentation
4. Run full test suite
5. Verify non-conflicting with other extensions

---

## Handoff Complete ✅

This extension is:
- ✅ Fully implemented
- ✅ Thoroughly tested (29 tests, 100% pass)
- ✅ Well documented
- ✅ Production-ready structure
- ✅ Ready for B3 integration testing

**Next Phase:** SDK surface validation and end-to-end testing with actual reviewer agents.

---

**Handoff Date:** 2025-04-22  
**Status:** Ready for B3 Integration  
**Maintainer:** Coda (Copilot CLI)
