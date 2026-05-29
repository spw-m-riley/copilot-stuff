# Agent governance patterns

Use this reference to choose the smallest runtime controls that match the agent's risk level.

## Core flow

```text
User request -> Intent classification -> Policy check -> Tool execution -> Audit log
                    |                     |              |
              threat detection       allow/deny/review   trust update
```

## Pattern summary

| Pattern | Purpose | Key checks |
| --- | --- | --- |
| Governance policy | Define what an agent may do | Allowed tools, blocked tools, blocked content patterns, max calls, human-review tools |
| Policy composition | Layer org, team, and agent policy | Deny overrides allow; rate limits choose the strictest value |
| Intent classification | Detect dangerous prompts before tools run | Data exfiltration, privilege escalation, destructive system changes, prompt injection |
| Tool-level wrapper | Enforce policy around each tool call | Check tool name, rate limit, string arguments, execution result, audit entry |
| Trust scoring | Track delegate reliability over time | Success/failure counts, temporal decay, operation thresholds |
| Audit trail | Preserve accountability | Append-only allowed/denied/error events with agent id, tool, policy, and details |

## Governance levels

| Level | Controls | Use case |
| --- | --- | --- |
| Open | Audit only, no restrictions | Internal development and testing |
| Standard | Tool allowlist plus content filters | General production agents |
| Strict | Standard controls plus human approval for sensitive tools | Financial, healthcare, legal, or customer-impacting tools |
| Locked | Allowlist only, no dynamic tools, full audit | Compliance-critical systems |

## Implementation checklist

- [ ] Define the governance policy: allowed tools, blocked tools, blocked patterns, rate limit, and review-required tools.
- [ ] Choose a governance level that matches the agent's operational risk.
- [ ] Apply the policy wrapper to every tool function, not just high-risk tools.
- [ ] Add pre-flight intent classification before any tool dispatch.
- [ ] Add trust scoring when agents delegate work or choose between worker agents.
- [ ] Export append-only audit events in a format the system can inspect later.
- [ ] Test blocked tools, blocked content, rate limiting, policy composition, and audit coverage.

## Best practices

- Store policy in YAML or JSON when policy owners need to change controls without a deploy.
- Use most-restrictive-wins for composed policy so team policy cannot weaken org policy accidentally.
- Keep governance independent from business logic; a domain tool should not decide its own eligibility.
- Decay trust scores over time so old success does not permanently authorize sensitive work.
- Include denied actions in audit trails; denial events are often the most useful security signal.
