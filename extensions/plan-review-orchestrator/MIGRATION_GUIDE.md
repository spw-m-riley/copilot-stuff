# Migration Guide: Orchestrated Plan Reviews

Welcome! This guide will help you understand and adopt the new **Plan Review Orchestrator** extension. If you're currently using `/plan` with manual review coordination, this guide will show you how the new orchestrator streamlines that workflow.

---

## Why Orchestrated Reviews?

### The Old Challenge

When you're planning complex work, getting quality feedback is critical—but coordinating multiple reviewers manually can be messy:

- **Conflicting feedback:** One reviewer suggests approach A, another suggests B. You're left resolving conflicts yourself.
- **Unclear next steps:** Feedback comes back fragmented. Did all reviewers approve? Should you revise further?
- **Lost context:** As you revise plans round-to-round, reviewers don't always see how their earlier feedback was addressed.
- **Slow iteration:** You have to manually wait for each reviewer, copy their feedback into revisions, and ask them to review again.
- **No coordination:** Reviewers work independently without seeing each other's input, leading to redundant or contradictory guidance.

### What the Orchestrator Fixes

The Plan Review Orchestrator **automatically coordinates** multiple expert reviewers throughout your planning process:

✅ **Structured feedback** — Reviewers follow a common approval format, making results consistent and actionable  
✅ **Transparent coordination** — You see which reviewers approved and which requested revisions, in real time  
✅ **Automatic revision cycles** — If any reviewer requests changes, the orchestrator coordinates a new round of reviews  
✅ **Clear stopping point** — Process completes when all reviewers approve or you reach a maximum revision round  
✅ **Multi-round intelligence** — Reviewers see the context of previous rounds, improving follow-up feedback

### When to Use Orchestrated Reviews

| Scenario | Recommendation |
|----------|-----------------|
| **Complex design decisions** | ✅ Use orchestrator — benefit from coordinated expert perspectives |
| **High-risk proposals** | ✅ Use orchestrator — ensure all reviewers are aligned before proceeding |
| **Large architectural changes** | ✅ Use orchestrator — catch issues from multiple angles |
| **Learning from expert feedback** | ✅ Use orchestrator — structured reviews improve over time |
| **Quick sanity checks** | ❌ Skip orchestrator — single reviewer or plan-review-policy is faster |
| **Simple 5-minute plans** | ❌ Skip orchestrator — not worth the review overhead |
| **Solo decisions** | ❌ Skip orchestrator — you don't need multi-reviewer consensus |

---

## What's Changing?

### Before: Manual Coordination

```
You: /plan
  ↓
Plan Review Policy: Injects general review guidelines
  ↓
You: Copy plan, share with reviewer A
  ↓
Reviewer A: Reviews → [manual feedback]
  ↓
You: Interpret feedback, revise plan
  ↓
You: Share revised plan with reviewer B
  ↓
Reviewer B: Reviews → [manual feedback]
  ↓
You: Synthesize feedback from both, revise again?
  ↓
Uncertain if you're done or need more feedback
```

### After: Automatic Orchestration

```
You: /plan
  ↓
Orchestrator: Initializes with Jason + Freddy reviewers
  ↓
[ROUND 1]
  Jason: Reviews plan → [PLAN-REVISE-NEEDED]
  Freddy: Reviews plan → [PLAN-APPROVED]
  ↓
  Orchestrator: Recognizes mixed feedback → requests revisions
  ↓
[ROUND 2]
  Jason: Reviews revised plan → [PLAN-APPROVED]
  Freddy: Reviews revised plan → [PLAN-APPROVED]
  ↓
  Orchestrator: ✅ All approved → Coordination complete!
```

### Key Differences at a Glance

| Aspect | Old Way | New Way |
|--------|---------|---------|
| **Reviewer detection** | Manual (you decide) | Automatic (Jason + Freddy by default) |
| **Feedback format** | Free-form text | Structured tokens: `[PLAN-APPROVED]` or `[PLAN-REVISE-NEEDED]` |
| **Round coordination** | Manual (you track) | Automatic (orchestrator tracks state) |
| **Completion signal** | Unclear (you guess) | Clear (all reviewers approve or max rounds reached) |
| **Revision requests** | Manual (you synthesize) | Automatic (orchestrator injects revision context) |
| **Session state** | Loose coupling | Tight state machine (traceable, deterministic) |

