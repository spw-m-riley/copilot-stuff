# Plan Review Orchestrator - User Guide

Welcome to the Plan Review Orchestrator! This guide will help you understand what the extension does, how to enable it, and how to use it effectively in your planning workflow.

## Getting Started

### What Does the Orchestrator Do?

The Plan Review Orchestrator automatically coordinates multi-reviewer approval workflows for your plans. When you use the `/plan` slash command, the extension:

1. **Detects** that you've entered plan mode
2. **Initializes** a multi-reviewer coordination session with Jason and Freddy
3. **Injects** reviewer-specific guidance so each reviewer understands their role
4. **Tracks** their approvals as they review your plan
5. **Coordinates** revisions if any reviewer requests changes
6. **Completes** when all reviewers approve or after 3 rounds of feedback

Instead of manually asking multiple reviewers to sign off on your plan, the orchestrator handles the coordination automatically. This means your plan gets thorough, multi-perspective feedback delivered efficiently.

### When Should You Enable It?

Enable the orchestrator when:

- ✅ You're working on **significant planning tasks** that benefit from multiple perspectives
- ✅ You want **structured feedback** from multiple specialized reviewers
- ✅ You're willing to **iterate** on your plan based on feedback (up to 3 rounds)
- ✅ You want a **deterministic, logged review process**

Do NOT enable it if:

- ❌ You need **lightning-fast** planning with no review overhead
- ❌ You want **single-reviewer** feedback only
- ❌ You prefer **manual** control over each reviewer invocation

### How to Enable It

The orchestrator is **disabled by default**. To enable it, update your Copilot CLI config file:

**File:** `~/.copilot/config.json`

```json
{
  "rollout": {
    "planReviewOrchestrator": true
  }
}
```

Once enabled, the orchestrator will automatically activate whenever you use `/plan`.

**To disable it temporarily**, either:

1. Remove or set the config flag to `false`
2. Exit plan mode and restart your session

### Simple Workflow Example

Here's what a typical orchestrated plan review looks like:

```
You:     /plan

System:  Initializing Plan Review Orchestrator
         Reviewers: Jason, Freddy
         Max rounds: 3

[ROUND 1 - Jason Reviews]
Jason:   Your approach is solid, but the timeline needs adjustment.
         [PLAN-REVISE-NEEDED]

[ROUND 1 - Freddy Reviews]
Freddy:  Good structure. I agree about the timeline.
         [PLAN-REVISE-NEEDED]

System:  Round 1 status:
         Jason: Revision needed
         Freddy: Revision needed
         → Requesting revisions

You:     Here's the updated plan with adjusted timeline...

[ROUND 2 - Jason Reviews Revised Plan]
Jason:   Much better. Timeline now realistic.
         [PLAN-APPROVED]

[ROUND 2 - Freddy Reviews Revised Plan]
Freddy:  Looks good. Ready to implement.
         [PLAN-APPROVED]

System:  ✅ All reviewers approved after 2 round(s)
         Orchestration complete!
```

That's it! Your plan is now vetted and ready to implement.

---

## Configuration

### Config File Location

The orchestrator reads from your standard Copilot CLI config:

**File:** `~/.copilot/config.json`

### Configuration Structure

```json
{
  "rollout": {
    "planReviewOrchestrator": true
  }
}
```

### Rollout Flag Details

| Setting                  | Type    | Default | Description                                                                          |
| ------------------------ | ------- | ------- | ------------------------------------------------------------------------------------ |
| `planReviewOrchestrator` | boolean | `false` | Enable/disable orchestrator. When `true`, orchestrator activates on `/plan` command. |

### Default Reviewers

The orchestrator uses two default reviewers:

| Reviewer   | Specialization                                                 |
| ---------- | -------------------------------------------------------------- |
| **Jason**  | Code architecture, technical depth, implementation feasibility |
| **Freddy** | Clarity, structure, completeness, user perspective             |

Both reviewers see your plan and provide feedback independently, then coordinate through the orchestrator.

### Multi-Round Limits

| Setting                  | Value | Description                                                                                |
| ------------------------ | ----- | ------------------------------------------------------------------------------------------ |
| **Max Rounds**           | 3     | Maximum revision cycles before orchestration completes, even if not all reviewers approve. |
| **Per-Reviewer Timeout** | 30s   | Time to wait for each reviewer's response before treating as rejection.                    |

**What if max rounds is reached?**

