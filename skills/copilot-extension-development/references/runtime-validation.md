# Runtime validation

`@github/copilot-sdk` is provided by the Copilot CLI extension runtime in this workspace. A raw Node.js import probe can fail even when the extension is valid in the CLI runtime.

## Preferred validation order

1. Use syntax-only checks for JavaScript parse errors when available.
2. Verify the SDK API or hook name against installed CLI/SDK docs, types, or runtime source.
3. Reload extensions.
4. Invoke the targeted extension tool or hook in a separate step.

## Failure interpretation

| Signal | Interpretation |
| --- | --- |
| Syntax check fails | Treat as code regression |
| Raw Node import cannot resolve `@github/copilot-sdk` | Not enough evidence; SDK may be runtime-provided |
| Extension reload fails | Inspect extension logs and runtime error |
| Targeted runtime invocation fails | Debug the extension behavior directly |
