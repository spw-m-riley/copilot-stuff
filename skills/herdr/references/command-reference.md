# Herdr command reference

Use this reference after the routing decision is already made and the job is clearly about coordinating panes, tabs, or workspaces from inside herdr.

## Discovery

| Goal | Command | Notes |
| --- | --- | --- |
| See the current pane | `herdr pane current --current` | Good first check before splitting or waiting. |
| List panes in the active session | `herdr pane list` | Use `--workspace <id>` to narrow to one workspace. |
| List tabs in a workspace | `herdr tab list --workspace <workspace-id>` | Useful before creating another tab or moving a pane. |
| List workspaces | `herdr workspace list` | Use this before focus, rename, or close operations. |

## Read and wait

| Goal | Command | Notes |
| --- | --- | --- |
| Read what is already on a pane | `herdr pane read <pane-id> --source recent --lines 50` | `visible` reads the viewport; `recent-unwrapped` joins soft wraps back together. |
| Wait for future output | `herdr wait output <pane-id> --match "ready" --timeout 30000` | Add `--regex` for pattern matching. |
| Wait for a sibling agent state | `herdr wait agent-status <pane-id> --status done --timeout 60000` | Valid states: `idle`, `working`, `blocked`, `done`, `unknown`. |

## Create or reshape context

| Goal | Command | Notes |
| --- | --- | --- |
| Split the current pane | `herdr pane split --current --direction right --no-focus` | Use `down` for a vertical stack. |
| Create a new tab | `herdr tab create --workspace <workspace-id> --label "docs" --no-focus` | Add `--cwd` or `--env KEY=VALUE` if the lane needs them. |
| Create a new workspace | `herdr workspace create --cwd /path/to/repo --label "api" --no-focus` | Best for a broader project lane. |
| Move a pane into a new tab | `herdr pane move <pane-id> --new-tab [--workspace <workspace-id>] --label "logs" --no-focus` | Use when the pane already exists and just needs isolation. |
| Move a pane into a new workspace | `herdr pane move <pane-id> --new-workspace --label "research" --no-focus` | Use for a larger context break. |

## Interact with a pane

| Goal | Command | Notes |
| --- | --- | --- |
| Run a one-shot command | `herdr pane run <pane-id> "npm test"` | Best when the command should send Enter immediately. |
| Send text without Enter | `herdr pane send-text <pane-id> "help"` | Pair with `send-keys` for interactive programs. |
| Send keys | `herdr pane send-keys <pane-id> Enter` | Works for Enter and other named keys. |
| Focus another pane | `herdr pane focus --direction right --current` | Directional focus avoids hard-coding an id. |
| Rename a pane, tab, or workspace | `herdr pane rename <pane-id> "server"` | `tab rename` and `workspace rename` follow the same pattern. |
| Close a pane, tab, or workspace | `herdr pane close <pane-id>` | Re-list afterward because live ids can compact. |

## Output-shape notes

- `pane read` returns text, not JSON.
- `pane run`, `pane send-text`, and `pane send-keys` succeed silently.
- Discovery, create, move, and wait commands return structured output; read the response and parse fresh ids instead of predicting them.
- `pane split` returns the new pane id in the response payload. `tab create` and `workspace create` return the new container plus root-pane information.
- `wait output --source recent` matches against unwrapped recent text. If you want to inspect the same transcript that the matcher used, read with `pane read --source recent-unwrapped`.

## Practical guidance

- Prefer `--no-focus` when you are starting sibling work and want to keep typing in your current pane.
- Prefer directional focus (`left`, `right`, `up`, `down`) when the layout is simple and you do not want to pin a brittle pane id in your next step.
- Re-read topology after any create, move, or close because pane, tab, and workspace ids are compact live ids, not durable identities.
