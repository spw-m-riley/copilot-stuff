---
description: 'Guidance for TypeScript source files in this workspace'
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript guidance

## Guidance

- Prefer existing shared types, helpers, and schemas before adding new ones.
- Prefer existing project tooling; when choosing or extending TS linting or formatting, favor `oxlint` and `oxfmt` over `eslint`, `prettier`, or `biome` unless the repository already standardizes otherwise.
- Do not introduce `any` outside test files; prefer `unknown` at boundaries and narrow with type guards.
- Avoid unsafe type assertions, especially `as unknown as`; use a guard, parser, or shared helper instead.
- Model distinct states with discriminated unions and use exhaustive checks for switches.
- Validate untrusted inputs at runtime before treating them as typed values.
- Handle `null` and `undefined` explicitly instead of relying on non-null assertions.
- Run the repository's standard typecheck, test, and lint commands for the touched TypeScript surface.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->

1. [TYPESCRIPT] Prefer generic parameters like `<T extends RequiredShape>` over broad index signatures when widening function inputs for object literals - index signatures can reject existing DTO interfaces that do not declare arbitrary keys
