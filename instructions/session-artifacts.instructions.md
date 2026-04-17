---
applyTo: "session-state/**/*.md"
---

Keep session-state artifacts concise, structured, and easy to hand off.

Prefer the `v1` templates under `skills/workflow-contracts/assets/` when a plan, review, or execution artifact needs durable structure.

For plan or handoff artifacts:

- include concrete tasks, dependencies, validation, and rollout notes
- keep files in scope, verification commands, and artifact outputs explicit
- make worktree boundaries explicit when parallelization is real

For research, review, or execution artifacts that feed implementation:

- separate findings from interpretation or recommendation when both are present
- make status, blockers, and next action explicit
- avoid free-form shape changes when an approved `v1` contract already fits

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [ACTIONS] When planning merge resolution and the user says `origin/develop` reflects the intended end state after a partial revert, treat `origin/develop` as authoritative for those reverted areas instead of preserving the branch's newer-looking tooling changes - this session showed the npm/esbuild migration was incomplete, non-working, and meant to be removed
2. [ACTIONS] Never capture a one-off repo-state clarification as a durable learned rule unless it reflects a reusable preference or general practice - the `origin/develop` vs branch tooling correction in `aws-pme` was specific to this repo at this moment, so the prior rule was too broad
3. [ACTIONS] Treat rule 1 as superseded historical context rather than an active reusable instruction; one-off repo-state clarifications belong in the task context unless they generalize beyond the immediate repository state
