---
description: 'Guidance for reusable skills and their support files'
applyTo: "skills/**/*"
---

# Skill package guidance

## Guidance

- Use the `skill-authoring` contract before changing a reusable skill package.
- Keep imported skills aligned with this repository's local frontmatter and section contract; do not reintroduce upstream-only metadata or headings.
- Keep support files shallow and link every on-disk support file from the skill's `## Reference files` section.
- When integrating later skill changes onto a newer branch, compare the touched `SKILL.md` files with the current integration content before applying the change.
- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs` after changing a skill package.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [INSTRUCTIONS] When cherry-picking a later skill-improvement lane onto a newer integration branch, compare any touched `SKILL.md` files against the current integration content before continuing; keep additive validator or scenario hooks without regressing earlier benchmark or guardrail guidance - this Wave 4 integration showed an older validator lane could silently downgrade `skill-authoring` and `workflow-contracts`
3. [EXTENSIONS] When evaluating skill invocation metadata, inspect the bundled runtime before rejecting product-specific fields: `disable-model-invocation` is supported by Copilot CLI/Claude-style runtimes, while Codex's `policy.allow_implicit_invocation` is a separate harness-specific field and should not be treated as a universal local contract - this session initially conflated the local validator's prohibition with runtime support
