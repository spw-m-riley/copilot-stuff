# Worktree Naming Convention

## Overview

This document defines the formal naming convention for Git worktrees in the Copilot CLI project. The scheme ensures worktrees are easily identified by purpose, helps manage parallel development, and simplifies cleanup and auditing.

**Guiding principle**: One worktree per agent lane, task branch, or temporary exploration. Worktrees are **never committed** to the repository (see [Rule 38](#rule-38-enforcement)).

---

## Naming Scheme

All worktrees live in `.worktrees/` and follow this structure:

### `.worktrees/agent/<AGENT_ID>` — Long-Running Agent Lanes

Used for agent-driven implementation work that may span multiple sessions and requires isolated parallel progress.

**Characteristics:**
- Persistent across sessions
- Tied to a specific agent or team working on a feature area
- Branch pattern: `agent/<AGENT_ID>`
- Typical lifecycle: days to weeks

**Examples:**
- `.worktrees/agent/ci-migration-orchestrator` (CircleCI→GitHub Actions migration)
- `.worktrees/agent/typescript-api-test-generator` (writing API tests)
- `.worktrees/agent/coherence-browser` (building memory browsing UI)

### `.worktrees/task/<TASK_ID>` — Feature/Fix Tasks

Used for bounded feature development or bug fixes that are expected to complete within a single session or a few sessions.

**Characteristics:**
- Scoped work with clear completion criteria
- Feature branches that will be reviewed and merged to main
- Branch pattern: `task/<TASK_ID>` (e.g., `task/fix-lore-backfill-ordering`)
- Typical lifecycle: hours to 1–2 days

**Examples:**
- `.worktrees/task/fix-lore-backfill-ordering` (fix a specific bug)
- `.worktrees/task/skills-ecosystem-documentation` (document skill authoring)
- `.worktrees/task/router-core-validation` (validate router improvements)

### `.worktrees/temp/<PURPOSE>` — Temporary Exploration

Used for quick, throwaway investigation or testing that may not result in commits or branches.

**Characteristics:**
- Ephemeral; expected to be removed after use
- No formal branch; local experiments only
- Branch pattern: often no branch, or `temp/<PURPOSE>`
- Typical lifecycle: minutes to a few hours
- **ID uniqueness:** Use semi-unique identifiers to prevent collision (e.g., `temp/debug-2025-04-21` instead of just `temp/debug`); this is especially important if multiple people run quick tests in parallel

**Examples:**
- `.worktrees/temp/quick-test` (fast reproduction of an issue)
- `.worktrees/temp/schema-spike` (try out a schema change locally)
- `.worktrees/temp/debug-session` (isolated debugging environment)
- `.worktrees/temp/debug-2025-04-21` (timestamp-based uniqueness for parallel testing)

---

## Rationale

### Why separate categories?

1. **Agent lanes** cluster related work (CLI improvements, documentation, feature stacks) and signal that progress is incremental and collaborative.
2. **Task worktrees** make it clear work is scoped and reviewable, preventing accidental scope creep.
3. **Temp worktrees** provide escape hatches for experimentation without polluting the agent/task namespaces.

### Why `.worktrees/` at all?

- Git worktrees are isolated checkouts that reduce friction when switching between parallel branches.
- Explicit `.worktrees/` root makes cleanup and auditing easier: `ls .worktrees/` gives a snapshot of active work.
- Keeps the main checkout clean (no stray branches, simpler `git branch` output).

---

## Transitioning from Old Naming

Current worktrees in this repository (54 active at baseline) use the flat pattern:

```
.worktrees/<ID>  →  branch: agent/<ID>
```

**Migration path** (not yet active; reserved for Phase 3b):
1. Keep flat-pattern worktrees active during transition period.
2. New worktrees use the three-category scheme.
3. **Gradual rename/archive:** Over the transition period, existing worktrees will be gradually renamed (`.worktrees/<ID>` → `.worktrees/agent/<ID>`) or archived as their branches merge or work concludes. This is **not an all-at-once migration**; the 54 existing worktrees remain stable while new work uses the structured naming.
4. Merging branches and retiring worktrees as planned continues to reduce the flat-pattern count over time.

Example: `.worktrees/add-style-retrieval` remains until the branch is merged; new agent work uses `.worktrees/agent/new-feature`. During Phase 3b, high-activity flat-pattern worktrees will be renamed to structured paths as a separate coordinated effort.

---

## Cleanup and Auditing

### When to Clean Up

A worktree should be removed when:

1. **After promotion into main** — The branch is merged or cherry-picked, and the work is done
2. **After completion or abandonment** — Exploration is finished or cancelled, no further changes needed
3. **No activity in 30+ days** — During monthly audits (see below), remove stale branches

### How to Clean Up

#### Step 1: Verify the worktree is clean

```bash
cd .worktrees/<CATEGORY>/<ID>
git status
```

**Clean-state definition:** A worktree is considered *clean* for promotion when:
- No uncommitted tracked or untracked changes exist in the working directory
- The branch is up-to-date with its base (no divergent commits)
- All changes have been committed to the branch (or stashed/discarded if not needed)

If you have changes:

- **Keep them:** Commit before cleanup (or stash and move to a different branch)
- **Discard them:** `git reset --hard HEAD`

#### Step 2: Remove the worktree

```bash
mr_worktree_remove <ID>
```

This command:
- Removes the worktree directory
- Optionally deletes the local branch (pass `--deleteBranch` if needed)

**Example:**

```bash
mr_worktree_remove coherence-doctor-wave4
```

#### Step 3: Clean up the branch on origin (if applicable)

If the branch was pushed and is no longer needed:

```bash
git push origin --delete agent/<AGENT_ID>
# or
git push origin --delete task/<TASK_ID>
```

### Monthly Audit Procedure

At the end of each month, check for orphaned or stale worktrees:

1. **List all worktrees and their branches:**

   ```bash
   git worktree list
   ```

2. **Check branch activity:**

   ```bash
   git for-each-ref --sort=-committerdate refs/heads/ | head -20
   ```

3. **Remove stale worktrees:**

   For any branch with no commits in 30+ days:

   ```bash
   mr_worktree_remove <ID>
   git push origin --delete <BRANCH_NAME>
   ```

4. **Verify cleanup:**

   ```bash
   git worktree list
   git branch -a | grep -E "agent/|task/|temp/"
   ```

### Signals for Cleanup

- No commits in 30 days (stale feature development)
- Branch already merged to main but worktree still exists
- Temp worktrees older than 1 day (forgot to remove it)
- Consensus that work is abandoned or deprioritized

---

## Rule 38 Enforcement: Never Commit `.worktrees/`

Per [Learned Rule 38](#rule-38-enforcement) in `copilot-instructions.md`:

> [GIT] Always ignore local `.worktrees/` directories and never commit them in repositories that use git worktrees.

### Why This Matters

- **Worktrees are local and ephemeral** — each developer's set of active lanes is unique
- **Committing worktree state would cause merge conflicts** across developers' machines
- **Worktree branches themselves are tracked** — only the `.worktrees/` directory is ignored
- **Clean `.gitignore` enforcement** keeps diffs focused on real code changes, not directory clutter

### Enforcement Mechanism

**`.gitignore` exclusion** — The repository root `.gitignore` contains:

```
.worktrees/
```

This ensures:
- Git will not stage files under `.worktrees/`
- CI/linting does not traverse `.worktrees/`
- Release/publish workflows exclude `.worktrees/` from artifacts

### How to Verify Enforcement

Before committing, verify `.worktrees/` is excluded:

```bash
# Check .gitignore includes .worktrees/
grep "\.worktrees/" .gitignore

# Verify git will not stage anything under .worktrees/
git status | grep -i worktree  # Should return nothing if working tree is clean

# Double-check by attempting to add .worktrees/ (should fail)
git add .worktrees/
# Expected: "The following pathspec didn't match any files"

# (Rule 38 verification) Confirm git will ignore .worktrees/ paths:
git check-ignore .worktrees/
# Expected: `.worktrees/` (prints the ignored path if enforcement is active)
```

### If `.worktrees/` is accidentally staged

```bash
git reset .worktrees/
git status  # Verify it is unstaged
```

---

## Examples by Lifecycle

### Example 1: Agent Lane (Multi-Week)

**Worktree:** `.worktrees/agent/lore-integration-verification`  
**Branch:** `agent/lore-integration-verification`  
**Start:** Monday 09:00 — agent begins integration testing  
**Activity:** Daily commits (3–5 per day)  
**Audit at week 4:** Branch shows recent activity → keep  
**Conclusion:** Merge to main after code review; worktree can be removed  

### Example 2: Task Worktree (1–2 Days)

**Worktree:** `.worktrees/task/fix-lore-backfill-ordering`  
**Branch:** `task/fix-lore-backfill-ordering`  
**Start:** Tuesday 14:00 — developer identifies ordering bug  
**Activity:** 3 commits in 4 hours  
**Completion:** PR merged Wednesday 10:00  
**Cleanup:** Remove worktree Wednesday 11:00 with `mr_worktree_remove fix-lore-backfill-ordering`  

### Example 3: Temp Worktree (1 Hour)

**Worktree:** `.worktrees/temp/debug-memory-leak`  
**Branch:** None (local changes only)  
**Start:** Friday 16:45 — reproduce memory leak in isolation  
**Activity:** Edit files, run profiler, confirm root cause  
**Completion:** Root cause identified 17:30  
**Cleanup:** Remove worktree with `git worktree remove .worktrees/temp/debug-memory-leak`  

---

## Status Summary

| Category | Current Count | Next Phase |
|----------|---------------|-----------|
| `agent/` | 54 (flat pattern) | Gradual rename or archive during Phase 3b |
| `task/` | 0 | Start with next feature |
| `temp/` | 0 | Use for quick experiments |
| **Total** | **54** | **TBD (declining during Phase 3b)** |

All current worktrees fit the **agent lane** profile and will remain on the flat pattern during Phase 3a. During Phase 3b, a gradual migration will begin: high-activity lanes will be renamed to `.worktrees/agent/<ID>`, while completed or low-activity lanes will be archived or removed as their work completes.

---

## Related Documentation

- **copilot-instructions.md** — See "Learned Rules" section, Rule 38: Git signing and worktree practices
  - Discusses when to use git worktrees for parallel work
  - Documents the `.worktrees/` naming baseline

- **Session Artifacts** — Use these commands to check active worktree state:
  - `mr_worktree_status` — Show status of all worktrees or a specific one
  - `mr_worktree_list` — List all active worktrees

- **MCP and Extension Tooling** — If adding new worktree management commands, document them in the relevant tool's README

---

## Quick Reference

| Action | Command |
|--------|---------|
| Create agent lane | `mr_worktree_create <AGENT_ID>` |
| Create task lane | `mr_worktree_create <TASK_ID>` |
| Create temp lane | `mr_worktree_create temp/<PURPOSE>` |
| Check worktree status | `mr_worktree_status` or `mr_worktree_status <ID>` |
| Remove worktree | `mr_worktree_remove <ID>` |
| List all worktrees | `git worktree list` |
| Verify .gitignore | `grep "\.worktrees/" .gitignore` |
| Monthly audit | `git for-each-ref --sort=-committerdate refs/heads/` |

---

**Last Updated:** 2025  
**Owner:** Copilot CLI Development
