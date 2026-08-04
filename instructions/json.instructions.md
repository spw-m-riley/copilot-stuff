---
description: 'Guidance for JSON and JSONC files in this workspace'
applyTo: "**/*.json,**/*.jsonc,**/*.code-workspace"
---

# JSON editing guidance

## Guidance

- Preserve the file's existing indentation, quoting style, and key ordering unless there is a strong reason to change them.
- Do not add comments to strict JSON files. Only use comments when the file format explicitly supports them, such as JSONC.
- Avoid trailing commas unless the target format explicitly allows them.
- When editing configuration files, check nearby examples or schemas before adding new keys.
- Do not rewrite lockfiles or generated JSON unless the task explicitly requires it.
- Use the repository's existing formatter, schema, and validation flow for the touched JSON surface when available.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [JSON] When package.json scripts or JSON-owned CI config need CI-aware behavior, never key them off a fake `CIRCLECI` variable; prefer the standard `CI` environment variable or an explicit repo-owned variable with a truthful name - the user explicitly said `CIRCLECI` should not be mentioned for this compatibility case
2. [JSON] When editing `~/.copilot/settings.json`, re-read the current on-disk file immediately before patching and make only minimal current-state edits - the live CLI can rewrite this shared settings file during the same session and stale snapshots can produce incorrect diffs
3. [JSON] When a repo has multiple package roots with their own `package.json` files, model `knip.json` with explicit `workspaces` keyed to those package roots and rebase each workspace's `entry` and `project` globs to that root - flat repo-wide globs misattribute dependencies and create noisy unlisted-dependency results
4. [JSON] When enabling a local Lore inference model, set `localInference.timeoutMs` above the model's measured cold-start latency rather than relying on the 30-second default - Gemma's first real reflection timed out during model loading even though warmed requests completed quickly
