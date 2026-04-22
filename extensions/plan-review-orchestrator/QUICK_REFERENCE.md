# Plan Review Orchestrator Quick Reference

## One-Line Summary

Passive `/plan` review coordination: track `jason` / `freddy`, inject role-aware context into runtime-launched matching reviewer children, and parse surfaced verdict text when available.

## Final Contract

- **Passive only** — no reviewer auto-launch path is proven here.
- **Stable reviewer ids** — `jason`, `freddy`.
- **Metadata inputs** — `agentName`, `agentDisplayName`, `agentDescription`, plus nested `input.subagent.agentName`, `input.subagent.agentDisplayName`, `input.subagent.agentDescription`.
- **Context injection** — only for runtime-launched matching reviewer children.
- **Completion parsing** — only from surfaced `input.response` / `input.output` text.
- **Missing completion text** — reviewer remains `pending`; no synthetic verdict is inferred.

## Stable Reviewer Roles

```javascript
DEFAULT_REVIEWER_ROLE_IDS; // ["jason", "freddy"]
```

Alias / hint mapping:

- `jason` → `gpt-5.3-codex`
- `freddy` → `claude-sonnet-4.6`

## Hook Summary

```text
onUserPromptSubmitted  -> initialize passive session state for /plan
onSubagentStart        -> match reviewer child + inject role context
onSubagentEnd          -> parse surfaced text if present; otherwise keep pending
onSessionEnd           -> clear session state
```

## Important Guardrails

Never reintroduce reviewer launch claims through:

- `additionalContext`
- `modifiedPrompt`
- `session.send(...)`
- `session.sendAndWait(...)`
- `session.rpc.agent.select(...)`

## Verdict Tokens

```text
[PLAN-APPROVED]
[PLAN-REVISE-NEEDED]
```

Rules:

- surfaced text with no token → rejected;
- both tokens → rejected as ambiguous;
- no surfaced text → pending.

## Minimal Flow

```text
/plan
  -> initialize reviewers: jason, freddy
runtime launches matching reviewer child
  -> inject role-specific context
child ends with surfaced verdict text
  -> parse token and record state
no surfaced text on child end
  -> log and leave pending (no synthetic rejection)
```

## Validation Commands

```bash
node tests/run-all.mjs
node tests/integration/both-extensions.test.mjs
```

## Files to Check During Review

- `extension.mjs`
- `lib/reviewer-dispatch.mjs`
- `lib/reviewer-roles.mjs`
- `tests/unit/context-policy.test.mjs`
- `tests/unit/sdk-dispatch-contract.test.mjs`
- `tests/integration/both-extensions.test.mjs`
