---
description: 'Guidance for code review, review agents, and promotion readiness'
applyTo: "**/*"
---

# Review guidance

## Purpose and Scope

- Applies to code reviews, pull-request review feedback, asynchronous reviewer results, and promotion decisions.
- Treat review conclusions as evidence about a specific commit, not as permanent approval for a moving branch.

## Core Guidance

- Before pushing or creating a pull request after asynchronous branch reviews, read every pending final-review result for the current `HEAD` or rerun the reviewers on the latest `HEAD`.
- If a final review reports `APPROVED` but its reasoning identifies a concrete plausible defect, inspect that code path and verify the behavior directly before closing the task.
- When GitHub's Copilot reviewer authors a thread and the requested fix has been pushed, resolve the thread unless Matt explicitly says to leave it open.
- Keep review findings focused on high-confidence defects, security issues, regressions, or actionable contract violations.

## Validation Expectations

- Tie each review result to the commit or diff it actually examined.
- Re-run the smallest relevant validation after addressing a finding, then reassess promotion readiness.
- Do not treat an earlier approval as current after the branch advances.

## Maintenance Notes

- Keep `## Learned Rules` as the final section in the file; do not add new sections after it.
- Append new learned rules without renumbering existing entries; numbering gaps can reflect archived or superseded entries.
- Use `[REVIEW]` for review-specific learned rules.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
56. [REVIEW] Before pushing or creating a PR after asynchronous branch reviews, always read every pending final-review result for the current HEAD or rerun the reviewers on the latest HEAD; earlier approvals are not enough once the branch advances.
58. [REVIEW] When a final review agent reports `APPROVED` but its own reasoning surfaces a concrete plausible defect, inspect the cited code path and verify behavior directly before closing the task.
92. [REVIEW] When a pull request review thread is authored by GitHub's Copilot reviewer and the requested fix has been pushed, resolve the thread unless Matt explicitly says to leave it open.
