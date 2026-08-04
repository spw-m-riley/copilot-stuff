---
description: 'Guidance for Markdown files in this workspace'
applyTo: "**/*.md"
---

# Markdown guidance

## Guidance

- Keep Markdown concise, scannable, and repo-relative.
- Prefer headings, short sections, and simple tables over dense prose when structure helps readers scan faster.
- Keep Mermaid diagrams small enough to stay readable in GitHub's renderer; prefer simpler layouts over wide, deeply nested graphs.
- Put detailed operational docs with the owning surface when a nested tool, extension, or package already has its own docs, and keep the root README high-level.
- Preview syntax-sensitive Markdown changes in GitHub-flavored rendering when they touch Mermaid, tables, or complex formatting.
- Verify linked files and examples use stable repo-relative paths that actually exist.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [MARKDOWN] In Mermaid flowcharts intended for GitHub README rendering, prefer quoted node labels and avoid inline edge text when labels contain punctuation or parentheses - GitHub's Mermaid parser is stricter than permissive examples and rejected an unquoted `Response (output tokens)` node plus annotated edge syntax
2. [MARKDOWN] In Mermaid flowcharts intended for GitHub README rendering, prefer top-down layouts and short labels once a diagram has nested groups or more than a few nodes - GitHub's renderer shrinks wide diagrams aggressively, which made the context-window diagram hard to read until it was simplified and stacked vertically
3. [MARKDOWN] In Mermaid flowcharts intended for GitHub README rendering, use explicit fill and stroke styling for major groups when category distinctions matter - GitHub's default dark-theme rendering can collapse nested diagrams into low-contrast grey boxes that are harder to read
4. [MARKDOWN] In nested skill support files under `assets/` or `references/`, resolve relative links from the support file's own directory instead of the package root - a sibling-skill link that looked right in `SKILL.md` was broken in a nested reference file until the path was adjusted from `../` to `../../`
5. [DOCS] Only add generated screenshots or VHS demos to user-facing documentation when they clarify the actual reader workflow; do not include validation-command recordings as decorative media because they are noisy and unhelpful for learning the feature
