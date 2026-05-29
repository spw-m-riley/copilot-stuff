# error-learner

`error-learner` is a Copilot CLI extension that listens for the SDK `onErrorOccurred` hook and records reusable error-pattern observations for Lore.

## Hook payload

The local SDK contract (`pkg/darwin-arm64/1.0.55/copilot-sdk/types.d.ts`) defines `ErrorOccurredHookInput` as:

| Field | Source | Notes |
| --- | --- | --- |
| `sessionId` | `BaseHookInput` | Runtime session that emitted the hook. |
| `timestamp` | `BaseHookInput` | Runtime event time. |
| `workingDirectory` | `BaseHookInput` | Used to derive `cwd` and repository. |
| `error` | `ErrorOccurredHookInput` | Converted to a redacted, truncated `errorMessage`. |
| `errorContext` | `ErrorOccurredHookInput` | One of `model_call`, `tool_execution`, `system`, or `user_input`. |
| `recoverable` | `ErrorOccurredHookInput` | Stored as a boolean confidence signal. |

The SDK type does not currently declare `toolName` on `ErrorOccurredHookInput`; the extension records `toolName` when the runtime provides it as an extra field and otherwise stores `"unknown"`.

## Write strategy

The approved policy prefers Lore's public `memory_save` tool over direct SQLite writes. Extension hooks do not expose a typed cross-extension tool invocation API in the shipped SDK; `CopilotSession` exposes logging, but not `memory_save` dispatch. `error-learner` therefore:

1. Builds the exact `memory_save` argument shape it wants to submit.
2. Attempts a best-effort in-process call only if the session object exposes a compatible `callTool` or `invokeTool` function.
3. Falls back to appending a JSONL envelope to `~/.copilot/session-state/error-learner/queue.jsonl` for later batch ingest.

No direct Lore SQLite write is used, so no ADR exception is required.

## Payload schema

Each observation is stored in the `memory_save.content` JSON string and mirrored in the JSONL queue envelope:

```json
{
  "kind": "error_pattern",
  "scope": "repo",
  "repository": "owner/repo",
  "cwd": "/path/to/workspace",
  "sessionId": "session-id",
  "sdkHook": "onErrorOccurred",
  "toolName": "bash",
  "errorContext": "tool_execution",
  "errorMessage": "redacted and truncated error text",
  "recoverable": true,
  "observedAt": "2026-05-29T00:00:00.000Z"
}
```

The queued JSONL line has this envelope:

```json
{
  "destination": "memory_save",
  "args": {
    "content": "{...payload json...}",
    "type": "error_pattern",
    "repository": "owner/repo",
    "scope": "repo",
    "confidence": 0.75
  },
  "payload": { "kind": "error_pattern" },
  "queuedAt": "2026-05-29T00:00:00.000Z",
  "reason": "session tool API unavailable from extension hook"
}
```

## Retrieving patterns

After ingest, use Lore search:

```text
memory_search query="error_pattern bash permission denied" type="error_pattern"
```

For repository-specific retrieval, include the tool name, error text, or `errorContext` terms in the query.
