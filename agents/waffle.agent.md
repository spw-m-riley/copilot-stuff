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
4. **Run baseline Security Auditor pass** — before any role-agents run, apply the Security Auditor lens. If the proposal has a fundamental security flaw, surface it immediately and ask whether to continue or abort. This gates the full role sweep on basic security sanity.

### Phase 2: Role-Agent Delegation

1. **Invoke role-specific agents in parallel** (default). Switch to sequential only if a Blocker is detected (halt immediately) or the user passes `parallel: false` in config:
   - **Security** (`docs/roles/security.md`) — attack surface, cryptography, data exposure, auth/authz flaws
   - **DevOps** (`docs/roles/devops.md`) — deployment feasibility, monitoring, runbooks, blast radius
   - **Test** (`docs/roles/test.md`) — coverage gaps, edge cases, flakiness risk, test-data strategy
   - **Documentation** (`docs/roles/documentation.md`) — clarity, completeness, audience fit, maintainability
   - **Cloud Architecture** (`docs/roles/cloud-architecture.md`) — scalability, cost, HA/DR, compliance

2. **Collect role-agent outputs** — each returns:
   - ✅ **Approval** — no concerns from this role
   - ⚠️ **Concern** — specific risk or gap; triggers adversary evaluation
   - 🔴 **Blocker** — fundamental flaw; halts parallel roles and escalates immediately
   - 💡 **Suggestion** — optional improvement; not loop-triggering, but **adversary may elevate to Concern** if it judges the suggestion is underweighted

### Phase 3: Integrated Adversary Evaluation

1. **Synthesize subagent feedback** — collect Approvals, Concerns, Blockers, and Suggestions:
   - Which roles approved, which flagged concerns, which blocked?
   - Are there patterns (all roles converge on one risk)?
   - Are there contradictions (security wants X, devops says X is undeployable)?
   - Are there Suggestions that look underweighted? If so, the adversary may elevate them to Concerns.

2. **Run rotating-adversary persona** — adapt the critical lens based on the primary conflict domain:
   - If **security** dominates → **DevOps Skeptic**: "You fixed the vuln — but can you *operate* this safely in production?"
   - If **devops** dominates → **Cost & Compliance Auditor**: "Operationally sound, but it's 3× the cloud bill and violates data residency."
   - If **test** dominates → **Design Critic**: "You can test this, but the complexity makes those tests fragile and the design unmaintainable."
   - If **documentation** dominates → **Operator's Advocate**: "If this breaks at 3am, what does the on-call engineer look at first?"
   - If **cloud-architecture** dominates → **Pragmatist**: "You've designed for scale — but can you build and operate this with the team and budget you have *today*? What's the MVP version?"
   - If no clear domain or all roles unanimous → **Generalist Challenger**: "I see [conflict A] and [conflict B] — let me probe the weak points."

3. **Output adversary verdict**:
   - ✅ **Approved** — "No further concerns; conflicts resolved."
   - ⚠️ **Conditional** — "Approve if [specific targeted change] is made." → triggers micro-loop (see Phase 4).
   - 🔄 **Retry** — "Re-plan with this feedback; address [key conflicts]." → triggers full loop.
   - 🛑 **Blocked** — "Fundamental issue; escalate to [specific role/user]." → no retry.

### Phase 4: Loop Decision

**If adversary approved:**
- Terminate. Proceed to Phase 5 Final Report.

**If adversary said conditional:**
- **Micro-loop**: Waffle applies the single targeted narrow-patch. Re-runs only the affected role-agent(s) (not all five). Adversary re-evaluates that specific change only. Does not increment the main iteration counter.
- If micro-loop resolves the condition → treat as Approved, proceed to Phase 5.
- If micro-loop surfaces new issues → escalate to full Retry or Blocked as appropriate.

**If adversary said retry:**
- Increment the main iteration counter.
- If **counter < max_iterations**: Waffle generates a **narrow-patch revision** — modifies only the elements specifically flagged by the adversary. No structural rewrites outside the flagged scope. Records what was changed and why. Loops back to Phase 2 with the updated proposal and full prior context.
- If **counter >= max_iterations**: Escalate to user with current state. Do not auto-patch further.

**If adversary blocked:**
- Surface blocker immediately. Do not retry. Escalate to user.

