# ADR 001: Waffle Multi-Role Orchestrator with Rotating Adversary

**Status:** Accepted  
**Date:** 2026-06-12  
**Deciders:** Matt  

## Context

Matt needs specialist agents to handle complex tasks involving multiple domains (security, devops, test, documentation, cloud architecture). A single monolithic agent reviewing all angles is inefficient and error-prone. Instead, delegate to role-specific experts and integrate adversarial challenge to refine proposals before surfacing them.

## Decision

Implement **Waffle**, a multi-role orchestrator agent that:

1. **Delegates to role-specific subagents** — security, devops, test, documentation, cloud architect — discovered via skill registry.
2. **Integrates a rotating adversary** — not a separate post-hoc pass, but woven into the orchestration loop. The adversary adapts its critical lens based on proposal context.
3. **Hybrid subagent model** — role-specific agents/skills discovered via skill registry (not registry file, not runtime role assumption alone).
4. **Auto-loop on conflict** — when adversary surfaces issues, orchestrator re-plans with that feedback baked in. No manual judgment gates; the loop terminates when the adversary approves or max iterations reached.
5. **Hybrid loop termination** — stops when: (1) adversary approves, *or* (2) max-iterations threshold, *or* (3) manual user override.

## Rationale

- **Role-specific subagents** reduce hallucination and increase domain accuracy compared to a monolithic multi-expert agent.
- **Integrated adversary** (vs post-review) gives faster feedback loops — conflicts surface mid-proposal, not after.
- **Skill-based discovery** leverages existing Copilot CLI infrastructure (skills/`, no new registry files).
- **Auto-loop** removes manual judgment calls on obvious refinements, letting the user focus on real decisions.
- **Hybrid state management** balances context retention (cheaper iterations) with fresh proposals on major issues.

## Consequences

- **Harder to reverse**: Waffle's multi-agent coordination is tightly coupled to role-specific skill structure. Removing it would require decoupling all role skills.
- **Surprising without context**: Users unfamiliar with Waffle's architecture may not immediately understand why re-planning happens automatically.
- **Real trade-off**: We explicitly choose integrated adversary (faster loops) over post-review (cleaner separation). Integrated means more feedback latency-wise, but fewer round-trips user-facing.

## Alternatives Considered

1. **Post-review adversary** — Separate agent reviews proposal after subagents. Cleaner separation but adds round-trip delay.
2. **Registry-based discovery** — Explicit manifest of roles. More flexible but adds config file overhead.
3. **Single multi-expert agent** — Monolithic design. Simpler but higher hallucination, lower domain accuracy.

## Related ADRs

None yet.

## Validation

- Waffle orchestrator implemented in `agents/waffle.agent.md`.
- Role-specific skill files created in `skills/security/`, `skills/devops/`, `skills/test/`, `skills/documentation/`, `skills/cloud-architecture/`.
- Adversary persona logic embedded in Waffle's orchestration loop.
