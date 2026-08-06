# New-worktree bootstrap checklist

Use this checklist right after creating a worktree and before the first edit, install, or test run inside it — with or without Worktrunk. It covers state that Git itself does not isolate between worktrees, so a fresh worktree can look ready while it is actually missing, sharing, or silently reusing state from the primary checkout.

## Shared Git state vs. per-worktree state

A linked worktree shares the parent repository's object database, refs, and most repository-level config; only a small set of paths are per-worktree. Getting this backwards causes two common mistakes: assuming a per-worktree file (like `.git/hooks` overrides) is isolated when it is shared, or assuming shared state (like remotes) needs to be re-configured per worktree when it does not.

- **Shared across all worktrees:** the object store, refs (branches, tags), most of `.git/config`, `.git/hooks/`, remotes, and reflogs for shared refs.
- **Per-worktree:** `HEAD`, the index, sparse-checkout state, and any worktree-specific config set with `git config --worktree` (requires `extensions.worktreeConfig = true`).
- A branch can only be checked out in one worktree at a time — Git blocks a duplicate checkout rather than silently diverging state.

## `git-dir` / `common-dir` detection

Before writing anything into `.git/`-relative paths from a script or hook, confirm whether the current directory is the main working tree or a linked worktree, and which git-dir is per-worktree vs shared:

```bash
git rev-parse --git-dir          # this worktree's own git-dir (e.g. .git/worktrees/<name> when linked)
git rev-parse --git-common-dir   # the shared repository git-dir (e.g. the primary checkout's .git)
git rev-parse --is-inside-work-tree
```

- If `--git-dir` and `--git-common-dir` differ, the current directory is a linked worktree — anything you need shared across all worktrees (hooks, shared config) belongs under `--git-common-dir`, and anything that must stay worktree-local belongs under `--git-dir`.
- Do not hardcode `.git/hooks/...` in a script meant to run from any worktree; resolve `--git-common-dir` first.

## Env, secrets: copy, not symlink

- Copy `.env`, credential files, and other untracked secret material into the new worktree rather than symlinking them back to the primary checkout. A symlink means editing the file in one worktree — including an agent overwriting it during a dependency install or codegen step — mutates the same file the primary checkout and every other worktree rely on, and a leaked or corrupted secret in one lane becomes a leaked or corrupted secret everywhere.
- After copying, treat the copy as independent: rotating a credential or changing an endpoint in one worktree should not require or accidentally trigger the same change elsewhere.

## Independent dependencies

- Install language/package dependencies (`node_modules/`, virtualenvs, vendor directories, lockfile-driven caches) fresh per worktree rather than symlinking or pointing at the primary checkout's copy. Two worktrees on different branches can have different lockfiles or dependency versions; sharing the install directory silently mixes them.
- It is fine to reuse a shared package-manager *cache* (npm/pnpm store, pip cache, Go module cache) across worktrees for speed — that's a read-mostly download cache, not the installed dependency tree itself. Keep the distinction: share the cache, not the installed/linked output.
- See [`wt-parallel-agents-recipes.md`](wt-parallel-agents-recipes.md) for the Worktrunk `post-start` copy-then-install pattern that reuses cached packages without sharing the install directory.

## DB and service identity, and ports

- Give each worktree its own service identity — a distinct DB name/container, dev-server port, and any other locally-bound resource — instead of pointing multiple worktrees at one shared instance. Concurrent lanes on a shared DB or port will race, and a destructive migration or reset in one worktree can wipe state another worktree's tests depend on.
- See [`wt-parallel-agents-recipes.md`](wt-parallel-agents-recipes.md) for the deterministic per-branch port/DB-name pattern (`hash_port`, per-branch container names) when Worktrunk is installed. Without Worktrunk, derive an equivalent deterministic name/port from the branch or worktree path manually before starting any service.
- Confirm a `pre-remove`-style cleanup step (or a manual equivalent) actually stops the worktree's own service and only that service — see [Destructive-hook guardrails](../SKILL.md#destructive-hook-guardrails) before trusting a hashed or pattern-matched target.

## Generated files

- Treat build output, codegen artifacts, and framework caches (`dist/`, `.next/`, `target/`, generated API clients, etc.) as worktree-local and regenerate them in the new worktree rather than copying stale output from the primary checkout. Stale generated files can silently mask a build error or a real source change.
- If a generated-file copy is intentionally used to skip a slow first build, document that it is a cache warm-up, not a source of truth, and re-run the generator once real edits land.

## Hooks

- Read any `.config/wt.toml` project hooks (or repo-specific bootstrap scripts) before relying on them in a new worktree — hooks execute arbitrary shell with no sandboxing, and a `pre-*` hook can block or corrupt the very operation it gates. See [Destructive-hook guardrails](../SKILL.md#destructive-hook-guardrails) for the full policy.
- Confirm hooks that reference `{{ branch }}`, `{{ repo }}`, or hashed ports/names actually resolve to this worktree's own branch before trusting a `post-start` or `pre-remove` action against a shared resource.

## Primary-checkout integration-point policy

- Decide up front how this worktree's work re-enters the primary checkout: PR merge back into the shared default branch is the default-safe path. Do not push directly to a shared branch from a worktree lane, or fast-forward the primary checkout's branch from inside a different worktree, without the user's explicit sign-off.
- Keep the primary checkout stable and reviewable while lanes are active — treat it as the integration point, not another parallel lane to edit directly for the same task.

## Reference files

- [`../SKILL.md`](../SKILL.md) - parent skill activation, workflow, and guardrails this checklist supports
- [`wt-parallel-agents-recipes.md`](wt-parallel-agents-recipes.md) - dev-server/DB-per-worktree patterns and cold-start elimination this checklist points to
- [`recovery-and-cleanup.md`](recovery-and-cleanup.md) - what to do when a worktree's state turns out wrong after bootstrap
