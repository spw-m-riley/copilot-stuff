---
name: reverse-prompt
description: "Use when the user explicitly asks to reverse-prompt, rewrite, or sharpen a request into an executable brief before research, planning, or implementation."
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Reverse prompt

## Use this skill when

- The user explicitly asks you to improve, rewrite, sharpen, or reverse-prompt a request.
- The user explicitly asks for a sharper brief, "must-see/should-see" context breakdown, or an executable prompt as a precursor to research, planning, or implementation.

## Do not use this skill when

- The request is already specific enough to execute directly.
- The request is merely under-specified with no explicit prompt-rewrite ask; clarify inline or proceed with reasonable assumptions instead of invoking this skill implicitly.
- The guidance should apply to most tasks even when no prompt-help intent is present.
- The behavior belongs in a specialized agent or an always-on extension hook instead of a reusable manual workflow.
- The user only wants generic prompt-writing advice with no repository grounding.

## Inputs to gather

**Required before rewriting**

- The user's actual objective.
- Scope boundaries or exclusions.
- Constraints on files, behavior, tools, or rollout.
- The expected deliverable.
- The completion rule, if one is already stated.

**Ground from repository context when available**

- Exact files or directories to mention with `@` references.
- Existing scripts, checks, or conventions that should shape the brief.
- The most likely next phase: `research`, `plan`, or `implement`.

**Only surface as blockers when needed**

- Missing target surfaces that cannot be safely inferred.
- Conflicting goals or constraints.
- Missing validation expectations for work that clearly needs a completion check.

## Mode selection

- Use `rewrite-and-return` when the user only wants a sharper brief or the next best prompt.
- Use `rewrite-and-proceed` when the user asks you to sharpen the prompt and then act on it.
- If both prompt-help wording and action wording appear, prefer `rewrite-and-proceed`.
- If prompt-help intent is explicit but execution intent is absent, do not start the work; return the rewritten brief instead.

## First move

1. Identify what structure is missing from the current ask.
2. Pull in repository-local specifics that can be grounded safely.
3. Rewrite the ask into the house brief format before doing deeper work.

## Workflow

1. Extract the user's intent, scope, constraints, deliverable, and completion signal.
2. Decide whether this is `rewrite-and-return` or `rewrite-and-proceed` using the mode-selection rules above and [`references/decision-rules.md`](references/decision-rules.md) for edge cases.
3. Fill the brief structure from [`references/brief-template.md`](references/brief-template.md), adding exact `@` file or directory mentions when they are known.
4. When the main blocker is missing repository context, use [`references/context-needs-output.md`](references/context-needs-output.md) to return `Must See`, `Should See`, `Already Have`, and `Uncertainties` instead of guessing.
5. Surface assumptions and blockers explicitly instead of hiding them inside the rewritten brief.
6. If the request is `rewrite-and-return`, return the improved brief plus assumptions or blockers and the recommended next phase.
7. If the request is `rewrite-and-proceed`, use the improved brief internally and continue into the appropriate next phase.
8. If a blocking ambiguity remains after rewriting, stop at the brief and blocker instead of forcing execution.

## Outputs

- A rewritten brief using [`references/brief-template.md`](references/brief-template.md) with goal, scope, constraints, deliverables, and completion signal.
- Explicit assumptions, blockers, and exact `@` file or directory mentions when known.
- A `Must See`, `Should See`, `Already Have`, and `Uncertainties` context-needs summary when repository context is missing.
- A mode decision to return the improved prompt, proceed with it, or stop on a blocking ambiguity.

## Guardrails

- Sharpen the request faithfully; do not invent requirements that are not grounded in the user's ask or repository context.
- Do not silently start work when prompt-help intent is explicit and execution intent is absent.
- If the target surface is still unknown after grounding, surface that blocker instead of inventing a destination.
- Keep the rewritten brief concise and action-oriented.
- Treat this as a reusable workflow, not a repository-wide prompt policy.
- Keep detailed rubrics and examples in support files instead of bloating `SKILL.md`.

## Validation

- Read the skill once as the target agent and confirm the next action is obvious within a few seconds.
- Confirm the dual-mode behavior in this file matches [`references/decision-rules.md`](references/decision-rules.md).
- Confirm the brief format includes goal, constraints, deliverables, approval rule, exact files when known, assumptions, and validation or checks.
- Confirm `## Reference files` links every support file.
- Keep [`references/rewrite-mode-scenarios.md`](references/rewrite-mode-scenarios.md) current when mode-selection or blocker routing changes.
- Smoke test with prompts such as:
  - `Reverse-prompt this request for this repo: fix the tests in @skills/workflow-contracts/`
  - `Before you start, sharpen my prompt into goal, constraints, deliverables, approval rule, and exact files, then implement it: audit @extensions/`
  - `Improve this prompt only: update the broken workflow in \`.github/workflows/ci.yml\`, but do not touch release jobs or deploy permissions`

- Smoke test:
  - should trigger: "Sharpen this vague request into a concrete implementation prompt for this repo."
  - should not trigger: "Grill my already-written migration plan for risks." (→ `grill`)

## Examples

- `Reverse-prompt this request for this repo: fix the failing tests in @skills/workflow-contracts/, but do not touch unrelated refactors.`
- `Rewrite this rough ask into the best executable prompt for this repository: add a skill that improves prompts before implementation.`
- `Before you start, sharpen my prompt and then move into planning mode: add a reverse prompt skill under @skills/.`
- `Improve this prompt only: audit @extensions/ and tell me the best next prompt to use.`
- `Before answering, tell me which files you need to see in this repo and group them into must-see vs should-see.`

## Reference files

- [Brief template](references/brief-template.md) - canonical shape for rewritten execution briefs.
- [Context-needs output](references/context-needs-output.md) - how to ask for required vs helpful repository context before answering or planning.
- [Decision rules](references/decision-rules.md) - rules for mode selection, blockers, and next-phase routing.
- [Examples matrix](assets/examples.md) - repository-local before/after examples and expected outcomes.
- [Rewrite mode scenarios](references/rewrite-mode-scenarios.md) - compact mode-selection and escalation cases for maintenance.
