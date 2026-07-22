---
name: golang-code-style
description: "Use when writing or reviewing Go code for clarity, control flow, declarations, line breaking, comments, or project style; not for naming or lint configuration."
metadata:
  kind: reference
---

# Go Code Style

Use this skill for judgment-heavy Go clarity and readability decisions that formatters and linters do not settle.

## Use this skill when

- You are reviewing Go control flow, declarations, line breaking, comments, or readability.
- The team needs consistent code-style conventions beyond `gofmt`.
- You need to simplify nesting, conditions, parameter lists, or composite literals.

## Do not use this skill when

- The request is specifically about naming, lint configuration, or doc comments.
- The issue is architectural or performance-related rather than stylistic clarity.
- A formatter or existing linter rule fully determines the answer.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Make Go code clearer where judgment is required. | Yes | - |
| Choose idiomatic names for Go identifiers. | No | [`golang-naming`](../golang-naming/SKILL.md) |
| Configure or resolve Go linter findings. | No | [`golang-lint`](../golang-lint/SKILL.md) |
| Write or review Go documentation comments. | No | [`golang-documentation`](../golang-documentation/SKILL.md) |

## Guardrails

- Prefer clear control flow and explicit intent over clever compression.
- Preserve behavior while simplifying; do not turn style review into architectural churn.
- Follow the repository's established conventions when they are coherent and mechanically enforced.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-code-style/SKILL.md`.
- Smoke test:
  - should trigger: "Review this Go function for nesting and readability."
  - should not trigger: "Configure golangci-lint for this repository."

## Examples

- "Simplify this deeply nested Go control flow."
- "Review these declarations and composite literals for clarity."
- "Help us define Go style guidance beyond gofmt."

## Reference files

- [`references/imported-guide.md`](./references/imported-guide.md) - comprehensive Go style guidance
- [`references/details.md`](./references/details.md) - detailed condition and formatting examples
- [`evals/evals.json`](./evals/evals.json) - behavioral evaluation cases
