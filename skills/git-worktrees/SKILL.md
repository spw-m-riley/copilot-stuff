---
name: git-worktrees
description: "Use when you need isolated Git worktrees for parallel branches, agent lanes, or safer cleanup."
metadata:
  category: version-control
  audience: general-coding-agent
  maturity: stable
---

# Git worktrees

## Use this skill when

- You need a separate checkout for another branch, review lane, or agent task.
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
- Repo shape details such as monorepo package paths, submodules, sparse checkout, or nested worktrees.

**Only investigate if encountered**

- Detached HEADs or platform-specific filesystem constraints.

## First move

0. Check if Worktrunk is installed: `wt --version`. If available (exit code 0), prefer `wt` commands throughout this workflow — see [Worktrunk command equivalents](references/worktrunk-commands.md).
1. Check current worktrees and branch state (`git worktree list` and `git branch --all`).
2. Pick names using defaults from `assets/naming-examples.md`.
3. Create a fresh worktree from the target base ref before editing files.

## Workflow

### With Worktrunk installed (`wt --version` succeeds)

1. Fetch and verify the intended base ref.
2. Create worktree: `wt switch --create <branch> --base <ref>` — fires `post-start` hooks automatically (deps install, dev server, etc).
3. Perform all edits, tests, and commits inside that worktree.
4. Commit with LLM message (if configured): `wt step commit`.
5. Merge when ready: `wt merge [target]` — squashes, rebases, validates via pre-merge hooks, fast-forwards, and cleans up. Add `--no-squash` if `[commit.generation]` is not configured.
6. Or: push and open PR, then `wt remove` after the PR is merged.

See [Worktrunk command equivalents](references/worktrunk-commands.md) and the `worktrunk` skill for hooks, LLM commits, and parallel agent recipes.

### Without Worktrunk (raw git fallback)

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
- **Should** keep branch names and worktree paths aligned so the branch name still makes sense if the worktree path is copied or recreated later.
- **Should** verify the repository root before creating the worktree in monorepos or nested checkouts.
- **Should** inspect for uncommitted changes before removing any worktree.
- **May** keep long-lived worktrees for release branches if the team workflow benefits.
- **Should** use `wt switch --create` / `wt remove` instead of `git worktree add` / `git worktree remove` when Worktrunk is installed, so project hooks fire and worktree lifecycle is tracked.

## Validation

- Confirm `git worktree list` shows expected paths and branches.
- Confirm `git status` is clean in the worktree before removal.
- Run relevant repository checks from inside the worktree used for changes.
- Verify pushed branch matches the intended task before merge.

## Examples

- "Create `.worktrees/feature-auth-refactor` from `origin/main` for a migration lane, then keep the main checkout untouched until the branch is ready."
- "Create `.worktrees/issue-812-auth-timeout` from `origin/main` with branch `task/issue-812-auth-timeout`, then keep the edits inside that checkout."
- "Set up one worktree per agent for parallel PR work, then remove the clean worktree only after `git status` passes."
- "Recover a worktree that points at the wrong branch without losing local edits."

## Reference files

- [Naming conventions and scheme](references/naming-conventions.md)
- [Naming defaults and examples](assets/naming-examples.md)
- [Recovery and cleanup guide](references/recovery-and-cleanup.md)
- [Worktrunk command equivalents](references/worktrunk-commands.md)

## Integration

**Pairs with:**
- [`worktrunk`](../worktrunk/SKILL.md) — use `wt switch --create` / `wt merge` / `wt remove` instead of raw git commands when Worktrunk is installed; the `worktrunk` skill covers hooks, LLM commits, and merge pipeline
- [`review-comment-resolution`](../review-comment-resolution/SKILL.md) — after pushing a branch from a worktree, address PR review comments in the same worktree before cleanup
- [`github-actions-failure-triage`](../github-actions-failure-triage/SKILL.md) — if a pushed branch fails CI, diagnose the failure before removing the worktree
