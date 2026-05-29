---
name: create-technical-spike
description: "Use when asked to create a time-boxed technical spike for research before implementation; not when the task is ready for direct coding."
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: draft
  kind: task
---

# Create Technical Spike

Use this skill to turn an unresolved technical question into a scoped spike with a timebox, investigation plan, success criteria, findings area, and decision section.

## Use this skill when

- A development task is blocked by an unknown that needs research.
- The user asks for a technical spike, proof-of-concept research plan, or time-boxed investigation document.
- A decision needs evidence before implementation starts.

## Do not use this skill when

- The user asks to implement a known solution now; use `test-driven-development` or the relevant implementation skill.
- The user asks to debug a concrete failure; use `systematic-debugging`.
- The user asks for an ADR after a decision is made; use `create-architectural-decision-record`.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Create a research spike for an unresolved technical choice | Yes | - |
| Diagnose a failing command or runtime bug | No | `systematic-debugging` |
| Record a final architecture decision | No | `create-architectural-decision-record` |

## Inputs to gather

**Required before editing**

- Spike title or research question.
- Category, owner or responsible team, and timebox.
- Why the answer is needed before implementation.

**Helpful if present**

- Priority, related components, dependencies, and constraints.
- Prototype or experiment ideas.
- Decision deadline and downstream blocked work.

**Only investigate if encountered**

- Existing spike directory conventions.
- Known external resources or APIs to inspect.

## First move

1. Find the repository spike location, defaulting to `docs/spikes/` if no convention exists.
2. Convert the request into one primary research question and a small set of secondary questions.
3. Define completion criteria before writing investigation tasks.

## Workflow

1. Create a spike document named `[category]-[short-description]-spike.md` using kebab-case.
2. Include frontmatter with title, category, status, priority, timebox, created/updated dates, owner, and tags when the repository supports frontmatter.
3. Write summary, research questions, investigation plan, success criteria, technical context, research findings, decision, follow-up actions, and status history.
4. Make the investigation plan evidence-oriented: docs to inspect, code to analyze, prototypes to build, and tests or measurements to run.
5. Keep the spike time-boxed and outcome-focused so it ends in a recommendation or explicit unresolved risk.

## Outputs

- A technical spike markdown file in the repository spike location.
- Clear success criteria and follow-up actions.
- A concise summary of unresolved inputs if the spike cannot be fully scoped.

## Guardrails

- Do not turn the spike into implementation work; keep it research-first.
- Prefer one primary question per spike.
- Do not mark a spike complete without findings and a recommendation.

## Validation

- Confirm the document includes a timebox, research question, investigation plan, success criteria, and decision section.
- Smoke test: should trigger for "Create a one-week spike to evaluate switching our queue backend."
- Smoke test: should not trigger for "Fix the queue worker crash"; use `systematic-debugging`.

## Examples

- "Create a spike for evaluating the Stripe webhook retry model."
- "Write a technical spike to research GraphQL federation options."
- "Scope a performance spike for reducing audio processing latency."

## Reference files

- [`references/upstream-notes.md`](references/upstream-notes.md) - normalized notes from the upstream awesome-copilot skill used for this local fork

## Learned Rules

No learned rules yet.
