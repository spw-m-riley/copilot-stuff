---
name: copilot-extension-development
description: "Use when adding, modifying, debugging, or registering Copilot CLI extensions under extensions/<name>/."
metadata:
  category: authoring
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Copilot extension development

## Use this skill when

- The user asks to add a new extension under `extensions/`.
- The user asks to modify an extension hook, tool, registration, or runtime behavior.
- Prompts include "this extension hook isn't firing", "register a new extension tool", or "modify the lore extension hook".
- The task requires verifying the Copilot CLI extension SDK contract before implementing behavior.
- An extension or hook imports `@github/copilot-sdk` and needs runtime validation, hook-name verification, or payload normalization guidance.

## Do not use this skill when

- The user only asks how to use Copilot CLI features; fetch the CLI documentation instead.
- The task is a reusable skill package under `skills/`, not an extension package.
- The task is documentation-only and does not change extension behavior or registration.
- The failure is in a third-party tool outside the extension boundary.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Add or modify an extension under `extensions/<name>/` | Yes | - |
| Create or revise a reusable skill under `skills/<name>/` | No | [`skill-authoring`](../skill-authoring/SKILL.md) |
| Update global or file-scoped instructions for extension policy only | No | [`init`](../init/SKILL.md) |
| Debug a generic runtime failure with unknown root cause first | No | [`systematic-debugging`](../systematic-debugging/SKILL.md) |

## Inputs to gather

**Required before editing**

- The target extension directory and entry point, usually `extensions/<name>/` and `extension.mjs` or equivalent.
- The intended hook, tool, canvas, or registration behavior.
- The current CLI/SDK documentation or type source that proves the hook or API exists.
- Existing tests, package scripts, README, and extension registration shape.

**Helpful if present**

- The failing command, hook payload sample, or extension log.
- Prior learned-rule constraints that apply to the extension surface.
- User-facing README sections that must stay accurate after behavior changes.

**Only investigate if encountered**

- Unknown hook names; verify against shipped SDK docs or types before coding.
- Hook payloads that may arrive stringified; inspect and normalize before reading fields.
- Extension reload or tool-availability changes; sequence validation carefully.
- Raw `node import()` failures for `@github/copilot-sdk`; the SDK is runtime-provided and plain Node cannot resolve it — use syntax checks, extension reload, and targeted invocation instead.

## First move

1. Read the target extension package and locate its entry point, tests, README, and registration code.
2. Verify the requested hook/tool API exists in the local CLI/SDK source or documentation before implementing it.
3. Identify the smallest validation loop: package tests, extension reload, and one sequential post-reload tool check when applicable.

## Workflow

1. Map the extension boundary: entry point, contributed tools/hooks/canvases, package metadata, tests, and README.
2. Verify SDK contracts first. Do not invent hook names; unknown hook keys can be silently ignored at runtime.
3. Normalize hook payload inputs before reading fields such as `toolArgs`, `path`, `view_range`, or `forceReadLargeFiles`; payloads may arrive as JSON strings.
4. Implement the smallest behavior change in the extension package and keep registration names stable unless the user asked for a rename.
5. Add or update tests under the package's `tests/` directory for the changed behavior, especially payload normalization and registration shape.
6. Update README or package docs only when user-facing behavior, setup, or commands change.
7. Run the extension's existing test/validation commands. Use RTK directly when an equivalent command exists in this workspace.
8. Reload extensions as its own step. Do not batch reload with follow-up extension tool calls.
9. After reload completes, validate new or changed tools sequentially so a failed tool call cannot be confused with reload failure.
10. Report changed files, tests run, reload status, and any remaining manual verification.

## Outputs

- A validated extension package under `extensions/<name>/` with updated entry point code.
- Tests under `tests/` covering the changed hook, tool, or registration behavior.
- README or package documentation updates when behavior is user-facing.
- A clean extension reload followed by separate post-reload verification for changed tools or hooks.

## Guardrails

- Follow learned rules 8 and 28: validate post-reload extension tools sequentially, and never batch `extensions_reload` with follow-up extension tool invocations.
- Follow learned rule 85: verify hook names against shipped SDK docs/types before implementing them.
- Follow learned rule 86: normalize `toolArgs` and similar hook payload fields before reading them.
- Follow learned rule 90: run RTK directly whenever an equivalent command exists in this workspace.
- Keep files under `extensions/` generic about models; mention branded model names or IDs only when the user explicitly asks.
- Run extension reload and the existing tests for every behavior change, including small changes.
- Keep broad policy in instructions or skills; use extension code for extension-specific behavior.

## Anti-patterns

- Implementing a hook from an issue description without proving the current SDK supports it.
- Treating object-shaped payload examples as proof that runtime payloads are never stringified.
- Reloading and immediately invoking a new tool in the same tool batch.
- Updating extension behavior but leaving tests or README examples stale.
- Adding model-specific references where generic capability language is enough.

## Validation

- Confirm the requested hook, tool, or registration API exists in local SDK docs/types.
- Confirm payload normalization tests cover object and stringified forms when hook inputs are read.
- Run the package's existing tests or validation script.
- Run extension reload as a separate step from subsequent extension tool calls.
- Confirm README updates exist when user-facing commands or behavior changed.
- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/copilot-extension-development/SKILL.md` after changing this skill.
- Smoke test:
  - should trigger: "This extension hook isn't firing; fix the extension under `extensions/ma/`."
  - should not trigger: "Create a reusable skill for extension authoring conventions." (→ `skill-authoring`)

## Examples

- "Add a new extension tool under `extensions/triage/` and verify it appears after reload."
- "Modify the lore extension hook to parse stringified `toolArgs` safely and add tests."
- "Register a new extension command, update the README, reload extensions, and validate the tool separately."

## Reference files

- [`copilot-instructions.md`](../../copilot-instructions.md) - learned rules for extension reloads, SDK hooks, payload normalization, and RTK use.
- [`references/runtime-validation.md`](references/runtime-validation.md) - validation patterns for runtime-provided `@github/copilot-sdk` imports.
