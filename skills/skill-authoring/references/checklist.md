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

### Capability-vs-process classification

Before picking `metadata.kind`, classify what the content actually is:

- **Capability** — the value is knowing a fact, convention, schema, or option space (what exists, what a field means, which command does what). This is `reference` material: the payoff is fast lookup, not a required sequence.
- **Process** — the value is a repeatable sequence with real inputs, outputs, and decision points (do step 1, then 2, branch on X). This is `task` material: the payoff is a correct end state reached in order.
- Mixed content is common on import — an upstream doc often bundles lookup tables with an implied sequence. Split it: keep the sequence in the top-level `SKILL.md` workflow, and move pure lookup content (tables, schemas, option catalogs) into `references/`. Do not force a lookup table into a numbered `## Workflow` just to satisfy the task shape, and do not strip a genuine multi-step sequence down into a flat reference list.
- If classification is genuinely ambiguous, default to the shape that matches how an agent will actually consume it in practice: sequential prompts calling for `task`, ad hoc "what does X mean" prompts calling for `reference`.

## Completion criteria

- Make completion criteria checkable: each required output or end state should map to an observable check.
- Make the criteria exhaustive, not merely representative; cover failure paths, route-away conditions, and required validation as well as the happy path.
- State what must be true before stopping, so a plausible first result does not become premature completion.
- Prefer completion checks that stay cheap on every re-run (a single command, a grep, a short re-read) over checks that require re-deriving context from scratch each time; a completion bar that is expensive to verify tends to get skipped under time pressure.

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

### Adversarial edge-case review

Before calling a skill complete, try to break it the way a hostile or careless input would, not just the way a cooperative user would:

- Feed the description a near-miss prompt from an adjacent skill and confirm routing stays unambiguous (this overlaps with, but is not the same as, the smoke test above — the smoke test checks one clean pair, this checks for a family of confusable prompts).
- Check whether the workflow, if followed literally by a less careful agent, could be pointed at a destructive or irreversible action without a guardrail catching it first (for example, a vague "clean up" step that could resolve to deleting the wrong path).
- For any skill that shells out, reads external content, or adopts third-party material, confirm the guardrails explicitly cover the intake-security checks in [`import-rewrite-contract.md`](import-rewrite-contract.md#third-party-skill-intake-security-checks), not just the happy-path workflow.
- Confirm a malformed, missing, or contradictory input (a missing required field, a nonsensical combination of inputs) produces a clear stop or escalation in the workflow rather than an undefined next step.

## Pruning and steering

- **Context economics**: every sentence in `SKILL.md` and its support files is reloaded into context on every future invocation, not written once and read once — treat brevity and precision as a recurring saving multiplied across every future session, not just neatness for a single read. This is the underlying reason the rules below matter more than they might look at first glance.
- Review prose sentence by sentence: delete no-op sentences, duplicated guidance, and sediment left from earlier versions.
- Keep one source of truth for each rule; replace repeats with a precise pointer to the owning section or reference file.
- Use leading words as compact steering cues (for example, **Prefer**, **Avoid**, **Check**, **Route**, and **Stop**) so bullets scan consistently.
- Phrase free-text guardrails positively around the desired behavior, while keeping explicit hard boundaries such as **must not**, **never**, or **do not** where safety or correctness requires them.
