# Skill checklist

Use this checklist before considering a skill complete.

## Structure

- `SKILL.md` exists.
- Frontmatter includes `name` and `description`.
- The `name` matches the parent directory name.
- The main file is concise and easy to scan.

## Activation and workflow

- The skill clearly says when to use it.
- The skill clearly says when not to use it, if overlap is likely.
- Inputs are clear enough for an agent to gather what it needs.
- The first move is obvious.
- The workflow is sequential and actionable.

## Progressive disclosure

- Detailed mappings, checklists, or examples live in `references/` or `assets/` instead of bloating `SKILL.md`.
- Every support file is referenced from `SKILL.md`.
- Any scripts are optional and clearly documented.

## Quality

- The wording stays generic at the intended user level.
- Guardrails prevent common failure modes.
- Validation steps tell an agent how to check its own work.
- Examples look like realistic user requests rather than abstract labels.
