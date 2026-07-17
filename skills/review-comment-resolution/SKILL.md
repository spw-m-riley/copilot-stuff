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

1. Fetch the in-scope review comments and map each one to its file, code context, and current relevance.
2. Classify each comment using the disposition guide before editing anything.
3. Start with the valid or partially valid comments that have the highest correctness or merge-blocking impact.

## Workflow

1. Inventory comments by file/root cause.
2. Classify each comment (valid, partially valid, not valid, superseded, not actionable yet).
3. Verify each accepted concern against current code/tests before editing, using the shared review mechanics in [`../code-review/references/shared-review-operations.md`](../code-review/references/shared-review-operations.md).
4. Fix accepted concerns in small coherent batches.
5. Re-run relevant validation for touched scope.
6. Commit only intended fixes, then push.
7. Confirm PR head SHA matches pushed commit and wait for checks to finish.
8. Re-fetch unresolved threads after checks; if new ones appeared, repeat classification.

## Outputs

- A comment disposition map for each in-scope thread: valid, partially valid, not valid, superseded, or not actionable yet.
- Focused fixes for accepted review comments, committed and pushed to the reviewed branch.
- Short rationale entries for intentionally unresolved comments (see `references/comment-disposition.md`).
- Validation and workflow-check status for the new head commit, plus any remaining blocker.

## Guardrails

- Do not apply comments mechanically without classification.
- Do not dismiss concerns without code/workflow evidence.
- Do not mix unrelated cleanup into review-fix commits.
- Do not claim completion until checks are terminal and unresolved-thread state is rechecked.
- Do not claim a fix is pushed until PR head SHA matches expected commit SHA.

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

- [`../code-review/references/shared-review-operations.md`](../code-review/references/shared-review-operations.md) - shared scope-first, evidence-first, and guardrail rules used by both review workflows
- [`references/comment-disposition.md`](references/comment-disposition.md) - how to classify review comments before fixing or rejecting them.
- [`references/push-and-workflow-wait.md`](references/push-and-workflow-wait.md) - how to commit, push, and wait for workflows or checks on the updated branch.
- [`references/review-resolution-scenarios.md`](references/review-resolution-scenarios.md) - compact routing and handoff scenarios for maintaining the review-resolution workflow.
