---
name: cli-tool-survey
description: "Use when asked to survey installed CLIs, brew list output, or local tools for skill and instruction gaps."
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# CLI tool survey

## Use this skill when

- The user asks whether installed CLIs warrant new skills or instruction updates.
- Prompts include "from brew list, are there any CLIs that warrant a skill?", "what tools could be skills?", or "survey installed CLIs for skill gaps".
- The desired output is an inventory-to-skill gap report, not immediate tool adoption.
- The user provides `brew list`, `which`, version output, or asks you to collect it locally.

## Do not use this skill when

- The user already named a skill to create or revise; route to `skill-authoring`.
- The user wants to use one specific CLI for a current task rather than survey the local toolchain.
- The request is about package updates, dependency audits, or security scanning instead of skill coverage.
- The inventory would expose secrets, private configuration contents, or credentials.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Survey installed CLIs and recommend skill or instruction gaps | Yes | - |
| Turn one recommendation into a new reusable skill | No | [`skill-authoring`](../skill-authoring/SKILL.md) |
| Audit JS/TS health with Fallow now | No | [`fallow`](../fallow/SKILL.md) |
| Decide which files and tests matter before implementation | No | [`context-map`](../context-map/SKILL.md) |

## Inputs to gather

**Required before surveying**

- The tool inventory source: provided list, `brew list`, PATH probes, or repository tool manifests.
- Existing skill names and obvious coverage areas under `skills/`.
- The user's intended scope: all installed CLIs, development-only CLIs, or a named subset.

**Helpful if present**

- Version output for unfamiliar or ambiguous tools.
- Existing instruction files that might already cover a tool without a dedicated skill.
- Repository workflows or docs that show a tool is used repeatedly.

**Only investigate if encountered**

- Tools with ambiguous names; run a safe `--version`, `help`, or package-info probe before classifying.
- Local aliases or wrapper commands that obscure the real executable.
- Tools that may phone home or require authentication; skip or note them rather than invoking unsafe probes.

## First move

1. Collect a bounded inventory using the user's provided list first; otherwise use safe local probes such as `brew list`, `which`, and version commands.
2. List existing skills by directory name and map obvious tool coverage before recommending anything new.
3. Classify each relevant CLI as covered, partially covered, or gap.

## Workflow

1. Scope the survey so it does not become an unbounded audit of every binary on the machine.
2. Gather installed tools from the chosen source and normalize names to executable names.
3. Identify tool categories: language/runtime, build/test, infrastructure, code-quality, security, version-control, agent workflow, documentation, or miscellaneous.
4. Compare each recurring or workflow-shaping tool against existing skills and instruction files.
5. Mark a tool as `covered` when an existing skill or instruction file gives agents enough activation and guardrails.
6. Mark a tool as `partial` when coverage exists but lacks activation, validation, or common pitfall guidance.
7. Mark a tool as `gap` only when a reusable workflow would likely recur and the tool is not already covered by a broader skill.
8. Rank candidate new skills by repeatability, risk reduction, and how often an agent would otherwise misuse the CLI.
9. Produce the survey report and route any accepted authoring work to `skill-authoring`.

## Outputs

- A table with columns: CLI, category, covered-by-skill or `gap`, and recommendation.
- A short top-candidates list for skill authoring or instruction updates.
- A clear `no gap` verdict when the installed inventory is already covered well enough.
- Notes for skipped tools when probing would be unsafe, unauthenticated, or out of scope.

## Guardrails

- Prefer existing skills and instructions before proposing new ones.
- Do not treat every installed CLI as skill-worthy; require repeatable agent workflow value.
- Avoid commands that print secrets, credential stores, tokens, or private config payloads.
- Keep probes shallow: presence and version are usually enough for classification.
- Do not install, upgrade, or remove tools during a survey.
- Do not use a survey report as permission to author new skills unless the user asks for that next step.

## Anti-patterns

- Recommending a skill for a one-off or low-risk CLI just because it appears in `brew list`.
- Ignoring existing broad skills that already cover the tool's workflow.
- Producing a raw inventory dump without the covered/gap/recommendation mapping.
- Running interactive or authenticated commands just to identify a tool.

## Validation

- Confirm the output table includes CLI, category, coverage, and recommendation for every in-scope tool.
- Confirm each proposed new skill has a reusable trigger and a distinct boundary from existing skills.
- Confirm any `no gap` verdict explains what existing skill or instruction coverage makes it true.
- Confirm unsafe or skipped probes are called out explicitly.
- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/cli-tool-survey/SKILL.md` after changing this skill.
- Smoke test:
  - should trigger: "From brew list, are there any CLIs here that warrant a new skill?"
  - should not trigger: "Create the Terraform skill we already decided on." (→ `skill-authoring`)

## Examples

- "Survey my installed CLIs and tell me which ones are already covered by skills versus gaps."
- "Given this `brew list`, what tools could become useful agent skills?"
- "Check whether our local toolchain needs instruction additions, and give me a no-gap verdict if not."

## Reference files

- [`skill-authoring`](../skill-authoring/SKILL.md) - consumer skill for accepted new-skill recommendations.
