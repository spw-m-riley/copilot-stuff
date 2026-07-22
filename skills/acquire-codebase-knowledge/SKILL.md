---
name: acquire-codebase-knowledge
description: "Use when the user explicitly asks to map, document, onboard into, or create codebase docs for an existing repo."
metadata:
  kind: task
---

# Acquire Codebase Knowledge

Use this skill to produce evidence-backed `docs/codebase/` onboarding documents for a repository-level discovery request.

## Use this skill when

- The user explicitly asks to map, document, or onboard into an existing codebase.
- Prompts include "map this codebase", "document this architecture", "onboard me to this repo", or "create codebase docs".
- The desired output is repository-level documentation rather than a narrow implementation answer.

## Do not use this skill when

- The task is a routine feature implementation, bug fix, or narrow code edit.
- The user asks for a quick file summary; read the named file directly.
- The user wants collaborative docs such as README, runbook, or API guide writing; route to [`doc-coauthoring`](../doc-coauthoring/SKILL.md).
- The user wants a pre-edit map but not committed docs; route to [`context-map`](../context-map/SKILL.md).

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| User asks for repo onboarding or architecture docs | Yes | - |
| User asks which files are involved before editing | No | [`context-map`](../context-map/SKILL.md) |
| User asks to write or improve README/runbook docs | No | [`doc-coauthoring`](../doc-coauthoring/SKILL.md) |
| User asks for one file explanation | No | read the file directly |

## Inputs to gather

- Optional focus area, such as architecture only, testing and concerns, or integrations.
- Target repository root when not already obvious.
- Any project intent documents the user wants treated as authoritative.

## First move

1. Run the scan script from the target project root before reading source files.
2. Read intent documents such as README, ARCHITECTURE, ROADMAP, SPEC, DESIGN, PRD, or TRD files.
3. Summarize stated intent before documenting source reality.

## Workflow

1. **Scan:** run `scripts/scan.py` from the target project root and save output under `docs/codebase/.codebase-scan.txt`.
2. **Read intent:** inspect top-level intent docs and note intent-vs-reality hypotheses.
3. **Investigate:** use [`references/inquiry-checkpoints.md`](references/inquiry-checkpoints.md) for per-template questions; use [`references/stack-detection.md`](references/stack-detection.md) only when the stack is ambiguous.
4. **Populate templates:** copy the seven templates from `assets/templates/` into `docs/codebase/` and fill only evidence-backed claims.
5. **Focus mode:** if a focus area was requested, fully complete those docs first and keep required sections with `[TODO]` in non-focus docs.
6. **Validate:** repeat until all required sections have evidence, unknowns use `[TODO]`, and intent gaps use `[ASK USER]`.

## Outputs

- `docs/codebase/STACK.md`
- `docs/codebase/STRUCTURE.md`
- `docs/codebase/ARCHITECTURE.md`
- `docs/codebase/CONVENTIONS.md`
- `docs/codebase/INTEGRATIONS.md`
- `docs/codebase/TESTING.md`
- `docs/codebase/CONCERNS.md`
- A final numbered `[ASK USER]` list and any intent-vs-reality divergences.

## Guardrails

- Document only what is verifiable from files or terminal output.
- Do not infer architecture, dependencies, databases, or conventions from names alone.
- Ignore generated output such as `dist/`, `build/`, `.next/`, `out/`, generated files, and caches.
- Mark unknowns as `[TODO]`; mark team-intent questions as `[ASK USER]`.
- Keep skill paths repo-relative; never hard-code local absolute paths.
- Distinguish README intent from actual source structure.

## Validation

- Confirm all seven required files exist in `docs/codebase/`.
- Spot-check two or three non-trivial claims per document against cited source evidence.
- Confirm there are no unsupported claims or empty required sections.
- Confirm every `[ASK USER]` item is a real intent ambiguity.
- Run `scripts/scan.py` again and confirm `STACK.md` remains consistent with scan output.
- Smoke test:
  - should trigger: "Map this repo's architecture and onboarding path for a new engineer."
  - should not trigger: "Write a README for this CLI for first-time users." (-> `doc-coauthoring`)

## Examples

- "Map this repo for a new developer."
- "Document only the architecture and testing layers."
- "Onboard me to this TypeScript monorepo."

## Reference files

- [`scripts/scan.py`](scripts/scan.py) - Phase 1 scanner to run before reading code
- [`references/inquiry-checkpoints.md`](references/inquiry-checkpoints.md) - per-template investigation questions
- [`references/stack-detection.md`](references/stack-detection.md) - stack detection help for ambiguous repositories
- [`assets/templates/STACK.md`](assets/templates/STACK.md) - stack, runtime, frameworks, and dependencies template
- [`assets/templates/STRUCTURE.md`](assets/templates/STRUCTURE.md) - directory layout, entry points, and key files template
- [`assets/templates/ARCHITECTURE.md`](assets/templates/ARCHITECTURE.md) - layers, patterns, and data-flow template
- [`assets/templates/CONVENTIONS.md`](assets/templates/CONVENTIONS.md) - naming, formatting, error handling, and import conventions template
- [`assets/templates/INTEGRATIONS.md`](assets/templates/INTEGRATIONS.md) - external APIs, databases, auth, and monitoring template
- [`assets/templates/TESTING.md`](assets/templates/TESTING.md) - test frameworks, organization, and mocking template
- [`assets/templates/CONCERNS.md`](assets/templates/CONCERNS.md) - tech debt, bugs, security risks, and performance concerns template
