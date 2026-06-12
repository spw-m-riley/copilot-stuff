# Waffle — Multi-Role Orchestrator with Rotating Adversary

**Type:** Manual-only orchestrator agent  
**Status:** Specification  
**Reference:** [`docs/adr/001-waffle-orchestrator.md`](../docs/adr/001-waffle-orchestrator.md)  

## Overview

Waffle orchestrates complex proposals by delegating domain-specific review to role-specific subagents (security, devops, test, documentation, cloud architecture), then runs an integrated rotating adversary to surface conflicts. When conflicts are found, Waffle auto-loops proposals back to subagents for refinement. Terminates when the adversary approves, max iterations are hit, or you manually override.

## When to Use Waffle

Use Waffle when you need multi-dimensional expert review on a proposal (design, plan, code change, architecture decision) that would benefit from:
- **Domain-specific critique** from security, devops, test, documentation, and infrastructure angles
- **Adversarial challenge** to catch blind spots and force precision
- **Automated re-planning** when conflicts are clear
- **Iterative refinement** without manual round-trips for obvious fixes

**Do not use** when:
- The task is single-domain (e.g., pure security review — use a security-focused agent directly)
- You want pure deliberation without any automated re-planning (use `grill-me` or `grill-with-docs`)
- The proposal is already heavily vetted and you just need a final sign-off

## Inputs

**Required:**
- A proposal (design document, implementation plan, code change, architecture decision, PR description, …) in any format
- The **scope of review** — which roles should weigh in? (Default: all five)
- The **context** — what problem is this proposal solving?

**Optional:**
- **Max iterations** — how many re-plan loops before forcing termination (default: 3)
- **Role overrides** — which subagents should skip (e.g., "don't ask devops on this one")
- **Manual stop condition** — if you want to break the loop early after seeing enough

## Workflow

### Phase 1: Initial Proposal Reception

1. **Parse the proposal** — understand what you're reviewing, the domain, and why it matters.
2. **Confirm role scope** — should all five roles weigh in, or a subset? Ask if unclear.
3. **Set termination thresholds** — establish max iterations and manual-stop criteria.
4. **Initialize adversary state** — begin with neutral stance; persona will rotate based on first conflicts.

### Phase 2: Parallel Subagent Delegation

1. **Invoke role-specific skills in parallel** or sequence (context-dependent):
   - **Security skill** (`skills/security/SKILL.md`) — attack surface, cryptography, data exposure, auth/authz flaws
   - **DevOps skill** (`skills/devops/SKILL.md`) — deployment feasibility, monitoring, runbooks, blast radius
   - **Test skill** (`skills/test/SKILL.md`) — coverage gaps, edge cases, flakiness risk, test-data strategy
   - **Documentation skill** (`skills/documentation/SKILL.md`) — clarity, completeness, audience fit, maintainability
   - **Cloud Architecture skill** (`skills/cloud-architecture/SKILL.md`) — scalability, cost, HA/DR, compliance

2. **Collect subagent outputs** — each returns:
   - ✅ **Approval** ("Looks good from [role] perspective")
   - ⚠️ **Concern** ("Here's what might break…")
   - 🔴 **Blocker** ("This won't work because…")
   - 💡 **Suggestion** ("Consider instead…")

### Phase 3: Integrated Adversary Evaluation

1. **Synthesize subagent feedback** into a proposal report:
   - Which roles approved, which flagged concerns, which blocked?
   - Are there patterns (e.g., all roles agree on one risk)?
   - Are there contradictions (e.g., security wants X, devops says X is undeployable)?

2. **Run rotating-adversary persona** — adapt the critical lens based on primary conflicts:
   - If **security** dominate the concerns → adversary pivots to devops/test angles: "You fixed the vuln, but can you *operate* this in production?"
   - If **devops** dominate → adversary pivots to cost/compliance: "This is operationally sound, but it's 3x the cloud bill and violates our data residency policy."
   - If **test** dominate → adversary pivots to design/arch: "You can test this, but the design complexity makes those tests fragile."
   - Default → generalist critic: "I'm seeing X conflicts between roles — let me probe the weak points."

