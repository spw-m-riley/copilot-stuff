---
name: coverage-gap-triage
description: "Use when coverage reports or Fallow show untested files/exports and the user asks what to test next."
metadata:
  category: code-quality
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Coverage gap triage

## Use this skill when

- The user provides a coverage report from Jest, Vitest, c8, nyc, Go coverage, or a similar tool and asks where to start.
- Fallow health or another code-health report shows untested files or exports.
- Prompts include "we have 87 untested files — where do I start?", "find coverage quick wins", "what should I test next", or "plan the work" for coverage gaps.
- The desired output is a prioritized testing plan, not immediate test implementation.

## Do not use this skill when

- The user asks you to write tests now; route the selected work to `test-driven-development`.
- The main issue is a failing test or unclear runtime bug; route to `systematic-debugging` first.
- The request is general JS/TS health analysis without a coverage or untested-surface focus.
- Coverage data is unavailable and the user only wants a pre-edit file map.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Prioritize untested files or exports from coverage/Fallow output | Yes | - |
| Implement the chosen tests test-first | No | [`test-driven-development`](../test-driven-development/SKILL.md) |
| Run broad JS/TS code-health analysis with Fallow | No | [`fallow`](../fallow/SKILL.md) |
| Diagnose why existing tests fail | No | [`systematic-debugging`](../systematic-debugging/SKILL.md) |
| Map affected files before a feature edit | No | [`context-map`](../context-map/SKILL.md) |

## Inputs to gather

**Required before triage**

- The coverage or untested-surface report, including file paths and uncovered exports when available.
- The repository's public entry points, package exports, routes, handlers, or CLI commands.
- Existing test framework and nearby test patterns.
- The user's scope: quick wins, highest risk first, changed files only, or a full backlog.

**Helpful if present**

- Recent churn, bug history, ownership, or production-critical paths.
- Fallow health output for dead code, public surface, or dependency signals.
- Existing coverage thresholds or CI gates.

**Only investigate if encountered**

- Generated files, build output, fixtures, or vendored code that should be excluded.
- Files with low coverage but no meaningful behavior to test.
- Public exports that are only test helpers or internal compatibility shims.

## First move

1. Parse the report into candidate files or exports and exclude generated, vendored, fixture, and build artifacts.
2. Identify which candidates are public surface or high-risk behavior before ranking by raw coverage percentage.
3. Find one or two nearby tests that establish the repository's preferred test shape.

## Workflow

1. Normalize coverage inputs into rows by file/export with uncovered lines, functions, branches, or exports when available.
2. Assign risk from behavior criticality, external inputs, auth/data boundaries, churn, complexity, and prior bug signals.
3. Assign public-surface weight for exported APIs, routes, handlers, CLIs, packages, shared libraries, or documented behaviors.
4. Estimate test effort from dependency seams, existing fixtures, mocking burden, setup cost, and availability of similar tests.
5. Filter out false priorities: generated code, type-only files, inert constants, barrel files, fixtures, and dead code candidates.
6. Sort by risk × public-surface ÷ effort, while preserving obvious quick wins that reduce noisy gaps cheaply.
7. For each top candidate, sketch the first test: behavior name, setup, input, assertion, and likely test file location.
8. Route implementation of selected picks to `test-driven-development` so tests are written and watched fail before production changes.

## Outputs

- A prioritized triage table with columns: file/export, risk rationale, suggested test shape, and effort.
- A top 3–5 pick list with first-test sketches.
- Exclusions with rationale for files that should not be tested now.
- A recommended next step: which test to write first and which skill should execute it.

## Guardrails

- Do not rank by lowest coverage percentage alone; prioritize risk, public surface, and effort together.
- Do not recommend tests for generated, vendored, fixture, build, or dead-code surfaces without explaining why they matter.
- Do not write tests during triage unless the user explicitly changes the task to implementation.
- Ground suggested test shapes in existing repository patterns.
- Keep first-test sketches concrete enough for a TDD pass but short enough to remain a plan.
- Call out missing or stale coverage data instead of inventing exact percentages.

## Anti-patterns

- Treating a private low-risk utility as more urgent than an untested public route because its coverage is lower.
- Recommending snapshot tests as a default quick win without behavior rationale.
- Ignoring branch coverage or error paths on high-risk boundary code.
- Producing a long backlog without naming the first 3–5 tests to write.

## Validation

- Confirm every top pick has risk rationale, suggested test shape, and effort estimate.
- Confirm exclusions are explicit for generated, fixture, vendored, build, or no-behavior files.
- Confirm at least one existing test pattern informed the suggested test shape.
- Confirm the top recommendation names the first test to write and routes implementation to `test-driven-development`.
- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/coverage-gap-triage/SKILL.md` after changing this skill.
- Smoke test:
  - should trigger: "Fallow shows 87 untested files; where should we start testing?"
  - should not trigger: "Write the missing tests for this bug fix now." (→ `test-driven-development`)

## Examples

- "We have 87 untested files from c8; rank what to test next by risk and effort."
- "Fallow health shows untested exports in this package. Give me quick wins and the first-test sketches."
- "Coverage dropped after the refactor; triage the gaps and tell me the top five tests to write next."

## Reference files

- [`test-driven-development`](../test-driven-development/SKILL.md) - executor for selected test picks.
- [`fallow`](../fallow/SKILL.md) - one source of untested-file and untested-export signals.
