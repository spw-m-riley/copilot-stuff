---
name: golang-dependency-injection
description: "Use when designing or refactoring Go dependency injection, constructors, lifecycles, composition roots, or DI libraries."
metadata:
  kind: reference
---

# Dependency Injection in Go

Use this skill when dependencies, service construction, lifecycle ownership, or application wiring are the primary design concern.

## Use this skill when

- You are introducing constructor injection or removing globals and service locators.
- You need to choose between manual wiring, Wire, Dig, Fx, or another DI approach.
- The work involves composition roots, singleton or transient lifecycles, factories, or dependency graph refactoring.

## Do not use this skill when

- The task only needs struct or interface design without application wiring.
- The problem is general architecture rather than dependency ownership.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Choose or refactor a Go dependency-injection approach. | Yes | - |
| Implement compile-time provider sets with Wire. | Yes | Use the linked Wire reference below. |
| Design the underlying interface contracts. | No | [`golang-structs-interfaces`](../golang-structs-interfaces/SKILL.md) |
| Choose a broader application architecture pattern. | No | [`golang-design-patterns`](../golang-design-patterns/SKILL.md) |

## Guardrails

- Keep the container at the composition root and never pass it through business logic as a service locator.
- Prefer explicit manual constructors until graph size or lifecycle needs justify a framework.
- Make ownership, cleanup order, and singleton or transient behavior explicit.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-dependency-injection/SKILL.md`.
- Smoke test:
  - should trigger: "Refactor these Go services from globals to constructor injection."
  - should not trigger: "Should this interface have one method or three?"

## Examples

- "Choose a DI approach for this Go service graph."
- "Move package-level clients into an explicit composition root."
- "Review this container setup for lifecycle and service-locator problems."

## Reference files

- [`references/imported-guide.md`](./references/imported-guide.md) - comprehensive DI patterns and library comparison
- [`references/google-wire.md`](./references/google-wire.md) - Wire provider and injector patterns
- [`references/google-wire-guide.md`](./references/google-wire-guide.md) - detailed Wire guide
- [`references/google-wire-advanced.md`](./references/google-wire-advanced.md) - advanced Wire patterns
- [`references/google-wire-recipes.md`](./references/google-wire-recipes.md) - end-to-end Wire recipes
- [`references/google-wire-testing.md`](./references/google-wire-testing.md) - Wire-specific testing patterns
- [`references/google-wire-evals.json`](./references/google-wire-evals.json) - Wire-specific evaluation cases
- [`references/manual-di.md`](./references/manual-di.md) - manual constructor injection examples
- [`references/samber-do.md`](./references/samber-do.md) - samber/do patterns
- [`references/uber-dig-fx.md`](./references/uber-dig-fx.md) - Dig and Fx patterns
- [`evals/evals.json`](./evals/evals.json) - behavioral evaluation cases