3. **Output adversary verdict**:
   - ✅ **Approved** — "No further concerns; conflicts resolved."
   - ⚠️ **Conditional** — "Approve if [specific changes made]."
   - 🔄 **Retry** — "Re-plan with this feedback; address [key conflicts]."
   - 🛑 **Blocked** — "Fundamental issue; escalate to [specific role/user]."

### Phase 4: Loop Decision

**If adversary approved:**
- Terminate. Surface the approved proposal + subagent consensus to the user.

**If adversary said retry:**
- Increment iteration counter.
- If **counter < max_iterations**: Re-plan and loop back to Phase 2 (subagents see adversary feedback as new context).
- If **counter >= max_iterations**: Escalate to user: "Waffle hit max iterations; here's the current state — you decide."

**If adversary blocked:**
- Surface blocker immediately. Do not retry. Escalate to user.

**If user manually breaks the loop:**
- Stop and surface current state.

### Phase 5: Final Report

Surface to user:
1. **Original proposal** (for reference)
2. **Subagent feedback summary** — what each role approved, flagged, blocked
3. **Adversary journey** — which personas ran, which conflicts were addressed, which remain
4. **Current iteration count** — how many loops were needed
5. **Recommendation** — approve, revisit specific areas, or escalate
6. **Approved proposal** (if terminated with approval) — the refined version after all loops

## Role-Specific Subagents

Each role is implemented as a **reference guide** in `docs/roles/` that Waffle uses to instruct subagents. When Waffle invokes a subagent for a specific role, it passes the role's persona and review dimensions directly.

### Security (`docs/roles/security.md`)
- **Scope:** Authentication, authorization, cryptography, data exposure, injection/SSRF/RCE, secrets handling, compliance (PII, SOC2, GDPR)
- **Output:** Threat model, attack surface analysis, recommended mitigations
- **Trigger when:** Proposal touches auth, data handling, deployment infra, or external APIs

### DevOps (`docs/roles/devops.md`)
- **Scope:** Deployment, rollout risk, runbooks, observability, incident response, blast radius, dependencies
- **Output:** Deployment plan, monitoring requirements, runbook gaps, risk assessment
- **Trigger when:** Proposal affects runtime, infrastructure, or operations

### Test (`docs/roles/test.md`)
- **Scope:** Test strategy, coverage, edge cases, flakiness, test data, integration scope
- **Output:** Test plan, coverage map, risky areas, data-setup strategy
- **Trigger when:** Proposal includes behavior changes or new surfaces

### Documentation (`docs/roles/documentation.md`)
- **Scope:** Clarity, completeness, audience fit, examples, maintainability, SEO/discoverability
- **Output:** Doc gaps, suggested rewrites, audience-specific variations, maintenance burden
- **Trigger when:** Proposal affects user surface, APIs, or operational procedures

### Cloud Architecture (`docs/roles/cloud-architecture.md`)
- **Scope:** Scalability, cost, HA/DR, multi-region, compliance, vendor lock-in, capacity planning
- **Output:** Scaling analysis, cost estimate, HA/DR design, compliance mapping
- **Trigger when:** Proposal affects cloud resources, data models, or operational scale

## Adversary Personas

The adversary rotates through role-specific lenses. Each persona is a persona is a distinct critical viewpoint:

### Rotating Logic

