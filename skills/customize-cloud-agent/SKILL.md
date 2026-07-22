---
name: customize-cloud-agent
description: "Use when configuring cloud coding-agent instructions, setup scripts, environments, or repository-specific behavior."
metadata:
  kind: task
---

# Customize cloud agent

Use this skill when a repository needs cloud-agent customization rather than local-only Copilot CLI behavior.

## Use this skill when

- Configuring cloud coding-agent instructions, setup steps, or environment assumptions.
- Adapting repository behavior so a remote agent can install dependencies, run tests, and respect project conventions.
- Auditing whether cloud-agent instructions are stale, too broad, or missing key bootstrap steps.
- Separating cloud-agent setup from local-only workflows, credentials, and machine-specific paths.

## Do not use this skill when

- The active workflow explicitly disallows GitHub-side remote coding agents.
- You are updating local Copilot CLI instructions in this `~/.copilot` repo; route to [`init`](../init/SKILL.md).
- You are creating a reusable skill package; route to [`skill-authoring`](../skill-authoring/SKILL.md).
- The task is only CI workflow repair; route to the relevant GitHub Actions or CI skill.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Remote/cloud agent bootstrap needs repository-specific setup | Yes | - |
| Local Copilot CLI instructions need maintenance | No | [`init`](../init/SKILL.md) |
| This repo's policy forbids remote coding agents | No | stop and surface the policy |
| GitHub Actions run is failing | No | [`github-actions-failure-triage`](../github-actions-failure-triage/SKILL.md) |

## Inputs to gather

- Target repository and cloud-agent platform or harness.
- Existing instruction files, setup scripts, devcontainer files, and CI commands.
- Required dependency installation, build, test, lint, and formatting commands.
- Secrets, credentials, signing, or network assumptions that must not be embedded in repo files.
- Local-only workflows that remote agents must avoid.

## First move

1. Confirm cloud agents are allowed for the target repository.
2. Inventory existing agent instructions and bootstrap files.
3. Compare required setup commands with CI and README commands before adding new guidance.

## Workflow

1. Identify the remote-agent lifecycle: checkout, setup, dependency install, validation, branch/PR handoff.
2. Keep instructions concise and repository-specific; move tutorials or broad docs elsewhere.
3. Add or update setup guidance only for non-obvious steps not already enforced by tooling.
4. Avoid machine-specific paths, local credential assumptions, and secrets.
5. Validate the documented commands in a clean local approximation or existing CI path when possible.

## Outputs

- Updated cloud-agent instructions or setup notes scoped to the target repository.
- A list of commands the cloud agent should run for install, build, test, lint, and handoff.
- Clear exclusions for local-only credentials, signing flows, or unsupported remote-agent behavior.

## Guardrails

- Do not configure cloud agents in repositories where the active policy says they are not allowed.
- Never commit secrets, tokens, private machine paths, or local credential-helper assumptions.
- Do not duplicate CI configuration or README content unless the agent needs a non-obvious operational caveat.
- Keep local Copilot CLI behavior separate from cloud-agent customization.

## Validation

- Verify referenced files and commands exist.
- Confirm setup instructions do not contain secrets or user-specific absolute paths.
- Confirm the documented validation command matches CI or the repository's package scripts.
- Smoke test:
  - should trigger: "Update the cloud coding-agent setup so it installs deps and runs the right tests."
  - should not trigger: "Update this local ~/.copilot instruction file." (-> `init`)

## Examples

- "Customize the cloud agent setup for this repo so it runs the same test command as CI."
- "Audit the cloud coding-agent instructions and remove local-only assumptions."
- "Add remote-agent bootstrap guidance without committing credentials or machine-specific paths."

## Reference files

- [`references/cloud-agent-checklist.md`](references/cloud-agent-checklist.md) - cloud-agent setup and safety checklist
- [`../init/SKILL.md`](../init/SKILL.md) - local agent instruction-file maintenance workflow
