# Git worktrees

Use this skill when you need isolated workspaces for parallel changes, especially when multiple agents or workstreams may edit the same repository.

## Goals

- Keep concurrent work from colliding in one working tree.
- Give each agent or task its own branch and filesystem path.
- Make cleanup and review predictable.

## Recommended layout

- Worktree path: `.worktrees/<agent-id>`
- Branch name: `agent/<agent-id>`

Choose a stable, filesystem-safe `<agent-id>` such as `pr-812-fix-auth` or `gha-cache-cleanup`.

## Workflow

1. Start from a clean, up-to-date base branch.
2. Create a dedicated branch for the task.
3. Create a worktree under `.worktrees/<agent-id>`.
4. Perform all edits, tests, and commits inside that worktree.
5. Remove the worktree when the task is done and the tree is clean.

## Bash example

```bash
git fetch origin
git worktree add .worktrees/pr-812-fix-auth -b agent/pr-812-fix-auth origin/main
cd .worktrees/pr-812-fix-auth
```

## PowerShell example

```powershell
git fetch origin
git worktree add .worktrees/pr-812-fix-auth -b agent/pr-812-fix-auth origin/main
Set-Location .worktrees/pr-812-fix-auth
```

## Safety guidance

- Do not share one worktree between multiple agents.
- Keep agent-specific temporary files inside the worktree, not the repo root.
- Before removing a worktree, ensure there are no uncommitted changes you still need.
- Prefer one worktree per task, even for small fixes, when parallel edits are happening.
