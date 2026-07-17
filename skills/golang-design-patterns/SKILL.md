---
name: golang-design-patterns
description: "Use when choosing an idiomatic Go architecture or implementation pattern, including constructors, functional options, lifecycle, resilience, streaming, or graceful shutdown."
metadata:
  category: golang
  audience: developer
  maturity: stable
  kind: reference
---

# Go Design Patterns and Idioms

Use this skill when you need to choose between Go design patterns or establish an explicit lifecycle, resilience, or architecture boundary.

## Use this skill when

- You are designing constructors, functional options, initialization, cleanup, retries, limits, or graceful shutdown.
- You need to choose an architecture such as layered, hexagonal, clean, or domain-driven design.
- The request asks which idiomatic Go pattern best fits a concrete problem.

## Do not use this skill when

- A narrower error, context, concurrency, DI, or type-design skill directly owns the issue.
- The request is only about formatting, naming, or documentation.
- No real design choice exists and a direct implementation is clearer.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Choose a broad Go design or lifecycle pattern. | Yes | - |
| Design dependency construction and service wiring. | No | [`golang-dependency-injection`](../golang-dependency-injection/SKILL.md) |
| Design interfaces, receivers, or concrete type contracts. | No | [`golang-structs-interfaces`](../golang-structs-interfaces/SKILL.md) |
| Handle Go context propagation or cancellation. | No | [`golang-context`](../golang-context/SKILL.md) |

## Guardrails

- Use the smallest pattern that solves the demonstrated problem; avoid abstraction for its own sake.
- Preserve explicit ownership, bounded resources, cancellation, cleanup, and error flow.
- Reuse the repository's existing architecture unless the change has a concrete migration benefit.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-design-patterns/SKILL.md`.
- Smoke test:
  - should trigger: "Which Go constructor pattern fits this evolving configuration API?"
  - should not trigger: "Rename these exported Go identifiers idiomatically."

## Examples

- "Choose between functional options and a configuration struct."
- "Design graceful shutdown and resource cleanup for this service."
- "Review this package boundary for unnecessary architectural complexity."

## Reference files

- [`references/imported-guide.md`](./references/imported-guide.md) - comprehensive idiom and lifecycle guide
- [`references/architecture.md`](./references/architecture.md) - application architecture choices
- [`references/clean-architecture.md`](./references/clean-architecture.md) - clean architecture guidance
- [`references/data-handling.md`](./references/data-handling.md) - data and streaming patterns
- [`references/ddd.md`](./references/ddd.md) - domain-driven design guidance
- [`references/hexagonal-architecture.md`](./references/hexagonal-architecture.md) - ports and adapters guidance
- [`references/resource-management.md`](./references/resource-management.md) - lifecycle and cleanup patterns
- [`evals/evals.json`](./evals/evals.json) - behavioral evaluation cases
