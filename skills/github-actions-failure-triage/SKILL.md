---
name: github-actions-failure-triage
description: "Use when GitHub Actions fails and needs root-cause triage after workflow, action, runner, cache, matrix, or Node-runtime changes."
metadata:
  kind: task
---

# GitHub Actions failure triage

Use this skill when a repository already uses GitHub Actions and you need to diagnose a concrete failing run, job, or check before making the smallest safe fix.

## Use this skill when

- The user asks why a GitHub Actions run, job, or check is failing.
- A workflow started failing after a workflow edit, action version bump, runner change, cache change, matrix change, or reusable workflow change.
- A post-migration GitHub Actions regression needs diagnosis, but the repository is already on GitHub Actions.
- Deprecation warnings appear in CI run logs (e.g. "Node.js 20 is deprecated", warnings from `setup-node`, `configure-nodejs`, or similar actions) and a proactive version-pin or action update is needed to prevent future failures.
- The likely best outcome is a targeted fix, a precise explanation, or a clean escalation path rather than a broad CI redesign.

## Do not use this skill when

- The main task is CircleCI-to-GitHub-Actions migration planning, parity mapping, or CircleCI retirement.
- The main task is handling PR review comments, pushing a fix batch, or waiting for post-push checks.
- The main task is worktree or branch isolation for parallel work.
- The user is asking for greenfield CI design or a broad GitHub Actions redesign with no concrete failing run to anchor on.
- The workflow is not failing; the real task is to simplify dense inline Bash or condition logic for readability and maintainability.
- The primary action required is changing org-admin settings, runner fleet configuration, branch protection, or environment policy rather than diagnosing a repository-owned failure.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Failing GitHub Actions run, job, or check in a repo already on Actions | Yes | - |
| CircleCI migration planning, parity checks, or staged cutover | No | [`circleci-to-github-actions-migration`](../circleci-to-github-actions-migration/SKILL.md) |
| Broad multi-workflow or multi-environment CI migration orchestration | No | `ci-migration-orchestrator` |
| Workflow cleanup is about readability of inline Bash, shell branching, or sprawling conditions rather than a live failure | No | [`workflow-bash-refactor`](../../agents/workflow-bash-refactor.agent.md) |
| PR review-comment adjudication and fix batching | No | [`github-cli-pr-workflow`](../github-cli-pr-workflow/SKILL.md) |
| Worktree or isolated branch setup for parallel changes | No | [`git-worktrees`](../git-worktrees/SKILL.md) |
| Root cause found; local reproduction with `act` is feasible | Yes | [`references/local-repro-guide.md`](references/local-repro-guide.md) |
| Upgrade tool failure (`topgrade`, `uv`, Homebrew, Go toolchain) outside of a CI job | No | [`tooling-upgrade-triage`](../tooling-upgrade-triage/SKILL.md) |

## Inputs to gather

**Required before editing**

- A concrete failure anchor such as a run URL, run ID, job name, job ID, or failed check name.
- The exact failing attempt, head SHA, branch or ref, and triggering event.
- The failing step logs plus enough surrounding context to understand what ran before the failure.
- The workflow file at the failing commit, plus any called reusable workflow or referenced action version involved in the failing path.

**Helpful if present**

- Matrix values for the failing job.
- Runner details such as GitHub-hosted vs self-hosted and the effective labels or image.
- Artifact names, cache keys, and relevant job outputs.
- Whether the failure is new, flaky, branch-specific, or already failing on the base branch.

**Only investigate if encountered**

- Secret and variable names, scopes, and inheritance behavior.
- Concurrency groups, cancellation behavior, and `needs` ordering.
- Debug rerun settings or extra logging surfaces.

Do not collect secret values. Only confirm whether the expected names, scopes, and inheritance behavior are present.

## First move

1. Anchor the exact failing run, attempt, job, step, SHA, branch or ref, and event.
2. Read the failed-step logs and surrounding setup context before editing anything.
3. Map the failure to the exact workflow file, called reusable workflow, action version, or repository script that ran for that commit.
4. If local reproduction is feasible, use the focused `act` workflow in [`references/local-repro-guide.md`](references/local-repro-guide.md) after capturing the hosted evidence.

## Workflow

