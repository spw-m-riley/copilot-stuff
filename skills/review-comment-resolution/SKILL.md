---
name: review-comment-resolution
description: Resolve pull request review comments by checking each concern, applying only valid fixes, and pushing the updated branch through workflow completion.
metadata:
  category: code-review
  audience: general-coding-agent
  maturity: stable
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

1. Inventory the review comments and group them by file, concern, or shared root cause.
2. For each comment, decide whether it is valid, partially valid, not valid, superseded, or not actionable yet.
3. Inspect the code and nearby tests before accepting or rejecting the concern.
4. Fix the accepted concerns in small coherent batches, preserving runtime behavior unless the comment is explicitly about behavior.
5. Re-run the relevant validation commands for the touched surface.
6. Prepare a concise rationale for comments you intentionally do not fix so the result can be explained clearly.
7. Commit only the intended changes with a focused message.
8. Push the branch and monitor workflows or checks on the new head commit until they reach a terminal state.
9. If workflows fail because of your changes, investigate and fix them before considering the task complete.

## Guardrails

- **Must not** assume every review comment is correct without checking the actual code and context.
- **Must not** dismiss reviewer concerns casually; keep evidence for any comment you choose not to fix.
- **Must not** mix unrelated cleanup into the review-comment fix batch.
- **Must not** force-push, merge, or resolve/dismiss comments unless the surrounding workflow clearly calls for it.
- **Should** prefer the smallest change that addresses the real concern rather than the literal wording of a comment if the wording is imprecise.
- **Should** keep accepted and rejected comment reasoning easy to summarize after the push.

## Validation

- Run the repository's relevant validation commands before committing.
- Verify the staged diff only contains the intended review-comment fixes.
- Confirm the pushed branch matches the branch or PR under review.
- Wait for workflows or checks on the new head commit to finish.
- If any workflow fails, inspect whether the failure was introduced by your changes and address it when it is in scope.

## Examples

- "On PR #214, fix the review thread that shows the null-check bug, leave the style-only nit unresolved if it is not merge-blocking, push the branch, and wait for the rerun to finish."
- "Go through the reviewer feedback on this branch, classify each thread before editing, and report which comments were intentionally not fixed because they were outdated or not actionable."
- "Resolve the latest PR review comments on this branch and return the updated code plus the pushed commit SHA."

## Reference files

- [`references/comment-disposition.md`](references/comment-disposition.md) - how to classify review comments before fixing or rejecting them.
- [`references/push-and-workflow-wait.md`](references/push-and-workflow-wait.md) - how to commit, push, and wait for workflows or checks on the updated branch.
