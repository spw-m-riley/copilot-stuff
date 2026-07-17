---
name: golang-context
description: "Use when thread go context cancellation through this call chain; not when another Go skill is a better fit."
metadata:
  category: go
  audience: general-coding-agent
  maturity: draft
  kind: reference
---

# Imported Go Context Guide

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
| The request is specifically about go context usage. | Yes | - |
| The request is better served by an adjacent Go skill. | No | Route broader coordination issues to [`golang-concurrency`](../../golang-concurrency/SKILL.md) and debugging work to [`golang-troubleshooting`](../../golang-troubleshooting/SKILL.md). |

## Guardrails

- Keep the guidance focused on go context usage work.
- Prefer the narrower Go skill when the request clearly fits one.
- Do not turn this skill into a generic catch-all.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-context/SKILL.md`.
- Smoke test:
  - should trigger: "Thread Go context cancellation through this call chain."
  - should not trigger: "Write a new Go database transaction."

## Examples

- "Thread context cancellation through this Go handler and service."
- "Show me how to propagate request deadlines cleanly."
- "Review this Go API for context misuse."

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
| The request is specifically about go context usage. | Yes | - |
| The request is better served by an adjacent Go skill. | No | Route broader coordination issues to [`golang-concurrency`](../../golang-concurrency/SKILL.md) and debugging work to [`golang-troubleshooting`](../../golang-troubleshooting/SKILL.md). |

## Guardrails

- Keep the guidance focused on go context usage work.
- Prefer the narrower Go skill when the request clearly fits one.
- Do not turn this skill into a generic catch-all.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-context/SKILL.md`.
- Smoke test:
  - should trigger: "Thread Go context cancellation through this call chain."
  - should not trigger: "Write a new Go database transaction."

## Examples

- "Thread context cancellation through this Go handler and service."
- "Show me how to propagate request deadlines cleanly."
- "Review this Go API for context misuse."

## Reference files

- [`references/cancellation.md`](./cancellation.md)
- [`references/http-services.md`](./http-services.md)
- [`references/values-tracing.md`](./values-tracing.md)
- [`evals/evals.json`](../evals/evals.json)

## Imported content
> **Community default.** A company skill that explicitly supersedes `samber/cc-skills-golang@golang-context` skill takes precedence.

# Go context.Context Best Practices

`context.Context` is Go's mechanism for propagating cancellation signals, deadlines, and request-scoped values across API boundaries and between goroutines. Think of it as the "session" of a request — it ties together every operation that belongs to the same unit of work.

## Best Practices Summary

1. The same context MUST be propagated through the entire request lifecycle: HTTP handler → service → DB → external APIs
2. `ctx` MUST be the first parameter, named `ctx context.Context`
3. NEVER store context in a struct — pass explicitly through function parameters
4. NEVER pass `nil` context — use `context.TODO()` if unsure
5. `cancel()` MUST be called on all control-flow paths for `WithCancel`/`WithTimeout`/`WithDeadline`, unless ownership of the context and cancel function is explicitly returned or transferred
6. `context.Background()` MUST only be used at the top level (main, init, tests)
7. **Use `context.TODO()`** as a placeholder when you know a context is needed but don't have one yet
8. NEVER create a new `context.Background()` in the middle of a request path
9. Context value keys MUST be unexported types to prevent collisions
10. Context values MUST only carry request-scoped metadata — NEVER function parameters
11. **Use `context.WithoutCancel`** (Go 1.21+) when spawning background work that must outlive the parent request

## Creating Contexts

| Situation | Use |
| --- | --- |
| Entry point (main, init, test) | `context.Background()` |
| Function needs context but caller doesn't provide one yet | `context.TODO()` |
| Inside an HTTP handler | `r.Context()` |
| Need cancellation control | `context.WithCancel(parentCtx)` |
| Need a deadline/timeout | `context.WithTimeout(parentCtx, duration)` |

## Context Propagation: The Core Principle

The most important rule: **propagate the same context through the entire call chain**. When you propagate correctly, cancelling the parent context cancels all downstream work automatically.

```go
// ✗ Bad — creates a new context, breaking the chain
func (s *OrderService) Create(ctx context.Context, order Order) error {
    return s.db.ExecContext(context.Background(), "INSERT INTO orders ...", order.ID)
}

// ✓ Good — propagates the caller's context
func (s *OrderService) Create(ctx context.Context, order Order) error {
    return s.db.ExecContext(ctx, "INSERT INTO orders ...", order.ID)
}
```

## Deep Dives

- **[Cancellation, Timeouts & Deadlines](./cancellation.md)** — How cancellation propagates: `WithCancel` for manual cancellation, `WithTimeout` for automatic cancellation after a duration, `WithDeadline` for absolute time deadlines. Patterns for listening (`<-ctx.Done()`) in concurrent code, `AfterFunc` callbacks, and `WithoutCancel` for operations that must outlive their parent request (e.g., audit logs).

- **[Context Values & Cross-Service Tracing](./values-tracing.md)** — Safe context value patterns: unexported key types to prevent namespace collisions, when to use context values (request ID, user ID) vs function parameters. Trace context propagation: OpenTelemetry trace headers, correlation IDs for log aggregation, and marshaling/unmarshaling context across service boundaries.

- **[Context in HTTP Servers & Service Calls](./http-services.md)** — HTTP handler context: `r.Context()` for request-scoped cancellation, middleware integration, and propagating to services. HTTP client patterns: `NewRequestWithContext`, client timeouts, and retries with context awareness. Database operations: always use `*Context` variants (`QueryContext`, `ExecContext`) to respect deadlines.

## Cross-References

- → See the `samber/cc-skills-golang@golang-concurrency` skill for goroutine cancellation patterns using context
- → See the `samber/cc-skills-golang@golang-database` skill for context-aware database operations (QueryContext, ExecContext)
- → See the `samber/cc-skills-golang@golang-observability` skill for trace context propagation with OpenTelemetry
- → See the `samber/cc-skills-golang@golang-design-patterns` skill for timeout and resilience patterns

## Enforce with Linters

Many context pitfalls are caught automatically by linters: `govet`, `staticcheck`. → See the `samber/cc-skills-golang@golang-lint` skill for configuration and usage.
