---
name: human-setup-wizard
description: "Use when generating a human-only setup walkthrough for accounts, credentials, or external service configuration that a person must run manually, with confirmation gates and safe secret handling; never for agent-executed or end-to-end setup."
metadata:
  category: authoring
  audience: general-coding-agent
  maturity: draft
  kind: task
---

# Human setup wizard

Use this skill to generate a setup walkthrough a human runs by hand — never a script this or any agent executes end-to-end. The output guides a person through account creation, credential generation, or external service configuration with explicit confirmation gates and safe secret handling.

## Use this skill when

- The user needs a step-by-step walkthrough for a human to follow manually: creating accounts, generating API keys, configuring an external service, or any setup involving a UI, third-party signup, or credentials an agent should not handle directly.
- Some steps are irreversible, billing-relevant, destructive, or externally visible and need an explicit confirmation gate before the reader proceeds.
- The walkthrough will involve credentials or secrets that must never be written into the artifact as real values.
- The walkthrough itself needs review, but running it end-to-end is not appropriate or possible for an agent to do safely.

## Do not use this skill when

- The setup is fully automatable with no human-only steps — write a normal script or CI step instead.
- The task is documentation prose with no manual walkthrough structure (a README, a guide, a runbook) — use [`doc-coauthoring`](../doc-coauthoring/SKILL.md).
- Existing secrets are already exposed in the repository and need triage — use [`secret-scan-triage`](../secret-scan-triage/SKILL.md).
- The user wants the agent to actually perform the setup steps itself right now — that is out of scope for this skill regardless of how the request is phrased.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Generate a manual walkthrough for a human to run themselves | Yes | - |
| Fully automatable setup with no human-only steps | No | write a script or CI step directly |
| General documentation authoring with no walkthrough structure | No | [`doc-coauthoring`](../doc-coauthoring/SKILL.md) |
| Already-exposed secrets need triage | No | [`secret-scan-triage`](../secret-scan-triage/SKILL.md) |
| User wants the agent to run the setup steps itself | No | decline and explain why; this skill only produces the walkthrough |

## Inputs to gather

**Required before drafting**

- What is being set up: the service, tool, or environment, and why.
- Which steps require a human (account creation, external UI, credential generation) versus which could be automated.
- Any credentials or secrets the setup will produce, and where they should ultimately live.

**Helpful if present**

- The target platform or environment (local machine, CI runner, a specific OS).
- Existing internal conventions for secret storage (password manager, secret store, env var naming).
- Any org-specific prerequisites (existing accounts, access levels) the reader must already have.

**Only investigate if encountered**

- A step that looks automatable but the user insists must stay manual — confirm the reason before drafting.
- A suspected existing secret exposure discovered while gathering context — route it to `secret-scan-triage` instead of folding it into the walkthrough.

## First move

1. Confirm which steps are genuinely human-only and why an agent should not perform them directly.
2. Identify every irreversible, billing-relevant, destructive, or externally visible step that needs a confirmation gate using [`references/confirmation-gates.md`](references/confirmation-gates.md).
3. Start from [`assets/setup-walkthrough-template.md`](assets/setup-walkthrough-template.md), written fresh for this specific setup rather than copied from any vendor's own onboarding content.

## Workflow

1. Draft the walkthrough from [`assets/setup-walkthrough-template.md`](assets/setup-walkthrough-template.md), writing each step in imperative, precise language.
2. Insert a confirmation gate immediately before every step that qualifies per [`references/confirmation-gates.md`](references/confirmation-gates.md).
3. For every credential the setup produces, add explicit storage guidance using [`references/secret-handling.md`](references/secret-handling.md) — never a real secret value in the artifact.
4. Add a final check section describing observable outcomes that confirm the setup succeeded.
5. Review the draft statically: check step order, gate placement, secret-handling completeness, and template fidelity — do not attempt to execute any step, click through any external UI, or generate a real credential to test the walkthrough.
6. Hand the completed walkthrough to the user to run themselves; do not proceed to perform any of its steps as part of this skill.

## Outputs

- A complete setup walkthrough using [`assets/setup-walkthrough-template.md`](assets/setup-walkthrough-template.md), written fresh for the specific setup.
- Confirmation gates placed before every irreversible, billing-relevant, destructive, or externally visible step.
- Explicit, placeholder-only credential handling guidance for every secret the setup produces.
- A static review note confirming step order, gate placement, and secret-handling completeness — not an execution result.

## Guardrails

- Never execute the walkthrough end-to-end, click through an external service, or generate a real credential as part of this skill; the deliverable is the document, not a completed setup.
- Never write a real secret, token, or credential value into the artifact; use placeholders per [`references/secret-handling.md`](references/secret-handling.md).
- Add a confirmation gate before every irreversible, billing-relevant, destructive, or externally visible step; do not let the reader move through these on autopilot.
- Write the walkthrough fresh and vendor-neutral for the specific task; do not copy a vendor's own onboarding wizard content wholesale.
- Validation of this skill's output is static only — reviewing the document's structure and content — never a live end-to-end run.

## Validation

- Confirm every irreversible, billing-relevant, destructive, or externally visible step has a confirmation gate per [`references/confirmation-gates.md`](references/confirmation-gates.md).
- Confirm no real secret, token, or credential value appears anywhere in the artifact; only placeholders and storage guidance per [`references/secret-handling.md`](references/secret-handling.md).
- Confirm the walkthrough was written fresh for this task, not copied wholesale from a vendor's own wizard content.
- Confirm this skill's own review was static (document read-through) and did not execute any step or contact an external service.
- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/human-setup-wizard/SKILL.md`.
- Smoke test:
  - should trigger: "Write a manual setup walkthrough for connecting our CI to a new cloud provider account, with confirmation gates before anything destructive."
  - should not trigger: "Add a secret-handling policy check to this agent's tool permissions." (→ `agent-safety`)

## Examples

- "Generate a human-only walkthrough for creating a new service account and API key for this integration, with a confirmation gate before the old key is revoked."
- "Write the manual steps for onboarding a new environment, including where to store the generated credentials — don't execute any of it yourself."
- "Draft a setup checklist for a teammate to configure their local dev environment against a new external API, with a stop-and-confirm before enabling billing."

## Reference files

- [`references/confirmation-gates.md`](references/confirmation-gates.md) - when a step needs an explicit stop-and-confirm gate and how to format it
- [`references/secret-handling.md`](references/secret-handling.md) - safe placeholder and storage guidance for credentials produced during setup
- [`assets/setup-walkthrough-template.md`](assets/setup-walkthrough-template.md) - fresh, vendor-neutral starting template for a human-only setup walkthrough
