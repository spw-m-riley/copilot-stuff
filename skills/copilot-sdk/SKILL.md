---
name: copilot-sdk
description: "Use when building or debugging code that imports the runtime-provided @github/copilot-sdk package."
metadata:
  category: authoring
  audience: general-coding-agent
  maturity: stable
  kind: reference
---

# Copilot SDK

> **Routing alias.** All work involving `@github/copilot-sdk` imports, SDK hook verification, and runtime payload handling is handled by [`copilot-extension-development`](../copilot-extension-development/SKILL.md). Use that skill directly.

The SDK-specific guardrails — payload normalization, runtime import resolution, hook-name verification — are maintained there and in the reference file below.

## Use this skill when

- Never route here as a starting point. This skill exists so older references remain resolvable.
- Trigger [`copilot-extension-development`](../copilot-extension-development/SKILL.md) for any task involving `@github/copilot-sdk`.

## Do not use this skill when

- You need to build, modify, or debug an extension that imports `@github/copilot-sdk` — use [`copilot-extension-development`](../copilot-extension-development/SKILL.md).
- You need to verify a hook or SDK API against the installed runtime — use [`copilot-extension-development`](../copilot-extension-development/SKILL.md).

## Validation

- No standalone validation; validate through `copilot-extension-development`.

## Examples

- "This extension imports @github/copilot-sdk" → [`copilot-extension-development`](../copilot-extension-development/SKILL.md)
- "Check whether this hook name exists in the SDK" → [`copilot-extension-development`](../copilot-extension-development/SKILL.md)

## Reference files

- [`references/runtime-validation.md`](references/runtime-validation.md) - validation patterns for runtime-provided SDK imports
- [`../copilot-extension-development/SKILL.md`](../copilot-extension-development/SKILL.md) - primary skill for all `@github/copilot-sdk` work
