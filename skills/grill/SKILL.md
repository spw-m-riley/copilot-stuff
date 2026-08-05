---
name: grill
description: 'Use when the user wants a plan or design stress-tested through structured interrogation, explicitly says "grill me", or wants that interrogation to also update domain docs such as CONTEXT.md or ADRs.'
disable-model-invocation: true
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Grill

Use this skill to relentlessly interrogate a plan or design until every branch of the decision tree is resolved. It runs in one of two modes: pure interrogation with no side effects, or interrogation that also maintains the project's domain glossary (CONTEXT.md) and architectural decision records (ADRs) as terms crystallise. Consolidates the former `grill-me` and `grill-with-docs` skills into one package with an explicit mode switch.

## Use this skill when

- The user wants to be grilled, stress-tested, or interviewed about a plan or design.
- The user explicitly says "grill me" about a plan.
- The user wants to think through a decision tree before committing to a direction.
- The plan touches domain concepts and the user wants CONTEXT.md or ADRs built or updated along the way.
- Domain terminology in the project is fuzzy, inconsistent, or undocumented and should be sharpened during interrogation.

## Do not use this skill when

- The request is under-specified and needs sharpening before interrogation — route to [`reverse-prompt`](../reverse-prompt/SKILL.md).
- A completed `/plan` needs formal reviewer approval — route to [`plan-review-loop`](../plan-review-loop/SKILL.md).
- The user wants to write standalone documentation (README, guide, runbook) with no interrogation — route to [`doc-coauthoring`](../doc-coauthoring/SKILL.md).
- The user wants a pre-edit file/test map — route to [`context-map`](../context-map/SKILL.md).

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| User says "grill me" about a plan | Yes | - |
| User wants interrogation and domain-doc maintenance in the same session | Yes (*interrogate-with-docs* mode) | - |
| User's request is too vague to interrogate | No | [`reverse-prompt`](../reverse-prompt/SKILL.md) |
| Completed `/plan` needs Jason/Freddy review | No | [`plan-review-loop`](../plan-review-loop/SKILL.md) |
| User wants a standalone document authored collaboratively, no interrogation | No | [`doc-coauthoring`](../doc-coauthoring/SKILL.md) |
| User needs a pre-edit file/test map | No | [`context-map`](../context-map/SKILL.md) |

## Inputs to gather

**Required before starting**

- The plan, design, or decision the user wants stress-tested.

**Helpful if present**

- Prior conversation context about the feature.
- The repository codebase for verification of claims.
- For `interrogate-with-docs` mode: the repository root where CONTEXT.md and `docs/adr/` should live, and any existing CONTEXT.md, CONTEXT-MAP.md, or `docs/adr/` entries.

## Mode selection

- Use `interrogate` (default) when the user wants pure interrogation with no documentation side effects.
- Use `interrogate-with-docs` when the plan touches domain concepts, terminology is fuzzy or undocumented, or the user explicitly mentions CONTEXT.md, ADRs, or building up domain docs while being grilled.
- If the mode is ambiguous, ask once before starting: state the default (`interrogate`) and confirm whether domain-doc maintenance should run alongside it.

## First move

1. Determine the mode: `interrogate` or `interrogate-with-docs`, using the mode-selection rules above.
2. In `interrogate-with-docs` mode, check whether CONTEXT.md (or CONTEXT-MAP.md) and `docs/adr/` exist in the repository, and read them if present.
3. Identify the first unresolved decision branch.
4. Ask the first question, providing your recommended answer using the `ask_user` tool.

## Workflow

1. **Ask one question at a time.** Walk down each branch of the design tree, resolving dependencies between decisions sequentially. For each question, provide your recommended answer. Wait for the user's response before continuing. See [references/session-playbook.md](references/session-playbook.md) for question sequencing, scenario construction, and contradiction-surfacing patterns shared by both modes.
2. **Explore instead of asking** when a question can be answered by examining the codebase.
3. **In `interrogate-with-docs` mode only:**
   - Challenge terms that conflict with the existing glossary in CONTEXT.md immediately.
   - Sharpen fuzzy or overloaded language by proposing a precise canonical term.
   - Cross-reference user claims against the code and surface contradictions.
   - Update CONTEXT.md inline as soon as a term resolves — do not batch documentation updates. Use the format in [references/context-format.md](references/context-format.md). Create CONTEXT.md lazily if it does not exist yet.
   - Offer an ADR only when all three conditions hold: hard to reverse, surprising without context, and the result of a real trade-off. Use the format in [references/adr-format.md](references/adr-format.md). Create `docs/adr/` lazily.
4. **Repeat** until all branches are resolved and you have reached a shared understanding.

## Outputs

- A shared understanding of the plan or design, with all decision branches resolved.
- In `interrogate-with-docs` mode: an updated or newly created CONTEXT.md with resolved domain terms, and zero or more ADRs in `docs/adr/` for qualifying decisions.

## Guardrails

- Ask questions one at a time. Never dump a wall of questions.
- Provide your recommended answer with every question.
- Explore the codebase when it can answer a question directly — do not ask the user what the code already tells you.
- In `interrogate` mode, do not create or update any documentation files (CONTEXT.md, ADRs). If domain-doc maintenance turns out to be needed, switch to `interrogate-with-docs` mode instead of silently writing docs.
- In `interrogate-with-docs` mode, keep CONTEXT.md focused on project-specific domain terms; leave general programming concepts out, and keep definitions to one sentence that defines what a term is rather than what it does.
- Offer an ADR only when all three offering criteria are met — see [references/adr-format.md](references/adr-format.md).

## Validation

- Confirm the skill activates on "grill me" prompts.
- Confirm `interrogate-with-docs` mode is only used when the user's wording signals domain-doc intent (CONTEXT.md, ADRs, domain language maintenance); otherwise stay in `interrogate` mode.
- Confirm every term added to CONTEXT.md follows [references/context-format.md](references/context-format.md), and every ADR follows [references/adr-format.md](references/adr-format.md) and meets all three offering criteria.
- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/grill/SKILL.md`.
- Smoke test:
  - should trigger: "Grill me on my plan to refactor the notification service."
  - should trigger: "Grill me on this plan to add order cancellation — I want the domain language documented." (→ `interrogate-with-docs` mode)
  - should not trigger: "Sharpen this vague request into a proper brief before I start." (→ `reverse-prompt`)

## Examples

- "Grill me on this plan to split the monolith into two services." (`interrogate` mode)
- "Stress-test my design for the new caching layer — I want to make sure I haven't missed anything." (`interrogate` mode)
- "Grill me on this plan to refactor the notification system — build up CONTEXT.md as we go." (`interrogate-with-docs` mode)
- "Stress-test my design for the new auth flow against the existing domain model in CONTEXT.md, and capture any ADRs along the way." (`interrogate-with-docs` mode)

## Reference files

- [references/session-playbook.md](references/session-playbook.md) — shared interrogation patterns: question sequencing, scenario construction, contradiction surfacing, fuzzy-term resolution, and docs-specific guidance for `interrogate-with-docs` mode
- [references/context-format.md](references/context-format.md) — CONTEXT.md format specification: structure, rules, single vs. multi-context repos
- [references/adr-format.md](references/adr-format.md) — ADR format, offering criteria, qualifying categories, and optional sections
- [assets/context-template.md](assets/context-template.md) — starter template for a new CONTEXT.md