**If user manually breaks the loop:**
- Stop and surface current state, including any in-progress patches.

### Phase 5: Final Report

Surface to user:
1. **Original proposal** — the exact text submitted to Waffle
2. **Subagent feedback summary** — what each role approved, flagged, blocked, or suggested
3. **Adversary journey** — which persona ran each iteration, what it challenged, what it elevated
4. **Patch log** — for each loop: the specific adversary concern, the narrow patch Waffle applied, and the before/after diff
5. **Iteration count** — how many full loops and micro-loops ran
6. **Approved proposal** (if terminated with approval) — the final version, fully auditable against the patch log

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

The adversary has two modes: a **fixed baseline** (Security Auditor, always runs first in Phase 1) and a **rotating lens** (selected per iteration based on conflict topology).

### Baseline: Security Auditor (Phase 1 gate)

Runs once, before role-agents, on every proposal. Acts as a first filter.

> "I'm a security lead reviewing this cold. Walk me through the threat model. Where does data flow? What can an attacker do at each step? What are you doing to prevent [common attack]?"

If this pass surfaces a **Blocker**, Waffle halts and asks you whether to continue or abort before spending resources on the full role sweep.

### Rotating Lens (Phase 3, per-iteration)

Selected based on the primary conflict domain from role-agent outputs:

```
security dominates       → DevOps Skeptic
devops dominates         → Cost & Compliance Auditor
test dominates           → Design Critic
documentation dominates  → Operator's Advocate
cloud-arch dominates     → Pragmatist
no clear domain / all unanimous → Generalist Challenger
```

### Persona Frames

**DevOps Skeptic:** "I'm the on-call engineer. Can I understand this runbook in 2 minutes? What does my alert say if this breaks? How do I roll it back safely?"

**Cost & Compliance Auditor:** "What's the cloud spend delta? Does this store PII in a compliant region? Is there vendor lock-in? What's the SLA impact?"

**Design Critic:** "Is this the simplest design that solves the problem? Are we over-engineering? Will the next person understand this without a guide?"

**Operator's Advocate:** "If this breaks at 3am, what do I look at first? Are there enough breadcrumbs in the logs? Can I diagnose this from a dashboard?"

**Pragmatist:** "You've designed for scale and resilience — but can you actually build and operate this with the team and budget you have today? What's the MVP version that gets 80% of the value?"

**Generalist Challenger:** "I see [conflict A] between roles and [conflict B]. Which one is real? Are they both real and do they require separate fixes? What's the common root cause?"

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

### Autonomous Narrow-Patch Rewriting

When Waffle generates a revised proposal (triggered by Retry or Conditional verdicts), it operates under strict scope constraints:

- **Only modify elements specifically flagged** by the adversary. Never restructure components that weren't cited.
- **Record every change**: what was modified, which adversary concern triggered it, and the before/after diff.
- **Flag out-of-scope observations**: if Waffle notices something else during synthesis, it logs it as a note without acting on it.
- If the required fix would force structural changes outside the flagged scope, escalate to the user rather than rewriting broadly. That's a Blocker, not a patch.

## Success Criteria

- ✅ Baseline Security Auditor pass runs before role-agents on every proposal
- ✅ Role-agents run in parallel by default; halt on Blocker, or sequential if `parallel: false`
- ✅ Adversary correctly identifies primary conflict domain and selects the matching rotating persona
- ✅ Suggestions are passed to adversary as potential elevation candidates, not silently dropped
- ✅ Conditional verdict triggers a micro-loop (targeted fix + affected role re-run only)
- ✅ Retry verdict triggers a narrow-patch revision — only flagged elements modified, no structural rewrites outside scope
- ✅ Auto-loop correctly carries original proposal + prior feedback + adversary concerns into each subsequent Phase 2
- ✅ Final report includes: original proposal, patch log with before/after diffs per loop, adversary journey, and approved proposal
- ✅ All termination modes work: adversary approval, max-iterations escalation, blocker escalation, manual override

## Related

- **ADR 001:** `docs/adr/001-waffle-orchestrator.md`
- **CONTEXT.md:** Waffle, subagent, rotating adversary, role-specific agent/skill
- **Role guides:** `docs/roles/security.md`, `docs/roles/devops.md`, `docs/roles/test.md`, `docs/roles/documentation.md`, `docs/roles/cloud-architecture.md`
