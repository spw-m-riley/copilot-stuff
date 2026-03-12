# CircleCI to GitHub Actions migration

Use this skill when migrating a repository from CircleCI to GitHub Actions.

## Focus

- Translate jobs, executors, workflows, caches, and environment setup.
- Prefer reusable workflows and existing repository patterns where possible.
- Keep rollout safe and easy to validate.

## Workflow

1. Read `.circleci/config.yml` and inventory jobs, commands, executors, filters, caches, and required secrets.
2. Map each workflow and job to a GitHub Actions equivalent.
3. Reuse existing org or repo workflows before creating bespoke jobs.
4. Recreate branch filters, path filters, matrices, caching, artifacts, and concurrency intentionally.
5. Validate any downstream Terraform, CloudFormation, deployment, or branch-protection implications.
6. Compare the new workflow behavior against the old pipeline before removing CircleCI.

## Guardrails

- Preserve secret handling and required permissions explicitly.
- Do not collapse multiple distinct deployment stages into one opaque workflow without a reason.
- Keep runner selection, artifact flow, and cache keys easy to understand.
- Prefer a phased migration when multiple workflows or environments are involved.
