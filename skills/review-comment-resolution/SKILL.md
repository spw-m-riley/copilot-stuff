---
name: review-comment-resolution
description: Use when a pull request has review comments or reviewer feedback that needs to be addressed — including deciding which comments are valid concerns before making changes, and pushing fixes through completed workflow checks.
metadata:
  category: code-review
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Review comment resolution

## Use this skill when

- The user asks you to address pull request review comments or reviewer feedback.
- Review comments exist as GitHub review threads, PR comments, copied text, or linked comment URLs.
- The task includes deciding which comments are valid concerns before making changes, or the user asks to "address" or "resolve" review comments without saying they must all be applied mechanically.
- The expected outcome is updated code plus a pushed commit whose workflows have finished.

## Do not use this skill when

- The task is only to summarize or classify review comments without making changes.
- The comments are actually bug reports, issue triage, or general design questions outside a concrete review surface.
- The main task is creating/updating a PR and watching checks before review starts; route to [`github-cli-pr-workflow`](../github-cli-pr-workflow/SKILL.md).
- The code changes are already handled and the remaining work is cross-cutting PR operations like metadata, thread cleanup, and merge-readiness; route to [`pr-operations-orchestrator`](../../agents/pr-operations-orchestrator.agent.md).
- The real blocker is a failing workflow or check; route that to [`github-actions-failure-triage`](../github-actions-failure-triage/SKILL.md) first.
- You cannot access the branch, PR, or review comment context needed to judge the concern.
- The user explicitly instructs you to apply every review comment exactly as written without assessment.

## Iron Law

> **Classify every comment before editing any file.**
>
> Inspect the actual code and context for each comment before accepting or rejecting the concern.
> Never apply review comments mechanically; never dismiss them without evidence.

## Inputs to gather

**Required before editing**

- The PR number, branch, or comment source to inspect.
- The unresolved or in-scope review comments to address.
- The repository's validation commands for the touched surface.
- Whether you can push to the current branch and whether workflows are expected to run on that push.

**Helpful if present**

- Review thread URLs or comment IDs.
- The base branch and head branch of the PR.
- Existing branch-protection or required-check expectations.
- Whether you should post follow-up replies for comments you decide not to fix.

## First move

**Announce at start:** "I'm using the review-comment-resolution skill to address these comments."

1. Fetch the in-scope review comments and map each one to its file, code context, and current relevance.
2. Classify each comment using the disposition guide before editing anything.
3. Start with the valid or partially valid comments that have the highest correctness or merge-blocking impact.

## Workflow

1. Inventory the review comments and group them by file, concern, or shared root cause.
2. For each comment, decide whether it is valid, partially valid, not valid, superseded, or not actionable yet.
3. Inspect the code and nearby tests before accepting or rejecting the concern.
4. Fix the accepted concerns in small coherent batches, preserving runtime behavior unless the comment is explicitly about behavior.
5. Re-run the relevant validation commands for the touched surface.
6. Prepare a concise rationale for comments you intentionally do not fix so the result can be explained clearly.
7. Commit only the intended changes with a focused message.
8. Push the branch, confirm the PR head SHA matches the pushed commit SHA, and monitor workflows or checks on that head commit until they reach a terminal state.
9. If workflows fail because of your changes, investigate and fix them before considering the task complete.
10. After workflows pass, fetch the current unresolved review threads on the PR. New threads may have been added since you started — treat them as a fresh classification cycle from step 2. The task is only complete when workflows are green **and** there are no new unresolved threads that require a response.

## Output for comments intentionally not fixed

When a comment is deliberately left unresolved, report it with a small, explicit summary instead of burying the decision in prose:

```md
- thread: <short label or comment id>
  disposition: not valid | superseded | not actionable yet
  reason: <one sentence rooted in code or workflow evidence>
  follow_up: <what would need to change for this to become actionable>
```

Do not leave an unresolved comment without a reason. If the concern is real but out of scope, say that directly.

## Outputs

- A comment disposition map for each in-scope thread: valid, partially valid, not valid, superseded, or not actionable yet.
- Focused fixes for accepted review comments, committed and pushed to the reviewed branch.
- Rationale entries for comments intentionally left unresolved using the documented output shape.
- Validation and workflow-check status for the new head commit, plus any remaining blocker.

## Guardrails

- **Must not** assume every review comment is correct without checking the actual code and context.
- **Must not** dismiss reviewer concerns casually; keep evidence for any comment you choose not to fix.
- **Must not** mix unrelated cleanup into the review-comment fix batch.
- **Must not** force-push, merge, or resolve/dismiss comments unless the surrounding workflow clearly calls for it.
- **Must not** rationalize away an unresolved comment by omitting it from the summary; every intentional non-fix needs a disposition.
- **Must not** declare the task complete after workflows pass without checking for new unresolved threads; reviewers may have added comments during or after the CI run.
- **Must not** claim a review fix is "pushed" until the PR head SHA reflects the expected commit SHA.
- **Should** prefer the smallest change that addresses the real concern rather than the literal wording of a comment if the wording is imprecise.
- **Should** keep accepted and rejected comment reasoning easy to summarize after the push.
- **Should** treat a user message of the form `#<N> has review comments` as an explicit re-entry signal: fetch the current unresolved threads on that PR and begin a fresh classification cycle, regardless of prior progress.

## Validation

- Run the repository's relevant validation commands before committing.
- Verify the staged diff only contains the intended review-comment fixes.
- Confirm the pushed branch matches the branch or PR under review.
- Confirm the PR head SHA equals the pushed commit SHA before evaluating whether comment state should have changed.
- Wait for workflows or checks on the new head commit to finish.
- If any workflow fails, inspect whether the failure was introduced by your changes and address it when it is in scope.

- Smoke test:
  - should trigger: "Address the open PR review comments, push fixes, and wait for checks."
  - should not trigger: "Create the PR and watch checks for this branch." (→ `github-cli-pr-workflow`)

## Examples

- "On PR #214, fix the review thread that shows the null-check bug, leave the style-only nit unresolved if it is not merge-blocking, push the branch, and wait for the rerun to finish."
- "Go through the reviewer feedback on this branch, classify each thread before editing, and report which comments were intentionally not fixed because they were outdated or not actionable."
- "Resolve the latest PR review comments on this branch and return the updated code plus the pushed commit SHA."
- See [`references/comment-disposition.md`](references/comment-disposition.md) for the disposition categories and unresolved-comment summary shape.

## Reference files

- [`references/comment-disposition.md`](references/comment-disposition.md) - how to classify review comments before fixing or rejecting them.
- [`references/push-and-workflow-wait.md`](references/push-and-workflow-wait.md) - how to commit, push, and wait for workflows or checks on the updated branch.
- [`references/review-resolution-scenarios.md`](references/review-resolution-scenarios.md) - compact routing and handoff scenarios for maintaining the review-resolution workflow.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| PR has review comments or feedback that needs classification and fixing | Yes | — |
| The next step is only PR creation, update, or watching checks before review starts | No | [`github-cli-pr-workflow`](../github-cli-pr-workflow/SKILL.md) |
| Code changes are done and the remaining work is GitHub-side PR coordination | No | [`pr-operations-orchestrator`](../../agents/pr-operations-orchestrator.agent.md) |
| A failing workflow is blocking the review cycle | No | [`github-actions-failure-triage`](../github-actions-failure-triage/SKILL.md) first |
| Working in an isolated worktree during the review cycle | Pairs | [`git-worktrees`](../git-worktrees/SKILL.md) |
| Review outcome needs a durable artifact for a downstream phase | Pairs | [`workflow-contracts`](../workflow-contracts/SKILL.md) |
