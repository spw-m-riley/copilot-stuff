# Shared review operations

This file captures the review mechanics used by both `code-review` and `review-comment-resolution` without merging their distinct outcomes.

## Scope first

- Classify the surface before making claims.
- Separate authored diff, supporting context, and pre-existing background.
- Keep findings or comment judgments tied to the smallest truthful scope.

## Evidence and validation

- Prefer concrete code, tests, build output, docs, or runtime evidence over speculation.
- Use the narrowest truthful evidence kind.
- Confirm the concern against current code or validation before reporting or fixing it.

## Common guardrails

- Do not report weak suspicion as a formal issue.
- Do not pad the result with style nits or unrelated debt.
- Do not claim completion until the relevant validation and workflow state has been checked.
- Do not mix unrelated cleanup into a review-fix batch.
