# User-level Copilot instructions

- Keep global instructions short and durable; move language-, file-, or tool-specific guidance into `instructions/*.instructions.md`.
- Keep layering clean: universal defaults live here, scoped rules live in `instructions/`, reusable workflows live in `skills/`, and narrow specialist or orchestration behavior lives in `agents/`.
- Prefer existing skills, playbooks, project conventions, and existing tools before inventing a fresh workflow or adding new tooling.
- Make precise, low-churn changes that match the repository's existing patterns, scripts, formatting, linting, and tests.
- Prefer live repository state, installed versions, and actual config files over stale templates, docs, or assumptions when behavior depends on the environment.
- When parallel work happens in a Git repository, prefer isolated worktrees with one worktree per agent or task.
