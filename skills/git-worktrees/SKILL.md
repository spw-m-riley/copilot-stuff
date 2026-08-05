---
name: git-worktrees
description: "Use when you need isolated Git worktrees for parallel branches, agent lanes, or safer cleanup, including configuring Worktrunk (wt) hooks, LLM commits, or parallel-agent lanes when it is installed."
metadata:
  category: version-control
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Git worktrees

This is the single user-facing worktree skill: raw `git worktree` workflows and Worktrunk (`wt`) configuration both live here. Worktrunk is a wrapper around the same worktree lifecycle — prefer it when installed, but the skill still works with plain `git worktree` when it is not.

## Use this skill when

- You need a separate checkout for another branch, review lane, or agent task.
- Multiple agents or contributors may work concurrently without branch-switch churn.
- You want safer experimentation while keeping your primary checkout stable.
- `wt` is installed and you need to configure hooks, LLM commit generation, merge behavior, or parallel agent lanes.

## Do not use this skill when

- You only need a single quick edit on your current branch.
- The repository is not a Git worktree-compatible checkout.
- A disposable clone is explicitly preferred over sharing object storage with the main repository.
- The task is only PR lifecycle work (create/update PR and watch checks) on an already prepared branch; route to [`github-cli-pr-workflow`](../github-cli-pr-workflow/SKILL.md).

## Inputs to gather

**Required before editing**

- Base ref to branch from (for example `origin/main`).
- Task identifier suitable for branch and directory naming.
- Whether this worktree is temporary, long-lived, or tied to a PR/issue.

**Helpful if present**

- Existing branch naming conventions.
- Local cleanup policy for stale worktrees.
- Repo shape details such as monorepo package paths, submodules, sparse checkout, or nested worktrees.
- Whether `~/.config/worktrunk/config.toml` or `.config/wt.toml` already exist, and whether hooks, LLM commit generation, or parallel-agent lanes are in scope.

**Only investigate if encountered**

- Detached HEADs or platform-specific filesystem constraints.

## First move

0. Check if Worktrunk is installed: `wt --version`. If available (exit code 0), prefer `wt` commands throughout this workflow — see [Worktrunk command equivalents](references/worktrunk-commands.md).
1. Check current worktrees and branch state (`git worktree list` and `git branch --all`).
2. Pick names using defaults from `assets/naming-examples.md`.
3. Create a fresh worktree from the target base ref before editing files.
4. If the task is Worktrunk configuration itself (hooks, LLM commits, merge defaults, parallel agents), run `wt config show` first to inspect what is already loaded before changing anything.

## Workflow

### With Worktrunk installed (`wt --version` succeeds)

