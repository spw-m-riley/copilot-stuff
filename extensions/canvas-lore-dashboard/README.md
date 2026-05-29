# canvas-lore-dashboard

`canvas-lore-dashboard` exposes a small Lore status dashboard for Copilot CLI sessions.

## Runtime behaviour

- **Canvas path:** when the host reports `session.capabilities.ui?.canvases === true`, the extension registers a `lore-dashboard` canvas with `requestCanvasRenderer: true` and opens it from `onSessionStart`.
- **Slash-command path:** when canvas rendering is unavailable but SDK slash-command registration is available, the extension registers `/lore-status`. This is the expected terminal TUI path today.
- **No-op path:** when neither surface is available, the extension logs one warning and stays idle instead of crashing.

## Stats source

The dashboard reads `lore.db` directly in read-only mode. This avoids changes to Lore core and avoids depending on another extension's in-process runtime. Each read opens a short-lived SQLite handle and closes it in `finally`; canvas `onClose` clears panel-instance state.

Displayed fields include active repository, semantic memory count, episode digest count, day-summary count, latest Lore context-injection latency recorded in `lore_activity_state`, dashboard prompt-hook latency, prompt count, and the top three prompt topics observed during the session.

## Validation

```sh
node --check extensions/canvas-lore-dashboard/extension.mjs
node extensions/canvas-lore-dashboard/tests/run.mjs
```
