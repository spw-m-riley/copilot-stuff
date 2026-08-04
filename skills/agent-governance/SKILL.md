---
name: agent-governance
description: "Use this skill when building tool-calling agents that need policy controls, audit trails, trust scoring, or rate limits."
metadata:
  category: governance
  audience: general-coding-agent
  maturity: stable
  kind: reference
---

# Agent Governance Patterns

Use this skill when an agent can call external tools and needs runtime safety boundaries rather than just static review.

## Use this skill when

- Building AI agents that call APIs, databases, file systems, shell commands, or other external tools.
- Implementing policy-based access controls for agent tool usage.
- Adding semantic intent classification to detect dangerous prompts before tool execution.
- Creating trust scoring systems for multi-agent workflows.
- Building append-only audit trails for agent actions and decisions.
- Enforcing rate limits, content filters, or tool restrictions on agents.
- Adapting governance patterns to frameworks such as PydanticAI, CrewAI, OpenAI Agents SDK, LangChain, or AutoGen.

## Do not use this skill when

- The agent runs in a fully trusted environment with no external tool access and no compliance requirements.
- You only need static code analysis or security review of agent source code; this skill covers runtime governance patterns.
- You are generating integrity manifests, dependency pinning audits, or promotion provenance for plugins; route to [`agent-supply-chain`](../agent-supply-chain/SKILL.md).

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Runtime tool access needs allow/deny/review policy | Yes | - |
| Prompt or tool input needs pre-flight threat checks | Yes | - |
| Agent actions need audit logs or trust scores | Yes | - |
| Plugin package needs SHA-256 manifest or tamper detection | No | [`agent-supply-chain`](../agent-supply-chain/SKILL.md) |
| Completed code needs security review for vulnerabilities | No | security-review agent |

## Navigation

- Start with [`references/patterns.md`](references/patterns.md) to choose the governance controls: policy object, intent classifier, tool decorator, trust score, audit trail, and governance level.
- Use [`references/framework-integration.md`](references/framework-integration.md) when wiring those controls into a specific agent framework.
- Keep implementation code in the target repository; this skill provides patterns and checks, not a drop-in package.

## Guardrails

- Fail closed: if a governance check errors, deny the action rather than allowing it.
- Keep policy separate from agent business logic so policy can change without rewriting the agent.
- Store policy as configuration where possible, not hardcoded behavior.
- Use most-restrictive-wins semantics when composing org, team, and agent policies.
- Classify dangerous intent before tool execution; output-only checks are too late for destructive tools.
- Make audit logs append-only; mutating or deleting governance events breaks compliance and debugging value.

## Validation

- Confirm blocked tools raise explicit denial errors with the policy name.
- Confirm content filters catch blocked patterns before tool execution occurs.
- Confirm rate limits count calls correctly and deny at the configured threshold.
- Confirm audit logs capture allowed, denied, and error events for every governed tool call.
- Confirm composed policies use most-restrictive-wins semantics.
- Smoke test:
  - should trigger: "Add tool allowlists and audit logs to this coding agent."
  - should not trigger: "Generate a SHA-256 manifest for this plugin bundle." (-> `agent-supply-chain`)

## Examples

- "Add policy checks, rate limits, and audit logging to this support agent before it can call ticket APIs."
- "Design runtime governance for a multi-agent workflow where workers delegate to other agents based on trust scores."
- "Add pre-flight prompt threat classification before this database agent can execute queries."

## Reference files

- [`references/patterns.md`](references/patterns.md) - governance controls, best practices, and implementation checklist
- [`references/framework-integration.md`](references/framework-integration.md) - framework-specific integration notes for PydanticAI, CrewAI, OpenAI Agents SDK, LangChain, and AutoGen
