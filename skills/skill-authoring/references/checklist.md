# Skill checklist

Use this checklist before considering a skill complete.

## Structure

- `SKILL.md` exists.
- Frontmatter includes `name` and `description`.
- The `name` matches the parent directory name.
- If nearby skills use shared metadata fields, the new skill follows that local convention consistently.
- If the skill uses `metadata.kind`, the value matches the package behavior.
- The main file is concise and easy to scan.
- The package shape is predictable enough that a future scaffolding or validation tool would not need to guess where things belong.

## Activation and workflow

- The skill clearly says when to use it.
- The skill clearly says when not to use it, if overlap is likely.
- The description includes specific trigger phrases (not just a domain label) and leans toward over-triggering. It includes at least one disambiguator to avoid crowding adjacent skills.
- Inputs are clear enough for an agent to gather what it needs.
- The first move is obvious.
- The workflow is sequential and actionable.
- Outputs or end-state expectations are explicit enough for the skill kind.
- Required section headings occur exactly once and are stable enough to find the activation, workflow, validation, and support-file guidance quickly.

## Completion criteria

- Make completion criteria checkable: each required output or end state should map to an observable check.
- Make the criteria exhaustive, not merely representative; cover failure paths, route-away conditions, and required validation as well as the happy path.
- State what must be true before stopping, so a plausible first result does not become premature completion.

## Progressive disclosure

- Detailed mappings, checklists, or examples live in `references/` or `assets/` instead of bloating `SKILL.md`.
- Put the decision branches and next action in `SKILL.md`; disclose branch-specific detail only after the branch is selected.
- Sharpen context pointers with a condition, purpose, and destination: say when to read a file, what it resolves, and link the exact path.
- Every support file is referenced from `SKILL.md`.
- `## Reference files` entries are backtick-wrapped only when the path exists locally in the skill package — the validator treats a backticked path-like string as a required local reference and fails on missing upstream-only paths (e.g. `guides/foo/bar.md`).
- `## Reference files` always lists at least one existing local file — never a placeholder like `None`, since the validator requires a resolvable local reference target.
- Any scripts are optional and clearly documented.
- Support-file names and paths are explicit enough that a future tool could discover them without guessing.

## Quality

- The wording stays generic at the intended user level.
- Guardrails prevent common failure modes.
- Validation steps tell an agent how to check its own work.
- Task skills declare outputs, artifacts, or end-state expectations plus validation.
- Reference skills make the lookup value, examples, and support-file navigation obvious.
- Examples look like realistic user requests rather than abstract labels.
- The skill uses the smallest stable structure that still leaves room for future tool-assisted authoring.
- A two-prompt smoke-test (one request that should trigger the skill, one near-miss that should not) confirms the description alone distinguishes between them without needing to read the SKILL.md body.

## Pruning and steering

- Review prose sentence by sentence: delete no-op sentences, duplicated guidance, and sediment left from earlier versions.
- Keep one source of truth for each rule; replace repeats with a precise pointer to the owning section or reference file.
- Use leading words as compact steering cues (for example, **Prefer**, **Avoid**, **Check**, **Route**, and **Stop**) so bullets scan consistently.
- Phrase free-text guardrails positively around the desired behavior, while keeping explicit hard boundaries such as **must not**, **never**, or **do not** where safety or correctness requires them.
