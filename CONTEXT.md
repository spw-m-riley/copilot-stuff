# Context — `~/.copilot`

This is Matt's user-level Copilot CLI config repo. It is the **one special repo** where top-level `skills/`, `agents/`, and `instructions/` are canonical surfaces (in any other repo those belong under `.github/`).

## Domain vocabulary

| Term | Meaning |
| --- | --- |
| **Lore** | The active memory and continuity system. Backed by `lore.db` and the `extensions/lore` submodule. Always the primary memory interface. |
| **Coherence** | Legacy alias for the older memory system. Compatibility residue only — `docs/legacy/coherence.schema.json` is kept for migration context, not active config. |
| **`ma`** | Reduction-first file-reading toolset (`ma_smart_read`, `ma_skeleton`, `ma_compress`, …). Use before full-fidelity reads when the goal is understanding. |
| **RTK** | Token-saving CLI proxy (`rtk git status`, `rtk grep …`). The `rtk-hook` extension steers raw bash commands toward the `rtk …` equivalent. See [`docs/RTK.md`](./docs/RTK.md). |
| **Skill** | A self-contained `skills/<name>/SKILL.md` workflow with frontmatter, trigger conditions, and optional reference files. Validated by `skills/skill-authoring/scripts/validate-skill-library.mjs`. |
| **Agent** | A `agents/<name>.agent.md` specialist (manual-only) for orchestration-heavy work that doesn't fit a single skill. |
| **Extension** | A `extensions/<name>/` package that registers lifecycle hooks or new tools with Copilot CLI. Auto-discovered. |
| **Instruction file** | `copilot-instructions.md` (root, global) or `instructions/<type>.instructions.md` (file-scoped). Both auto-read by Copilot. Standalone docs in `docs/` are not. |
| **Learned rule** | A numbered, categorized rule under `## Learned Rules` in an instruction file. IDs are append-only by default and archive supersessions to `copilot-instructions-deprecated.md`; renumber only via an explicit logged entry in that file to resolve an ID collision or migration error, never to keep sequences tidy. |
| **Worktrunk** | Worktree-per-task workflow; the `wt` CLI wraps `git worktree` with hooks, LLM commits, and a merge pipeline. Both raw-git and Worktrunk workflows live in `skills/git-worktrees/` (the single user-facing worktree skill). Local worktrees live under `.worktrees/` and are never committed. |
| **Session state** | `session-state/<sessionId>/` holds per-session artifacts (plan.md, checkpoints, files). Gitignored. Pruned via `scripts/prune-session-state.sh`. |
| **Stabilisation guard** | The `stabilisation-guard` extension that surfaces unresolved `open_loop` / `assistant_goal` Lore memories at session start. Resolved via the `resolve-open-loops` skill. |

## Layout

```
copilot-instructions.md        Global rules + learned-rule ledger
instructions/*.instructions.md File-type rules (typescript, go, yaml, …)
skills/<name>/SKILL.md         Invokable workflows
agents/<name>.agent.md         Manual-only specialists
extensions/<name>/             Auto-discovered CLI extensions
docs/                          Reference docs (RTK, legacy schemas)
scripts/                       Maintenance utilities
session-state/                 Per-session scratch (gitignored)
logs/                          Runtime logs (gitignored)
```

## Conventions

- Conventional Commits for commits and PR titles.
- Never bypass 1Password/GPG signing.
- Never commit `.worktrees/`, `session-state/`, `logs/`, `*.db*`, `installed-plugins/`, or `permissions-config.json`.
- Skills must pass `node skills/skill-authoring/scripts/validate-skill-library.mjs` before being considered done.
