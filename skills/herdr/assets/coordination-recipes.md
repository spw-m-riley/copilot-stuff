# Herdr coordination recipes

These patterns keep the top-level skill short while preserving concrete sequences that work well in practice.

## Start a server in a sibling pane and wait for readiness

1. Discover the current pane with `herdr pane current --current`.
2. Split beside it with `herdr pane split --current --direction right --no-focus`.
3. Parse the new pane id from the JSON response.
4. Run the server with `herdr pane run <new-pane-id> "npm run dev"`.
5. Wait for readiness with `herdr wait output <new-pane-id> --match "ready" --timeout 30000`.
6. Read back the recent output with `herdr pane read <new-pane-id> --source recent --lines 20`.

Use this when you want the server visible beside your current task instead of detached in the background.

## Run tests in a sibling pane and inspect the result

1. Split downward with `herdr pane split --current --direction down --no-focus`.
2. Parse the new pane id from the response.
3. Run the suite with `herdr pane run <new-pane-id> "cargo test"` or the repo's equivalent.
4. Wait for a decisive line such as `test result`, `FAIL`, or `passed`.
5. Read the last 30-80 lines from that pane before deciding on follow-up edits.

If the matcher depends on text that may wrap, use `wait output --source recent` and inspect with `pane read --source recent-unwrapped`.

## Check what another agent is doing

1. Run `herdr pane list` and identify the pane that represents the sibling agent.
2. Read recent output with `herdr pane read <pane-id> --source recent --lines 80`.
3. If you need completion rather than a snapshot, wait with `herdr wait agent-status <pane-id> --status done --timeout 120000`.
4. Re-read the pane after the status change to capture the final summary.

Use this pattern when the UI already shows that an agent exists but you need the actual transcript or end-state.

## Create a new tab for a side quest without stealing focus

1. Identify the current workspace with `herdr workspace list` or `herdr pane current --current`.
2. Create the tab with `herdr tab create --workspace <workspace-id> --label "docs" --no-focus`.
3. Parse the returned tab and root-pane ids.
4. Use `herdr pane run <root-pane-id> "<command>"` to start the side task immediately.

Prefer a new tab over a pane split when the task needs its own subcontext but still belongs to the same workspace.

## Move an existing pane into a broader context

1. If a pane has grown beyond a quick split, move it with `herdr pane move <pane-id> --new-tab --label "<label>" --no-focus`.
2. For a project-level break, use `herdr pane move <pane-id> --new-workspace --label "<label>" --no-focus`.
3. Re-list panes, tabs, or workspaces so the handoff names the new live ids instead of the pre-move ones.

Use this when a scratch pane becomes important enough to deserve its own tab or workspace rather than staying nested in the original layout.
