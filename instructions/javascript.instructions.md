---
applyTo: "**/*.js,**/*.mjs,**/*.cjs"
---

Prefer existing shared helpers, schemas, and project conventions before adding new patterns.
Prefer existing project tooling; when choosing or extending JS linting or formatting, favor `oxlint` and `oxfmt` over `eslint`, `prettier`, or `biome` unless the repository already standardizes otherwise.
Keep module syntax, import style, and runtime assumptions consistent with the file type and the surrounding codebase.
Validate untrusted inputs at runtime before assuming object shapes or data types.
Handle `null` and `undefined` explicitly rather than relying on truthiness when behavior matters.
Keep exported APIs and shared utilities small, clear, and easy to consume.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
7. [JAVASCRIPT] When extending `detectPromptContextNeed`, preserve all existing contract fields and shipped routing semantics (identity-only fast path, temporal cross-workspace fallback, and repo-scoped temporal local-only behavior); add new fields additively rather than replacing existing detection contracts - replacing fields caused regressions in style context, temporal routing, and greeting handling
1. [JAVASCRIPT] When validating Markdown structure in JS tooling, match actual heading lines and ignore fenced code blocks with correctly paired fence delimiters - substring searches create false positives from prose and mismatched fence handling creates false negatives
2. [JAVASCRIPT] When matching Markdown headings in JS validators, treat lines indented by 4 or more spaces as code blocks, not headings - otherwise indented examples can incorrectly satisfy required-heading checks
3. [JAVASCRIPT] When matching CommonMark ATX headings in JS validators, accept optional closing hashes on heading lines - exact string equality rejects valid headings that users or formatters may write as `## heading ##`
4. [JAVASCRIPT] When building SQLite FTS queries in JS, strip punctuation like hyphens and slashes down to plain alphanumeric tokens before issuing `MATCH` - leaving operator-like punctuation in the query can turn search terms into malformed expressions and trigger runtime SQL errors such as `no such column`
5. [JAVASCRIPT] When migrating SQLite schemas in JS, add new columns to existing tables before creating indexes or running queries that reference them - `CREATE TABLE IF NOT EXISTS` does not retrofit old tables, so index creation can fail with `no such column` during live migrations
6. [JAVASCRIPT] When extracting short identity statements from conversational prompts in JS, strip greeting or direct-address prefixes before matching intro regexes - greetings like `Hi Coda, I'm Matt` otherwise miss the real identity clause
8. [JAVASCRIPT] For Coherence maintenance-scheduler MVPs, prefer an additive `maintenanceScheduler` config and reuse existing deferred extraction, validation, replay, status, and trace surfaces; keep rollout default-off rather than introducing a parallel upkeep system - the user explicitly redirected this slice toward the smallest safe reuse path
9. [JAVASCRIPT] For the Coherence maintenance-scheduler MVP surface, expose a single `maintenance_schedule_run` tool with dry-run/live modes and keep status on existing surfaces like `memory_status` - the user explicitly narrowed the desired public interface for this slice
