---
name: golang-structs-interfaces
description: "Use when designing Go structs/interfaces, choosing receivers, embedding, tags, or consumer-owned contracts."
metadata:
  kind: reference
---

# Go Structs and Interfaces

Use this skill when Go type design is the central concern: structs, interfaces, embedding, receivers, assertions, field tags, or composition boundaries.

## Use this skill when

- You are defining or reviewing structs, interfaces, receiver methods, or embedding.
- You need to choose concrete versus interface boundaries or compose small interfaces.
- The work involves type assertions, type switches, field tags, zero values, or compile-time interface checks.

## Do not use this skill when

- The request is mainly about dependency wiring rather than type contracts.
- The issue is general naming, error handling, or data-structure performance.
- You need to diagnose a concrete compiler or runtime failure.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Design Go structs, interfaces, receivers, embedding, or tags. | Yes | - |
| Wire services and dependency lifecycles. | No | [`golang-dependency-injection`](../golang-dependency-injection/SKILL.md) |
| Choose naming conventions for Go types and interfaces. | No | [`golang-naming`](../golang-naming/SKILL.md) |
| Optimize slices, maps, buffers, or collection structures. | No | [`golang-data-structures`](../golang-data-structures/SKILL.md) |

## Guardrails

- Define interfaces at the consumer boundary and keep them as small as the real contract allows.
- Prefer concrete return types and avoid speculative interfaces without a demonstrated consumer need.
- Preserve useful zero values and choose pointer or value receivers consistently with mutation and method-set semantics.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-structs-interfaces/SKILL.md`.
- Smoke test:
  - should trigger: "Should this Go constructor return a struct or an interface?"
  - should not trigger: "Set up Wire providers for this Go application."

## Examples

- "Review these Go interfaces for unnecessary abstraction."
- "Choose pointer or value receivers for this type."
- "Design field tags and embedding for these API structs."

## Reference files

- [`references/imported-guide.md`](./references/imported-guide.md) - comprehensive struct and interface design guidance
- [`evals/evals.json`](./evals/evals.json) - behavioral evaluation cases
