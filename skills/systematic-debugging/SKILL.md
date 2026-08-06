---
name: systematic-debugging
description: "Use when a failure or unexpected behavior has an unclear root cause and needs evidence before fixing; use specialist triage for known CI, AWS, TypeScript, Terraform, or toolchain failures."
metadata:
  category: testing
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Systematic Debugging

Use this skill when the symptom is visible but the root cause is not yet proven.

## Use this skill when

- You encounter a failing test, error message, or unexpected behavior.
- The symptom is clear but the root cause is unclear.
- You feel pressure to "just try something" or skip investigation.
- Behavior changed after recent commits or configuration changes.
- You are about to propose a fix without understanding why the problem exists.

## Do not use this skill when

- The root cause is already known and validated.
- The fix has already been verified in a test environment.
- The user explicitly asks you to apply a specific fix and does not want investigation.
- The failure is clearly scoped to GitHub Actions, AWS, TypeScript, Terraform, or toolchain upgrades; use the matching specialist triage skill.
- The remaining work is verifying a fix; route to [`verification-before-completion`](../verification-before-completion/SKILL.md).

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Error or test output is visible, but no clear root cause exists | Yes | - |
| Root cause is validated and fix strategy is known | No | [`test-driven-development`](../test-driven-development/SKILL.md) |
| Fix is implemented and needs proof | No | [`verification-before-completion`](../verification-before-completion/SKILL.md) |
| User wants a specific known fix applied | Usually no | apply the requested fix, then validate |
| Root cause is confirmed but no correct seam/interface exists for a clean fix | No | [`codebase-design`](../codebase-design/SKILL.md) |

## Inputs to gather

- Full error message or test failure output.
- Exact reproduction command or user action.
- Environment context: OS, tool versions, config, branch, recent changes.
- Timeline: when the behavior started and what changed.
- Scope: which inputs, environments, or packages are affected.

## First move

1. Capture the full error or failure output.
2. Pick the fastest reproduction technique from [`references/feedback-loop-playbook.md`](references/feedback-loop-playbook.md) and reproduce the issue consistently, or document why it is intermittent.
3. Read the failure output end-to-end before proposing fixes.

## Workflow

1. **Investigate:** reproduce using the ranked techniques and completion bar in [`references/feedback-loop-playbook.md`](references/feedback-loop-playbook.md), trace data flow, check boundaries, inspect recent diffs. Tag any temporary debug output with a unique marker so it stays easy to filter and remove.
2. **Compare cases:** isolate differences between failing and working behavior.
3. **State one hypothesis:** one sentence for cause + evidence.
4. **Test minimally:** one focused check per hypothesis.
5. **Fix only after cause is supported:** smallest possible fix.
6. **Reassess after repeated misses:** stop guessing after three failed attempts.

## Outputs

- The exact reproduced failure output, command, environment notes, and consistency status.
- A one-sentence verified root cause backed by logs, tests, diffs, traces, or working-case comparison.
- The minimal fix that addresses the cause rather than the symptom.
- Validation evidence and any unresolved environmental or intermittent blocker.

## Guardrails

- Never propose a fix without stating the root cause.
- Never make more than one change per hypothesis test.
- Never skip reproduction; if reproduction is impossible, say so and investigate environment differences.
- Do not accumulate random changes after failed hypotheses.
- After three failed fixes, stop and reassess instead of trying "one more thing".

## Validation

- Root cause is documented in one sentence.
- The cause is verified by a test, diff, log trace, debugger observation, or working-case comparison.
- The fix is minimal and targets the cause.
- The formerly failing path now passes, and relevant regression checks pass.
- Smoke test:
  - should trigger: "This test still flakes; find the root cause before we change code."
  - should not trigger: "Rerun the failing test to confirm the fix worked." (→ `verification-before-completion`)

## Examples

- "This unit test fails with an assertion error; trace the input and compare with a passing test before fixing."
- "This failure started after yesterday's commits; identify the commit and root cause before changing code."
- "This test flakes once every few runs; reproduce the pattern and isolate state or timing differences."

## Reference files

- [`references/root-cause-tracing.md`](references/root-cause-tracing.md) - error analysis, reproduction, and data-flow tracing techniques
- [`references/defense-in-depth.md`](references/defense-in-depth.md) - layered observability and systematic elimination strategies
- [`references/feedback-loop-playbook.md`](references/feedback-loop-playbook.md) - ranked reproduction techniques, the reproducible/deterministic/fast/agent-runnable completion bar, flaky reproduction-rate guidance, debug tags, and when to route to `codebase-design`
