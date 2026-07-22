---
name: golang-continuous-integration
description: "Use when setting up or fixing Go CI workflows, quality gates, release jobs, or repository automation; not for generic non-Go Actions failures."
metadata:
  category: go
  audience: general-coding-agent
  maturity: draft
  kind: reference
---

# Go Continuous Integration

Use this skill when you are setting up or fixing CI checks, release jobs, lint gates, or repository automation for Go projects.

## Use this skill when

- The task is about GitHub Actions, test automation, release pipelines, or Go repository checks.
- You need to wire lint, test, build, security, or release steps together.
- The work is around automation rather than application logic.

## Do not use this skill when

- The problem is local code behavior, not CI.
- You need generic GitHub Actions triage for a non-Go workflow.
- The issue is dependency drift rather than pipeline design.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Design or improve CI specifically for a Go repository. | Yes | - |
| Diagnose an existing GitHub Actions failure before editing. | No | [`github-actions-failure-triage`](../github-actions-failure-triage/SKILL.md) |
| Upgrade or tidy Go dependencies. | No | [`golang-dependency-management`](../golang-dependency-management/SKILL.md) |

## Guardrails

- Reuse the repository's existing workflow conventions and pinned action versions.
- Keep permissions least-privilege and avoid exposing secrets in logs or fork-triggered jobs.
- Separate fast pull-request checks from slower release or integration workflows when the repository already distinguishes them.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-continuous-integration/SKILL.md`.
- Smoke test:
  - should trigger: "Add lint, test, and release workflows for this Go repository."
  - should not trigger: "Debug why this existing JavaScript Actions job fails."

## Examples

- "Fix the Go test job in this workflow."
- "Add lint and release automation for this Go repo."
- "Review these CI files for Go-specific issues."

## Reference files

- [`references/imported-guide.md`](./references/imported-guide.md) - comprehensive Go CI and release automation guide
- [`references/repo-security.md`](./references/repo-security.md) - repository security settings
- [`assets/claude-code-review.yml`](./assets/claude-code-review.yml) - external review workflow example
- [`assets/codecov.yml`](./assets/codecov.yml) - coverage configuration example
- [`assets/codeql-config.yml`](./assets/codeql-config.yml) - CodeQL configuration example
- [`assets/copilot-review-instructions.md`](./assets/copilot-review-instructions.md) - review instruction example
- [`assets/dependabot-auto-merge.yml`](./assets/dependabot-auto-merge.yml) - dependency auto-merge example
- [`assets/dependabot.yml`](./assets/dependabot.yml) - Dependabot configuration example
- [`assets/docker.yml`](./assets/docker.yml) - container build workflow example
- [`assets/goreleaser-cli.yml`](./assets/goreleaser-cli.yml) - GoReleaser CLI example
- [`assets/goreleaser-lib.yml`](./assets/goreleaser-lib.yml) - GoReleaser library example
- [`assets/goreleaser-monorepo.yml`](./assets/goreleaser-monorepo.yml) - GoReleaser monorepo example
- [`assets/integration.yml`](./assets/integration.yml) - integration test workflow example
- [`assets/lint.yml`](./assets/lint.yml) - lint workflow example
- [`assets/release.yml`](./assets/release.yml) - release workflow example
- [`assets/renovate.json`](./assets/renovate.json) - Renovate configuration example
- [`assets/security.yml`](./assets/security.yml) - security workflow example
- [`assets/test.yml`](./assets/test.yml) - test workflow example
- [`evals/evals.json`](./evals/evals.json) - activation evaluation cases
- [`references/goreleaser-guide.md`](./references/goreleaser-guide.md) - Release Please and GoReleaser v2 release-pipeline guide
- [`references/goreleaser-release-please-config.md`](./references/goreleaser-release-please-config.md) - annotated Release Please and GoReleaser workflow configuration
