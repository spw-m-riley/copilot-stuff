---
name: golang-safety
description: "Use when preventing nil, bounds, slice, map, pointer, conversion, or resource-lifecycle mistakes in Go; not for adversarial security review."
metadata:
  category: go
  audience: general-coding-agent
  maturity: draft
  kind: reference
---

# Go Safety

Use this skill when you are preventing nil, slice, map, pointer, conversion, bounds, or resource-lifecycle mistakes in Go.

## Use this skill when

- The task is about preventing common Go correctness and safety footguns.
- You need to reason about nil, bounds, map, slice, pointer, conversion, or cleanup behavior.
- The request is safety-focused rather than debugging a specific crash.

## Do not use this skill when

- The issue is broader security hardening or a concrete runtime bug.
- You need design or architecture guidance instead.
- The code path is already clearly safe.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Prevent ordinary Go panics, leaks, aliasing, or silent conversion bugs. | Yes | - |
| Diagnose an observed crash or hang. | No | [`golang-troubleshooting`](../golang-troubleshooting/SKILL.md) |
| Review adversarial threats, secrets, crypto, or untrusted input. | No | [`golang-security`](../golang-security/SKILL.md) |

## Guardrails

- Prefer compile-time guarantees and explicit comma-ok checks over panic-prone assertions.
- Preserve useful zero values, explicit ownership, and defensive-copy boundaries.
- Treat resource cleanup and numeric conversion as correctness obligations, not optional polish.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-safety/SKILL.md`.
- Smoke test:
  - should trigger: "Review this Go slice and pointer code for nil, bounds, and aliasing mistakes."
  - should not trigger: "Audit this Go HTTP handler for injection vulnerabilities."

## Examples

- "Review this Go code for nil and bounds safety."
- "What safety pitfalls should I avoid in this slice logic?"
- "Help me make these map operations safe."

## Reference files

- [`references/imported-guide.md`](./references/imported-guide.md) - comprehensive defensive Go correctness guide
- [`references/nil-safety.md`](./references/nil-safety.md) - nil and interface safety patterns
- [`references/slice-map-safety.md`](./references/slice-map-safety.md) - slice and map ownership patterns
- [`evals/evals.json`](./evals/evals.json) - activation evaluation cases
