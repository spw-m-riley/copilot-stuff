---
name: skill-authoring
description: Author reusable agent skills under skills/<name>/SKILL.md with clear activation, shallow references, predictable structure, and explicit validation.
metadata:
  category: authoring
  audience: general-coding-agent
  maturity: stable
---

# Skill authoring

Use this skill when creating or revising a reusable agent skill under `skills/<name>/SKILL.md`, especially when you need to decide activation, layering, examples, and validation.

Treat this as the benchmark shape other skills should copy: concise activation, shallow support files, and an obvious first validation step.

## Use this skill when

- You are creating or revising a reusable agent skill under `skills/<name>/SKILL.md`.
- You need a reusable authoring standard for a local skill package with shallow support files.

## Minimum acceptance gate

A skill is ready to hand off when it:

- says exactly when to use it and when not to
- keeps `SKILL.md` concise by pushing lookup-heavy detail into shallow support files
- includes at least one concrete example and one validation step
- makes the next action obvious without asking the reader to infer the workflow

## Do not use this skill when

- The guidance belongs in global instructions or a repository-wide policy file instead of a reusable skill.
- The workflow is so narrow or stateful that it belongs in a specialized agent instead of a reusable skill.
- The request is a one-off task description with no reuse value.

## Inputs to gather

- The problem the skill should solve and the kinds of requests that should activate it.
- The intended audience, such as a general coding agent or a narrow specialist workflow.
- Whether the skill is primarily a `reference skill` or a `task skill`.
- Required inputs, constraints, examples, and common failure modes.
- The outputs, artifacts, or decisions the skill should leave behind.
- Nearby instructions, skills, or agents that may overlap.
- Any environment assumptions that truly matter, such as required tools or network access.
- Whether the skill should follow an existing local package shape or frontmatter convention.

## First move

1. Check whether the guidance belongs in a skill at all instead of a broader instruction file or a specialized agent.
2. Choose a concise kebab-case skill name that matches the directory name.
3. Start from `assets/skill-template.md` and keep the main `SKILL.md` focused on activation, first actions, and validation.

## Workflow

1. Define what should activate the skill and what should not.
2. Decide whether the package is primarily a `reference skill` or a `task skill`:
   - `reference skill` = lookup-heavy guidance, conventions, and examples
   - `task skill` = multi-step workflow with explicit inputs, outputs, and validation
3. Use a predictable package shape so the skill is easy to scaffold, inspect, and validate later:
   - stable frontmatter
   - clear section headings
   - shallow support-file layout
   - direct links to every support file
4. Draft the top-level `SKILL.md` so the next action is obvious within a few seconds of reading it.
5. Keep the main skill file concise and move lookup-heavy detail into reference files.
6. For task skills, make outputs or handoff artifacts explicit. For reference skills, make discovery and support-file navigation explicit.
7. Add assets for reusable templates or examples when they make the workflow easier to apply.
8. Add scripts only when they remove repeated work and can stay generic, self-contained, and optional.
9. Link every support file from `SKILL.md` so an agent can discover it without guessing.
10. Validate the final package for naming, structure, layering, and discoverability.

## Guardrails

- Keep the skill focused on a reusable workflow, not a one-off task.
- Make the smallest reasonable generic assumptions; only stop for clarification when ambiguity would materially change the design.
- Do not duplicate instructions that belong in broader config or in a specialized agent.
- Do not force a task-skill output shape onto a reference skill, but do not leave a task skill without explicit outputs or validation.
- Keep support files shallow under the skill root and reference them directly from `SKILL.md`.
- Prefer `references/` before `scripts/` unless automation clearly reduces repeated work.
- Prefer standard section names when they fit so future authoring or validation tools can reason about the skill without guessing.
- **Red flag:** if the draft starts embedding repo policy, one-off orchestration, or environment-specific branching, move that content out of the skill.
- **Handoff trigger:** if the shape needs a dedicated operator persona, split orchestration, or long-lived state, promote it to a specialized agent instead of widening the skill.

## Anti-patterns

- Wrong layering: putting lookup tables, full templates, or repo-specific exceptions directly in `SKILL.md` when a shallow reference file would keep the package clearer.
- Over-specialized shape: baking in a single repository's path conventions, CI roles, or internal team process so the skill stops being reusable.
- Hidden workflow: making the skill feel like a note to the author instead of a playbook with activation, workflow, and validation.

## Validation

- Read the completed skill once as if you were the target agent and confirm the next action is obvious.
- Check the layering against `references/layering-guide.md`.
- Run the checklist in `references/checklist.md`.
- Run `scripts/validate-skill-library.mjs` after changing `SKILL.md`, `assets/`, or `references/`.
- Check that the package shape is predictable enough for future tool-assisted authoring:
  - frontmatter is present and matches the directory name
  - section headings are stable and easy to scan
  - support files are shallow and linked directly from `SKILL.md`
- Check that the skill's structure matches its kind:
  - task skills declare outputs or handoff artifacts plus validation
  - reference skills make the lookup value and support-file paths obvious
- If the target client supports skill reload or listing, verify the skill remains discoverable there.

## Examples

- "Turn this conventions-heavy note into a reference skill with a one-paragraph activation block, direct links to support files, and a concrete example."
- "Rewrite `skills/reverse-prompt/SKILL.md` so the decision logic stays obvious at the top level and the detailed branching moves into references."
- "Create a `terraform-module-upgrade` skill that stays generic, uses shallow references, and makes the first validation step obvious."

## Reference files

- `assets/skill-template.md` - starter template for a new `SKILL.md`
- `references/layering-guide.md` - where guidance belongs across instructions, skills, and agents
- `references/checklist.md` - final authoring and validation checklist
- `scripts/validate-skill-library.mjs` - local validator for skill library metadata, examples, and support-file references
