---
name: ma
description: "Use when you need reduced file context for understanding large prose, code, schemas, or instruction files — but not when you need exact source for editing."
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: stable
  kind: reference
---

# ma

Use this skill when the next step is understanding a local file with less context, not preparing an exact edit.

## Use this skill when

- You need to understand a large local file without spending full context on raw source.
- You want automatic reduction before deciding whether a full read is necessary.
- You already know you want prose compression, code skeletons, schema minification, or instruction-file deduplication.
- You are auditing instruction files for repeated guidance before editing them manually.

## Do not use this skill when

- You need exact file contents before editing, patching, or line-precise review.
- The real task is repo discovery, planning, or implementation rather than file reduction; route to `context-map` or normal search tools.
- You need semantic rewriting, code changes, or shell-command automation; `ma` is a reduction tool, not a general execution wrapper.
- The path is sensitive or credential-adjacent; the extension refuses those inputs.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Need reduced context for a known local file before deeper investigation | Yes | - |
| Need exact file contents before editing or patching | No | `view` or another full-fidelity reader |
| Need declarations and signatures without implementation details | Yes | `ma_skeleton` |
| Need schema structure without descriptions, examples, or defaults | Yes | `ma_minify_schema` |
| Need duplicate detection across instruction files | Yes | `ma_dedup` |
| Need cross-file repo discovery rather than file reduction | No | `context-map` or normal search tools |

## Inputs to gather

**Required before using `ma`**

- The file path, or the list of instruction files for a dedup pass.
- Whether the goal is auto reduction, prose compression, code shape, schema shape, or duplicate detection.

**Helpful if present**

- Whether the file is large enough that reduction is likely to help.
- Whether the result should stay summarized or eventually become a full-fidelity read.

**Only investigate if encountered**

- Whether direct CLI control matters more than the extension wrapper.
- Whether the output looks unreduced and should be treated as a full raw read instead.

## First move

1. Start with `ma_smart_read` unless the prompt already names a specific reduction.
2. Use the narrowest tool directly when the desired output is already obvious.
3. If the result needs exact fidelity or looks unreduced, switch to `view`.

## Workflow

1. Use the extension tools first; they match the agent tool surface and apply sensitive-path checks.
2. Summarize only the reduced output you actually need.
3. Treat `ma_smart_read` as best-effort reduction: short files may pass through unchanged, and runtime failures can fall back to raw file contents.
4. If the task becomes editing or line-precise inspection, re-read with a full-fidelity tool.

## Guardrails

- Do not use reduced output as the source of truth for edits.
- If `ma_smart_read` returns content that looks unreduced, treat it as a normal full read and switch tools if exact fidelity matters.
- Use the CLI only when explicit control matters more than the extension wrapper.
- CLI mutation is explicit with `--write`; treat write-capable commands as deliberate operator actions.
- `ma` is offline-only and is not a shell-command proxy.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/ma/SKILL.md`.
- Confirm the top-level file links each local support file directly from `## Reference files`.
- Smoke test the activation boundary:
  - should trigger: `Read @instructions/typescript.instructions.md with reduction first; I only need the structure and duplicate rules.`
  - should not trigger: `Patch @extensions/ma/extension.mjs to change the timeout.`

## Examples

- `Use reduced context first on @README.md; I only need the architecture structure.`
- `Show me just the declarations from @extensions/lore/extension.mjs before I trace the tool surface.`
- `See [assets/examples.md](assets/examples.md) for fuller trigger and near-miss prompts.`

## Reference files

- [`references/tool-surface.md`](references/tool-surface.md) - supported extension tools, fallback behavior, and sensitive-path rules
- [`references/cli-reference.md`](references/cli-reference.md) - CLI commands to use when explicit control matters more than the extension wrapper
- [`assets/examples.md`](assets/examples.md) - richer trigger and near-miss examples for understanding vs. editing