The orchestrator completes after 3 rounds regardless of approval status. You'll see:

```
⚠️  Max rounds (3) reached
   Some reviewers may not have approved.
   You can continue planning or implement as-is.
```

You retain full control—approval is advisory, not enforced.

---

## Usage Examples

### Example 1: Basic Plan with Orchestrator

**Scenario:** You're planning a new authentication system and want both technical and design feedback.

```
You: /plan
     I want to implement JWT-based authentication for our API.

     Key decisions:
     - Store JWT in httpOnly cookies
     - 15-minute token expiry
     - Refresh tokens valid for 7 days
     - Refresh tokens rotate on each use

System: plan-orchestrator: initialized with 2 reviewers (max 3 rounds)
        plan-orchestrator: Round 1 / 3 - Dispatching Jason

[Jason's Review]
Jason:  Solid choices. Rotating refresh tokens adds good security.
        However, consider:
        - Document token refresh flow in API docs
        - Add rate limiting to token refresh endpoint
        - Include logout endpoint to invalidate refresh tokens
        [PLAN-APPROVED]

System: plan-orchestrator: Jason → approved
        plan-orchestrator: Round 1 / 3 - Dispatching Freddy

[Freddy's Review]
Freddy: Good structure overall. A few questions:
        - How will clients handle token expiry UX?
        - Is the 15-minute window documented for frontend teams?
        - Consider a refresh-before-expiry grace period
        [PLAN-REVISE-NEEDED]

System: plan-orchestrator: Freddy → revision needed
        plan-orchestrator: Round 1 complete:
          Jason: approved
          Freddy: revision needed
        → Revisions needed. Starting round 2.

You: Updated plan:
     - Added logout endpoint that invalidates refresh tokens
     - Token refresh window: 15-minute expiry, refresh up to 1 minute before expiry
     - Frontend teams will auto-refresh on 401, with fallback to re-login
     - Updated docs with token lifecycle diagram

System: plan-orchestrator: Round 2 / 3 - Dispatching Jason

[Jason's Review (Round 2)]
Jason:  Logout endpoint looks good. One small addition:
        - Add CSRF protection when refreshing tokens
        [PLAN-APPROVED]

System: plan-orchestrator: Jason → approved
        plan-orchestrator: Round 2 / 3 - Dispatching Freddy

[Freddy's Review (Round 2)]
Freddy: Much clearer now! The grace period and docs help a lot.
        [PLAN-APPROVED]

System: plan-orchestrator: Freddy → approved
        plan-orchestrator: ✅ All reviewers approved after 2 round(s)
        plan-orchestrator: Orchestration complete!
```

**Output Token Reference:**

| Event                   | Token                  | Meaning                                            |
| ----------------------- | ---------------------- | -------------------------------------------------- |
| Jason approves          | `[PLAN-APPROVED]`      | Reviewer is satisfied; plan is ready               |
| Freddy requests changes | `[PLAN-REVISE-NEEDED]` | Reviewer wants revisions before approval           |
| Session completes       | (no token)             | Orchestrator finished (all approved or max rounds) |

### Example 2: Plan with Multiple Revision Rounds

**Scenario:** You're planning a complex data migration, and reviewers have different concerns across multiple rounds.

```
You: /plan
     Plan to migrate 10M user records from PostgreSQL to DynamoDB.

     Approach:
     1. Create CDC pipeline using AWS Lambda
     2. Run parallel writes (both databases) for 2 weeks
     3. Validate data consistency
     4. Switch read traffic to DynamoDB
     5. Cleanup PostgreSQL

System: plan-orchestrator: initialized with 2 reviewers (max 3 rounds)

[Round 1]
Jason:  Architecture is sound. Questions:
        - How will you handle CDC failures?
        - Rollback strategy if DynamoDB has issues?
        [PLAN-REVISE-NEEDED]

Freddy: The timeline is aggressive. Concerns:
        - 2-week parallel write window with 10M records?
        - What's your monitoring strategy?
        [PLAN-REVISE-NEEDED]

System: Round 1 complete: Both reviewers request revision
        → Starting round 2

You: Updated plan addresses:
     - CDC failures: Lambda DLQ + SNS alerting
     - Rollback: Switch reads back to PostgreSQL if issues detected
     - Timeline: Phased approach (1M records at a time)
     - Monitoring: CloudWatch dashboards + custom metrics

[Round 2]
Jason:  CDC rollback plan is good. One addition needed:
        - Define "acceptable" validation metrics
        - When do we declare consistency achieved?
        [PLAN-REVISE-NEEDED]

Freddy: Phased approach much better. Timeline now realistic.
        [PLAN-APPROVED]

System: Round 2 complete: Jason needs more details, Freddy approves
        → Starting round 3

You: Added validation criteria:
     - 99.99% record match rate between databases
     - All foreign keys resolvable
     - No orphaned records
     - Sample audit on 0.1% of records for content accuracy

[Round 3]
Jason:  Validation criteria are solid. Ready to implement.
        [PLAN-APPROVED]

Freddy: Still looks good.
        [PLAN-APPROVED]

System: ✅ All reviewers approved after 3 round(s)
```