1. Gather the required evidence using the checklist in [`references/evidence-checklist.md`](references/evidence-checklist.md).
2. Classify the failure using [`references/failure-buckets.md`](references/failure-buckets.md) before proposing a fix.
3. Form the smallest root-cause hypothesis that explains the failing step.
4. Choose the next action: small workflow fix, repo code/config fix, targeted rerun/debug, explanation-only, or escalation.
5. Apply the smallest justified change only after the evidence supports it.
6. Validate as narrowly as possible:
   - relevant repository checks for the touched surface
   - workflow linting with `action-validator` (or the repo's established equivalent) when available
   - targeted rerun, check, or workflow verification where practical
7. Summarize the result using [`assets/triage-summary-template.md`](assets/triage-summary-template.md), including evidence, change made, validation, and any remaining blocker.
8. If the failure really belongs to migration design, review-comment handling, or admin-only settings, stop and hand off cleanly instead of stretching the skill.

## Outputs

- A triage summary using [`assets/triage-summary-template.md`](assets/triage-summary-template.md) with run, job, step, SHA, and evidence.
- A root-cause classification and decision to fix workflow, fix repository code/config, rerun, explain, escalate, or hand off.
- The smallest justified change when evidence supports editing.
- Validation evidence from local checks, workflow linting, reruns, or an explicit blocker.

## Guardrails

- **Must not** edit workflow files speculatively before reading the concrete failing evidence.
- **Must not** assume every failure is a YAML problem; the root cause may be a real project, test, deployment, or runtime bug.
- **Must not** collect, print, or store secret values.
- **Must not** absorb migration planning, PR review handling, or worktree setup into this skill.
- **Must not** rely on blind reruns as a substitute for diagnosis.
- **Must not** rerun a failure just to feel productive; a rerun only counts when it can change the evidence or verify a narrowly targeted fix.
- **Should** prefer the smallest change that explains the failure and preserves the surrounding workflow shape.
- **Should** distinguish flaky, pre-existing, and newly introduced failures before claiming a fix.
- **Should** escalate instead of guessing when the failure depends on org-admin controls, runner-fleet health, or broader CI redesign.

## Validation

- Run the repository's relevant validation commands for the touched surface.
- If workflow files changed, run workflow linting with `action-validator` (or the repo's established equivalent).
- Re-check the exact failing workflow, job, or check when practical instead of relying only on generic local validation.
- If the change touches artifact, cache, or output wiring, confirm both the producer and consumer paths before calling the fix complete.
- If the failure stayed ambiguous after reading the logs, prefer escalation or extra debug evidence over repeated reruns.
- If no change is made, provide a precise evidence-backed explanation of the root cause or blocker.
- Smoke test:
  - should trigger: "Diagnose why the deploy job started failing after a workflow edit."
  - should trigger: "Reproduce this failing Actions job locally with act after reading the hosted failure evidence."
  - should not trigger: "Add a new Go release workflow to a repository with no failing run." (→ `golang-continuous-integration`)

## Examples

- "The `deploy` job on PR #182 fails on `Upload artifact` with `Artifact not found`; trace that run, fix the upload path, and do not touch the rest of the workflow."
- "A workflow started failing after `actions/checkout` was bumped; confirm whether the failure is in the action input, the checkout depth, or the repo script before changing anything else."
- "Only the `ubuntu-latest / node-20` matrix leg fails at the test step; isolate the failing job and keep the fix limited to that branch of the matrix."
- "A reusable workflow call started failing after an input rename; verify the caller and callee contract before editing unrelated jobs."

## Reference files

- [`references/evidence-checklist.md`](references/evidence-checklist.md) - intake fields and evidence to gather before editing
- [`references/failure-buckets.md`](references/failure-buckets.md) - common failure categories, symptoms, and first checks
- [`references/debug-and-escalation.md`](references/debug-and-escalation.md) - when to rerun, enable extra debugging, or hand off
- [`references/triage-scenarios.md`](references/triage-scenarios.md) - compact scenario matrix for validation and fast bucket recognition
- [`assets/triage-summary-template.md`](assets/triage-summary-template.md) - concise format for reporting root cause, fix, validation, and blockers
- [`references/local-repro-guide.md`](references/local-repro-guide.md) - focused `act` reproduction workflow
- [`references/act-command-patterns.md`](references/act-command-patterns.md) - safe `act` command patterns
