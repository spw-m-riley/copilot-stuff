---
name: typescript-any-eliminator
description: Replace unsafe `any` with the narrowest truthful TypeScript type, reusing shared types and boundary guards.
metadata:
  category: typescript
  audience: general-coding-agent
  maturity: stable
---

# TypeScript any eliminator

## Use this skill when

- The user asks to remove, reduce, or replace `any` types in TypeScript code.
- You find explicit `any` in application code, shared helpers, DTOs, or API layers that should be narrowed safely.
- The task is to improve type safety without changing runtime behavior.

## Do not use this skill when

- The task is broad TypeScript type-system work that is not mainly about eliminating `any`.
- The `any` appears in generated code or third-party declarations that should not be hand-edited.
- The repository intentionally documents a permissive boundary and the task is not to tighten it.
- The work primarily requires behavior-changing refactors rather than truthful type replacement.

## Inputs to gather

**Required before editing**

- The targeted `any` sites and the surrounding API surface.
- The repository's typecheck command, such as `tsc --noEmit` or an equivalent project wrapper.
- Existing shared domain types, DTOs, schemas, validators, or helper types that may already model the value.
- Whether each boundary is trusted or untrusted.

**Helpful if present**

- Nearby tests or examples that show the intended shape.
- Whether the touched file is generated or backed by third-party typings.
- Existing lint rules or conventions around `unknown`, guards, and assertions.

## First move

1. Inventory the targeted `any` sites and read the adjacent types before editing.
2. Run the repository's typecheck command if available so you understand the current failure surface.
3. Start with the smallest self-contained `any` site and consult the reference files before inventing new patterns.

## Workflow

1. Trace inbound and outbound values so the replacement type matches real usage.
2. Reuse an existing domain type, DTO, schema, validator, or helper type before creating a new local type.
3. Choose the narrowest truthful replacement strategy:
   - an existing shared type
   - a generic with constraints
   - a discriminated union or other explicit union
   - `unknown` plus narrowing or validation at an untrusted boundary
4. If the honest boundary is still permissive, stop at `unknown` plus a guard instead of inventing a fake precise type.
5. Update adjacent call sites only when needed to keep the typed surface coherent.
6. Preserve runtime behavior while tightening the types.
7. Re-run the typecheck and targeted tests after the change.

## Guardrails

- **Must not** replace `any` with an equally vague type unless that is the honest boundary.
- **Must not** use unsafe casts such as `as unknown as` to silence the compiler.
- **Must not** move `any` elsewhere to make the local error disappear.
- **Should** prefer `unknown` only at untrusted boundaries, then narrow with guards or validators.
- **Should** keep edits small and local unless a larger refactor is required to keep types coherent.
- **May** leave a documented or generated `any` boundary in place when editing it would be unsafe or out of scope.

## Validation

- Re-run the repository's typecheck command after the edit.
- Run targeted tests or the nearest equivalent validation command for the touched surface when available.
- Confirm the final type is more precise than `any`, `object`, `Function`, or another unjustified widening.

## Examples

- `Before`
  ```ts
  export function read(input: any) {
    return input.user.id;
  }
  ```
  `After`
  ```ts
  export function read(input: unknown) {
    if (!isUser(input)) throw new Error("invalid user");
    return input.user.id;
  }
  ```
- `Before`
  ```ts
  type Payload = Record<string, any>;
  ```
  `After`
  ```ts
  type Payload = Record<string, unknown>;
  ```

## Reference files

- [`references/replacement-patterns.md`](references/replacement-patterns.md) - before/after replacement patterns, including generic keyed access and `unknown` plus type-guard examples.
- [`references/boundary-triage.md`](references/boundary-triage.md) - how to choose between existing types, unions, `unknown`, guards, and validators.
- [`references/unsafe-shortcuts-to-avoid.md`](references/unsafe-shortcuts-to-avoid.md) - anti-patterns that hide type problems instead of fixing them.