**Key Insight:** The orchestrator works across multiple revision cycles, tracking which reviewers have approved and re-reviewing only the updated parts of the plan.

### Example 3: Mixed Feedback (One Approval, One Revision)

**Scenario:** A simpler plan where reviewers have different opinions.

```
You: /plan
     Add real-time notifications to the dashboard using WebSockets.

System: plan-orchestrator: initialized with 2 reviewers (max 3 rounds)

[Round 1]
Jason:  Good idea. Suggestion:
        - Consider Server-Sent Events (SSE) instead for simpler browser support
        - WebSockets are more complex; SSE handles 90% of use cases
        [PLAN-REVISE-NEEDED]

Freddy: Solid approach. WebSockets are the right choice for real-time.
        Notification delivery is clear and well-structured.
        [PLAN-APPROVED]

System: Round 1 complete:
        Jason: revision needed
        Freddy: approved
        → Jason's concerns noted. Continuing to round 2.

You: Updated plan:
     - Reconsidered SSE vs WebSockets
     - WebSockets chosen for bi-directional capability (future interactive notifications)
     - Added fallback to polling for older clients
     - Documented the tradeoff analysis

[Round 2]
Jason:  Good analysis. Fallback strategy is smart. I'm satisfied.
        [PLAN-APPROVED]

Freddy: Still looks good. Ready to implement.
        [PLAN-APPROVED]

System: ✅ All reviewers approved after 2 round(s)
```

**What You Learn:** Different reviewers bring different perspectives. The orchestrator ensures both are considered before you move forward.

---

## Troubleshooting

### Orchestrator Not Activating

**Problem:** You're using `/plan`, but you don't see orchestrator messages.

**Solutions:**

1. **Check the rollout flag:**

   ```json
   // ~/.copilot/config.json
   {
     "rollout": {
       "planReviewOrchestrator": true
     }
   }
   ```

   Make sure `planReviewOrchestrator` is set to `true`.

2. **Restart your session:**

   ```bash
   # If Copilot CLI is running, restart it
   killall node  # or restart your terminal
   ```

3. **Check for errors in logs:**
   Look in `~/.copilot/logs/` for any messages indicating the extension failed to load.

4. **Verify you're in plan mode:**
   The orchestrator only activates after you type `/plan`. Make sure the slash command is recognized.

### Only One Reviewer Responding

**Problem:** You see messages from Jason but not Freddy (or vice versa).

**Expected behavior:** Both reviewers should respond, but there can be legitimate reasons only one appears:

- **Freddy is still reviewing** — They may take longer. Give them up to 30 seconds.
- **Freddy approved silently** — Some reviewer sessions may not provide verbose feedback.
- **Network issue** — The second reviewer may have timed out. The system will treat this as a revision needed.

**If this happens repeatedly:**

1. Check your internet connection
2. Verify both reviewer roles can still be launched in your current runtime
3. File an issue if the second reviewer consistently doesn't appear

### Unclear Token Formats

**Problem:** You see reviewer responses but aren't sure if they approved or rejected.

**Reference table:**

| Scenario                  | Token                  | Meaning                              | Example                                                      |
| ------------------------- | ---------------------- | ------------------------------------ | ------------------------------------------------------------ |
| Reviewer approves         | `[PLAN-APPROVED]`      | Plan is ready to implement           | Freddy ends with: "Looks good! [PLAN-APPROVED]"              |
| Reviewer requests changes | `[PLAN-REVISE-NEEDED]` | Revisions required before approval   | Jason ends with: "Add error handling. [PLAN-REVISE-NEEDED]"  |
| No token found            | (defaults to reject)   | Treated as revision needed           | Jason responds but forgets token → treated as rejection      |
| Both tokens present       | (ambiguous)            | Defaults to revision needed          | "[PLAN-APPROVED] Actually, [PLAN-REVISE-NEEDED]" → rejection |
| Token not at end          | (still counted)        | Token in middle of response is valid | "We [PLAN-APPROVED] this approach yesterday" → approval      |

