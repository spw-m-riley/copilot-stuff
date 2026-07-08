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
- **Residual findings:** whether unresolved actionable review, code-review, or known-risk findings still remain.

## First move

1. Verify the branch and target base are what the user expects.
2. Verify the worktree is clean before integration actions.
3. Verify the relevant checks are green, or state clearly that only discard/keep remains safe.
4. Verify whether any unresolved actionable findings still require a residual-risk decision.

## Workflow

1. Confirm branch, base, worktree path, and verification evidence.
2. If checks are failing and discard is not requested, stop and report blocker.
3. If unresolved actionable findings remain, run [`references/residual-risk-gate.md`](references/residual-risk-gate.md) and record one explicit decision per finding.
4. If any finding lands on `stop`, halt and report blocker.
5. Present four outcomes from [`references/integration-options.md`](references/integration-options.md): merge locally, push/create PR, keep, or discard.
6. Execute only the selected outcome.
7. Validate resulting branch/PR/merge/cleanup state.
8. Report final state and any residual-risk record/tracker.

## Outputs

- A validated integration decision: merge locally, push and create PR, keep as-is, or discard.
- The resulting branch, PR, merge, or cleanup state with the relevant location or link.
- A check-result summary proving the chosen option was safe to execute, or a clear blocker if it was not.
- An explicit residual-risk disposition for any unresolved actionable finding, including tracker or durable-record location when one was required.
- Any remaining handoff notes for preserved worktrees or follow-up review.

## Guardrails

- Do not present green-path integration options if checks are failing, blocked, or not run; report the blocker first.
- Do not proceed to merge or PR while unresolved actionable findings remain without an explicit residual-risk decision for each one.
- Do not mark work done until the selected outcome is executed and verified.
- Do not merge, push, or delete from a dirty worktree.
- Confirm the feature branch still exists and has the expected commits before starting.
- Pull or otherwise verify the base branch freshness before local merge.
- Confirm the branch is reachable from the remote before creating a PR.
- Require explicit typed confirmation for discard before deleting branches or worktrees.
- Keep the residual-risk gate manual and explicit; do not imply hook automation or policy enforcement that this skill does not provide.
- When shipping with `accept with durable record`, reuse [`review-outcome-v1`](../workflow-contracts/assets/review-outcome-v1.md) instead of inventing a new artifact shape.

## Validation

- Merge locally: base branch includes the work, checks pass on base, feature branch/worktree cleanup matches the selected flow.
- PR path: branch is pushed, PR exists against the right base, title/body are clear, and worktree remains available for review cycles.
- Keep as-is: branch and worktree locations are reported clearly, with no cleanup performed.
- Discard: user confirmed discard, branch/worktree are removed, and no residual files remain.
- Residual-risk gate: every unresolved actionable finding has exactly one explicit decision; any `accept with durable record` path points at a valid [`review-outcome-v1`](../workflow-contracts/assets/review-outcome-v1.md) artifact; any `defer to tracker` path names the tracker destination.
- Smoke test:
  - should trigger: "Tests pass, but I still have one known reviewer concern; help me decide whether to fix it, defer it, accept it with a durable record, or stop before we choose merge vs PR."
  - should not trigger: "Create a PR and watch checks for this ready branch." (-> `github-cli-pr-workflow`)

## Examples

- "All checks pass on `feature/auth-jwt`; help me decide whether to merge locally, create a PR, keep it, or discard it."
- "This worktree is complete but I am not sure whether to keep it open for review or merge it now."
- "The experiment failed and I want to discard the branch safely."

## Integration

- Pairs with [`git-worktrees`](../git-worktrees/SKILL.md) for worktree cleanup via `mr_worktree_remove`.
- Pairs with [`worktrunk`](../worktrunk/SKILL.md) when `wt merge` is the preferred local merge path.
- Pairs with [`github-cli-pr-workflow`](../github-cli-pr-workflow/SKILL.md) for PR creation and check-watch handoff.
- Pairs with [`review-comment-resolution`](../review-comment-resolution/SKILL.md) after PR feedback arrives.

## Reference files

- [`references/integration-options.md`](references/integration-options.md) - detailed merge, PR, keep, and discard decision table
- [`references/residual-risk-gate.md`](references/residual-risk-gate.md) - manual gate for unresolved actionable findings before branch disposition
- [`git-worktrees`](../git-worktrees/SKILL.md) - worktree lifecycle management and cleanup via `mr_worktree_remove`
- [`worktrunk`](../worktrunk/SKILL.md) - `wt merge` for local integration when Worktrunk is installed
- [`review-comment-resolution`](../review-comment-resolution/SKILL.md) - handling review feedback cycles after PR creation
- [`workflow-contracts`](../workflow-contracts/SKILL.md) - durable artifact guidance when residual-risk acceptance needs a `review-outcome-v1` record
