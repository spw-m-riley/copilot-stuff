---
description: 'Guidance for YAML files in this workspace'
applyTo: "**/*.{yml,yaml}"
---

# YAML guidance

## Purpose and Scope

- Applies to `**/*.{yml,yaml}` files in this workspace.
- Use these rules to keep YAML edits explicit, reviewable, and consistent with repository schema expectations.

## Core Guidance

- Keep YAML focused on clear structured data, not embedded logic or shell-heavy indirection.
- Prefer existing schema shape, key naming, and repository conventions before introducing new patterns.
- Prefer existing project tooling; when formatting YAML, favor `oxfmt` over `prettier` or `biome` unless the repository already standardizes otherwise.
- Use anchors and aliases sparingly; only reuse them when they make repeated structure clearer rather than harder to scan.
- Be explicit about booleans, strings, nulls, and multiline blocks when type or parsing behavior matters.
- Keep environment-specific values, secret references, and generated data easy to identify and trace.

## Validation Expectations

- Run the repository's standard formatter, linter, and schema-aware checks for the touched YAML surface when they exist.
- When the change touches `.github/workflows/`, also follow `github-workflows.instructions.md` and run `actionlint`.

## Maintenance Notes

- Keep `## Learned Rules` as the final section in the file; do not add new sections after it.
- Append new learned rules without renumbering existing entries; numbering gaps can reflect archived or superseded rules.
- Use `[YAML]` for YAML-specific learned rules in this file and keep broader automation policy in the more specific workflow file or the root instructions.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
