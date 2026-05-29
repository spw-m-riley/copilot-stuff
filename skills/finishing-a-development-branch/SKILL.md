---
name: finishing-a-development-branch
description: "Use when implementation is complete and you need to choose merge, PR, keep, or discard for the branch."
metadata:
  category: version-control
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Finishing a development branch

Use this skill after implementation work is complete and the branch needs a safe final disposition.

## Use this skill when

- Implementation work on a feature or fix is complete.
- Relevant local checks have passed or the only remaining decision is whether to discard failed work.
- You need to decide the final integration path: merge, PR, keep, or discard.
- A worktree or isolated branch exists and needs lifecycle resolution.
- The agent needs a structured, repeatable decision boundary before handing off.

## Do not use this skill when

- Implementation is incomplete or blocked.
- The task is mid-flight and still under active development.
- Tests are failing and the user has not indicated discard is on the table.
- The user has already decided the integration method; execute that path directly or route to the matching workflow.
- The main work is creating or updating a PR and watching checks; route to [`github-cli-pr-workflow`](../github-cli-pr-workflow/SKILL.md).

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Work is complete and branch fate is undecided | Yes | - |
| User wants raw worktree lifecycle commands | No | [`git-worktrees`](../git-worktrees/SKILL.md) |
| User wants Worktrunk merge or hook behavior | No | [`worktrunk`](../worktrunk/SKILL.md) |
| User already chose PR flow | No | [`github-cli-pr-workflow`](../github-cli-pr-workflow/SKILL.md) |
| Review comments arrived on an existing PR | No | [`review-comment-resolution`](../review-comment-resolution/SKILL.md) |

## Inputs to gather

- **Branch and base:** feature branch, target base branch, and whether the base is current.
- **Verification status:** relevant test, lint, build, or smoke-test results.
- **Worktree context:** isolated worktree path or main checkout.
- **Delivery preference:** repo convention for local merge vs. PR.
- **Review need:** whether humans or CI must review before merge.

## First move

1. Verify the branch and target base are what the user expects.
2. Verify the worktree is clean before integration actions.
3. Verify the relevant checks are green, or state clearly that only discard/keep remains safe.

## Workflow

1. Confirm the current branch, base branch, worktree path, and verification evidence.
2. If checks are failing and the user did not ask to discard, stop and report the blocker instead of presenting green-path options.
3. Present the four outcomes from [`references/integration-options.md`](references/integration-options.md): merge locally, push/create PR, keep as-is, or discard.
4. Execute only the selected outcome.
5. Validate the resulting branch, PR, merge, or cleanup state.
6. Report the final state with the relevant branch name, PR link, merge target, or preserved worktree path.

## Outputs

- A validated integration decision: merge locally, push and create PR, keep as-is, or discard.
- The resulting branch, PR, merge, or cleanup state with the relevant location or link.
- A check-result summary proving the chosen option was safe to execute, or a clear blocker if it was not.
- Any remaining handoff notes for preserved worktrees or follow-up review.

## Guardrails

- Do not present green-path integration options if checks are failing, blocked, or not run; report the blocker first.
- Do not mark work done until the selected outcome is executed and verified.
- Do not merge, push, or delete from a dirty worktree.
- Confirm the feature branch still exists and has the expected commits before starting.
- Pull or otherwise verify the base branch freshness before local merge.
- Confirm the branch is reachable from the remote before creating a PR.
- Require explicit typed confirmation for discard before deleting branches or worktrees.

## Validation

- Merge locally: base branch includes the work, checks pass on base, feature branch/worktree cleanup matches the selected flow.
- PR path: branch is pushed, PR exists against the right base, title/body are clear, and worktree remains available for review cycles.
- Keep as-is: branch and worktree locations are reported clearly, with no cleanup performed.
- Discard: user confirmed discard, branch/worktree are removed, and no residual files remain.
- Smoke test:
  - should trigger: "Tests pass; help me decide whether to merge, PR, keep, or discard this branch."
  - should not trigger: "Create a PR and watch checks for this ready branch." (-> `github-cli-pr-workflow`)

## Examples

- "All checks pass on `feature/auth-jwt`; help me decide whether to merge locally, create a PR, keep it, or discard it."
- "This worktree is complete but I am not sure whether to keep it open for review or merge it now."
- "The experiment failed and I want to discard the branch safely."

## Integration

- Called by multi-step implementation workflows after all tasks complete and before final handoff.
- Pairs with [`git-worktrees`](../git-worktrees/SKILL.md) for worktree cleanup via `mr_worktree_remove`.
- Pairs with [`worktrunk`](../worktrunk/SKILL.md) when `wt merge` is the preferred local merge path.
- Pairs with [`github-cli-pr-workflow`](../github-cli-pr-workflow/SKILL.md) for PR creation and check-watch handoff.
- Pairs with [`review-comment-resolution`](../review-comment-resolution/SKILL.md) after PR feedback arrives.

## Reference files

- [`references/integration-options.md`](references/integration-options.md) - detailed merge, PR, keep, and discard decision table
- [`git-worktrees`](../git-worktrees/SKILL.md) - worktree lifecycle management and cleanup via `mr_worktree_remove`
- [`worktrunk`](../worktrunk/SKILL.md) - `wt merge` for local integration when Worktrunk is installed
- [`review-comment-resolution`](../review-comment-resolution/SKILL.md) - handling review feedback cycles after PR creation
