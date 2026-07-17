---
name: golang-context
description: "Use when threading Go context cancellation, deadlines, or request-scoped values through a call chain; not for unrelated concurrency bugs."
metadata:
  category: go
  audience: general-coding-agent
  maturity: draft
  kind: reference
---

# Go Context Usage

Use this skill when you are threading context cancellation, deadlines, or request-scoped values through Go code.

## Use this skill when

- The API or call chain depends on context propagation.
- You need guidance on cancellation, deadlines, or request-scoped values.
- The work touches HTTP handlers, background jobs, or other long-lived operations.

## Do not use this skill when

- You are debugging a different concurrency issue that does not involve context.
- The problem is general runtime behavior or performance.
- A broader concurrency or troubleshooting skill is a better first stop.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Thread cancellation, deadlines, or request metadata through Go APIs. | Yes | - |
| Coordinate goroutines, channels, locks, or worker pools. | No | [`golang-concurrency`](../golang-concurrency/SKILL.md) |
| Diagnose a concrete crash, hang, or unexpected runtime behavior. | No | [`golang-troubleshooting`](../golang-troubleshooting/SKILL.md) |

## Guardrails

- Preserve context ownership: the creator of a cancellable context remains responsible for calling its cancel function unless ownership is explicitly transferred.
- Keep request-scoped values small, typed, and limited to cross-cutting metadata.
- Do not turn context into an optional parameter bag or store it in long-lived structs.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-context/SKILL.md`.
- Smoke test:
  - should trigger: "Thread Go context cancellation through this handler and service call chain."
  - should not trigger: "Fix a deadlock in this Go worker pool."

## Examples

- "Thread context cancellation through this Go handler and service."
- "Show me how to propagate request deadlines cleanly."
- "Review this Go API for context misuse."

## Reference files

- [`references/imported-guide.md`](./references/imported-guide.md) - comprehensive context patterns and best-practice lookup
- [`references/cancellation.md`](./references/cancellation.md) - cancellation ownership and lifecycle patterns
- [`references/http-services.md`](./references/http-services.md) - HTTP and service propagation examples
- [`references/values-tracing.md`](./references/values-tracing.md) - typed values and tracing metadata
- [`evals/evals.json`](./evals/evals.json) - activation evaluation cases
