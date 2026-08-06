---
name: work-prep
description: "Start here when a request needs sharpening, issue triage, PRD synthesis, or implementation-issue slicing before coding."
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: draft
  kind: task
---

# Work prep

Use this as the entry point when work needs to be shaped before implementation.
Route to the earliest fitting playbook — do not perform the downstream work here.

## Commands

| Command | Route to |
| --- | --- |
| `sharpen` | [`reverse-prompt`](../reverse-prompt/SKILL.md) |
| `triage` | [`issue-tracker-triage`](../issue-tracker-triage/SKILL.md) |
| `prd` | [`to-prd`](../to-prd/SKILL.md) |
| `issues` | [`to-issues`](../to-issues/SKILL.md) |

Use `/work-prep <command>` when the stage is known. With no command, infer the earliest required stage from the source material and stop if the stage is ambiguous.

## Use this skill when

- A request needs sharpening, tracker-neutral triage, product framing, or issue slicing before implementation.
- The user wants to move an idea through the path from raw request to grabbable work.
- It is unclear whether the next step is a brief, triage record, PRD, or issue breakdown.

## Do not use this skill when

- The request is already an approved, implementation-ready task.
- The user wants repository discovery before shaping the work — use [`context-map`](../context-map/SKILL.md).
- The user wants a reusable handoff artifact rather than a PRD or issue breakdown — use [`workflow-contracts`](../workflow-contracts/SKILL.md).

## Routing boundary

| Situation | Route |
| --- | --- |
| The request is vague or needs an executable brief | [`reverse-prompt`](../reverse-prompt/SKILL.md) |
| The source is a raw issue or PR | [`issue-tracker-triage`](../issue-tracker-triage/SKILL.md) |
| The problem and outcome are agreed, but product framing is needed | [`to-prd`](../to-prd/SKILL.md) |
| The plan or PRD is approved and needs implementation slices | [`to-issues`](../to-issues/SKILL.md) |

## Inputs to gather

- The current request or source artifact.
- The stage already completed, if any.
- Whether the next output should be a brief, triage record, PRD, or issue set.

## First move

1. Use an explicit command when provided.
2. Otherwise identify the earliest missing stage: sharpen, triage, PRD, or issues.
3. Route to that playbook immediately.

## Workflow

1. Classify the source by the routing boundary.
2. Route to the selected playbook without duplicating its workflow.
3. If two stages appear to fit, choose the earlier one and state why.
4. Stop once the correct downstream skill is identified.

## Outputs

- A routing decision naming one downstream skill.
- The source stage and evidence that justified the route.
- No duplicate PRD, triage, or issue-slicing work performed by this router.

## Validation

- Confirm the selected command or inferred stage maps to a real local skill.
- Confirm raw issues route to triage before PRD or issue slicing.
- Confirm approved plans or PRDs route directly to issue slicing.
- Smoke test:
  - should trigger: "`/work-prep triage` this raw issue before we decide whether it needs a PRD."
  - should trigger: "Take this approved PRD and turn it into implementation issues."
  - should not trigger: "Implement this already-approved issue now."

## Examples

- "`/work-prep sharpen` this rough request before we plan it."
- "Triage this raw bug report, then tell me whether it needs a PRD or issue slices."
- "Turn the approved PRD into dependency-aware implementation issues."

## Reference files

- [`reverse-prompt`](../reverse-prompt/SKILL.md) - executable-brief shaping playbook
- [`issue-tracker-triage`](../issue-tracker-triage/SKILL.md) - raw issue and PR triage playbook
- [`to-prd`](../to-prd/SKILL.md) - product requirements synthesis playbook
- [`to-issues`](../to-issues/SKILL.md) - approved-work issue slicing playbook
