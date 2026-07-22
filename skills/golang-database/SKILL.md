---
name: golang-database
description: "Use when writing or reviewing Go SQL, scanning, transactions, pools, or persistence tests; not for general debugging."
metadata:
  kind: reference
---

# Go Database Access

Use this skill when you are writing or reviewing Go database access, scanning, transactions, connection pools, or persistence tests.

## Use this skill when

- The code touches SQL queries, transactions, row scanning, or persistence tests.
- You need help with database performance or transaction boundaries.
- The request is about repository or persistence behavior in Go.

## Do not use this skill when

- The task is not database-related.
- You mainly need optimization advice at the measurement layer.
- The issue is a general application bug rather than persistence logic.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Write or review Go persistence and transaction code. | Yes | - |
| Measure or optimize a broader Go performance bottleneck. | No | [`golang-performance`](../golang-performance/SKILL.md) |
| Diagnose a general crash or unexpected application behavior. | No | [`golang-troubleshooting`](../golang-troubleshooting/SKILL.md) |

## Guardrails

- Preserve explicit SQL and parameterized query boundaries; never concatenate untrusted values into queries.
- Pass context to database operations and handle `sql.ErrNoRows` distinctly from operational failures.
- Make transaction ownership, commit, rollback, and row-closing behavior explicit on every control-flow path.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-database/SKILL.md`.
- Smoke test:
  - should trigger: "Review this Go row-scanning and transaction code."
  - should not trigger: "Profile this CPU-bound Go benchmark."

## Examples

- "Review this Go transaction boundary for correctness."
- "Help me scan these database rows safely in Go."
- "Add tests for this Go repository layer."

## Reference files

- [`references/imported-guide.md`](./references/imported-guide.md) - comprehensive Go database access guide
- [`references/performance.md`](./references/performance.md) - database-specific performance guidance
- [`references/scanning.md`](./references/scanning.md) - row scanning and nullable-value patterns
- [`references/testing.md`](./references/testing.md) - persistence testing patterns
- [`references/transactions.md`](./references/transactions.md) - transaction lifecycle patterns
- [`evals/evals.json`](./evals/evals.json) - activation evaluation cases
