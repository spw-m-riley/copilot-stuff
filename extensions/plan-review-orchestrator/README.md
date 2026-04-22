# Plan Review Orchestrator Extension

Passive orchestration for `/plan` review workflows. The extension initializes per-session review state, injects reviewer-specific context into matching reviewer child agents when the runtime launches them, and parses surfaced reviewer verdicts when available.

It does **not** launch reviewer agents itself, and this repository has not proven a safe supported SDK auto-launch path.

## Final Contract

- **Passive only** — no supported auto-launch API was proven here.
- **Stable reviewer role ids** — `jason` and `freddy`.
- **Nested child metadata supported** — reviewer matching reads `agentName`, `agentDisplayName`, `agentDescription`, plus `input.subagent.agentName`, `input.subagent.agentDisplayName`, and `input.subagent.agentDescription`.
- **Context injection is selective** — reviewer context is injected only for runtime-launched child agents whose metadata matches tracked reviewer roles.
- **Response parsing is opportunistic** — `onSubagentEnd` parses surfaced text only; if no response text is exposed, the reviewer stays `pending` and the extension does not synthesize a verdict from that absence.

## Overview

When `/plan` starts, the extension:

1. creates in-memory orchestration state for the session;
2. tracks reviewer roles `jason` and `freddy`;
3. waits for the runtime to launch matching reviewer child agents;
4. injects role-specific reviewer context into those matching children;
5. records verdict tokens from surfaced reviewer text when available; and
6. advances rounds or completes once all tracked reviewers have responded.

## What It Does Not Do

The following are intentionally out of scope for the shipped contract:

- launching reviewer agents automatically;
- treating `additionalContext` as a launch mechanism;
- using `modifiedPrompt`, `session.send`, `session.sendAndWait`, or `session.rpc.agent.select` as supported reviewer dispatch APIs;
- assuming `onSubagentEnd` always contains reviewer response text.

## Architecture

### Core Files

- **`extension.mjs`** — hook wiring, per-session state, passive round coordination.
- **`lib/orchestrator.mjs`** — in-memory state machine for rounds, approvals, and completion.
- **`lib/approval-tracker.mjs`** — strict verdict token parsing.
- **`lib/reviewer-dispatch.mjs`** — reviewer matching and role-specific context generation.
- **`lib/reviewer-roles.mjs`** — stable reviewer role registry (`jason` / `freddy`) plus model/display aliases.

### Reviewer Role Registry

The shipped reviewer ids are stable role ids, not model ids:

```javascript
DEFAULT_REVIEWER_ROLE_IDS; // ["jason", "freddy"]
```

Current preferred model hints remain:

- `jason` → `gpt-5.3-codex`
- `freddy` → `claude-sonnet-4.6`

Those model names are aliases and hints for matching/context, not the orchestrator's stable ids.

## Hook Behavior

### `onUserPromptSubmitted`

- detects `/plan`;
- initializes the orchestrator with `jason` and `freddy`;
- clears stale orchestrator state when leaving plan mode.

### `onSubagentStart`

- reads reviewer metadata from top-level agent fields and nested `input.subagent.*` fields;
- checks whether the child looks like a reviewer;
- matches the child to tracked role ids;
- injects reviewer-specific context only for matching reviewer children already launched by the runtime.

### `onSubagentEnd`

- checks whether surfaced text exists in `input.response` or `input.output`;
- if no text is surfaced, logs the condition, leaves that reviewer `pending`, and waits for a later surfaced signal rather than inventing a timeout verdict;
- if text is surfaced, parses `[PLAN-APPROVED]` / `[PLAN-REVISE-NEEDED]` tokens;
- advances rounds or completes once all tracked reviewers have non-pending states.

## Approval Tokens

Reviewers are instructed to end with exactly one verdict token:

```text
[PLAN-APPROVED]
[PLAN-REVISE-NEEDED]
```

Parsing rules:

- tokens are case-insensitive;
- missing token with surfaced text → rejected;
- both tokens present → rejected as ambiguous;
- no surfaced text at all → reviewer remains pending.

## Integration with `plan-review-policy`

The two extensions are additive:

- **`plan-review-policy`** provides the broader `/plan` reviewer-loop guidance.
- **`plan-review-orchestrator`** adds passive state tracking, role-aware child context, and verdict parsing.

Neither extension is the reviewer launcher. The runtime still decides whether and when reviewer child agents appear.

## Logging Examples

```text
plan-orchestrator: initialized with 2 reviewers (max 3 rounds)
plan-orchestrator: injecting reviewer context for jason (round 1)
plan-orchestrator: jason → approved ([PLAN-APPROVED] token found)
plan-orchestrator: freddy finished without surfaced response text; leaving reviewer pending
plan-orchestrator: Round 1 status:
  Round 1/3:
    jason: approved
    freddy: pending
```

If a round finishes with surfaced rejections, the extension logs the revision request text as an ephemeral session log and advances internal round state. It does not auto-send that text back into the session as a new launch action; the surrounding runtime/user flow must decide what happens next.

## Validation

Run from `extensions/plan-review-orchestrator/` or from the repository root with full paths.

```bash
node tests/run-all.mjs
node tests/integration/both-extensions.test.mjs
```

Current checked coverage in this worktree:

- `tests/run-all.mjs` → shared metadata, SDK contract, orchestrator state machine, reviewer dispatch
- `tests/integration/both-extensions.test.mjs` → additive behavior with `plan-review-policy`

## Known Limitations

- in-memory session state only;
- reviewer roster is fixed to `jason` / `freddy`;
- no proven SDK reviewer auto-launch surface in this repository;
- no guarantee that runtime hook payloads will include reviewer response text on completion.

## Files

```text
extensions/plan-review-orchestrator/
├── extension.mjs
├── lib/
│   ├── approval-tracker.mjs
│   ├── orchestrator.mjs
│   ├── reviewer-dispatch.mjs
│   └── reviewer-roles.mjs
└── tests/
    ├── fixtures/sdk-dispatch-contract.json
    ├── integration/both-extensions.test.mjs
    ├── run-all.mjs
    └── unit/
        ├── context-policy.test.mjs
        ├── orchestrator.test.mjs
        ├── reviewer-dispatch.test.mjs
        └── sdk-dispatch-contract.test.mjs
```
