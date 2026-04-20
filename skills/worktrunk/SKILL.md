---
name: worktrunk
description: Configure and use Worktrunk (wt) for worktree lifecycle management, hooks, LLM commits, and parallel agent workflows.
metadata:
  category: version-control
  audience: general-coding-agent
  maturity: stable
  kind: reference
---

# Worktrunk

Use this skill when a user needs to configure `wt`, set up LLM commit messages, author project hooks, or run multiple parallel agent lanes with isolated worktrees.

## Use this skill when

- User asks how to configure Worktrunk (`wt config`, `~/.config/worktrunk/config.toml`, `.config/wt.toml`)
- User wants to set up LLM-generated commit messages or branch summaries
- User needs to author or debug hooks (`post-start`, `pre-merge`, etc.)
- User is setting up parallel agent workflows with `wt switch --create --execute=…`
- User asks about `wt merge`, `wt step`, or the merge pipeline
- User is debugging shell integration or worktree path layout

## Do not use this skill when

- `wt --version` fails — Worktrunk is not installed; suggest `brew install worktrunk`
- A disposable clone is preferred over a worktree
- The task only needs raw `git worktree` commands — route to the `git-worktrees` skill instead

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| `wt` installed; user wants hooks or config | Yes | — |
| User wants raw `git worktree add/remove` only | No | `git-worktrees` skill |
| `wt --version` fails | No | Suggest `brew install worktrunk` |
| Disposable clone, not a worktree | No | `git clone` directly |

## Inputs to gather

**Required before editing**

- Is this config setup, hook authoring, or a parallel agent workflow?
- Does `~/.config/worktrunk/config.toml` already exist? (`wt config show`)

**Helpful if present**

- Project type (Node, Rust, Python, etc.) for hook examples
- Whether LLM commit generation is desired and which LLM tool is available

## First move

1. `wt --version` — confirm install (expect `0.40.0` or later)
2. `wt config show` — inspect active config and file locations
3. `wt config create` — scaffold user config if missing; `wt config create --project` for project config

## Workflow

1. **Configure worktree path** — set `worktree-path` in user config (inside-repo `.worktrees/` is recommended for Copilot CLI worktree-manager compatibility)
2. **Set up LLM commits** — add `[commit.generation]` block; see [`assets/llm-commits-setup.md`](assets/llm-commits-setup.md)
3. **Add project hooks** — author `.config/wt.toml` hooks for install, dev server, DB, CI gates; see [`assets/hooks-reference.md`](assets/hooks-reference.md)
4. **Enable branch summaries** (optional) — `[list] summary = true` in user config
5. **Run parallel agents** (optional) — use `wt switch --create --execute=<agent>`; see [`assets/parallel-agents-recipes.md`](assets/parallel-agents-recipes.md)

## Validation

```sh
wt config show                              # confirms settings loaded
wt switch --create test-wt-check           # creates worktree, fires hooks
wt list                                    # confirms branch with status markers
wt remove test-wt-check                   # cleans up
```

## Examples

- "Set up LLM commit messages for this repo"
- "Add a post-start hook that runs npm ci and starts the dev server"
- "Configure parallel agent lanes with unique ports per worktree"

## Reference files

- [`assets/hooks-reference.md`](assets/hooks-reference.md) — all hook types, template variables, filters, pipeline syntax
- [`assets/merge-pipeline.md`](assets/merge-pipeline.md) — `wt merge` pipeline, flags, and `wt step` sub-commands
- [`assets/llm-commits-setup.md`](assets/llm-commits-setup.md) — LLM commit generation config for Claude Code, Codex, llm CLI, aichat
- [`assets/parallel-agents-recipes.md`](assets/parallel-agents-recipes.md) — one-shot alias pattern, dev server per worktree, DB per worktree, cold-start elimination
- [`references/config-reference.md`](references/config-reference.md) — complete config key reference with defaults
