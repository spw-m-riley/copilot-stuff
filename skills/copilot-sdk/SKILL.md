---
name: copilot-sdk
description: "Use when building or debugging code that imports the runtime-provided @github/copilot-sdk package."
metadata:
  category: authoring
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Copilot SDK

Use this skill when code depends on the Copilot CLI runtime SDK rather than a package that is available to plain Node.js.

## Use this skill when

- Editing a Copilot CLI extension or hook that imports `@github/copilot-sdk`.
- Debugging extension-runtime behavior where plain `node import()` cannot resolve the SDK.
- Checking whether a Copilot SDK API or hook exists before using it.
- Updating extension validation so syntax checks and runtime reloads replace raw Node import probes.

## Do not use this skill when

- The task is generic extension authoring under `extensions/<name>/`; route to [`copilot-extension-development`](../copilot-extension-development/SKILL.md).
- The task is writing normal JavaScript with npm-installed dependencies.
- The task is only about local skill metadata or skill package structure; route to [`skill-authoring`](../skill-authoring/SKILL.md).

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Code imports `@github/copilot-sdk` | Yes | - |
| Hook/API support needs runtime confirmation | Yes | - |
| Extension package shape needs authoring | No | [`copilot-extension-development`](../copilot-extension-development/SKILL.md) |
| General JavaScript style or tests are changing | No | JavaScript instructions and repo tooling |

## Inputs to gather

- Extension or hook file path.
- The SDK import or API being used.
- The Copilot CLI version or local SDK type/source evidence when available.
- The validation command currently used and whether it assumes plain Node module resolution.

## First move

1. Inspect the extension file and confirm whether it imports `@github/copilot-sdk`.
2. Check the shipped SDK docs, types, or runtime source for the API or hook before changing code.
3. Choose validation that matches the runtime: syntax check, extension reload, or CLI invocation.

## Workflow

1. Identify the SDK surface in use: extension export, tool helper, hook payload, runtime context, or config access.
2. Verify the surface exists in the installed Copilot CLI/SDK source for this environment.
3. Avoid raw `node import()` as a regression signal when the SDK is runtime-provided.
4. Normalize runtime payloads defensively when hook/tool arguments may arrive as strings or objects.
5. Validate with the closest available runtime path, such as extension reload plus a targeted tool or hook invocation.

## Outputs

- A runtime-supported SDK usage or a clear unsupported-surface finding.
- Updated validation guidance that does not mistake missing plain-Node resolution for a code regression.
- A targeted extension-runtime verification result when the task changes behavior.

## Guardrails

- Do not invent SDK APIs from examples; verify against the current installed runtime source or types.
- Do not treat `@github/copilot-sdk` import failure in plain Node as proof that extension code is broken.
- Do not reference branded model names or specific model IDs in files under `extensions/` unless explicitly requested.
- Do not batch extension reloads with follow-up extension tool calls.

## Validation

- Run a syntax check that does not require resolving runtime-injected SDK dependencies when possible.
- Reload extensions before checking changed extension behavior.
- Invoke the specific extension tool or hook path separately after reload.
- Smoke test:
  - should trigger: "This extension imports @github/copilot-sdk; validate the hook without using raw Node import."
  - should not trigger: "Create a new reusable skill package for this workflow." (-> `skill-authoring`)

## Examples

- "Check whether this Copilot CLI hook name exists before I wire it into the extension."
- "This `.mjs` extension imports `@github/copilot-sdk`; update validation so plain Node import failures do not block us."
- "Normalize the SDK hook payload and verify it through extension reload."

## Reference files

- [`references/runtime-validation.md`](references/runtime-validation.md) - validation patterns for runtime-provided SDK imports
- [`../copilot-extension-development/SKILL.md`](../copilot-extension-development/SKILL.md) - broader Copilot CLI extension authoring workflow
