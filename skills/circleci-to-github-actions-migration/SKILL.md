---
name: circleci-to-github-actions-migration
description: Migrate a repository from CircleCI to GitHub Actions with clear parity and rollout checks.
metadata:
  category: migrations
  audience: general-coding-agent
  maturity: stable
---

# CircleCI to GitHub Actions migration

## Use this skill when

- You need to replace or phase out `.circleci/config.yml` with GitHub Actions workflows.
- The migration must preserve current CI behavior across build, test, deploy, caching, and artifacts.
- You need an incremental rollout path with low-risk parity checks.

## Do not use this skill when

- The repository is already fully on GitHub Actions and you only need minor workflow tuning.
- You are designing a brand-new CI pipeline with no CircleCI behavior to preserve.
- You are migrating between other CI systems (for example, Jenkins to GitHub Actions).

## Inputs to gather

**Required before editing**

- `.circleci/config.yml` (jobs, workflows, filters, executors, contexts, caches, artifacts).
- Existing `.github/workflows/*.yml` files or reusable workflows already in use.
- Required secrets, protected environments, deployment gates, and branch protections.

**Helpful if present**

- Recent successful CircleCI runs for timing and artifact parity checks.
- Repository scripts for build, lint, test, package, and release.

**Only investigate if encountered**

- Downstream infra or release automation that expects CircleCI-specific artifacts or status contexts.

## First move

1. Read `.circleci/config.yml` end-to-end and create a concept map using `references/concept-mapping.md`.
2. Draft one representative GitHub Actions workflow from `assets/workflow-skeleton.yml`.
3. Validate trigger, matrix, cache, and secret parity for that workflow before translating the rest.

## Workflow

1. Inventory CircleCI jobs, commands, workflows, filters, contexts, cache keys, and artifacts.
2. Translate concepts using `references/concept-mapping.md`.
3. Create or update GitHub Actions workflows with explicit triggers, `permissions`, runner choices, and concurrency.
4. Recreate branch/path filters, matrix strategy, caches, artifacts, and environment protections intentionally.
5. Keep deployment stages explicit instead of collapsing distinct environments into one opaque job.
6. Run a staged rollout using `assets/rollout-checklist.md` before deleting CircleCI configuration.

## Guardrails

- **Must** preserve behavior for triggers, required checks, artifacts, and deployment protections.
- **Must** define secret usage and job `permissions` explicitly.
- **Should** migrate incrementally (shadow run or staged cutover) for multi-workflow repositories.
- **Should** keep workflows readable and deterministic rather than embedding heavy shell logic.
- **May** reuse existing reusable workflows where they preserve parity.

## Validation

- Run repository build/test/lint commands locally where practical before relying on workflow runs.
- Compare CircleCI and GitHub Actions outcomes for the same branch or commit range.
- Confirm required checks, protected branches, and deploy approvals behave as expected.
- Only remove `.circleci/config.yml` after successful parity and rollout checks.

## Examples

- “Migrate this CircleCI pipeline to GitHub Actions and keep staging and production deploys separate.”
- “Translate CircleCI test/build/release workflows with equivalent caching and branch filters.”
- “Plan a low-risk CircleCI retirement with shadow runs and rollback checkpoints.”

## Reference files

- [CircleCI to Actions concept mapping](references/concept-mapping.md)
- [Workflow skeleton](assets/workflow-skeleton.yml)
- [Rollout checklist](assets/rollout-checklist.md)
