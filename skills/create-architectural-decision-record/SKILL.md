---
name: create-architectural-decision-record
description: "Use when asked to create, draft, or standardize an Architectural Decision Record (ADR); not when generic documentation coauthoring is enough."
metadata:
  category: architecture
  audience: general-coding-agent
  maturity: draft
  kind: task
---

# Create Architectural Decision Record

Use this skill to produce a focused ADR that records context, decision, consequences, alternatives, and implementation notes in a predictable format.

## Use this skill when

- The user asks for an ADR or architectural decision record.
- A design decision needs durable status, consequences, and alternatives.
- A codebase needs a new `docs/adr/adr-NNNN-*.md` decision artifact.

## Do not use this skill when

- The user wants broad documentation edits without a decision record; use `doc-coauthoring`.
- The user wants to stress-test a design before committing it; use `grill-with-docs` or `grill-me` first.
- The user wants a code walkthrough rather than a decision artifact; use `code-tour`.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Create a formal ADR for a selected technical choice | Yes | - |
| Draft or edit general README/API documentation | No | `doc-coauthoring` |
| Stress-test whether the decision is sound before documenting it | No | `grill-with-docs` |

## Inputs to gather

**Required before editing**

- Decision title and short problem statement.
- Chosen decision and current status: proposed, accepted, rejected, superseded, or deprecated.
- Relevant context, constraints, and stakeholders.

**Helpful if present**

- Alternatives already considered.
- Existing ADR numbering or docs location.
- Known consequences, risks, and rollout notes.

**Only investigate if encountered**

- Related ADR links if the repository already has ADRs.
- Architecture principles or governance templates if present.

## First move

1. Locate the repository ADR directory and the next ADR number, defaulting to `docs/adr/` and `adr-NNNN-[title-slug].md` when no convention exists.
2. Gather the decision, alternatives, stakeholders, consequences, and implementation notes from the prompt or nearby docs.
3. If critical decision inputs are missing, list the gaps before writing the ADR.

## Workflow

1. Create the ADR with frontmatter and a clear H1 title.
2. Write concise sections for status, context, decision, positive consequences, negative consequences, alternatives considered, implementation notes, and references.
3. Use stable coded bullets such as `POS-001`, `NEG-001`, `ALT-001`, `IMP-001`, and `REF-001` for machine-readable multi-item sections.
4. Save the ADR in the repository convention and preserve existing numbering style.
5. Review the ADR for traceability: every alternative should have a rejection reason and every consequence should connect to the decision.

## Outputs

- A complete ADR markdown file in the repository ADR location.
- A summary of the selected decision, alternatives captured, and any missing follow-up information.
- No unrelated code or documentation changes.

## Guardrails

- Do not invent stakeholder approval, status, or consequences that are not supported by the prompt or repository context.
- Do not overwrite existing ADR numbers; pick the next available sequence.
- Keep implementation commands out of the ADR unless they are necessary implementation notes.

## Validation

- Run the repository documentation checks if they exist; otherwise inspect the generated ADR for required headings and frontmatter.
- Smoke test: should trigger for "Create an ADR for choosing Postgres over DynamoDB for billing."
- Smoke test: should not trigger for "Rewrite this README introduction"; use `doc-coauthoring`.

## Examples

- "Create an ADR for moving our API from REST polling to webhooks."
- "Document the decision to adopt Terraform modules for shared infrastructure."
- "Write an ADR for rejecting a monorepo split this quarter."

## Reference files

- [`references/upstream-notes.md`](references/upstream-notes.md) - normalized notes from the upstream awesome-copilot skill used for this local fork

## Learned Rules

No learned rules yet.
