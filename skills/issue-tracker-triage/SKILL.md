---
name: issue-tracker-triage
description: "Use when a raw issue or PR needs a tracker-agnostic category, lifecycle state, and durable behavioral brief before planning, ticketing, or GitHub-specific mechanics; not for tracker operations or already-approved requirement docs."
disable-model-invocation: true
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: draft
  kind: task
---

# Issue tracker triage

Use this skill when a raw issue or PR needs disciplined triage into a category, a lifecycle state, and a durable behavioral brief — independent of which tracker hosts it. The output is a triage record other skills can consume, not tracker-specific operations and not a full PRD.

## Use this skill when

- A raw issue or PR needs to be classified by category (bug, feature request, question, duplicate, needs-info, out-of-scope) and lifecycle state (triage, ready, in progress, blocked, closed).
- The team needs a tracker-agnostic triage vocabulary that does not assume GitHub, Jira, Linear, or any specific tool.
- The next output should be a durable behavioral brief describing what observable behavior is being requested or reported, not implementation detail.
- Concepts mentioned in the discussion are explicitly out of scope and need to be recorded so they are not silently dropped or silently expanded later.

## Do not use this skill when

- The task is GitHub-specific mechanics: creating/updating a PR, resolving review comments, watching checks, or choosing merge/keep/discard — use [`github-cli-pr-workflow`](../github-cli-pr-workflow/SKILL.md).
- The work is already triaged and approved, and the next step is breaking it into implementation tickets — use [`to-issues`](../to-issues/SKILL.md).
- The work needs full product framing (problem statement, user stories, implementation/testing decisions) — use [`to-prd`](../to-prd/SKILL.md).
- The request is under-specified and needs sharpening before triage is even possible — use [`reverse-prompt`](../reverse-prompt/SKILL.md).

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Classify a raw issue/PR into category, state, and a behavioral brief | Yes | - |
| Create/update a PR, resolve review threads, or watch checks | No | [`github-cli-pr-workflow`](../github-cli-pr-workflow/SKILL.md) |
| Break already-approved, already-triaged work into tickets | No | [`to-issues`](../to-issues/SKILL.md) |
| Produce a full PRD from scratch | No | [`to-prd`](../to-prd/SKILL.md) |
| Request is too vague to triage at all | No | [`reverse-prompt`](../reverse-prompt/SKILL.md) |

## Inputs to gather

**Required before triaging**

- The raw issue or PR content: title, body, and any relevant comments.
- Whether the item is a bug report, feature request, question, or unclear.

**Helpful if present**

- The tracker type, if known (not required — triage works the same regardless).
- Existing labels, prior triage notes, or a linked duplicate.
- Related ADRs, PRDs, or domain docs that might mark the request out-of-scope by prior decision.

**Only investigate if encountered**

- A suspected duplicate that needs confirming against another issue.
- Ambiguity about whether a mentioned idea is core scope or an adjacent out-of-scope concept.

## First move

1. Read the raw issue/PR content end to end before classifying anything.
2. Classify the category using [`references/category-and-lifecycle.md`](references/category-and-lifecycle.md).
3. Start from [`assets/behavioral-brief-template.md`](assets/behavioral-brief-template.md) to record the triage result.

## Workflow

1. Classify the category: bug, feature request, question, duplicate, needs-info, or out-of-scope.
2. Classify the lifecycle state independently of category: triage, ready, in progress, blocked, or closed.
3. Draft the behavioral brief: what observable behavior is being requested or reported, in plain language, with no file paths, function names, or implementation detail.
4. Record an explicit out-of-scope concepts list — ideas mentioned in the discussion that are not part of this item's scope, each with a one-line reason. Write "none identified" rather than omitting the section.
5. Recommend the next step: hand to [`to-prd`](../to-prd/SKILL.md) if product framing is still needed, hand to [`to-issues`](../to-issues/SKILL.md) if scope is already approved and just needs slicing, hand to [`github-cli-pr-workflow`](../github-cli-pr-workflow/SKILL.md) for tracker-mechanics follow-up, or state "no further action" with a reason.

## Outputs

- A completed triage record using [`assets/behavioral-brief-template.md`](assets/behavioral-brief-template.md): category, lifecycle state, behavioral brief, out-of-scope concepts, and a recommended next step.
- An explicit routing recommendation to the skill that should handle the next phase, or a stated "no further action."

## Guardrails

- Do not assume any specific tracker's API, labels, or fields; this skill's vocabulary is tracker-agnostic by design.
- Keep the behavioral brief free of file paths, function names, and code snippets — describe observable behavior, not implementation.
- Do not silently drop a mentioned idea that is out of scope; record it with a reason instead.
- Do not perform tracker mechanics (creating issues, posting comments, merging) as part of this skill; route to the mechanics skill once triage is complete.
- If the report cannot be classified due to missing information, mark it `needs-info` and say what is missing rather than guessing at a category.

## Validation

- Confirm the triage record has both a category and a lifecycle state, classified independently.
- Confirm the behavioral brief describes observable behavior only, with no file paths or code snippets.
- Confirm the out-of-scope section is present even when empty ("none identified").
- Confirm the recommended next step names a real local skill or explicitly states "no further action."
- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/issue-tracker-triage/SKILL.md`.
- Smoke test:
  - should trigger: "Triage this raw bug report into a category, state, and behavioral brief before we decide what to do with it."
  - should not trigger: "Push the fixes for this PR's review comments and wait for checks." (→ `github-cli-pr-workflow`)

## Examples

- "Here's a raw GitHub issue; classify it, write the behavioral brief, and tell me whether it needs a PRD or can go straight to ticket slicing."
- "Triage these three Linear tickets into category and lifecycle state, and flag anything that's really a duplicate or out-of-scope."
- "This bug report is missing repro steps — triage it as needs-info and say exactly what's missing."

## Reference files

- [`references/category-and-lifecycle.md`](references/category-and-lifecycle.md) - category and lifecycle-state definitions, and how to apply them independently
- [`assets/behavioral-brief-template.md`](assets/behavioral-brief-template.md) - triage record template with behavioral brief and out-of-scope concept tracking