### Backward Compatibility

✅ **Fully backward compatible** — The orchestrator is an **opt-in enhancement**:

- Existing `/plan` workflows continue to work unchanged
- Plan Review Policy extension still provides general review guidance
- No breaking changes to any existing tools or commands
- Both extensions coexist without conflict

You can enable the orchestrator globally, per-session, or not at all—your choice.

---

## Migration Path: 5 Steps

### Step 1: Understand the New Workflow

**Read the essential guides:**

- **[README.md](README.md)** — Complete technical overview
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** — Quick lookup for state machine and token formats
- **This guide** — Your step-by-step adoption path

**Key concept:** The orchestrator is a state machine that tracks multi-round reviews. When you run `/plan`, it initializes reviewers, tracks their approval tokens, and coordinates revisions automatically.

### Step 2: Enable the Orchestrator

The orchestrator is **disabled by default** to keep your existing workflow unchanged.

**Option A: Enable globally for all plans**

Edit your Copilot CLI config file (`~/.copilot/config.json`):

```json
{
  "rollout": {
    "planReviewOrchestrator": true
  }
}
```

**Option B: Enable per-session via environment variable**

```bash
export COPILOT_PLAN_REVIEW_ORCHESTRATOR=true
copilot
```

**Option C: Leave disabled and use on-demand (see Step 4)**

You can leave the orchestrator disabled by default and selectively enable it for specific complex plans.

### Step 3: Run a Test Plan

Try out the orchestrator with a simple plan to observe the new workflow:

```bash
# In a Copilot session
/plan

# Enter a simple design decision, e.g.:
# "I'm planning to refactor the auth module to use JWT tokens instead of sessions.
#  Focus on security, backwards compatibility, and rollback strategy."
```

**What to expect:**

- Orchestrator initializes and logs: `plan-orchestrator: initialized with 2 reviewers (max 3 rounds)`
- Jason (first reviewer) reviews your plan
- Freddy (second reviewer) reviews your plan
- Both respond with `[PLAN-APPROVED]` or `[PLAN-REVISE-NEEDED]`
- If either needs revisions, orchestrator automatically requests them
- Process repeats until all approve or max rounds (3) is reached

**Check the logs:**

```
plan-orchestrator: initialized with 2 reviewers (max 3 rounds)
plan-orchestrator: injecting reviewer context for gpt-5.3-codex (round 1)
plan-orchestrator: gpt-5.3-codex → approved
plan-orchestrator: injecting reviewer context for claude-sonnet-4.6 (round 1)
plan-orchestrator: claude-sonnet-4.6 → approved
plan-orchestrator: ✅ All reviewers approved after 1 round
```

### Step 4: Compare Old vs. New Feedback

Run the same plan **with and without the orchestrator** to see the difference:

**Without orchestrator:**
- You get general review guidance from plan-review-policy
- You synthesize feedback manually
- Unclear consensus or next steps

**With orchestrator:**
- Jason and Freddy provide structured feedback with explicit approval/revision tokens
- Orchestrator tracks which reviewers approved
- Automatic revision rounds if needed
- Clear completion signal

### Step 5: Adjust Your Workflow (Optional)

Depending on your experience, you might customize:

**A. Disable for quick checks**

```bash
# For a simple one-off plan, skip the orchestrator overhead
export COPILOT_PLAN_REVIEW_ORCHESTRATOR=false
/plan
```

**B. Use only for specific plan types**

Consider the "when to use" table above—if you're mostly doing quick sanity checks, the orchestrator might add overhead. If you're doing complex, high-risk planning, enable it globally.

**C. Integrate with your team's workflow**

If your team uses Copilot for collaborative planning, the orchestrator's structured feedback can help create a shared understanding of plan readiness.

### Rollback: Easy Return to Old Workflow

If you want to disable the orchestrator at any time:

```json
// config.json
{
  "rollout": {
    "planReviewOrchestrator": false
  }
}
```

Or:

```bash
unset COPILOT_PLAN_REVIEW_ORCHESTRATOR
```

**Your existing workflows are unaffected** — the orchestrator is purely additive.

---

## Practical Scenarios

### Scenario A: Complex Design Decision

