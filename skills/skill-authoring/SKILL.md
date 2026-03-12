---
name: skill-authoring
description: Create or revise reusable agent skills under skills/<name>/SKILL.md with clear structure, progressive disclosure, and guardrails.
metadata:
  category: authoring
  audience: general-coding-agent
  maturity: stable
---

# Skill authoring

Use this skill when creating or revising a reusable agent skill under `skills/<name>/SKILL.md`.

## Do not use this skill when

- The guidance belongs in global instructions or a repository-wide policy file instead of a reusable skill.
- The workflow is so narrow or stateful that it belongs in a specialized agent instead of a reusable skill.
- The request is a one-off task description with no reuse value.

## Inputs to gather

- The problem the skill should solve and the kinds of requests that should activate it.
- The intended audience, such as a general coding agent or a narrow specialist workflow.
- Required inputs, constraints, examples, and common failure modes.
- Nearby instructions, skills, or agents that may overlap.
- Any environment assumptions that truly matter, such as required tools or network access.

## First move

1. Check whether the guidance belongs in a skill at all instead of a broader instruction file or a specialized agent.
2. Choose a concise kebab-case skill name that matches the directory name.
3. Start from `assets/skill-template.md` and keep the main `SKILL.md` focused on activation, first actions, and validation.

## Workflow

1. Define what should activate the skill and what should not.
2. Draft the top-level `SKILL.md` so the next action is obvious within a few seconds of reading it.
3. Keep the main skill file concise and move lookup-heavy detail into reference files.
4. Add assets for reusable templates or examples when they make the workflow easier to apply.
5. Add scripts only when they remove repeated work and can stay generic, self-contained, and optional.
6. Link every support file from `SKILL.md` so an agent can discover it without guessing.
7. Validate the final package for naming, structure, layering, and discoverability.

## Guardrails

- Keep the skill focused on a reusable workflow, not a one-off task.
- Make the smallest reasonable generic assumptions; only stop for clarification when ambiguity would materially change the design.
- Do not duplicate instructions that belong in broader config or in a specialized agent.
- Keep support files shallow under the skill root and reference them directly from `SKILL.md`.
- Prefer `references/` before `scripts/` unless automation clearly reduces repeated work.

## Validation

- Read the completed skill once as if you were the target agent and confirm the next action is obvious.
- Check the layering against `references/layering-guide.md`.
- Run the checklist in `references/checklist.md`.
- Run `skills-ref validate path/to/skill` when available.
- If the target client supports skill reload or listing, verify the skill remains discoverable there.

## Examples

- "Create a `terraform-module-upgrade` skill for safe module version bumps."
- "Rewrite this skill so it uses references for detailed checklists instead of putting everything in `SKILL.md`."
- "Make this skill more generic so it works across repositories instead of embedding local project rules."

## Reference files

- `assets/skill-template.md` - starter template for a new `SKILL.md`
- `references/layering-guide.md` - where guidance belongs across instructions, skills, and agents
- `references/checklist.md` - final authoring and validation checklist
