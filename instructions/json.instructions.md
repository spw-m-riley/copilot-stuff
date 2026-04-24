---
description: 'Guidance for JSON and JSONC files in this workspace'
applyTo: "**/*.json,**/*.jsonc,**/*.code-workspace"
---

# JSON editing guidance

## Purpose and Scope

- Applies to `**/*.json`, `**/*.jsonc`, and `**/*.code-workspace` files in this workspace.
- Use these rules for low-churn JSON and JSONC edits that preserve structure, schema expectations, and generated-file safety.

## Core Guidance

- Prefer minimal edits so diffs stay easy to review.
- Preserve the file's existing indentation, quoting style, and key ordering unless there is a strong reason to change them.
- Do not add comments to strict JSON files. Only use comments when the file format explicitly supports them, such as JSONC.
- Avoid trailing commas unless the target format explicitly allows them.
- When editing configuration files, check nearby examples or schemas before adding new keys.
- Do not rewrite lockfiles or generated JSON unless the task explicitly requires it.

## Validation Expectations

- Use the repository's existing formatter, schema, and validation flow for the touched JSON surface when available.
- Avoid broad rewrites of generated JSON or lockfiles unless the task explicitly requires them and the repository's normal regeneration flow is part of the change.

## Maintenance Notes

- Keep `## Learned Rules` as the final section in the file; do not add new sections after it.
- Append new learned rules without renumbering existing entries; numbering gaps can reflect archived or superseded rules.
- Use `[JSON]` for JSON-specific learned rules in this file; `[OTHER]` is also acceptable here for cross-cutting config-policy rules that are anchored to JSON-owned files.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [OTHER] When package.json scripts or JSON-owned CI config need CI-aware behavior, never key them off a fake `CIRCLECI` variable; prefer the standard `CI` environment variable or an explicit repo-owned variable with a truthful name - the user explicitly said `CIRCLECI` should not be mentioned for this compatibility case
2. [OTHER] When editing `~/.copilot/settings.json`, re-read the current on-disk file immediately before patching and make only minimal current-state edits - the live CLI can rewrite this shared settings file during the same session and stale snapshots can produce incorrect diffs
