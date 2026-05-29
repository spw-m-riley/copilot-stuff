---
name: create-github-action-workflow-specification
description: "Use when asked to create a formal specification for an existing GitHub Actions workflow; not when debugging a failing workflow run."
metadata:
  category: ci
  audience: general-coding-agent
  maturity: draft
  kind: task
---

# Create GitHub Action Workflow Specification

Use this skill to document what a GitHub Actions workflow does, its triggers, contracts, quality gates, constraints, and change-management expectations.

## Use this skill when

- The user asks for a GitHub Actions workflow specification.
- An existing workflow needs implementation-agnostic documentation for maintenance.
- CI/CD behavior, contracts, and quality gates need to be captured for AI consumption.

## Do not use this skill when

- A GitHub Actions run is currently failing; use `github-actions-failure-triage`.
- The task is migrating CircleCI to GitHub Actions; use `circleci-to-github-actions-migration`.
- The task is editing YAML directly without writing a spec; use the relevant workflow or YAML guidance.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Create a behavior specification for an existing workflow | Yes | - |
| Diagnose a failing workflow run | No | `github-actions-failure-triage` |
| Migrate CI from CircleCI | No | `circleci-to-github-actions-migration` |

## Inputs to gather

**Required before editing**

- Workflow file path.
- Workflow purpose and owner if not obvious from the repository.
- Target spec location, defaulting to `spec/spec-process-cicd-[workflow-name].md`.

**Helpful if present**

- Known environments, secrets, variables, and approvals.
- Related dependent workflows or deployment systems.
- Performance, security, or compliance requirements.

**Only investigate if encountered**

- Organization workflow standards if present.
- Recent workflow runs only if they clarify behavior, not for failure triage.

## First move

1. Read the workflow YAML and any nearby CI documentation.
2. Extract the primary purpose, triggers, jobs, dependencies, inputs, outputs, permissions, and quality gates.
3. Choose the spec path and normalize the workflow name for `spec-process-cicd-[workflow-name].md`.

## Workflow

1. Create an implementation-agnostic specification focused on what the workflow accomplishes.
2. Document overview, trigger events, target environments, job/dependency flow, requirements matrix, inputs/outputs, secrets, constraints, error handling, quality gates, monitoring, integrations, compliance, edge cases, validation criteria, and change management.
3. Use tables and concise structured prose for token-efficient AI consumption.
4. Include a Mermaid flow diagram when the workflow has meaningful job dependencies.
5. Avoid copying low-level commands or tool versions unless they define an observable contract.

## Outputs

- A workflow specification markdown file under the chosen spec location.
- A summary of workflow contracts and any assumptions or missing ownership details.
- No direct workflow behavior changes unless separately requested.

## Guardrails

- Do not expose secret values; document names and purposes only.
- Do not claim governance requirements that are not present in the workflow or docs.
- Keep the spec implementation-agnostic and maintainable.

## Validation

- Run markdown checks if available; otherwise compare the spec against the workflow for trigger, job, permission, secret, and output coverage.
- Smoke test: should trigger for "Create a specification for .github/workflows/ci.yml."
- Smoke test: should not trigger for "CI failed on main"; use `github-actions-failure-triage`.

## Examples

- "Create a formal spec for our release workflow."
- "Document what .github/workflows/terraform.yml guarantees and requires."
- "Write an AI-optimized specification for the CI workflow."

## Reference files

- [`references/upstream-notes.md`](references/upstream-notes.md) - normalized notes from the upstream awesome-copilot skill used for this local fork

## Learned Rules

No learned rules yet.
