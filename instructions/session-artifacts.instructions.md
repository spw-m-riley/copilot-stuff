---
description: 'Guidance for session-state markdown artifacts in this workspace'
applyTo: "**/session-state/**/*.md"
---

# Session artifact guidance

## Guidance

- Keep session-state artifacts concise, structured, and easy to hand off.
- Prefer the `v1` templates under `skills/workflow-contracts/assets/` when a plan, review, or execution artifact needs durable structure.
- Include tasks, dependencies, validation, rollout notes, scoped files, outputs, and real worktree boundaries in plans or handoffs.
- Separate findings from interpretation, and make status, blockers, and next action explicit.
- Do not invent a free-form shape when an approved `v1` contract fits.
- Validate against the chosen `v1` contract or the repository's existing artifact format before handoff.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [WORKFLOW] When writing verification commands in session-state plans or handoff artifacts, keep scratch paths inside the target repository rather than `/tmp` or other external locations so the documented workflow respects workspace file-operation constraints
