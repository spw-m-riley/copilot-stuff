---
name: golang-documentation
description: "Use when writing or reviewing Go doc comments, examples, READMEs, contribution guides, changelogs, package docs, or documentation sites."
metadata:
  kind: reference
---

# Go Documentation

Use this skill when documentation for a Go library, application, CLI, package, or exported API is the primary deliverable.

## Use this skill when

- You are writing or reviewing Go doc comments, package comments, examples, or pkg.go.dev content.
- The task involves README, CONTRIBUTING, CHANGELOG, `llms.txt`, installation, or project documentation.
- You need documentation guidance that differs for a Go library versus an application or CLI.

## Do not use this skill when

- The request is general documentation without a Go-specific surface.
- The task is primarily naming, code style, or test implementation.
- You are designing OpenAPI behavior rather than documenting existing Go APIs.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Write or review Go-specific project and API documentation. | Yes | - |
| Coauthor general documentation through a collaborative workflow. | No | [`doc-coauthoring`](../doc-coauthoring/SKILL.md) |
| Choose Go naming conventions. | No | [`golang-naming`](../golang-naming/SKILL.md) |
| Implement executable Go examples as tests. | No | [`golang-testing`](../golang-testing/SKILL.md) |

## Guardrails

- Document intent, constraints, error behavior, and usage rather than paraphrasing signatures.
- Preserve modality and avoid invented rationale, marketing language, or unsupported guarantees.
- Keep examples executable and align project docs with the repository's actual commands and behavior.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-documentation/SKILL.md`.
- Smoke test:
  - should trigger: "Add accurate godoc comments and examples for this exported Go API."
  - should not trigger: "Rewrite this product strategy document collaboratively."

## Examples

- "Review these exported Go comments for pkg.go.dev quality."
- "Write a README and contribution guide for this Go CLI."
- "Add executable examples for this library API."

## Reference files

- [`references/imported-guide.md`](./references/imported-guide.md) - comprehensive Go documentation guide
- [`references/application.md`](./references/application.md) - application and CLI documentation
- [`references/code-comments.md`](./references/code-comments.md) - doc-comment and inline-comment guidance
- [`references/library.md`](./references/library.md) - library and pkg.go.dev guidance
- [`references/project-docs.md`](./references/project-docs.md) - project-level documentation guidance
- [`assets/templates/CHANGELOG.md`](./assets/templates/CHANGELOG.md) - changelog template
- [`assets/templates/CONTRIBUTING.md`](./assets/templates/CONTRIBUTING.md) - contribution guide template
- [`assets/templates/README.md`](./assets/templates/README.md) - README template
- [`assets/templates/llms.txt`](./assets/templates/llms.txt) - llms.txt template
- [`evals/evals.json`](./evals/evals.json) - behavioral evaluation cases
