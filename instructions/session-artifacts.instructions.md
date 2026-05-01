---
description: 'Guidance for session-state markdown artifacts in this workspace'
applyTo: "session-state/**/*.md"
---

# Session artifact guidance

## Purpose and Scope

- Applies to `session-state/**/*.md` artifacts in this workspace.
- Use these rules for plans, research notes, reviews, and execution handoffs that need to stay concise, structured, and easy to resume.

## Core Guidance

- Keep session-state artifacts concise, structured, and easy to hand off.
- Prefer the `v1` templates under `skills/workflow-contracts/assets/` when a plan, review, or execution artifact needs durable structure.
- For plan or handoff artifacts:
  - include concrete tasks, dependencies, validation, and rollout notes
  - keep files in scope, verification commands, and artifact outputs explicit
  - make worktree boundaries explicit when parallelization is real
- For research, review, or execution artifacts that feed implementation:
  - separate findings from interpretation or recommendation when both are present
  - make status, blockers, and next action explicit
  - avoid free-form shape changes when an approved `v1` contract already fits

## Validation Expectations

- Validate against the chosen `v1` contract or the repository's existing artifact format before handoff.
- Confirm status, next action, files in scope, and verification commands are explicit enough that the next phase does not need to reconstruct context from chat history.

## Maintenance Notes

- Keep `## Learned Rules` as the final section in the file; do not add new sections after it.
- Append new learned rules without renumbering existing entries; numbering gaps can reflect archived or superseded rules.
- Use `[OTHER]` for learned rules here unless a narrower artifact-specific category is introduced later.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [OTHER] When writing verification commands in session-state plans or handoff artifacts, keep scratch paths inside the target repository rather than `/tmp` or other external locations so the documented workflow respects workspace file-operation constraints
