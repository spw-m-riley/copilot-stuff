---
applyTo: "**/*.json,**/*.jsonc,**/*.code-workspace"
---

# JSON editing guidance

- Prefer minimal edits so diffs stay easy to review.
- Preserve the file's existing indentation, quoting style, and key ordering unless there is a strong reason to change them.
- Do not add comments to strict JSON files. Only use comments when the file format explicitly supports them, such as JSONC.
- Avoid trailing commas unless the target format explicitly allows them.
- When editing configuration files, check nearby examples or schemas before adding new keys.
- Do not rewrite lockfiles or generated JSON unless the task explicitly requires it.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
