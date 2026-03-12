---
applyTo: "**/*.ts,**/*.tsx"
---

Use strict TypeScript.
Prefer existing shared types, helpers, and schemas before adding new ones.
Prefer existing project tooling; when choosing or extending TS linting or formatting, favor `oxlint` and `oxfmt` over `eslint`, `prettier`, or `biome` unless the repository already standardizes otherwise.
Do not introduce `any` outside test files; prefer `unknown` at boundaries and narrow with type guards.
Avoid unsafe type assertions, especially `as unknown as`; use a guard, parser, or shared helper instead.
Model distinct states with discriminated unions and use exhaustive checks for switches.
Validate untrusted inputs at runtime before treating them as typed values.
Handle `null` and `undefined` explicitly instead of relying on non-null assertions.
Keep exported APIs and shared utilities easy to consume with clear parameter and return types.