**Context:** You're planning a major microservices migration.

**What happens:**

1. You run `/plan` with orchestrator enabled
2. Jason reviews and sees potential security gaps → `[PLAN-REVISE-NEEDED]`
3. Freddy reviews and sees deployment complexity → `[PLAN-REVISE-NEEDED]`
4. Orchestrator detects both need revisions and requests Round 2
5. You revise the plan addressing both concerns
6. Jason reviews revised plan → `[PLAN-APPROVED]`
7. Freddy reviews revised plan → `[PLAN-APPROVED]`
8. Orchestrator completes: ✅ All reviewers aligned after 2 rounds

**Value:** Without orchestration, you might have missed the security gap or deployment issue entirely, or spent cycles thrashing between conflicting feedback.

### Scenario B: Bug Fix Validation

**Context:** You're planning a fix for a critical production bug.

**What happens:**

1. You run `/plan` with orchestrator enabled
2. Jason reviews → `[PLAN-APPROVED]` (approach is solid)
3. Freddy reviews → `[PLAN-APPROVED]` (implementation strategy checks out)
4. Orchestrator completes after Round 1: ✅ Both reviewers confident, proceed with implementation

**Value:** Explicit, coordinated validation gives you confidence to ship quickly.

### Scenario C: Mixed Feedback with Revision Cycles

**Context:** You're planning a performance optimization across multiple systems.

**What happens:**

**Round 1:**
- Jason: Likes the approach but notes missing load-test strategy → `[PLAN-REVISE-NEEDED]`
- Freddy: Agrees with Jason's concern, adds rollback plan needed → `[PLAN-REVISE-NEEDED]`

**Round 2 (your revision):**
- You add load-test plan and rollback strategy
- Jason: Satisfied with load tests, but rollback needs clarification → `[PLAN-REVISE-NEEDED]`
- Freddy: Rollback plan looks solid, agrees with Jason on test clarity → `[PLAN-REVISE-NEEDED]`

**Round 3 (your final revision):**
- You clarify both concerns
- Jason: Looks good! → `[PLAN-APPROVED]`
- Freddy: Ready to go! → `[PLAN-APPROVED]`
- Orchestrator completes: ✅ After 3 rounds, full consensus

**Value:** Without orchestration, you'd never know if round 3 was truly final or if there were hidden concerns. Orchestration ensures explicit consensus.

### Scenario D: Disabling Orchestrator for Quick Checks

**Context:** You're doing a quick sanity check on a 5-minute task.

**What happens:**

1. You disable orchestrator: `export COPILOT_PLAN_REVIEW_ORCHESTRATOR=false`
2. You run `/plan` for a trivial task
3. Plan Review Policy provides general guidance (no multi-reviewer coordination)
4. You get quick feedback without orchestrator overhead

**Value:** You have control—use orchestration where it adds value, skip it for lightweight work.

---

## Frequently Asked Questions

### Q: Will the orchestrator slow down my planning?

**A:** It depends on your plan complexity:

- **Simple plans:** Yes, orchestrator adds coordination overhead. Consider disabling for quick checks.
- **Complex plans:** No—orchestrator *saves* time by automating multi-round coordination you'd otherwise do manually.
- **Trade-off:** A bit slower on simple plans, much faster on complex plans. The value emerges with higher-stakes decisions.

**Recommendation:** Enable globally if you do complex planning; disable if you mostly do quick sanity checks.

### Q: What if one reviewer doesn't respond or times out?

**A:** The orchestrator uses a 30-second timeout per reviewer. If a reviewer doesn't respond:

1. Their response is treated as a rejection (strict default for safety)
2. The orchestrator logs the timeout
3. Revision round continues to give them another chance
4. If timeouts repeat, the process completes after max rounds

This conservative approach ensures you're never blocked—the orchestrator will always complete, one way or another.

### Q: Can I choose different reviewers?

**A:** Currently, the orchestrator is hardcoded to Jason (gpt-5.3-codex) and Freddy (claude-sonnet-4.6) to match the plan-review-policy defaults.

**Future versions** will support custom reviewer configuration via config file. For now, contact the Copilot team if you'd like to use different reviewers.

### Q: Can I go back to the old workflow?

