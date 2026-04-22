# Plan Review Orchestrator Handoff

## Status

Passive orchestrator implementation integrated and documented in this worktree.

## Shipped Contract

This extension now ships a **passive** contract:

- initializes per-session orchestration state on `/plan`;
- tracks stable reviewer role ids `jason` and `freddy`;
- matches reviewer children using `agentName`, `agentDisplayName`, `agentDescription`, plus `input.subagent.agentName`, `input.subagent.agentDisplayName`, and `input.subagent.agentDescription`;
- injects reviewer context only when the runtime has already launched a matching reviewer child;
- parses surfaced reviewer text on `onSubagentEnd` when available;
- leaves a reviewer `pending` if completion metadata does not expose any response text.

## Explicit Non-Goals Preserved

Do **not** treat any of the following as supported reviewer launch semantics here:

- `additionalContext`
- `modifiedPrompt`
- `session.send(...)`
- `session.sendAndWait(...)`
- `session.rpc.agent.select(...)`

No safe supported SDK auto-launch path was proven in this repository, and the docs now reflect that directly.

## Reviewer Role Registry

Stable role ids:

```javascript
["jason", "freddy"]
```

Current aliases / preferred model hints:

- `jason` ↔ `gpt-5.3-codex`
- `freddy` ↔ `claude-sonnet-4.6`

The role ids are the contract; model names are matching aids and display hints.

## Relevant Files

- `extensions/_shared/context-policy.mjs`
- `extensions/fleet-model-policy/extension.mjs`
- `extensions/plan-review-orchestrator/extension.mjs`
- `extensions/plan-review-orchestrator/lib/reviewer-dispatch.mjs`
- `extensions/plan-review-orchestrator/lib/reviewer-roles.mjs`
- `extensions/plan-review-orchestrator/tests/run-all.mjs`
- `extensions/plan-review-orchestrator/tests/integration/both-extensions.test.mjs`
- `extensions/plan-review-orchestrator/tests/unit/context-policy.test.mjs`
- `extensions/plan-review-orchestrator/tests/unit/reviewer-dispatch.test.mjs`
- `extensions/plan-review-orchestrator/tests/unit/sdk-dispatch-contract.test.mjs`
- `extensions/plan-review-orchestrator/tests/fixtures/sdk-dispatch-contract.json`

## Validation Commands

Run in `extensions/plan-review-orchestrator/`:

```bash
node tests/run-all.mjs
node tests/integration/both-extensions.test.mjs
```

Expected coverage from the current suite:

- shared nested metadata handling;
- stable role-id matching and role-specific context;
- SDK passive-contract guardrails;
- orchestrator state transitions;
- additive coexistence with `plan-review-policy`.

## Reader-Tested Clarifications Applied

The docs were updated to answer these likely reconciliation questions directly:

1. Does the orchestrator launch reviewers? → **No. Passive only.**
2. Are reviewer ids model names? → **No. Stable ids are `jason` / `freddy`.**
3. Where does reviewer matching look? → **Top-level plus nested `input.subagent.*`.**
4. What happens if `onSubagentEnd` exposes no text? → **Reviewer stays pending; no synthetic rejection/timeout is inferred from missing text alone.**
5. Does revision handling auto-send a new reviewer/planner turn? → **No. It writes revision context to the ephemeral session log and advances internal round state only.**

## Reconciliation Note

When diffing this lane back into the main checkout, preserve the passive SDK contract language. If any other branch still claims auto-launch, response-text certainty, or model-name reviewer ids as the stable interface, this lane should win.
