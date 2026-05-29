# Cloud-agent checklist

Use this checklist before adding or changing cloud-agent customization.

## Allowance

- Confirm the target repository allows remote/cloud coding agents.
- If policy forbids remote agents, stop and do not add setup.

## Setup

- Identify dependency install commands from package manager files, README, and CI.
- Identify build, lint, test, and smoke-test commands from existing scripts.
- Keep setup commands deterministic and non-interactive.
- Avoid commands that require local-only credentials or GUI approval.

## Safety

- Do not include secrets, tokens, private paths, or local credential helper details.
- Do not bypass configured signing or authentication flows.
- Do not add broad generic instructions that duplicate the repository README.

## Handoff

- Document what the cloud agent should report: branch, PR, validation commands, and known blockers.
- Route PR creation and check watching to the repository's normal GitHub CLI workflow when available.