**A:** Absolutely! Set `planReviewOrchestrator: false` in your config, or unset the environment variable. No impact on existing workflows—you're just turning off the coordination layer.

### Q: Does the orchestrator work with my existing scripts or integrations?

**A:** Yes! The orchestrator is a pure enhancement:

- It doesn't break `/plan` command syntax
- It doesn't change the output format you're used to
- It doesn't interfere with other extensions
- Existing integrations continue to work as-is

The orchestrator runs silently in the background, coordinating reviewers. Your scripts won't notice a difference.

### Q: What tokens do reviewers use to signal approval?

**A:** Reviewers must end their response with one of:

```
[PLAN-APPROVED]       ← Use when plan is ready to implement
[PLAN-REVISE-NEEDED]  ← Use when revisions are required
```

These tokens are:
- Case-insensitive: `[plan-approved]` works too
- Parsed from the end of the response
- Strict: missing token = rejection (safe default)

### Q: How many revision rounds can the orchestrator do?

**A:** Maximum of **3 rounds** by default:

1. **Round 1:** Initial plan reviews
2. **Round 2:** First revision if needed
3. **Round 3:** Final revision if still needed

After Round 3, the orchestrator completes regardless of approval status. This prevents infinite loops. Future versions may make this configurable.

### Q: What if reviewers give conflicting feedback?

**A:** That's actually a feature! The orchestrator lets you see all feedback clearly:

- Each reviewer's verdict is explicit (`[PLAN-APPROVED]` or `[PLAN-REVISE-NEEDED]`)
- Their rationale is included in their response
- You can read both rationales and synthesize an informed decision
- Orchestrator doesn't force consensus—it just makes disagreement visible

### Q: Does orchestrator work with the existing plan-review-policy?

**A:** Yes, both extensions coexist perfectly:

- **plan-review-policy** injects general review guidance
- **orchestrator** injects reviewer-specific context and tracks approvals

They use different hooks and maintain separate state. No conflicts.

---

## Troubleshooting

### Orchestrator Not Activating

**Symptom:** You enabled the orchestrator but it's not running.

**Diagnosis:**

1. Check config file: `cat ~/.copilot/config.json | grep planReviewOrchestrator`
2. Check environment variable: `echo $COPILOT_PLAN_REVIEW_ORCHESTRATOR`
3. Verify you're using `/plan` command (not a different command)
4. Check extension is loaded: Look for `plan-orchestrator` in logs

**Solution:**

- Ensure `planReviewOrchestrator: true` is set in config.json
- Or set `export COPILOT_PLAN_REVIEW_ORCHESTRATOR=true`
- Restart your Copilot session

### Unexpected Behavior with Existing Extensions

**Symptom:** Other extensions behaving oddly after enabling orchestrator.

**Diagnosis:**

1. Orchestrator uses separate hooks (`onSubagentStart`, `onSubagentEnd`)
2. It should not interfere with other extensions
3. Most likely: another extension is also modifying `/plan` behavior

**Solution:**

- Disable orchestrator temporarily: `export COPILOT_PLAN_REVIEW_ORCHESTRATOR=false`
- If issue goes away, it's an orchestrator-extension conflict
- Contact Copilot team with both extension names
- If issue persists, it's an unrelated extension conflict

### Performance Considerations

**Scenario:** Orchestrator is slow / taking too long.

**Expected behavior:**

- Round 1: ~30–60 seconds (both reviewers evaluate)
- Round 2+: ~30–60 seconds per round

**If orchestrator is slower than expected:**

1. Check network: Are you on slow connection?
2. Check reviewer availability: Are Jason and Freddy responding?
3. Disable orchestrator for lightweight plans (see "When NOT to use" section)
4. Consider max-round timeout if you're hitting all 3 rounds

**If orchestrator is noticeably faster than before:**

Congratulations! You're benefiting from automatic round coordination.

### Debug Mode / Enabling Logging

**Enable verbose logging:**

```bash
export COPILOT_LOG_LEVEL=debug
export COPILOT_PLAN_ORCHESTRATOR_DEBUG=true
copilot
```

**What you'll see:**

