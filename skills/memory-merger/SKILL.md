---
name: memory-merger
description: "Use when merging mature lessons from a domain memory file into an instruction file; not when capturing a new one-off learned rule."
metadata:
  category: memory
  audience: general-coding-agent
  maturity: draft
  kind: task
---

# Memory Merger

Use this skill to consolidate mature memory notes into durable instruction guidance while preserving knowledge and reducing redundancy.

## Use this skill when

- A domain memory file contains mature guidance that should become an instruction file.
- The user asks to merge or promote memories into instructions.
- Instruction and memory files need deduplication without knowledge loss.

## Do not use this skill when

- The user states a new correction or preference that should be appended as a learned rule immediately.
- The task is cross-session recall; use Lore memory tools.
- The user wants general documentation prose; use `doc-coauthoring`.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Merge mature memory notes into instructions | Yes | - |
| Capture a new learned rule from a correction | No | Relevant instruction file learned-rule process |
| Recall prior work from memory | No | Lore recall/reflection tools |

## Inputs to gather

**Required before editing**

- Domain name and target scope.
- Memory file path and destination instruction file path.
- User approval for which memories to merge when interactive review is possible.

**Helpful if present**

- Existing instruction frontmatter and applyTo patterns.
- Known duplicates or superseded rules.
- Preferred categories for learned rules.

**Only investigate if encountered**

- Adjacent instruction files if routing or applyTo overlap is unclear.
- Deprecated-rule archive only when removing active guidance.

## First move

1. Parse the domain and scope, mapping global/user and workspace/ws aliases when applicable.
2. Read the memory file and the destination instruction file if it exists.
3. Propose merge candidates before modifying files when user review is available; in autonomous mode, proceed only with clearly mature, non-conflicting guidance.

## Workflow

1. Inventory memory entries and group them by destination section.
2. Preserve every material detail while removing duplicates and stale wording.
3. Merge applyTo patterns when creating or updating instruction frontmatter.
4. Update the instruction file, keeping `## Learned Rules` as the final section when present.
5. Remove or mark merged memory entries so the same lesson is not promoted repeatedly.

## Outputs

- Updated instruction file with merged guidance.
- Cleaned memory file with merged content removed or clearly marked.
- Summary of memories merged, skipped, or left for user review.

## Guardrails

- Do not delete active rules without archiving when repository policy requires deprecation history.
- Do not merge uncertain or conflicting lessons without surfacing the conflict.
- Do not create broad global guidance from repo-specific memory unless the scope is explicitly global.

## Validation

- Run markdown or instruction validators if present; otherwise inspect frontmatter, applyTo, and final `## Learned Rules` placement.
- Smoke test: should trigger for "/memory-merger >typescript workspace".
- Smoke test: should not trigger for "Remember that I prefer short answers"; capture a learned rule or memory instead.

## Examples

- "Merge the mature git-workflow memories into the workspace instruction file."
- "/memory-merger >prompt-engineering global"
- "Promote these Terraform memory notes into the Terraform instructions."

## Reference files

- [`references/upstream-notes.md`](references/upstream-notes.md) - normalized notes from the upstream awesome-copilot skill used for this local fork

## Learned Rules

No learned rules yet.
