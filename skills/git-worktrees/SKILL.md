---
name: git-worktrees
description: Use isolated git worktrees for parallel tasks, agents, and safer multi-branch development.
metadata:
  category: version-control
  audience: general-coding-agent
  maturity: stable
---

# Git worktrees

## Use this skill when

- You need isolated workspaces for parallel changes in the same repository.
- Multiple agents or contributors may work concurrently without branch-switch churn.
- You want safer experimentation while keeping your primary checkout stable.

## Do not use this skill when

- You only need a single quick edit on your current branch.
- The repository is not a Git worktree-compatible checkout.
- A disposable clone is explicitly preferred over sharing object storage with the main repository.

## Inputs to gather

**Required before editing**

- Base ref to branch from (for example `origin/main`).
- Task identifier suitable for branch and directory naming.
- Whether this worktree is temporary, long-lived, or tied to a PR/issue.

**Helpful if present**

- Existing branch naming conventions.
- Local cleanup policy for stale worktrees.

**Only investigate if encountered**

- Submodule, sparse checkout, or platform-specific filesystem constraints.

## First move

1. Check current worktrees and branch state (`git worktree list` and `git branch --all`).
2. Pick names using defaults from `assets/naming-examples.md`.
3. Create a fresh worktree from the target base ref before editing files.

## Workflow

1. Fetch and verify the intended base ref.
2. Create a dedicated branch and worktree for the task.
3. Perform all edits, tests, and commits inside that worktree.
4. Keep generated files scoped to the worktree.
5. Push branch and open or update PR as needed.
6. Clean up completed worktrees using `references/recovery-and-cleanup.md`.

## Guardrails

- **Must** use one active worktree per independent task to avoid accidental cross-task edits.
- **Must** verify the current directory and branch before applying changes.
- **Should** use consistent naming defaults, but adjust to repository conventions when needed.
- **Should** inspect for uncommitted changes before removing any worktree.
- **May** keep long-lived worktrees for release branches if the team workflow benefits.

## Validation

- Confirm `git worktree list` shows expected paths and branches.
- Confirm `git status` is clean in the worktree before removal.
- Run relevant repository checks from inside the worktree used for changes.
- Verify pushed branch matches the intended task before merge.

## Examples

- “Set up a separate worktree for this bug fix so it does not collide with release prep.”
- “Create one worktree per agent for parallel PR work, then clean up safely afterward.”
- “Recover a worktree that points to the wrong branch without losing local edits.”

## Reference files

- [Naming defaults and examples](assets/naming-examples.md)
- [Recovery and cleanup guide](references/recovery-and-cleanup.md)
