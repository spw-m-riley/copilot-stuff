---
description: 'Guidance for YAML files in this workspace'
applyTo: "**/*.{yml,yaml}"
---

# YAML guidance

## Guidance

- Keep YAML focused on clear structured data, not embedded logic or shell-heavy indirection.
- Prefer existing schema shape, key naming, and repository conventions before introducing new patterns.
- Prefer existing project tooling; when formatting YAML, favor `oxfmt` over `prettier` or `biome` unless the repository already standardizes otherwise.
- Use anchors and aliases sparingly; only reuse them when they make repeated structure clearer rather than harder to scan.
- Be explicit about booleans, strings, nulls, and multiline blocks when type or parsing behavior matters.
- Keep environment-specific values, secret references, and generated data easy to identify and trace.
- Run the repository's standard formatter, linter, and schema-aware checks for the touched YAML surface when they exist.
- When the change touches `.github/workflows/`, also follow `github-workflows.instructions.md` and run `actionlint`.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
