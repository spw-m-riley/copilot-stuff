---
name: reverse-prompt
description: Rewrite rough requests into executable task briefs with clear goal, constraints, deliverables, and next-phase routing.
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: stable
---

# Reverse prompt

## Use this skill when

- The user explicitly asks you to improve, rewrite, sharpen, or reverse-prompt a request.
- The current ask is under-specified enough that a sharper brief would materially improve execution speed or correctness.
- The user wants prompt improvement as a precursor to research, planning, or implementation.

## Do not use this skill when

- The request is already specific enough to execute directly.
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
4. Surface assumptions and blockers explicitly instead of hiding them inside the rewritten brief.
5. If the request is `rewrite-and-return`, return the improved brief plus assumptions or blockers and the recommended next phase.
6. If the request is `rewrite-and-proceed`, use the improved brief internally and continue into the appropriate next phase.
7. If a blocking ambiguity remains after rewriting, stop at the brief and blocker instead of forcing execution.

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
- Smoke test with prompts such as:
  - `Reverse-prompt this request for this repo: fix the tests in @skills/workflow-contracts/`
  - `Before you start, sharpen my prompt into goal, constraints, deliverables, approval rule, and exact files, then implement it: audit @extensions/`
  - `Improve this prompt only: update the broken workflow in \`.github/workflows/ci.yml\`, but do not touch release jobs or deploy permissions`

## Examples

- `Reverse-prompt this request for this repo: fix the failing tests in @skills/workflow-contracts/, but do not touch unrelated refactors.`
- `Rewrite this rough ask into the best executable prompt for this repository: add a skill that improves prompts before implementation.`
- `Before you start, sharpen my prompt and then move into planning mode: add a reverse prompt skill under @skills/.`
- `Improve this prompt only: audit @extensions/ and tell me the best next prompt to use.`

## Reference files

- [Brief template](references/brief-template.md) - canonical shape for rewritten execution briefs.
- [Decision rules](references/decision-rules.md) - rules for mode selection, blockers, and next-phase routing.
- [Examples matrix](assets/examples.md) - repository-local before/after examples and expected outcomes.
