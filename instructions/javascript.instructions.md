---
description: 'Guidance for JavaScript files in this workspace'
applyTo: "**/*.js,**/*.mjs,**/*.cjs"
---

# JavaScript guidance

## Purpose and Scope

- Applies to `**/*.js`, `**/*.mjs`, and `**/*.cjs` files in this workspace.
- Use these rules for runtime-safe JavaScript edits that stay aligned with existing helpers, module style, and repository tooling.

## Core Guidance

- Prefer existing shared helpers, schemas, and project conventions before adding new patterns.
- Prefer existing project tooling; when choosing or extending JS linting or formatting, favor `oxlint` and `oxfmt` over `eslint`, `prettier`, or `biome` unless the repository already standardizes otherwise.
- Keep module syntax, import style, and runtime assumptions consistent with the file type and the surrounding codebase.
- Validate untrusted inputs at runtime before assuming object shapes or data types.
- Handle `null` and `undefined` explicitly rather than relying on truthiness when behavior matters.
- Keep exported APIs and shared utilities small, clear, and easy to consume.

## Validation Expectations

- Run the repository's standard lint, test, and runtime validation commands for the touched JavaScript surface.
- Prefer syntax checks or extension-runtime validation over bare Node import probes when the runtime injects dependencies that plain Node does not provide.

## Maintenance Notes

- Keep `## Learned Rules` as the final section in the file; do not add new sections after it.
- Append new learned rules without renumbering existing entries; numbering gaps can reflect archived or superseded rules.
- Use `[JAVASCRIPT]` for JavaScript-specific learned rules in this file and keep broader workflow or repository-policy guidance in the root instructions.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->

1. [JAVASCRIPT] When validating Markdown structure in JS tooling, match actual heading lines and ignore fenced code blocks with correctly paired fence delimiters - substring searches create false positives from prose and mismatched fence handling creates false negatives
2. [JAVASCRIPT] When matching Markdown headings in JS validators, treat lines indented by 4 or more spaces as code blocks, not headings - otherwise indented examples can incorrectly satisfy required-heading checks
3. [JAVASCRIPT] When matching CommonMark ATX headings in JS validators, accept optional closing hashes on heading lines - exact string equality rejects valid headings that users or formatters may write as `## heading ##`
4. [JAVASCRIPT] When building SQLite FTS queries in JS, strip punctuation like hyphens and slashes down to plain alphanumeric tokens before issuing `MATCH` - leaving operator-like punctuation in the query can turn search terms into malformed expressions and trigger runtime SQL errors such as `no such column`
5. [JAVASCRIPT] When migrating SQLite schemas in JS, add new columns to existing tables before creating indexes or running queries that reference them - `CREATE TABLE IF NOT EXISTS` does not retrofit old tables, so index creation can fail with `no such column` during live migrations
6. [JAVASCRIPT] When extracting short identity statements from conversational prompts in JS, strip greeting or direct-address prefixes before matching intro regexes - greetings like `Hi Coda, I'm Matt` otherwise miss the real identity clause
7. [JAVASCRIPT] When extending `detectPromptContextNeed`, preserve all existing contract fields and shipped routing semantics (identity-only fast path, temporal cross-workspace fallback, and repo-scoped temporal local-only behavior); add new fields additively rather than replacing existing detection contracts - replacing fields caused regressions in style context, temporal routing, and greeting handling
8. [JAVASCRIPT] For Coherence maintenance-scheduler MVPs, prefer an additive `maintenanceScheduler` config and reuse existing deferred extraction, validation, replay, status, and trace surfaces; keep rollout default-off rather than introducing a parallel upkeep system - the user explicitly redirected this slice toward the smallest safe reuse path
9. [JAVASCRIPT] For the Coherence maintenance-scheduler MVP surface, expose a single `maintenance_schedule_run` tool with dry-run/live modes and keep status on existing surfaces like `memory_status` - the user explicitly narrowed the desired public interface for this slice
10. [JAVASCRIPT] For Coherence safety-gate MVP slices, keep scope to one observe-only reporting surface integrated into an existing Doctor/status tool; avoid adding new rollout flags, standalone tools, interception hooks, or enforcement paths unless explicitly requested - the user explicitly requested the smallest additive reporting-only slice
11. [JAVASCRIPT] When JS extensions read GitHub Copilot CLI user config, prefer the current camelCase config keys and keep older snake_case names only as explicit compatibility fallbacks - this audit found `config.json` using `effortLevel` while a config fallback still looked for `reasoning_effort`, which silently dropped the user's reasoning preference
12. [JAVASCRIPT] When refreshing this repo's `src/web` Yarn 1 lockfile for the CRA4 app, keep `babel-preset-react-app` pinned to `10.0.0`, `babel-preset-current-node-syntax` pinned to `1.0.1`, and `@types/minimatch` pinned to `3.0.3` in `src/web/package.json` resolutions before reinstalling - newer transitive Babel and type-package resolutions break web tests with `plugin-syntax-import-attributes` and break builds with `TS2688` on `minimatch`
13. [JAVASCRIPT] When validating Copilot CLI extension `.mjs` entrypoints in this workspace, do not treat raw Node `import()` failures for `@github/copilot-sdk` as proof of a code regression - the SDK is runtime-provided and unavailable to plain Node here, so use syntax checks and extension-runtime reloads when possible instead
14. [JAVASCRIPT] When JS extensions need the user's Copilot model or effort fallback, read `settings.json` first and treat `config.json` as a comment-tolerant compatibility file rather than strict JSON - this regression came from parsing a comment-prefixed managed config file that does not own user settings
