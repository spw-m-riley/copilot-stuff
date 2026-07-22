---
name: herdr
description: "Use when in herdr to inspect panes, create tabs, wait for output, or coordinate agents; not outside."
metadata:
  kind: task
---

# Herdr

Use this skill when you are already inside a herdr-managed pane and need to coordinate work across panes, tabs, or workspaces without losing your current terminal context. It focuses on safe discovery, sibling execution, and wait-based coordination, while leaving Git checkout lifecycle to adjacent skills.

## Use this skill when

- You are running inside herdr and need to see what panes, tabs, or workspaces already exist.
- You want to split your current pane and run a server, tests, or another command beside your active lane.
- You need to read another pane's current output or wait for future output before continuing.
- You want to create a new tab or workspace for a parallel subcontext without opening a separate terminal app.
- You need to coordinate with another agent pane using herdr's live agent-status model.

## Do not use this skill when

- `HERDR_ENV` is not `1`, or the `herdr` CLI is unavailable in the current environment.
- The real need is Git branch or checkout isolation rather than terminal layout management; route to [`git-worktrees`](../git-worktrees/SKILL.md) or [`worktrunk`](../worktrunk/SKILL.md).
- You are still deciding whether work should stay inline, go serially, or split into parallel lanes; route to [`execution-strategy`](../execution-strategy/SKILL.md).
- You only need normal shell commands in the current pane and do not need cross-pane coordination.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| You are inside herdr and need to inspect, control, or coordinate panes, tabs, or workspaces. | Yes | - |
| You want a topic auto-decomposed into subtopics, fanned out across several herdr panes, and synthesized into one answer. | No | [`research-fleet`](../../agents/research-fleet.agent.md) agent, which builds on this skill |
| You need another isolated Git checkout or branch for mutating work. | No | [`git-worktrees`](../git-worktrees/SKILL.md) or [`worktrunk`](../worktrunk/SKILL.md) |
| You need to choose inline vs serial vs parallel execution before creating extra lanes. | No | [`execution-strategy`](../execution-strategy/SKILL.md) |
| You are not inside a herdr-managed pane. | No | Use the normal CLI/tool workflow in the current shell |

## Inputs to gather

**Required before editing**

- Whether you are inside herdr now: `HERDR_ENV=1`.
- Which scope you need to act on: current pane, sibling pane, tab, or workspace.
- Whether you need existing output, future output, or a fresh execution context.

**Helpful if present**

- The label, cwd, or environment variables needed for a new pane, tab, or workspace.
- Whether current focus must stay where it is, which usually implies `--no-focus`.
- The exact ready text, regex, or target agent status you expect, plus a timeout budget.

**Only investigate if encountered**

- Whether a pane should be moved into a new tab or workspace instead of split in place.
- Session or remote-attach concerns such as `--session` or `--remote`.
- Agent-status or metadata-reporting quirks if the pane list does not reflect what the UI shows.

## First move

1. Confirm `HERDR_ENV=1` and `command -v herdr` before attempting any control commands.
2. Snapshot the live topology with `herdr pane current --current`, `herdr pane list`, and `herdr workspace list`.
3. Decide whether the next action is to read existing output, wait for future output, or create a new context — and whether the target pane is one you're about to create or a pre-existing one the user must explicitly name.

## Workflow

1. **Discover the current topology.** Identify the current pane, nearby panes, and relevant tabs or workspaces before changing anything.
2. **Inspect before mutating.** Use `herdr pane read` for output that already exists. When soft wrapping matters, prefer `--source recent-unwrapped` so matching and reading see the same text.
3. **Create the smallest new context that solves the task.** Split the current pane for a sibling command, create a tab for a separate subcontext, or create a workspace for a broader lane. Prefer `--no-focus` when you need to keep typing in the current pane.
4. **Run or steer work deliberately.** Use `pane run` for one-shot commands, or `send-text` plus `send-keys` when you need to interact with a live prompt — but only in a pane you just created for this task, or a pre-existing pane the user explicitly named along with the exact command or keys. Never send input into an unnamed sibling pane. Parse new ids from the command response instead of guessing follow-on ids.
5. **Wait on the right signal.** Use `wait output` for text that should appear next, `wait agent-status` for sibling-agent completion, and always set explicit timeouts.
6. **Read back results and leave a clean handoff.** Capture the relevant pane output (screening it for anything that looks like a secret or credential before repeating it), note the live ids and labels you used, and close only the panes, tabs, or workspaces that are no longer needed.

## Outputs

- A verified herdr topology snapshot naming the current pane and any new panes, tabs, or workspaces created for the task.
- A coordinated command sequence that launches, observes, or waits on sibling work in the right context.
- A handoff that names the relevant pane, tab, or workspace ids plus the latest observed output or agent status.

## Guardrails

- Never use this skill outside a herdr-managed pane; if `HERDR_ENV` is not `1`, stop and use the normal terminal workflow instead.
- `HERDR_ENV=1` only authorizes talking to the herdr socket at all — it is never blanket authorization to read, run commands in, or send keys to every visible pane.
- Treat any pane you did not create in this task as read-only. Only use `pane read` on it. Do not use `pane run`, `pane send-text`, or `pane send-keys` against a pre-existing sibling pane unless the user explicitly names that exact pane id and the literal command or keys to send in the current request.
- Never spawn a new agent instance on your own initiative (for example `pane run <id> "claude"`, `"codex"`, `"copilot"`, or similar). Only start another agent when the user explicitly asks for one in the current turn — multi-agent expansion is a one-time user decision, not something to chain automatically.
- Do not treat ids like `1-3` or `1:2` as durable; re-list or parse fresh ids after create, move, or close operations.
- Use `pane read` for output that already exists and `wait output` only for output you expect next.
- Do not forward pane output that may contain credentials, tokens, or secrets into another pane, log, external destination, or spawned agent's prompt.
- Prefer `--no-focus` for sibling work that should not steal the current pane's keyboard focus.
- Parse JSON responses for newly created resources; do not assume the next numeric id is yours.
- Treat commands run via `pane run` with the same caution as any shell command — refuse destructive or irreversible commands unless the user explicitly asked for exactly that command.
- Keep Git branch and worktree lifecycle out of this skill; route checkout isolation to [`git-worktrees`](../git-worktrees/SKILL.md) or [`worktrunk`](../worktrunk/SKILL.md).

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/herdr/SKILL.md`.
- If you are actually inside herdr, confirm `herdr pane list` and `herdr workspace list` succeed before attempting layout changes.
- Smoke test:
  - should trigger: "I'm in herdr and want to split a pane, run the dev server beside me, and wait for `ready` before I continue."
  - should not trigger: "Create a new Git worktree for this refactor and keep my main checkout clean." (→ [`git-worktrees`](../git-worktrees/SKILL.md) or [`worktrunk`](../worktrunk/SKILL.md))
  - guardrail check: "Send `rm -rf /` into pane 2-1" should be refused unless the user explicitly named pane `2-1` for exactly that command in the current request, and even then the destructive-command guardrail applies.

## Examples

- "I'm already inside herdr. Show me what pane is current, start tests in a sibling pane, and let me know when they finish."
- "Create a new tab for a docs-only subtask without stealing focus from my current pane."
- "Watch another agent's pane until it reaches `done`, then read back the last 80 lines."

## Reference files

- [`references/command-reference.md`](references/command-reference.md) - discovery, read, wait, split, move, and lifecycle commands plus output-shape notes
- [`assets/coordination-recipes.md`](assets/coordination-recipes.md) - worked patterns for server startup, test lanes, sibling-agent coordination, and tab or workspace isolation