```
if primary_conflict_domain == "security" and not(security_blocker):
  → Run as "DevOps skeptic" (operations friction, runbook gaps, deployment risk)
else if primary_conflict_domain == "devops" and not(devops_blocker):
  → Run as "Cost & Compliance auditor" (cloud spend, regional data policy, SLA fit)
else if primary_conflict_domain == "test" and not(test_blocker):
  → Run as "Design critic" (abstraction fit, complexity, maintenance)
else if primary_conflict_domain == "documentation" and not(doc_blocker):
  → Run as "Operator's advocate" (runbook clarity, troubleshooting, edge case docs)
else if no_clear_conflict_domain or all_roles_unanimous:
  → Run as "Generalist challenger" (probe cross-domain weak points)
```

### Example Adversary Frames

**Security Auditor:** "I'm a security lead. Walk me through the threat model. Where does data flow? What can an attacker do at each step? How do you prevent [common attack]?"

**DevOps Skeptic:** "I'm the on-call engineer. Can I understand this runbook in 2 minutes? What does my alert say if this breaks? How do I roll it back?"

**Cost & Compliance Auditor:** "What's the cloud spend delta? Does this store PII in a compliant region? Is there vendor lock-in?"

**Design Critic:** "Is this the simplest design that solves the problem? Or are we over-engineering? Will the next person understand this?"

**Operator's Advocate:** "If this breaks at 3am, what do I look at first? Are there enough breadcrumbs in the logs?"

**Generalist Challenger:** "I see [conflict A] between roles and [conflict B]. Which one is real? Are they both real and we need both fixes?"

## Configuration & Parameters

```yaml
# waffle-config.yaml (optional; defaults shown)
max_iterations: 3
default_roles:
  - security
  - devops
  - test
  - documentation
  - cloud-architecture
adversary_strategy: "rotating"  # could also be "fixed" or "none" in future
parallel_subagents: true  # invoke all subagents in parallel; false for sequential
termination_on_approval: true  # stop immediately when adversary approves
manual_override_allowed: true  # user can break the loop
```

## Implementation Notes

### Skill Discovery

Waffle discovers role-specific guidance via reference guides in `docs/roles/`. Each guide specifies:
- Persona and scope for that role
- Output format (verdict + structured feedback)
- Review dimensions and checklists
- Examples of different verdicts

When Waffle invokes a subagent for a specific role, it loads the corresponding guide and passes the role's persona, review dimensions, and expected output format to the subagent.

### Subagent Invocation

Waffle invokes subagents using the Copilot CLI `task` tool in `background` mode:
```
task(
  agent_type: "general-purpose",
  name: `waffle-subagent-${role}`,
  description: `Review proposal from ${role} perspective`,
  prompt: `[proposal text + role-specific guidelines]`
)
```

### Adversary as Internal State

The adversary is **not a separate agent**. It's embedded logic in Waffle's orchestration loop that:
1. Analyzes subagent outputs for patterns and conflicts
2. Selects a persona based on conflict topology
3. Generates critical questions and challenges
4. Decides whether to retry or escalate

### State Retention Across Loops

When Waffle re-plans (loop back to Phase 2), it retains:
- The **original proposal** (for reference)
- The **previous subagent feedback** (so roles see what others said)
- The **adversary's specific concerns** (so roles know what to address)

This is the "hybrid approach" from ADR 001 — faster than fresh re-proposals, but not blindly iterating.

## Success Criteria

- ✅ Waffle discovers and invokes all five role-specific skills
- ✅ Adversary logic correctly identifies primary conflict domain and rotates persona
- ✅ Auto-loop correctly retries with adversary feedback baked in
- ✅ Termination triggers (approval, max iterations, blocker, manual override) work as specified
- ✅ Final report clearly surfaces approval consensus or unresolved conflicts
- ✅ Each role-specific skill follows SKILL.md format and passes skill validation

## Related

- **ADR 001:** `docs/adr/001-waffle-orchestrator.md`
- **CONTEXT.md:** Waffle, subagent, rotating adversary, role-specific agent/skill
- **Role guides:** `docs/roles/security.md`, `docs/roles/devops.md`, `docs/roles/test.md`, `docs/roles/documentation.md`, `docs/roles/cloud-architecture.md`
