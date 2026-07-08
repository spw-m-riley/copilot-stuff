---
name: verification-before-completion
description: "Use when about to claim work is complete, tests pass, a bug is fixed, or a build succeeds."
metadata:
  category: testing
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Verification Before Completion

Use this skill before making any completion, pass/fail, readiness, or "fixed" claim.

## Use this skill when

- You are about to claim a test suite passes, a specific test passes, or a test fails.
- You are about to claim a build, lint check, formatting check, script, or agent operation succeeded.
- You are about to claim a bug is fixed, a regression is gone, or a feature works as intended.
- You are about to mark a task done, commit, push, create a PR, or report final progress.
- You have made code changes and are unsure whether they work.

## Do not use this skill when

- You are still gathering context, planning, or designing a feature.
- You are debugging a failure and tracing root cause; route to [`systematic-debugging`](../systematic-debugging/SKILL.md).
- You need to write tests before implementation; route to [`test-driven-development`](../test-driven-development/SKILL.md).
- You are asking the user which command should count as verification.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| "I think I fixed it" but no fresh proof command ran | Yes | - |
| "All tests pass" from an earlier run | Yes | - |
| "This PR is ready" without current checks | Yes | - |
| A test is failing and root cause is unknown | No | [`systematic-debugging`](../systematic-debugging/SKILL.md) |
| Behavior needs tests written before code changes | No | [`test-driven-development`](../test-driven-development/SKILL.md) |

## Inputs to gather

- **Claim:** the exact status you are about to state.
- **Proof command:** the command that proves or disproves the claim.
- **Success criteria:** exit code, pass count, output pattern, observable behavior, or artifact.
- **Scope:** all tests, targeted tests, changed files, integration suite, or smoke path.
- **Environment:** branch, working directory, and relevant runtime version when it affects the result.

## First move

1. State the exact claim in one sentence.
2. Pick the smallest proof command that can verify it.
3. Run that proof fresh before making the claim.

## Workflow

1. Pause before claiming success, readiness, pass/fail, or completion.
2. Run the fresh proof command described in [`references/verification-gate.md`](references/verification-gate.md).
3. Read exit code, stdout, stderr, pass/fail counts, warnings, and artifacts.
4. Compare the evidence against the exact claim.
5. If evidence fails or is ambiguous, report the actual status and route back to debugging or implementation.
6. If evidence passes, make only the claim the evidence supports.

## Outputs

- A verification record naming the claim, proof command, success signal, exit code, and relevant output evidence.
- A clear pass/fail decision that either supports the claim or states the actual status.
- A failure handoff with the observed blocker and next debugging step when verification does not pass.

## Guardrails

- Do not trust cached output, prior runs, assumptions, or code inspection alone.
- Run the command in the current state and working directory.
- Use the same command a user or CI would use unless you explicitly scope the claim narrower.
- Do not claim "all tests pass" after running only targeted tests.
- Do not hide warnings, skipped tests, flaky behavior, or partial validation.
- If output is ambiguous, say so instead of force-fitting it to the desired claim.

## Validation

- Confirm you ran the relevant command fresh.
- Confirm you read complete stdout, stderr, and exit status.
- Confirm the output matches or contradicts the exact claim.
- Confirm any narrower scope is stated clearly.
- Smoke test:
  - should trigger: "Before I say it's fixed, rerun the failing test and read the output."
  - should not trigger: "Find out why this failing test breaks only on CI." (-> `systematic-debugging`)

## Examples

- "I changed the parser; before saying the bug is fixed, run the reproduction test and compare the output."
- "Before opening the PR, run the repo's standard test and lint commands and only claim the checks that actually pass."
- "The build failed earlier; rebuild fresh before saying the compile error is gone."

## Reference files

- [`references/verification-gate.md`](references/verification-gate.md) - proof-command checklist, common false claims, and example verification records
- [`systematic-debugging`](../systematic-debugging/SKILL.md) - use when root-cause investigation is needed before verifying a fix
- [`test-driven-development`](../test-driven-development/SKILL.md) - use when writing tests to prove behavior before claiming correctness
