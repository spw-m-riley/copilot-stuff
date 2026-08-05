---
description: 'Guidance for Copilot CLI extension code and integration surfaces'
applyTo: "extensions/**/*"
---

# Extension guidance

## Guidance

- Defer to a nested extension repository's own instructions and keep this file focused on integration boundaries.
- Verify hook names and payload contracts against the shipped Copilot CLI SDK or bundled runtime source before implementing them; issue descriptions can mention unsupported hooks.
- Normalize extension tool arguments before reading fields because interactive payloads can arrive as JSON strings.
- Keep extension reloads separate from follow-up extension-tool calls so availability changes are validated sequentially.
- Do not add branded model names or model IDs to extension files unless Matt explicitly requests them.
- Keep root documentation high-level and keep detailed setup, rollout, maintenance, and product guidance with the owning nested extension.
- Do not suggest direct calls to blocked Copilot API endpoints; use the supported local or editor-backed fallback.
- Prefer syntax checks and extension-runtime validation over plain Node imports when dependencies are provided only by Copilot CLI.
- When live-testing a tool handler, pass the structured arguments implied by the natural-language request before diagnosing routing.
- When an extension or its test surface moves, update the tracked README and CI/test references in the same slice.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [EXTENSIONS] Never batch `extensions_reload` with follow-up extension tool invocations; reload first, then run extension tools in a separate step and report the pause up front - this session stalled when a post-reload `lore_onboard` call was interrupted in the same batch
2. [DOCS] When updating the root `~/.copilot` docs for a nested extension repo, keep the root README high-level and move detailed setup, rollout, maintenance, and product documentation into that extension repo's own docs - Matt explicitly wants Lore documentation to live in the Lore repo instead of being duplicated here
3. [EXTENSIONS] In this environment, `api.githubcopilot.com` is blocked by the corporate firewall - do not suggest any tool that calls it directly (including `llm-github-copilot`, `CopilotChat.nvim`, or `codecompanion.nvim`). For LLM commit messages in worktrunk, use the Neovim editor fallback instead of a Copilot-backed CLI tool
4. [EXTENSIONS] In files under `extensions/`, never reference branded model names or specific model IDs unless Matt explicitly asks for them - he explicitly asked to remove names like Sonnet and `GPT-5.3-codex` from that subtree
5. [RESEARCH] When the user asks about Copilot CLI or extension-runtime capabilities, inspect the bundled CLI/SDK source or other authoritative runtime source first instead of inferring behavior from local `~/.copilot` usage examples - repo-local extension patterns are not the runtime contract
6. [WORKFLOW] When a repo-local extension or test surface moves to a new path, update the tracked README and CI/test-command references in the same slice before promotion - a prior move left automation and documentation stale
7. [EXTENSIONS] Before implementing a Copilot CLI hook, verify the hook name exists in the shipped SDK docs/types for the current CLI version; unknown hook keys are silently ignored at runtime
8. [EXTENSIONS] In Copilot CLI session hooks, always normalize `toolArgs` before reading fields like `path`, `view_range`, or `forceReadLargeFiles`; interactive runtime payloads can arrive as JSON strings even when object-shaped args appear elsewhere
9. [WORKFLOW] When live-testing a tool handler directly, pass the structured arguments that the natural-language request implies before diagnosing routing from rendered output - omitting an implied scope flag can look like a routing failure
10. [JAVASCRIPT] When extracting short identity statements from conversational prompts in a Copilot CLI extension, strip greeting or direct-address prefixes before matching intro regexes - greetings like `Hi Coda, I'm Matt` otherwise miss the real identity clause
11. [JAVASCRIPT] When extending an extension's `detectPromptContextNeed`-style routing function, preserve all existing contract fields and shipped routing semantics (identity-only fast path, temporal cross-workspace fallback, and repo-scoped temporal local-only behavior); add new fields additively rather than replacing existing detection contracts - replacing fields caused regressions in style context, temporal routing, and greeting handling
12. [JAVASCRIPT] For Lore/Coherence maintenance-scheduler MVPs, prefer an additive `maintenanceScheduler` config and reuse existing deferred extraction, validation, replay, status, and trace surfaces; keep rollout default-off rather than introducing a parallel upkeep system - the user explicitly redirected this slice toward the smallest safe reuse path
13. [JAVASCRIPT] For the Lore/Coherence maintenance-scheduler MVP surface, expose a single `maintenance_schedule_run` tool with dry-run/live modes and keep status on existing surfaces like `memory_status` - the user explicitly narrowed the desired public interface for this slice
14. [JAVASCRIPT] For Lore/Coherence safety-gate MVP slices, keep scope to one observe-only reporting surface integrated into an existing Doctor/status tool; avoid adding new rollout flags, standalone tools, interception hooks, or enforcement paths unless explicitly requested - the user explicitly requested the smallest additive reporting-only slice
15. [JAVASCRIPT] When an extension reads GitHub Copilot CLI user config, prefer the current camelCase config keys and keep older snake_case names only as explicit compatibility fallbacks - this audit found `config.json` using `effortLevel` while a config fallback still looked for `reasoning_effort`, which silently dropped the user's reasoning preference
16. [JAVASCRIPT] When validating a Copilot CLI extension's `.mjs` entrypoints, do not treat raw Node `import()` failures for `@github/copilot-sdk` as proof of a code regression - the SDK is runtime-provided and unavailable to plain Node here, so use syntax checks and extension-runtime reloads when possible instead
17. [JAVASCRIPT] When an extension needs the user's Copilot model or effort fallback, read `settings.json` first and treat `config.json` as a comment-tolerant compatibility file rather than strict JSON - this regression came from parsing a comment-prefixed managed config file that does not own user settings
18. [JAVASCRIPT] When adding a new `lib/config.mjs` + `schemas/lore.schema.json` config key in the Lore extension, also update `tests/helpers/fixture-config.mjs`'s separately-maintained hardcoded defaults and any test asserting the full rollout shape (e.g. `tests/unit/config.test.mjs`'s `normalizeRolloutConfig` expectation) - `scripts/validate-config-schema.mjs` only checks parity between `config.mjs` and the schema, so the test fixture's own defaults copy can silently drift and never exercise the new key otherwise
19. [JAVASCRIPT] When patching repeated JavaScript test setup blocks in the Lore extension, anchor the patch with the unique test name or fixture ID rather than a generic setup call - an episode fixture for the reflection-default test was initially inserted into the preceding opt-in test because both blocks shared the same `db.insertSemanticMemory` context
20. [JAVASCRIPT] When expanding Lore retrieval queries for SQLite FTS, never append semantic expansion terms to the existing space-separated query; run expansion as an alternate retrieval attempt and retry the deterministic query when it produces no evidence - adjacent FTS terms narrow matches with AND-style behavior and can hide valid evidence