**Token formats accepted:**

- `[PLAN-APPROVED]` (standard)
- `[plan-approved]` (case-insensitive)
- `[Plan-Approved]` (case-insensitive)
- `[ PLAN-APPROVED ]` (with spaces)

**Tips:**

- Tokens are **case-insensitive**, so `[PLAN-APPROVED]`, `[plan-approved]`, and `[Plan-Approved]` all work
- Tokens can appear **anywhere** in the response (beginning, middle, end)
- **One token per response** — if both tokens are present, the system treats it as ambiguous and defaults to rejection
- **Missing token** — if a reviewer doesn't include a token, the system treats it as a revision needed (strict default)

### Session State Issues

**Problem:** The orchestrator seems to be in a weird state, or you want to start fresh.

**Solutions:**

1. **Restart your session:**
   The orchestrator automatically clears state when your session ends. Simply:

   ```bash
   # Exit the current session and start a new one
   exit
   ```

2. **Force exit plan mode:**

   ```bash
   # Type Escape or Ctrl+C to exit plan mode
   # Orchestrator will clean up automatically
   ```

3. **Check orchestrator logs:**
   Look for messages like:

   ```
   plan-orchestrator: cleared session state
   ```

   This confirms the orchestrator cleaned up properly.

4. **Manual reset** (if needed):
   Edit `~/.copilot/config.json` and toggle the flag:
   ```json
   { "rollout": { "planReviewOrchestrator": false } } // Disable
   ```
   Then re-enable:
   ```json
   { "rollout": { "planReviewOrchestrator": true } } // Re-enable
   ```

---

## Advanced Usage

### Disabling the Orchestrator Mid-Session

If you started a session with the orchestrator enabled but want to switch to non-orchestrated planning:

**Option 1: Exit and rejoin**

```
You: /exit  (exit plan mode)
System: Plan orchestration halted
You: /plan  (rejoin without triggering orchestrator for this round)
```

**Option 2: Update config and reload**

```bash
# Edit config
~/.copilot/config.json
# Set planReviewOrchestrator to false
# Reload extensions
extensions_reload
```

The orchestrator will not initialize for new `/plan` sessions after this change.

### Customizing Reviewer Selection

**Note:** Reviewer customization is a planned feature for future releases.

Currently, the orchestrator always uses:

- **Jason**
- **Freddy**

In future versions, you'll be able to:

- Override reviewer selection per session
- Add custom reviewers (e.g., domain experts)
- Adjust reviewer weights (if you trust one more than another)
- Use single-reviewer mode for lightweight feedback

**To request reviewer customization,** open an issue describing your use case.

### Integration with Other Copilot Extensions

The Plan Review Orchestrator coexists safely with other Copilot extensions, including:

- **plan-review-policy** — The orchestrator builds on top of this extension. Both are compatible.
- **Other extensions** — The orchestrator uses isolated session state and doesn't interfere with other extensions.

**Key points:**

- The orchestrator and plan-review-policy extensions **do not conflict** — they run on different hooks
- The orchestrator's reviewer-specific context **complements** the general planning guidance from plan-review-policy
- You can enable/disable the orchestrator independently without affecting other extensions

**Example:** With both extensions enabled:

1. `plan-review-policy` injects general planning guidelines (scope, risks, resources)
2. `plan-orchestrator` injects reviewer-specific context (focus areas for Jason/Freddy)
3. Reviewers see both sets of context and provide feedback
4. Orchestrator tracks approvals and coordinates revisions

---

## Related Documentation

- **[README.md](README.md)** — Technical overview and architecture
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** — Quick reference for developers
- **[tests/TEST_GUIDE.md](tests/TEST_GUIDE.md)** — Test suite documentation and examples

---

## Summary

The Plan Review Orchestrator automates multi-reviewer coordination for your plans:

✅ **Enable** via config flag `{ rollout: { planReviewOrchestrator: true } }`
✅ **Trigger** by using `/plan` slash command
✅ **Coordinate** Jason and Freddy through multiple revision rounds (max 3)
✅ **Complete** when all reviewers approve or max rounds reached
✅ **Control** remains yours — approval is advisory

Happy planning! 🎯
