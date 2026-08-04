---
name: typescript-triage
description: "Start here when the TypeScript problem is unclear — routes to the right specialist skill by symptom."
metadata:
  category: typescript
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# TypeScript triage

Use this as the entry point when a TypeScript task does not clearly match one of the specialist skills.
Read the symptom table and route immediately — do not implement TypeScript fixes from within this skill.

## Use this skill when

- The TypeScript problem is described vaguely: "fix the TypeScript", "sort out the types", "our TypeScript is a mess".
- The request could map to compiler errors, config drift, unsafe `any`, schema boundaries, or test coverage gaps — and it is not yet clear which.
- You need a quick routing decision before picking a TypeScript specialist skill.

## Do not use this skill when

- The symptom already maps clearly to a specialist skill — go there directly.
- The task is not TypeScript (runtime-only JavaScript, bundler failure, non-TS schema work).

## Inputs to gather

- The user's description of the problem.
- Current `tsc` or typecheck output, if available.
- Whether the issue appeared after a specific change (refactor, config edit, dependency upgrade).

## First move

1. Run `tsc --noEmit` (or the repo's equivalent typecheck command) if compiler output is not already available.
2. Match the output or description to a row in the symptom routing table below.
3. Route to the specialist skill — do not begin fixing from here.

## Symptom routing table

| What you are seeing | Route to |
| --- | --- |
| Burst of `tsc` errors after a refactor, upgrade, or config change | [`tsc-error-triage`](../tsc-error-triage/SKILL.md) |
| Config cleanup, enabling stricter flags, resolving module-resolution drift | [`tsconfig-hardening`](../tsconfig-hardening/SKILL.md) |
| Multi-package workspace needs `composite` / `references` / `tsc -b` migration | [`project-references-migration`](../project-references-migration/SKILL.md) |
| Explicit `any` in application code, helpers, DTOs, or API layers | [`typescript-any-eliminator`](../typescript-any-eliminator/SKILL.md) |
| Untrusted input at an API, storage, or parsing boundary needs runtime validation + types | [`schema-boundary-typing`](../schema-boundary-typing/SKILL.md) |
| Lock down a type-inference contract or regression with compile-time tests | [`test-driven-development`](../test-driven-development/SKILL.md) |

## Common ambiguous prompts

- "Fix the TypeScript issues" → run typecheck; if errors exist route to `tsc-error-triage`, if config is suspect route to `tsconfig-hardening`
- "Sort out the any types" → `typescript-any-eliminator`; after `any` is removed, route untrusted-boundary gaps to `schema-boundary-typing`
- "Our types are a mess" → start with `tsconfig-hardening` for config; then `typescript-any-eliminator` for code
- "Add type safety to this API" → `schema-boundary-typing` first; `test-driven-development` after the boundary is stable

## Workflow

1. Identify which symptom row best matches the request.
2. Route to that specialist skill immediately.
3. If multiple symptoms are present, start with the earliest causal failure — typically config or a missing type export — before addressing downstream `any` or test coverage.

## Outputs

- A routing decision with the target specialist skill identified.
- The specific symptom or evidence that justified the route.

## Validation

- Confirm the routed specialist skill's trigger conditions match the actual symptoms before handing off.
- Re-route if the first specialist skill surfaces a different root cause (for example, `tsc-error-triage` discovers that config is actually the culprit → route back through `tsconfig-hardening`).
- Smoke test:
  - should trigger: "Fix the TypeScript — I'm not sure what's wrong."
  - should not trigger: "Run `tsc --noEmit` and fix the specific errors it reports." (→ `tsc-error-triage`)

## Examples

- "Our TypeScript is really messy after the last merge" → run typecheck; burst of errors → `tsc-error-triage`
- "Can you make this file not use any?" → `typescript-any-eliminator`
- "I want to add type safety to our request handlers" → `schema-boundary-typing`, then `test-driven-development`

## Reference files

- [`references/routing-map.md`](references/routing-map.md) - expanded decision tree with symptom examples, skill sequences, and handoff notes.
