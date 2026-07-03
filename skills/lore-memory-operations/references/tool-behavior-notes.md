# Lore tool behavior notes

Detailed schema/API mechanics behind the workflow steps in `SKILL.md`. Consolidates prior `copilot-instructions.md` learned rules (see the end of each section for the archived rule numbers).

## Domain upserts fully replace, not merge

`upsertMemoryDomain` (behind `lore_retain` when `domainKey` references an existing domain) fully **replaces** the domain row rather than merging fields. Any call that omits `domainKind`/`domainTitle`/`domainMission`/`domainDirectives` silently resets a previously-enriched domain back to bare defaults (`kind: custom`, empty mission/directives). Always resupply the full set on every call that targets an existing `domainKey`.

*(Archived rule #109.)*

## `persistObservation` clobbers — don't auto-persist on every run

`lore_reflect`'s `persistObservation: true` snapshots that single call's own mechanically-generated `summary` — a keyword-frequency clustering over selected evidence, not LLM synthesis. No tool parameter exposes a way to write a custom/pre-synthesized summary directly.

- **Recurring automation** (e.g., a daily profile refresh): never call `persistObservation: true` unconditionally every run — it clobbers any richer synthesized content with the thin keyword-cluster summary. Instead: read the current summary first, synthesize an evolved narrative (preserve durable traits, fold in new signal, cap length), and write it back via a scoped parameterized DB update. Refresh `updated_at`/`last_refreshed_at` every successful run regardless, so freshness never lapses even when the narrative text itself doesn't change.
- **One-off rich analysis**: synthesize the narrative directly and write it with a scoped, parameterized direct DB update (preserving all other columns), then live-verify via `memory_explain(mode: "session_start")`.

*(Archived rules #116, #117.)*

## Verify temporal coverage before trusting a reflection

When a profile refresh or reflection asks for "the last day" (or similar) of sessions:

- Check that the reflection output actually includes temporal/session evidence before trusting it. If source accounting shows only style reminders or cross-repo examples with no real session coverage, treat the refresh as **degraded** and avoid updating ambient persona memories from it.
- Don't rely on free-text "last day"/"last week" phrasing on compound analytical prompts — pass the explicit `lookbackHours` parameter instead, and check the returned `recentSessionCount`/`trace.recentSessionCount` as the authoritative degradation signal rather than eyeballing summary text. Root cause (historical): `inferDateFromPrompt` never recognized "last day," and `pureTemporalRecall` requires zero non-date content terms, so compound prompts with dozens of content terms could never trigger the session-lookup path regardless of date-phrase fixes.

*(Archived rules #112, #113.)*

## Fixed: `recentSessionCount` and durability (`extensions/lore` PR #48)

Historically, two failure modes required manual workarounds. Both are now fixed and merged — current `lore_reflect`/`lore_retain` output can be trusted at face value for these two specific modes without manual ground-truth re-verification:

- **Session-count capping**: `recentSessionCount` used to be silently set to the length of the (deliberately capped) evidence-fetch array — `Math.max(3, Math.min(limit*2, 20))`, i.e. 12 with the default `limit: 6` — not a true `COUNT(*)`. It now comes from `SessionStoreReader.countSessionsSince()`: an exact `COUNT(*)` for the cross-repo case, or a hydrated count flagged `capped: true` at its own ceiling when repository-scoped.
- **Write durability**: a `lore_retain` call could report `success: true` with a real generated memory ID that never became durably queryable, root-caused to a multi-process WAL race (many long-lived `copilot` CLI processes hold independent `node:sqlite` `DatabaseSync` connections open to `lore.db`, and `close()`'s old `PRAGMA wal_checkpoint(TRUNCATE)` could race a concurrent writer's in-flight commit). Every `insertSemanticMemory` write is now confirmed durable via an independent read-only connection (`verifySemanticMemoryDurability`) before success is reported, and `close()` uses `wal_checkpoint(PASSIVE)`, which never blocks or disrupts other connections.

Still true regardless: never trust a Lore automation's self-reported actions (e.g., "retained memory X", "sessions found: N") without checking `lore.db`/`session-store.db` directly for anything the tool layer doesn't itself verify — a detailed, specific-sounding report can diverge from what was actually persisted.

*(Archived rules #108, #118, #119, #120, #122.)*

## `memory_backfill` modes and caps

`memory_backfill` has two modes:

- **`legacy`** (default, one-shot): `limit` and `batchSize` are both hard-clamped to 20. Fine for small catch-ups, but silently stops well short of a true full import on larger archives.
- **`controlled`** (resumable): `limit`/`batchSize` allow up to 100, and the tool supports `action: "preview" | "start" | "resume" | "status" | "restore"` to process an arbitrarily large archive across multiple calls without dropping to raw module access.

For any archive bigger than ~20 sessions, use `mode: "controlled"` with resume actions rather than assuming the legacy default gives full coverage.

*(Archived rule #15, rewritten from "coherence" terminology and updated for the controlled/resumable mode added since the original rule was written.)*

## Scoping: global vs. repository, cross-repo fallback, cross-workspace recall

- Treat repository isolation as the **default** retrieval scope, not a hard wall. Allow transferable cross-repo memories/examples to surface as clearly labeled fallback context when the prompt suggests reuse or local recall is weak (e.g., prior-art like CI migration patterns), without polluting normal repo-specific memory.
- Store stable identity facts that should follow the assistant across repositories (e.g., the name the user wants used) as **global** memories, not repo-scoped ones.
- Treat unscoped temporal recall prompts ("What did we do last Thursday?") as **cross-workspace by default**, and only keep them repo-local when the user explicitly scopes to the current repo/config.
- When a user expresses a standing tone/style preference (e.g., friendly, conversational, occasional humor), persist it as a durable **global** style preference with guardrails rather than a one-off prompt tweak.
- For cross-repository temporal recall or work-history questions, use Lore's own retrieval/reflection tools first and only fall back to raw `session_store` SQL for verification or gaps.

*(Archived rules #13, #14, #17, #18, #32 — rewritten from "coherence system" terminology; the underlying policy is unchanged and confirmed still live via Lore's `includeOtherRepositories`/`crossRepo` handling.)*

## Baseline capture and validation hygiene

- Before reloading the Lore extension to capture a baseline ahead of extraction/ranking changes, account for `autoProcessOnSessionStart` — a reload can consume deferred extraction jobs and mutate the would-be baseline under unchanged logic.
- When validating `lore.db` snapshot/restore behavior, prefer in-process extension tool validation over external Node probes; a stale or parallel Copilot process holding the database open can produce misleading lock errors during restore.

*(Archived rules #6, #9 — rewritten from "coherence"/"coherence.db" terminology; both mechanics are identical in Lore's current codebase.)*