1. Fetch and verify the intended base ref.
2. Create worktree: `wt switch --create <branch> --base <ref>` — fires `post-start` hooks automatically (deps install, dev server, etc).
3. Perform all edits, tests, and commits inside that worktree.
4. Commit with LLM message (if configured): `wt step commit`.
5. Merge when ready: `wt merge [target]` — squashes, rebases, validates via pre-merge hooks, fast-forwards, and cleans up. Add `--no-squash` if `[commit.generation]` is not configured (see [Merge guardrails](#merge-guardrails)).
6. Or: push and open PR, then `wt remove` after the PR is merged.

### Without Worktrunk (raw git fallback)

1. Fetch and verify the intended base ref.
2. Create a dedicated branch and worktree for the task.
3. Perform all edits, tests, and commits inside that worktree.
4. Keep generated files scoped to the worktree.
5. Push branch and open or update PR as needed.
6. Clean up completed worktrees using `references/recovery-and-cleanup.md`.

### Configuring Worktrunk (hooks, LLM commits, merge pipeline, parallel agents)

1. **Configure worktree path** — set `worktree-path` in user config (inside-repo `.worktrees/` is recommended for agent harness worktree-manager compatibility). See [`references/wt-config-reference.md`](references/wt-config-reference.md).
2. **Set up LLM commits** — add `[commit.generation]`; see [`references/wt-llm-commits-setup.md`](references/wt-llm-commits-setup.md). Review [Destructive-hook guardrails](#destructive-hook-guardrails) before wiring any hook that runs an external command.
3. **Add project hooks** — author `.config/wt.toml` hooks for install, dev server, DB, CI gates; see [`references/wt-hooks-reference.md`](references/wt-hooks-reference.md).
4. **Understand the merge pipeline** — see [`references/wt-merge-pipeline.md`](references/wt-merge-pipeline.md) and [Merge guardrails](#merge-guardrails) before relying on `wt merge` defaults.
5. **Run parallel agents** (optional) — use `wt switch --create --execute=<agent>`; see [`references/wt-parallel-agents-recipes.md`](references/wt-parallel-agents-recipes.md) and [Agent-execution guardrails](#agent-execution-guardrails) first.

## Outputs

- A dedicated worktree and branch rooted at the intended base ref, or a verified cleanup of a completed worktree.
- Worktree-scoped commits, tests, and status evidence for the task lane.
- A merge, PR, or cleanup handoff naming the branch, path, and next owner action.
- A recovery note when stale, dirty, or orphaned worktrees cannot be removed safely.
- A loaded and reviewed Worktrunk config (hooks, commit generation, merge defaults, or parallel-agent lane) when the task is `wt` configuration.

## Guardrails

- **Must** use one active worktree per independent task to avoid accidental cross-task edits.
- **Must** verify the current directory and branch before applying changes.
- **Must** account for the uncommitted tracked and untracked baseline when continuing existing work in a fresh worktree — a new worktree starts from `HEAD` only and can silently omit local state the task actually needs.
- **Must** never report a task done while the assigned worktree has uncommitted changes — validate, commit the finalized slice, confirm `git status` is clean, then update status.
- **Must** check nested git repositories separately from the parent worktree — the parent's status can look clean while a nested repo still has uncommitted changes.
- **Should** use consistent naming defaults, but adjust to repository conventions when needed.
- **Should** keep branch names and worktree paths aligned so the branch name still makes sense if the worktree path is copied or recreated later.
- **Should** verify the repository root before creating the worktree in monorepos or nested checkouts.
- **Should** inspect for uncommitted changes before removing any worktree.
- **Should** confirm a dependent/follow-on worktree's branch already contains the prerequisite commit(s) before treating that lane as active, rather than assuming it's caught up.
- **Should** ignore pre-existing out-of-scope changes already in the worktree unless they interfere with the requested slice, but still surface a focused file-level diff for the actual requested slice so it isn't lost amid the noise.
- **Should** stop at the current safe point — no further edits, no status changes — when another lane is already active for the same slice, or the slice is already being promoted/merged, unless validated evidence says otherwise.
- **May** keep long-lived worktrees for release branches if the team workflow benefits.
- **Should** use `wt switch --create` / `wt remove` instead of `git worktree add` / `git worktree remove` when Worktrunk is installed, so project hooks fire and worktree lifecycle is tracked.

### Dirty-worktree guardrails

- **Must** run `git status` (and check nested repos separately) before `wt remove`, `wt merge`, or `git worktree remove` — dirty worktrees must be committed, stashed, or explicitly abandoned with the user's sign-off first, never silently discarded.
- **Must not** pass `--force` to `git worktree remove` (or rely on `wt remove` bypassing its safety check) as a default move when a worktree looks stale; confirm there is genuinely nothing worth keeping.
- **Should** treat "worktree has uncommitted changes and the task is being marked done" as a stop condition, not a detail to note in passing.

### Destructive-hook guardrails

- **Must** read any `pre-*`/`post-*` hook body before it runs for the first time in a new repo — hooks execute arbitrary shell commands (`sh -c`) with no sandboxing, and `pre-*` hooks can block or corrupt the operation they gate.
- **Must** treat `pre-remove` hooks that kill processes or containers (see [`references/wt-parallel-agents-recipes.md`](references/wt-parallel-agents-recipes.md)) as destructive by default — verify the target port/container is actually scoped to the worktree being removed before the hook runs, especially when ports or container names are hashed from branch names.
- **Must not** add a hook that deletes files, databases, or containers outside the worktree's own scope (for example, a shared dev database) without an explicit, named exception from the user.
- **Should** prefer background (`post-*`) hooks for notifications and non-blocking side effects, and reserve blocking (`pre-*`) hooks for validation gates (lint, test, install) rather than destructive cleanup.

### Merge guardrails

- **Must not** run `wt merge` (default squash mode) in a repo where `[commit.generation]` is not configured — the squash step will hang waiting on stdin. Use `wt merge --no-squash` or configure `[commit.generation]` first; see [`references/wt-merge-pipeline.md`](references/wt-merge-pipeline.md).
- **Must** let `[[pre-merge]]` hooks (tests, lint, typecheck) run and pass before treating a merge as safe; do not bypass them with `--yes` or by skipping the pipeline unless the user explicitly waives that gate.
- **Must** confirm the target branch and the worktree's branch are what the user intends before merging — `wt merge [target]` defaults to the repository's default branch when `[target]` is omitted.
- **Should** prefer `wt merge` over manual squash/rebase/merge/remove sequences once hooks are configured, since it enforces the same gate every time; fall back to the raw-git fallback steps only when `wt` is unavailable.

### Agent-execution guardrails

- **Must** isolate each parallel agent lane in its own worktree (`wt switch --create --execute=<agent>`) so concurrent agents cannot race on the same files or branch.
- **Must not** let an agent-executed lane merge or remove its own worktree unattended unless the user explicitly authorized autonomous merge; review the lane's diff and status (`wt list`) before promoting it.
- **Must** review project hooks (`post-start`, `pre-merge`, `pre-remove`) for destructive behavior before launching an agent lane that will trigger them automatically — an unattended agent will not notice a misconfigured hook the way an interactive user would.
- **Should** use per-branch state (`wt config state vars`) and activity markers to track which lanes are agent-owned versus human-owned, so cleanup and merge decisions do not cross lanes.

## Validation

- Confirm `git worktree list` shows expected paths and branches.
- Confirm `git status` is clean in the worktree before removal.
- Run relevant repository checks from inside the worktree used for changes.
- Verify pushed branch matches the intended task before merge.
- For Worktrunk configuration changes: `wt config show` confirms settings loaded; `wt switch --create test-wt-check` creates a worktree and fires hooks; `wt list` confirms status; `wt remove test-wt-check` cleans up.

- Smoke test:
  - should trigger: "Create a parallel worktree for a refactor without touching my main checkout."
  - should trigger: "Configure wt hooks and parallel lanes for this repo."
  - should not trigger: "Create a raw git clone for a one-off, disposable experiment with no shared object storage." (→ plain `git clone`)

## Examples

- "Create `.worktrees/feature-auth-refactor` from `origin/main` for a migration lane, then keep the main checkout untouched until the branch is ready."
- "Create `.worktrees/issue-812-auth-timeout` from `origin/main` with branch `task/issue-812-auth-timeout`, then keep the edits inside that checkout."
- "Set up one worktree per agent for parallel PR work, then remove the clean worktree only after `git status` passes."
- "Recover a worktree that points at the wrong branch without losing local edits."
- "Set up LLM commit messages for this repo and add a post-start hook that runs `npm ci`."
- "Configure parallel agent lanes with unique ports per worktree using `wt switch --create --execute=`."

## Reference files

- [Naming conventions and scheme](references/naming-conventions.md)
- [Naming defaults and examples](assets/naming-examples.md)
- [Recovery and cleanup guide](references/recovery-and-cleanup.md)
- [Worktrunk command equivalents](references/worktrunk-commands.md)
- [`references/wt-config-reference.md`](references/wt-config-reference.md) — complete Worktrunk config key reference with defaults
- [`references/wt-hooks-reference.md`](references/wt-hooks-reference.md) — all hook types, template variables, filters, pipeline syntax
- [`references/wt-merge-pipeline.md`](references/wt-merge-pipeline.md) — `wt merge` pipeline, flags, and `wt step` sub-commands
- [`references/wt-llm-commits-setup.md`](references/wt-llm-commits-setup.md) — LLM commit generation config for Claude Code, Codex, llm CLI, aichat, Ollama
- [`references/wt-parallel-agents-recipes.md`](references/wt-parallel-agents-recipes.md) — one-shot alias pattern, dev server per worktree, DB per worktree, cold-start elimination

## Integration

**Pairs with:**
- [`github-cli-pr-workflow`](../github-cli-pr-workflow/SKILL.md) — after pushing a branch from a worktree, use this to create/update the PR, resolve review comments, watch checks, and decide how to integrate (merge, keep, or discard).
- [`github-actions-failure-triage`](../github-actions-failure-triage/SKILL.md) — if a pushed branch fails CI, diagnose the failure before removing the worktree.
