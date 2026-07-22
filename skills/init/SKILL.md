---
name: init
description: "Use when creating or updating agent instruction files, per-path guides, or stale instruction routers."
metadata:
  kind: task
---

# init Skill

Use this skill to create or refresh instruction files that reduce repeated agent mistakes without duplicating what the repository already shows.

## Use this skill when

- Instruction files are missing, incomplete, stale, too long, or overly generic.
- Agents repeatedly make the same repository-specific mistake.
- A file-type or path-specific instruction file is missing but the codebase has clear non-obvious conventions.
- Agent instruction files need to be split into focused per-path guides.
- You need to document non-obvious operational constraints such as signing, security, deployment gates, testing procedures, or environment setup.
- Learned rules from prior corrections should be captured proactively.

## Do not use this skill when

- The instructions already exist and are current.
- The needed guidance is already enforced by tooling.
- The task is to change repository code, configuration, or behavior.
- The content is a tutorial, project documentation, architecture rationale, or end-user guide.
- You are creating or revising a reusable skill package; route to [`skill-authoring`](../skill-authoring/SKILL.md).

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Instruction files need auditing or splitting | Yes | - |
| Agents keep repeating a repository-specific mistake | Yes | - |
| A reusable skill package needs authoring | No | [`skill-authoring`](../skill-authoring/SKILL.md) |
| README, runbook, or user-facing docs need writing | No | [`doc-coauthoring`](../doc-coauthoring/SKILL.md) |
| Actual code needs changing | No | relevant coding/debugging skill |

## Inputs to gather

- **Scope:** target instruction files, harness conventions, and whether this is global, project-level, or per-path guidance.
- **Problem:** the mistake, stale section, missing rule, or routing gap that triggered the work.
- **Evidence:** examples from prior corrections, review comments, failed tasks, or repeated agent behavior.
- **Constraints:** security, signing, deployment, testing, or tool choices that must not be weakened.
- **Existing sources:** README, config, scripts, ADRs, and nearby instructions to avoid duplicates.

## First move

1. List existing instruction files in scope and skim them for stale, generic, or duplicate guidance.
2. Identify candidate additions or removals and apply the discoverability filter from [`references/discoverability-filter.md`](references/discoverability-filter.md).
3. Decide whether each candidate belongs in instructions, docs, tooling, a skill, or nowhere.

## Workflow

1. **Audit current state:** read relevant instruction files, note stale content, and find missing scoped guides.
2. **Filter candidate rules:** keep only guidance that is non-discoverable, accurate, and materially reduces mistakes.
3. **Choose placement:** global instruction, project instruction, per-path guide, skill, agent, docs, or tooling.
4. **Write or update:** use concise imperative guidance, correct frontmatter, stable repo-relative paths, and learned-rule placement.
5. **Remove or move noise:** archive stale instructions and move tutorials or architecture rationale to docs.
6. **Validate:** verify paths, links, frontmatter, and examples against the live repository.

## Outputs

- Updated agent instruction files with correct frontmatter, scope, examples, and learned-rule placement.
- Keep/archive/move decisions for stale, duplicate, or discoverable content.
- Verified repository-specific paths, commands, and links used by the instructions.
- A handoff note for future instruction maintenance when follow-up remains.

## Guardrails

- Do not use instruction files as a code walkthrough; agents can read code, configs, and README files.
- Do not duplicate rules already enforced by linters, type checks, pre-commit hooks, or CI.
- Do not add generic best practices such as "write clean code" or "test thoroughly".
- Do not force a tool choice unless the repository genuinely cannot use an alternative.
- Do not add unstable guidance for code or workflows still in flux.
- Keep `## Learned Rules` as the final section in instruction files that have one.
- Prefer narrow file/path-scoped instructions over bloated global instruction files.

## Validation

- Every touched `*.instructions.md` file has `description` and `applyTo` frontmatter when that convention applies.
- Each added line passes the 3-question check in [`references/discoverability-filter.md`](references/discoverability-filter.md).
- Links, paths, commands, and examples exist in the repository.
- No content duplicates README, ADRs, config files, or generated tooling output.
- Learned rules are appended in the correct file without adding sections after `## Learned Rules`.
- Smoke test:
  - should trigger: "Split stale copilot-instructions.md into focused per-path instruction files."
  - should not trigger: "Create a reusable skill package for instruction upkeep." (-> `skill-authoring`)

## Examples

- "Agents keep using the wrong deploy command; add the non-obvious repo rule to the right instruction file."
- "Audit these instruction files and remove anything the repo already makes obvious."
- "Create a TypeScript per-path instruction file for this strict workspace convention."

## Reference files

- [`references/discoverability-filter.md`](references/discoverability-filter.md) - deeper guidance and worked examples for deciding what belongs in instructions
- [`references/instruction-examples.md`](references/instruction-examples.md) - good and bad instruction-line examples across repositories