```
[DEBUG] plan-orchestrator: Initializing with reviewers: gpt-5.3-codex, claude-sonnet-4.6
[DEBUG] plan-orchestrator: Round 1 state: { gpt-5.3-codex: pending, claude-sonnet-4.6: pending }
[DEBUG] plan-orchestrator: Parsing response from gpt-5.3-codex: "...full response text..."
[DEBUG] plan-orchestrator: Token found: [PLAN-APPROVED]
[DEBUG] plan-orchestrator: Round 1 state: { gpt-5.3-codex: approved, claude-sonnet-4.6: pending }
```

This helps diagnose token parsing, state transitions, and reviewer detection issues.

---

## Best Practices

### When to Enable Orchestrator

✅ **Enable globally if:**
- You regularly plan complex, high-risk initiatives
- You value multiple expert perspectives
- Your team uses structured review processes
- You want learning from multi-reviewer feedback

❌ **Leave disabled if:**
- You mostly do simple, low-stakes planning
- You prefer single-reviewer feedback
- You're doing quick sanity checks
- You want minimal overhead

### Interpreting Conflicting Feedback

If Jason approves but Freddy requests revisions:

1. **Read both rationales carefully** — They often disagree on different aspects
2. **Look for patterns** — If one always requests revisions, their feedback might be conservative (good for risky decisions, wasteful for simple plans)
3. **Synthesize, don't average** — You're not voting; you're collecting expert input to make informed decisions
4. **Trust your judgment** — Reviewers are smart, but you know your context best

### Using Multi-Round Cycles Effectively

**Round 1:** Present your raw idea
- Expect: Foundational feedback on approach, major gaps
- Action: Incorporate feedback into core strategy

**Round 2:** Present refined plan
- Expect: Deeper feedback on implementation, edge cases
- Action: Tighten details, address specific concerns

**Round 3:** Present polished plan
- Expect: Final sign-off or last-minute catches
- Action: Final polish or scope decision

**After Round 3:** Orchestrator completes
- Even if not all approve, you've had structured, multi-round feedback
- Trust that you've captured the essential concerns

### Integrating with Team Workflows

**If your team uses Copilot for planning:**

1. **Run orchestrator for team-level plans** — Creates shared understanding
2. **Share orchestrator feedback with the team** — Use it as a planning artifact
3. **Train reviewers consistently** — If Jason and Freddy are your standards, consistency compounds
4. **Use orchestrator output as planning documentation** — Explicit approvals = audit trail

---

## Next Steps

### To Get Started Today

1. **Read the QUICK_REFERENCE.md** — 5-minute overview of state machine and tokens
2. **Enable orchestrator** — Set config or env variable
3. **Run a test plan** — See the workflow in action
4. **Compare feedback** — Note how structured approvals change your planning clarity

### For Questions or Issues

- **Usage questions:** See the FAQ section above
- **Troubleshooting:** See the Troubleshooting section above
- **Technical details:** See [README.md](README.md) and [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **Found a bug:** Report via Copilot CLI issue tracker

### For Advanced Configuration (Future)

When config file support is added, you'll be able to:

```json
{
  "planReviewOrchestratorReviewers": [
    "gpt-5.3-codex",
    "claude-sonnet-4.6",
    "custom-reviewer-id"
  ],
  "planReviewOrchestratorMaxRounds": 5,
  "planReviewOrchestratorTimeout": 60000
}
```

This is not yet available in the MVP but is planned for a future release.

---

## Summary

The Plan Review Orchestrator transforms `/plan` from a manual multi-reviewer process into an **automated, coordinated workflow**:

| Element | Before | After |
|---------|--------|-------|
| **Coordination** | Manual (error-prone) | Automatic (reliable) |
| **Feedback format** | Free-form (ambiguous) | Structured tokens (clear) |
| **Round tracking** | Manual (uncertain) | Automatic (transparent) |
| **Completion signal** | Unclear (guess) | Explicit (all approved or max rounds) |
| **Revision synthesis** | Manual (tedious) | Automatic (coordinated) |

**You stay in control:**
- Enable globally, per-session, or on-demand
- Fully backward compatible
- Disable anytime if you prefer the old workflow
- Pure opt-in enhancement

**Start small:** Try it on one complex plan. Once you experience the clarity and coordination, you'll likely find it valuable for high-stakes planning.

---

**Ready to begin?** Enable the orchestrator and run `/plan` on your next complex decision. Happy planning! 🚀

