# Herdr operational sharp edges

Use this reference once the routing decision is already made and a live herdr command is about to run. Each edge below was confirmed against a live `herdr` session (`herdr api snapshot`, `herdr <group> --help`) rather than assumed from documentation alone — re-verify against the installed binary's `--help` output if a command shape looks different, since the CLI evolves across releases.

## Preconditions: `HERDR_ENV` and `HERDR_WORKSPACE_ID`

- `HERDR_ENV=1` proves the process is inside a herdr-managed pane at all. Treat any other value, or an unset variable, as "not in herdr" and stop.
- `HERDR_WORKSPACE_ID`, `HERDR_TAB_ID`, and `HERDR_PANE_ID` are herdr's own injected caller context — they identify *this* pane, not a target the user named. Read them with `printf '%s\n' "$HERDR_WORKSPACE_ID" "$HERDR_TAB_ID" "$HERDR_PANE_ID"` before using `--current` or scoping a `list` call with `--workspace "$HERDR_WORKSPACE_ID"`.
- Do not assume `HERDR_WORKSPACE_ID` is set just because `HERDR_ENV=1` is. If a command needs an explicit workspace scope and the env var is missing or empty, re-discover it with `herdr pane current --current` instead of guessing.

## Session targeting and first-colon parsing

- `herdr session list|attach|stop|delete` manages named persistent sessions distinct from workspace/tab/pane topology. When more than one named session could be running (`--session <name>` at the top level), target the session explicitly rather than assuming the attached one is the only one live.
- Workspace, tab, and pane IDs are workspace-qualified strings shaped like `w1`, `w1:t1`, `w1:p1` — the workspace ID is always the substring before the *first* colon. Do not assume a fixed-width or fixed-segment-count scheme (a pane ID is not guaranteed to be exactly `w<N>:p<N>`); split on the first colon only, and treat everything after it as an opaque suffix.
- After `pane move`, the new pane ID lives at `.result.move_result.pane.pane_id` (workspace-requalified) and the old ID is reported separately as `.result.move_result.previous_pane_id`. Only the moved process's own inherited context still resolves the old ID — do not reuse `previous_pane_id` as a general target for other commands.

## `send-text` then delay then Enter

- `pane run <pane-id> <command>` and `agent prompt <target> <text> --wait` send text and Enter atomically in one call — prefer these when starting or driving a supported agent or a one-shot command.
- `pane send-text` sends literal text only; the CLI's own help says the next step is `send-keys` for Enter. When a live interactive prompt genuinely requires the split send-text-then-Enter form (for example, typing into a program that isn't a supported agent kind), add a short delay between the two calls before sending `Enter` — a pty on the other end can still be processing the just-written text, and an Enter sent immediately after can race ahead of it or land before the text is fully flushed, silently losing or splitting the input. Re-read the pane (`pane read --source recent`) after sending Enter to confirm the text actually landed before trusting the result.

## Pane-read minimum-line trap

- `--lines N` asks for more rows from the pane's rendered screen and host scrollback, not from the agent's true full response. If increasing `--lines` does not reveal more of a completed answer, the pane is very likely rendering on the terminal's alternate screen (common for full-screen TUIs and some agent UIs) — rows that leave the alternate screen never enter herdr's host scrollback, so no `--lines` value will recover them.
- Diagnose the trap before assuming a wait or read command is broken: compare `--source recent` against `--source recent-unwrapped` and `--source detection`; if none show more content as `--lines` grows, stop trying larger values.
- Fallback once the trap is confirmed: ask the sibling agent to write its complete answer to a file and reply with only the path, then read that file directly. Use this only as a fallback after the read genuinely plateaus — do not default to file-based handoff for every task.

## `.foreground_cwd` vs `.cwd`

- `herdr api snapshot` and `pane get`/`agent get` report both `cwd` and `foreground_cwd` per pane. `cwd` is the pane's shell working directory; `foreground_cwd` is the working directory of whatever process currently owns the foreground of that terminal.
- These two fields diverge whenever the foreground process `chdir`s away from the shell's own directory (for example, a long-running agent or REPL that changed directories after launch, or a nested shell). Use `foreground_cwd` when deciding what a currently-running agent or command is actually operating on; use `cwd` when deciding what a fresh command in that pane's shell would run from.
- Do not use `cwd` alone to decide whether a pane is "the right one" for a task — check `foreground_cwd` too when an agent or long-lived process is active in that pane.

## False-idle corroboration

- Herdr's `idle`/`done` states have a "seen" requirement baked in: `idle` means the agent is ready for input *and* its tab has been seen in the focused herdr UI; `done` is the same underlying idle state reached after unseen background work finished. Reading a pane over the CLI does not mark it seen — only focusing the tab, or targeting the pane/agent with a focus command, does.
- `unknown` means herdr detected an agent but cannot classify its state confidently — it is not evidence of completion either way.
- A `wait` call timing out does not mean the pane is stuck. Always corroborate a suspicious status (timeout, `unknown`, or an unexpectedly fast `idle`) with a direct `pane read --source recent` / `agent read` before deciding the pane needs intervention — the pane may already be correctly idle at its prompt with nothing sent to it yet, or may still be actively working despite a stale status snapshot.
- Treat a single status read as a snapshot, not a guarantee: re-check after any action that could have changed state (a send, a focus change, or elapsed wait time) rather than trusting one read across multiple decisions.

## Post-restart husks

- Herdr's server process can restart independently of the panes it was tracking. After any restart (yours or one you notice from stale-looking output), previously reported agent, pane, or workspace records can persist as husks — entries that no longer correspond to a live, attached process.
- Before sending input to, waiting on, or reporting the state of any pane or agent whose topology you did not just discover in this task, re-verify it is live: re-run the relevant `list`/`get` call and check `pane process-info` or `agent get` rather than reusing an ID or status cached from earlier in the conversation.
- Prefer re-discovering topology (`herdr pane list`, `herdr workspace list`, `herdr agent list`) after any gap in activity longer than a few commands, especially before a mutating call.

## Workspace-label collisions

- Workspace, tab, and pane `label` fields are display-only metadata (`report-metadata` sets them) — they are not unique and are not stable identifiers. Two workspaces can legitimately share the same label (for example, two windows both labeled after the same repository directory name).
- Never target a workspace, tab, or pane by matching on its label. Always resolve the numeric/opaque ID from a `list` or `get` call first, and use that ID (or `--current`, or a unique live agent name) for the actual mutating command.
