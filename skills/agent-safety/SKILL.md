---
name: agent-safety
description: "Use this skill when building tool-calling agents that need runtime policy controls, audit trails, trust scoring, or rate limits, or when agent plugins need integrity manifests, tamper checks, dependency pinning, or promotion provenance."
metadata:
  category: governance
  audience: general-coding-agent
  maturity: stable
  kind: reference
---

# Agent Safety

Use this skill when an agent needs safety boundaries beyond static code review. It covers two distinct but related concerns, kept as clearly separated reference sections: **governance** (runtime controls over what a running agent may do) and **supply-chain integrity** (verifiable evidence that an agent plugin or tool package has not been tampered with). Consolidates the former `agent-governance` and `agent-supply-chain` skills into one package.

## Use this skill when

- Building AI agents that call APIs, databases, file systems, shell commands, or other external tools and need runtime policy controls (governance).
- Implementing policy-based access controls, semantic intent classification, trust scoring, rate limits, content filters, or audit trails for agent tool usage (governance).
- Adapting governance patterns to frameworks such as PydanticAI, CrewAI, OpenAI Agents SDK, LangChain, or AutoGen (governance).
- Generating or verifying SHA-256 integrity manifests for agent plugins or tool packages before promotion (supply-chain).
- Detecting tampered, modified, missing, or untracked files in agent tool directories, or auditing dependency pinning (supply-chain).
- Building provenance chains for agent plugin promotion from development to staging or production (supply-chain).
- A request says "verify plugin integrity", "generate manifest", "check supply chain", "sign this plugin", "add tool allowlists", or "add audit logs to this agent".

## Do not use this skill when

- The agent runs in a fully trusted environment with no external tool access, no distributable plugin package, and no compliance requirements.
- You only need static code analysis or security review of agent source code for exploitable vulnerabilities; this skill covers runtime governance and supply-chain integrity, not vulnerability hunting. Use the local [`code-review`](../code-review/SKILL.md) skill for evidence-backed review of a diff or PR, or the built-in `security-review` review mode (invoke explicitly, for example via `/security-review`) when the request is specifically to find exploitable vulnerabilities — `security-review` is a built-in review capability, not a file tracked under this repository's `skills/` or `agents/` directories.
- The plugin is a simple local script with no distributable files or production promotion path and no runtime tool-access policy is needed either.
- You are triaging a leaked credential or scanner finding; route to [`secret-scan-triage`](../secret-scan-triage/SKILL.md).

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Runtime tool access needs allow/deny/review policy | Yes (governance) | - |
| Prompt or tool input needs pre-flight threat checks | Yes (governance) | - |
| Agent actions need audit logs or trust scores | Yes (governance) | - |
| Plugin needs a reproducible file manifest or tamper detection | Yes (supply-chain) | - |
| Release pipeline needs an integrity promotion gate | Yes (supply-chain) | - |
| Completed code needs review for exploitable vulnerabilities | No | [`code-review`](../code-review/SKILL.md) for evidence-backed diff review, or the built-in `security-review` review mode for explicit vulnerability hunting |
| Secret scanner found a possible credential | No | [`secret-scan-triage`](../secret-scan-triage/SKILL.md) |

## Navigation

**Governance** — runtime controls over what a running agent may do:

- Start with [`references/governance-patterns.md`](references/governance-patterns.md) to choose the controls: policy object, intent classifier, tool decorator, trust score, audit trail, and governance level.
- Use [`references/governance-framework-integration.md`](references/governance-framework-integration.md) when wiring those controls into a specific agent framework.

**Supply-chain integrity** — verifiable evidence that a plugin package has not been tampered with:

- Use [`references/supply-chain-integrity-patterns.md`](references/supply-chain-integrity-patterns.md) for manifest shape, verification behavior, dependency pinning checks, and promotion gates.
- Use [`references/supply-chain-ci-integration.md`](references/supply-chain-ci-integration.md) when wiring manifest verification into GitHub Actions.

Keep implementation code in the target repository; this skill provides patterns and checks, not a drop-in package. Keep generated manifests in the plugin package only when they are meant to be reviewed, versioned, and promoted with it.

## Guardrails

**Governance:**

- Fail closed: if a governance check errors, deny the action rather than allowing it.
- Keep policy separate from agent business logic so policy can change without rewriting the agent.
- Store policy as configuration where possible, not hardcoded behavior.
- Use most-restrictive-wins semantics when composing org, team, and agent policies.
- Classify dangerous intent before tool execution; output-only checks are too late for destructive tools.
- Make audit logs append-only; mutating or deleting governance events breaks compliance and debugging value.

**Supply-chain integrity:**

- Generate manifests after review-ready source changes, not before ongoing edits.
- Exclude generated build artifacts, dependency directories, caches, and VCS metadata from source integrity manifests.
- Treat missing, modified, and untracked files as separate failure classes so reviewers know what changed.
- Pin dependencies exactly where the ecosystem allows it; floating versions undermine reproducible plugin state.
- Do not use integrity manifests as a substitute for secret scanning or runtime governance.

## Validation

**Governance:**

- Confirm blocked tools raise explicit denial errors with the policy name.
- Confirm content filters catch blocked patterns before tool execution occurs.
- Confirm rate limits count calls correctly and deny at the configured threshold.
- Confirm audit logs capture allowed, denied, and error events for every governed tool call.
- Confirm composed policies use most-restrictive-wins semantics.

**Supply-chain integrity:**

- Generate a manifest on a fresh plugin directory and confirm the file count and chain hash are stable across repeated runs.
- Modify a tracked file and re-run verification; the result must report `MODIFIED`.
- Add an untracked file and re-run verification; the result must report `UNTRACKED`.
- Remove a tracked file and re-run verification; the result must report `MISSING`.
- Run the CI verification flow from [`references/supply-chain-ci-integration.md`](references/supply-chain-ci-integration.md) and confirm it exits 0 for a clean plugin.

- Smoke test:
  - should trigger: "Add tool allowlists and audit logs to this coding agent." (governance)
  - should trigger: "Generate a SHA-256 manifest for this plugin and verify it in CI." (supply-chain)
  - should not trigger: "Find exploitable vulnerabilities in this pull request." (→ built-in `security-review` review mode)

## Examples

- "Add policy checks, rate limits, and audit logging to this support agent before it can call ticket APIs." (governance)
- "Design runtime governance for a multi-agent workflow where workers delegate to other agents based on trust scores." (governance)
- "Lock in the state of `my-agent-plugin/` after code review with an integrity manifest." (supply-chain)
- "Gate our plugin release pipeline on manifest verification and pinned dependencies." (supply-chain)

## Reference files

- [`references/governance-patterns.md`](references/governance-patterns.md) - governance controls, best practices, and implementation checklist
- [`references/governance-framework-integration.md`](references/governance-framework-integration.md) - framework-specific integration notes for PydanticAI, CrewAI, OpenAI Agents SDK, LangChain, and AutoGen
- [`references/supply-chain-integrity-patterns.md`](references/supply-chain-integrity-patterns.md) - manifest schema, verification outcomes, dependency audit, and promotion-gate checklist
- [`references/supply-chain-ci-integration.md`](references/supply-chain-ci-integration.md) - GitHub Actions workflow template for manifest verification in CI
