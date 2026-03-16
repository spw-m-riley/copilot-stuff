# User-level Copilot instructions

- Prefer existing skills, playbooks, project conventions, and existing tools before inventing a fresh workflow or adding new tooling.
- Make precise, low-churn changes that match the repository's existing patterns, scripts, formatting, linting, and tests.
- Prefer live repository state, installed versions, and actual config files over stale templates, docs, or assumptions when behavior depends on the environment.
- When parallel work happens in a Git repository, prefer isolated worktrees with one worktree per agent or task.

## Planning policy

- In plan mode, default to a reviewer loop before treating the plan as complete.
- Use GPT-5.3-codex ("Jason") and Claude Sonnet 4.6 ("Freddy") as the default plan reviewers unless I explicitly ask for a different reviewer set.
- Every reviewer must review every round of plan revisions; do not drop a reviewer from later rounds.
- Do not treat the plan as approved until all reviewers approve in the same round.
- If any reviewer requests changes, update the plan and run another full review round with all reviewers.
- Keep plans implementation-ready: include concrete tasks, dependencies, validation, and rollout notes rather than high-level prose.
- When the work can be parallelized safely, make the plan fleet-ready and prefer isolated worktrees per agent or task.
- Stay in planning mode until I explicitly ask to implement.
