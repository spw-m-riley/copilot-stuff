---
name: github-cli-pr-workflow
description: "Use when a completed branch needs PR creation/update, review resolution, checks, or merge/keep/discard decisions."
metadata:
  category: version-control
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# GitHub CLI PR workflow

Use this skill for the complete branch-to-PR lifecycle, from readiness checks through review feedback, check monitoring, and final branch disposition.

## Use this skill when

- The user asks to create or update a PR with `gh`.
- The user asks to watch checks for the latest pushed commit.
- A PR has review comments that need classification, fixes, a push, and completed checks.
- Implementation is complete and the user needs to choose merge locally, create a PR, keep the branch, or discard it.

## Do not use this skill when

- The task is a one-time code review without existing PR feedback; use [`code-review`](../code-review/SKILL.md).
- The primary blocker is a failing workflow or check; use [`github-actions-failure-triage`](../github-actions-failure-triage/SKILL.md).
- The task is only worktree setup or isolation, including Worktrunk (`wt`) configuration; use [`git-worktrees`](../git-worktrees/SKILL.md).
- The user asks for supervised multi-agent PR operations; use [`pr-operations-orchestrator`](../../agents/pr-operations-orchestrator.agent.md).

## Iron Laws

> **Always anchor PR status to the current pushed head SHA.**
>
> **Never apply review comments mechanically; classify each concern first.**

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Create or update a PR and monitor checks | Yes | - |
| Resolve existing review comments, push fixes, and wait for checks | Yes | - |
| Choose merge, PR, keep, or discard after implementation | Yes | - |
| Review a diff once without existing review threads | No | `code-review` |
| Diagnose a failing workflow or check | No | `github-actions-failure-triage` |
| Create an isolated worktree or configure Worktrunk | No | `git-worktrees` |
| Supervise cross-cutting PR operations across agents | No | `pr-operations-orchestrator` |

## Inputs to gather

**Required before editing or integration**

- Current branch, target base, worktree path, and clean/dirty state.
- Current head SHA and whether the branch is pushed.
- PR number or confirmation that no PR exists.
- In-scope review comments, if any.
- Relevant local checks and required remote checks.
- Whether the user wants merge locally, PR review, keep, or discard when branch fate is undecided.

**Helpful if present**

- Review thread URLs or comment IDs.
- Preferred PR title/body format and linked issues.
- Branch-protection or required-check expectations.
- Whether follow-up replies are needed for comments left unresolved.

## First move

1. Confirm branch, target base, worktree, and current head SHA.
2. Confirm whether the branch is pushed and whether a PR already exists.
3. Identify the active phase: PR creation/update, review resolution, check monitoring, or branch disposition.
4. Stop before destructive integration if the worktree is dirty, checks are failing, or actionable findings are unclassified.

## Workflow

### 1. Prepare and create or update the PR

1. Verify branch and remote context.
2. Push the intended branch when needed.
3. Create or update the PR with `gh`.
4. Record the PR number, URL, base branch, branch, and current head SHA.

### 2. Resolve review feedback

1. Fetch in-scope comments and map each to current code context.
2. Classify each comment as `valid`, `partially valid`, `not valid`, `superseded`, or `not actionable yet`.
3. Fix accepted concerns in small coherent batches.
4. Run relevant local validation.
5. Inspect the staged diff, commit only intended fixes, and push the intended branch.

### 3. Monitor checks

1. Confirm the PR head SHA equals the commit just pushed.
2. Watch checks for that exact SHA.
3. Distinguish pass, fail, blocked, running, and skipped states.
4. If a workflow fails, route root-cause diagnosis to `github-actions-failure-triage`.
5. Re-fetch unresolved review threads after checks finish.

### 4. Finish the branch

1. Verify the base is current and the worktree is clean.
2. If actionable findings remain, use [`references/residual-risk-gate.md`](references/residual-risk-gate.md) and make one explicit decision per finding.
3. Present the four outcomes from [`references/integration-options.md`](references/integration-options.md): merge locally, push/create PR, keep, or discard.
4. Require explicit typed confirmation before discard.
5. Execute only the selected outcome and validate the resulting branch, PR, merge, or cleanup state.

## Outputs

- PR number and URL, exact head SHA assessed, and base branch.
- Review disposition map and focused fixes for accepted comments.
- Check status for the current head SHA with any precise blocker.
- Final branch disposition and resulting cleanup or handoff state.
- Explicit residual-risk decisions for unresolved actionable findings.

## Guardrails

- Anchor every check-status claim to the current head SHA.
- Classify each review comment with evidence before applying or dismissing it.
- Keep review-fix commits limited to the intended change batch.
- Require a clean worktree before merge or deletion.
- Treat failing or blocked checks as a keep-or-discard decision until they reach a justified state.
- Complete review classification before merging or creating a PR.
- Require explicit typed confirmation before deleting branches or worktrees.
- Inspect the staged file list and diff before every scoped commit.
- Use the selected outcome and its validation as the completion gate.

## Validation

- PR targets the intended base and reports the current head SHA.
- Review comments have one disposition each, with accepted concerns fixed or explicitly recorded.
- Local validation passes for touched files before commit.
- Staged diff contains only the intended batch.
- Pushed branch head matches the expected commit and remote checks have reached terminal states.
- Merge, PR, keep, or discard outcome matches the user's explicit choice.
- Residual-risk decisions use the documented gate and `review-outcome-v1` when required.

- Smoke test:
  - should trigger: "Address the open PR review comments, push fixes, and wait for checks."
  - should trigger: "All checks pass; help me choose whether to merge, create a PR, keep, or discard this branch."
  - should not trigger: "Review this diff once for bugs and security issues." (→ `code-review`)

## Examples

- "Create a PR from this branch, watch checks for the latest SHA, and report the handoff."
- "Classify the review comments on PR #214, fix the valid concerns, push, and wait for checks."
- "The implementation is complete; help me decide whether to merge locally, create a PR, keep the worktree, or discard it safely."

## Reference files

- [`references/pr-lifecycle-commands.md`](references/pr-lifecycle-commands.md) - `gh` commands for branch, PR, and check-watch flows.
- [`references/routing-scenarios.md`](references/routing-scenarios.md) - lifecycle routing and escalation cues.
- [`references/comment-disposition.md`](references/comment-disposition.md) - review comment classification and unresolved summary shape.
- [`references/push-and-workflow-wait.md`](references/push-and-workflow-wait.md) - validation, commit, push, and workflow-wait sequence.
- [`references/review-resolution-scenarios.md`](references/review-resolution-scenarios.md) - review-resolution examples and maintenance cues.
- [`references/integration-options.md`](references/integration-options.md) - merge, PR, keep, and discard decision table.
- [`references/residual-risk-gate.md`](references/residual-risk-gate.md) - explicit gate for unresolved actionable findings.
