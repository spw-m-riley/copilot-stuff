---
name: test-driven-development
description: "Use when implementing, fixing, or refactoring behavior with tests written before production code."
metadata:
  kind: task
---

# Test-Driven Development

Use this skill when implementing any feature, bugfix, or behavior change that should be proven by executable tests written before production code.

## Use this skill when

- Implementing a new feature where behavior must be specified clearly.
- Fixing a bug or regression and you need a test that reproduces it first.
- Refactoring behavior-sensitive code and you want a safety net before changes.
- Adding edge-case handling where failure modes should be locked in with tests.
- Locking down compile-time TypeScript contracts with test fixtures or inline assertions.

## Do not use this skill when

- The task is documentation-only or configuration-only with no executable logic.
- The request is exploratory research or one-off investigation without production code output.
- The request is to only rerun or report on existing test results (route to `verification-before-completion`).
- The repository explicitly prohibits automated tests (rare; confirm first).

## Routing boundary

| Scenario | Use TDD Skill | Route Away |
|---|---|---|
| New feature request | Yes — write desired behavior test first | N/A |
| Bug report | Yes — reproduce with a failing test first | `github-actions-failure-triage` if the issue is CI plumbing |
| Refactor request | Yes — pin behavior first, then refactor | N/A |
| Code review asks for behavior change | Yes | `github-cli-pr-workflow` for thread/process handling |
| Config/docs-only task | No | Handle directly without this skill |

## Inputs to gather

1. **What is the expected behavior?** (What should the code do?)
2. **What test framework is in use?** (Jest, Vitest, Go test, etc. — follow repo defaults)
3. **What scope is in-bounds?** (single function, module slice, endpoint, etc.)
4. **Which existing tests set conventions?** (fixtures, helpers, assertion style)
5. **What acceptance criteria must be proven?** (happy path, edge cases, error handling)

## First move

1. Write one minimal failing test for the highest-priority behavior.
2. Run it and confirm failure is for the expected reason (missing behavior, not syntax/import noise).
3. Only then write production code.

## Workflow

1. **RED**: add one failing test for one behavior.
2. **GREEN**: add minimal code to pass that test only.
3. **REFACTOR**: improve code with tests staying green.
4. Repeat per behavior until acceptance criteria are covered.

## Outputs

- A failing test that demonstrated missing behavior before code changes.
- Minimal production code that passes tests without unrelated behavior drift.
- Refactored, readable implementation with tests still green.
- Targeted test evidence covering requested behavior and key edge cases.

## Guardrails

- One behavior per red/green cycle.
- Confirm every new test fails before writing production code.
- Keep production changes minimal to satisfy current test only.
- Mock boundaries (I/O, network, DB), not core logic under test.
- Never leave refactor steps with failing tests.

## Validation

1. Run the targeted tests for changed behavior.
2. Run module/package tests if the repo convention expects it.
3. Confirm no skipped/pending tests in the changed scope.
4. Check that test names describe behavior, not implementation details.

Smoke tests:
- should trigger: "Fix this parser bug by writing a failing test first."
- should not trigger: "Rerun parser tests before we merge." (→ `verification-before-completion`)

## Examples

- "Add rate-limit handling: write failing test for 429 retry behavior first, then implement."
- "Reproduce this discount/tax bug with a failing test before touching production code."
- "Pin current serializer behavior with tests, then refactor the implementation safely."

See [`references/tdd-scenarios.md`](references/tdd-scenarios.md) for full walkthroughs and richer TypeScript examples.

## Reference files

- [`references/tdd-scenarios.md`](references/tdd-scenarios.md) - Detailed scenario walkthroughs with TypeScript examples.
- [`references/type-test-scenarios.md`](references/type-test-scenarios.md) - choosing the lightest durable compile-time type-test shape.
- [`references/assertion-patterns.md`](references/assertion-patterns.md) - positive and negative compile-time assertion patterns.
