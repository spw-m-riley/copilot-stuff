---
name: context-md-authoring
description: "Use when writing CONTEXT.md, CONTEXT-MAP.md, or a project-specific domain glossary."
metadata:
  category: documentation
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# CONTEXT.md authoring

## Use this skill when

- The user asks to write, refresh, or set up `CONTEXT.md` for a repository.
- The user asks for `CONTEXT-MAP.md` in a repository with multiple bounded contexts.
- Prompts include "the domain terminology is fuzzy", "add a glossary of project terms", or "write a CONTEXT.md for this repo".
- The intended artifact is project-specific domain vocabulary grounded in canonical code or docs.

## Do not use this skill when

- The user wants design stress-testing or interrogation that will update domain docs as a side effect.
- The user wants a README, runbook, API guide, or broad documentation rewrite.
- The requested terms are general programming concepts rather than project-specific domain language.
- The repo already has clear context docs and the task is only to answer a one-off terminology question in chat.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Write or refresh `CONTEXT.md` as the primary artifact | Yes | - |
| Set up `CONTEXT-MAP.md` for multiple bounded contexts | Yes | - |
| Stress-test a design while updating CONTEXT.md and ADRs | No | [`grill-with-docs`](../grill-with-docs/SKILL.md) |
| Co-author a README, guide, or runbook | No | [`doc-coauthoring`](../doc-coauthoring/SKILL.md) |
| Map the whole codebase into onboarding docs | No | [`acquire-codebase-knowledge`](../acquire-codebase-knowledge/SKILL.md) |

## Inputs to gather

**Required before editing**

- The repository root and whether it already has `CONTEXT.md` or `CONTEXT-MAP.md`.
- The domain area or bounded contexts to document.
- Canonical code paths, docs, schemas, tests, or examples that define the terms.
- Terms that are fuzzy, overloaded, or important to future work.

**Helpful if present**

- Existing ADRs, glossary notes, issue discussions, or user-provided definitions.
- Package or service boundaries that imply separate contexts.
- Known terms that should not be used because they conflict with current domain language.

**Only investigate if encountered**

- Monorepo or multi-product layout that may require a map instead of one root glossary.
- Conflicting definitions across code, docs, and user language.
- Terms that look technical but are actually domain-specific in this project.

## First move

1. Check the repo root for `CONTEXT.md` and `CONTEXT-MAP.md`.
2. If a map exists, use it to find the relevant context file before editing.
3. Gather candidate terms from canonical docs and code before drafting definitions.

## Workflow

1. Decide whether the repository has a single bounded context or multiple contexts.
2. For a single context, create or update root `CONTEXT.md` unless the repo already establishes a more specific location.
3. For multiple contexts, create or update `CONTEXT-MAP.md` with each context name, purpose, owning path, and linked context file.
4. Extract only project-specific domain terms; exclude general programming, framework, infrastructure, and generic architecture vocabulary.
5. For each term, write a concise definition and link to canonical code, docs, schema, or tests that establish the meaning.
6. Call out synonyms, deprecated terms, or overloaded words when they affect future agent work.
7. Preserve existing accurate definitions and update stale ones with evidence rather than rewriting the glossary wholesale.
8. Add explicit non-goals so future agents know what not to put in the context docs.
9. Validate every link and re-read the artifact for terminology consistency.

## Outputs

- A root or per-context `CONTEXT.md` with project-specific domain terms, definitions, and links to canonical evidence.
- `CONTEXT-MAP.md` when multiple bounded contexts exist or need routing.
- Explicit non-goals stating that general programming concepts do not belong in these artifacts.
- A brief final summary of terms added, terms changed, and any unresolved terminology conflicts.

## Guardrails

- Only add project-specific domain terms; do not add general programming concepts.
- Keep definitions concise and evidence-backed.
- Do not invent domain meaning from variable names alone; verify against code behavior, tests, docs, or user-provided context.
- Use repo-relative links and avoid user-specific absolute paths.
- Do not create ADRs unless the user asks or another skill owns that design-decision workflow.
- Do not let CONTEXT.md become an architecture guide, README, or implementation inventory.

## Anti-patterns

- Adding terms such as "API", "database", "service", or "component" without project-specific meaning.
- Writing long implementation explanations instead of definitions.
- Creating a single root glossary for a monorepo with clearly separate bounded contexts.
- Replacing established domain language with generic industry terminology.

## Validation

- Confirm every added term is project-specific and has a canonical evidence link.
- Confirm `CONTEXT-MAP.md` exists and links to context files when multiple bounded contexts are present.
- Confirm explicit non-goals exclude general programming concepts.
- Confirm repo-relative links resolve.
- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/context-md-authoring/SKILL.md` after changing this skill.
- Smoke test:
  - should trigger: "Write a CONTEXT.md for this repo with the project glossary and canonical code links."
  - should not trigger: "Grill me on this design and capture ADRs as decisions emerge." (→ `grill-with-docs`)

## Examples

- "Write a CONTEXT.md for this repo so agents use the domain terms consistently."
- "The terminology is fuzzy around invoices, payouts, and settlements; refresh the glossary from the code."
- "Set up CONTEXT-MAP.md for this monorepo and link each bounded context to its glossary."

## Reference files

- [`grill-with-docs`](../grill-with-docs/SKILL.md) - adjacent design stress-test workflow that can update domain docs as a side effect.
