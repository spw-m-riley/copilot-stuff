---
name: agent-supply-chain
description: "Use this skill when agent plugins need integrity manifests, tamper checks, dependency pinning, or promotion provenance."
metadata:
  category: governance
  audience: general-coding-agent
  maturity: stable
  kind: reference
---

# Agent Supply Chain Integrity

Use this skill to generate and verify integrity evidence for agent plugins, MCP servers, and tool packages before promotion.

## Use this skill when

- Generating SHA-256 integrity manifests for agent plugins or tool packages before promotion.
- Verifying that installed plugins match their published manifests.
- Detecting tampered, modified, missing, or untracked files in agent tool directories.
- Auditing dependency pinning and version policies for agent components.
- Building provenance chains for agent plugin promotion from development to staging or production.
- A request says "verify plugin integrity", "generate manifest", "check supply chain", or "sign this plugin".

## Do not use this skill when

- The plugin is a simple local script with no distributable files or production promotion path.
- You need runtime policy controls for an agent's tool calls; use [`agent-governance`](../agent-governance/SKILL.md).
- You are triaging a leaked credential or scanner finding; route to [`secret-scan-triage`](../secret-scan-triage/SKILL.md).

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Plugin needs a reproducible file manifest | Yes | - |
| Installed plugin may have been tampered with | Yes | - |
| Release pipeline needs an integrity promotion gate | Yes | - |
| Runtime tool calls need allow/deny policy | No | [`agent-governance`](../agent-governance/SKILL.md) |
| Secret scanner found a possible credential | No | [`secret-scan-triage`](../secret-scan-triage/SKILL.md) |

## Navigation

- Use [`references/integrity-patterns.md`](references/integrity-patterns.md) for manifest shape, verification behavior, dependency pinning checks, and promotion gates.
- Use [`references/ci-integration.md`](references/ci-integration.md) when wiring manifest verification into GitHub Actions.
- Keep generated manifests in the plugin package only when they are meant to be reviewed, versioned, and promoted with the package.

## Guardrails

- Generate manifests after review-ready source changes, not before ongoing edits.
- Exclude generated build artifacts, dependency directories, caches, and VCS metadata from source integrity manifests.
- Treat missing, modified, and untracked files as separate failure classes so reviewers know what changed.
- Pin dependencies exactly where the ecosystem allows it; floating versions undermine reproducible plugin state.
- Do not use integrity manifests as a substitute for secret scanning or runtime governance.

## Validation

- Generate a manifest on a fresh plugin directory and confirm the file count and chain hash are stable across repeated runs.
- Modify a tracked file and re-run verification; the result must report `MODIFIED`.
- Add an untracked file and re-run verification; the result must report `UNTRACKED`.
- Remove a tracked file and re-run verification; the result must report `MISSING`.
- Run the CI verification flow from [`references/ci-integration.md`](references/ci-integration.md) and confirm it exits 0 for a clean plugin.
- Smoke test:
  - should trigger: "Generate a SHA-256 manifest for this plugin and verify it in CI."
  - should not trigger: "Add runtime tool allowlists to this agent." (-> `agent-governance`)

## Examples

- "Lock in the state of `my-agent-plugin/` after code review with an integrity manifest."
- "Verify that the deployed plugin still matches the last reviewed manifest."
- "Gate our plugin release pipeline on manifest verification and pinned dependencies."

## Reference files

- [`references/integrity-patterns.md`](references/integrity-patterns.md) - manifest schema, verification outcomes, dependency audit, and promotion-gate checklist
- [`references/ci-integration.md`](references/ci-integration.md) - GitHub Actions workflow template for manifest verification in CI
