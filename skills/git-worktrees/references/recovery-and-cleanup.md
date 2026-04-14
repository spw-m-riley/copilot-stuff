# Git worktrees recovery and cleanup

Use this reference when a worktree is stale, misconfigured, or ready to retire.

## Quick diagnostics

```bash
git worktree list --porcelain
git status
git branch --all
```

## Repo-shape caveats

- Use the top-level repository root when creating or repairing a worktree; nested package directories are not separate worktree roots.
- Submodules need their own Git operations inside the submodule checkout, not from the parent worktree.
- Sparse checkout can hide files that a recovery step expects, so verify visible paths before assuming data loss.

## Common recovery cases

### Worktree path was deleted manually

1. Remove stale registration:
   ```bash
   git worktree prune
   ```
2. Confirm list is clean:
   ```bash
   git worktree list
   ```

### Worktree exists but is on the wrong branch

1. Enter the worktree directory.
2. Check for uncommitted changes:
   ```bash
   git status
   ```
3. If clean, switch branch:
   ```bash
   git switch <expected-branch>
   ```
4. If not clean, commit or stash before switching.

### Branch already checked out in another worktree

Git blocks duplicate branch checkout across worktrees.

- Either create a new branch for this worktree:
  ```bash
  git switch -c <new-branch>
  ```
- Or use the existing worktree already attached to that branch.

### Failed removal due to uncommitted changes

1. Inspect pending changes:
   ```bash
   git status
   ```
2. Commit, stash, or intentionally discard changes.
3. Remove worktree:
   ```bash
   git worktree remove <path>
   ```

## Safe cleanup sequence

1. Verify branch has been pushed or merged if needed.
2. Ensure worktree is clean (`git status`).
3. Remove worktree path:
   ```bash
   git worktree remove <path>
   ```
4. Optionally delete merged branch:
   ```bash
   git branch -d <branch>
   ```
5. Prune stale metadata:
   ```bash
   git worktree prune
   ```
