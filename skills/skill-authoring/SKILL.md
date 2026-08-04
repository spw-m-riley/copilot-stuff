---
name: skill-authoring
description: "Use when creating or revising a reusable agent skill under skills/<name>/SKILL.md."
metadata:
  category: authoring
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Skill authoring

Use this skill when creating or revising a reusable `skills/<name>/SKILL.md` package with clear activation, concise workflow, and validator-safe structure.

## Use this skill when

- You are creating or revising a reusable skill package under `skills/<name>/`.
- You need to decide whether guidance belongs in a skill, instruction file, docs, or specialized agent.
- You are normalizing frontmatter, activation boundaries, examples, validation, or support-file links.

## Do not use this skill when

- The guidance belongs in global instructions or a repository-wide policy file.
- The workflow is so narrow or stateful that it belongs in a specialized agent.
- The request spans skills, agents, instructions, extensions, docs, and validators across the whole `~/.copilot` repo; route to [`copilot-config-curator`](../../agents/copilot-config-curator.agent.md).
- The request is a one-off task description with no reuse value.
- The user is asking for collaborative documentation rather than an agent skill; route to [`doc-coauthoring`](../doc-coauthoring/SKILL.md).

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Create or revise a reusable skill package | Yes | - |
| Create or update agent instruction files | No | [`init`](../init/SKILL.md) |
| Author README, guide, API docs, or runbook prose | No | [`doc-coauthoring`](../doc-coauthoring/SKILL.md) |
| Curate the whole `~/.copilot` library across skills, agents, instructions, docs, and validators | No | [`copilot-config-curator`](../../agents/copilot-config-curator.agent.md) |
| Build a long-lived operator persona or stateful workflow | No | specialized agent |

## Inputs to gather

- The problem the skill should solve and requests that should activate it.
- Intended audience and whether the skill is `task` or `reference`.
- Inputs, constraints, examples, common failure modes, and expected outputs.
- Nearby skills, instructions, or agents that may overlap.
- Support files/scripts/templates that should stay shallow and linked.

## First move

1. Check whether the guidance belongs in a skill at all.
2. Choose a concise kebab-case name that matches the directory.
3. Start from [`assets/skill-template.md`](assets/skill-template.md).

## Workflow

1. Define trigger and non-trigger boundaries.
2. Draft a trigger-focused description (when to read, not how to execute).
3. Choose `metadata.kind`: `task` for playbooks, `reference` for lookup-heavy guidance.
4. Keep `SKILL.md` concise; move detailed tables/examples/schemas into support files.
5. Keep stable section names and link every support file from `## Reference files`.
6. Add concrete trigger/non-trigger examples.
7. Run validator + checklist before considering the skill complete.

## Outputs

- A validated `skills/<name>/SKILL.md` package with correct frontmatter, activation, routing boundaries, workflow or navigation, examples, validation, and reference links.
- Shallow support files under `assets/`, `references/`, or `scripts/` when they reduce top-level bulk.
- A clear `metadata.kind` decision that matches the package behavior.
- Passing `scripts/validate-skill-library.mjs` output for the changed package or full library.

## Guardrails

- Keep the skill focused on a reusable workflow, not a one-off task.
- Do not duplicate instructions that belong in broader config or a specialized agent.
- Do not force task-skill output shape onto a reference skill.
- Do not leave a task skill without explicit outputs and validation.
- Prefer `references/` before `scripts/` unless automation clearly reduces repeated work.
- Descriptions must say when to read the skill, not how to execute it.

## Validation

- Check the frontmatter contract in [`references/metadata-contract.md`](references/metadata-contract.md).
- Run the checklist in [`references/checklist.md`](references/checklist.md).
- Check layering against [`references/layering-guide.md`](references/layering-guide.md).
- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs` after changing `SKILL.md`, `assets/`, `references/`, or `scripts/`.
- Smoke-test with one trigger and one near-miss prompt.

## Examples

- "Turn this conventions-heavy note into a reference skill with concise activation and linked support files."
- "Rewrite `skills/reverse-prompt/SKILL.md` so decision logic is top-level and details move to references."
- "Create a `terraform-module-upgrade` skill with clear trigger boundaries and first validation step."
- should trigger: "Create a reusable skill for GraphQL schema migrations with activation boundaries and validation."
- should not trigger: "Add a rule to copilot-instructions.md about how this repo signs commits."

## Reference files

- [`assets/skill-template.md`](assets/skill-template.md) - starter template for a new `SKILL.md`
- [`references/layering-guide.md`](references/layering-guide.md) - where guidance belongs across instructions, skills, and agents
- [`references/checklist.md`](references/checklist.md) - final authoring and validation checklist
- [`references/metadata-contract.md`](references/metadata-contract.md) - canonical frontmatter contract and forbidden-key policy
- [`references/import-rewrite-contract.md`](references/import-rewrite-contract.md) - shared target shape for rewriting upstream skills into this library
- [`references/quality-scenarios.md`](references/quality-scenarios.md) - skill quality review scenarios and maintenance loop
- [`scripts/validate-skill-library.mjs`](scripts/validate-skill-library.mjs) - local validator for metadata, examples, and support-file references
