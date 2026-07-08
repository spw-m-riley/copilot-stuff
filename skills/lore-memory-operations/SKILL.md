---
name: lore-memory-operations
description: "Use when writing, reflecting on, or verifying Lore memories (lore_retain, lore_reflect, memory_backfill, domain scoping) and need the tool's real persistence, scoping, or coverage semantics. Not when the stabilisation-guard blocked the session on open_loop items."
metadata:
  category: memory
  audience: general-coding-agent
  maturity: draft
  kind: task
---

# Lore memory operations

Use this skill when calling Lore's memory tools (`lore_retain`, `lore_reflect`, `memory_backfill`, `memory_explain`) so writes are verified, scoping is deliberate, and recurring automations evolve their stored narrative instead of clobbering it.

## Use this skill when

- Writing a memory with `lore_retain` and deciding global vs. domain/repository scope.
- Reflecting on recent activity with `lore_reflect` for temporal or cross-repo coverage.
- Setting up or debugging a recurring automation that persists into a `refreshable_observation`.
- Verifying whether a Lore write or reflection actually captured real evidence.
- Backfilling more than a handful of historical sessions into Lore.
- Exporting approved improvement artifacts with `memory_portable_bundle` for external review, archival, or sharing outside the CLI.

## Do not use this skill when

- The stabilisation-guard blocked the session on `open_loop`/`assistant_goal` memories — route to [`resolve-open-loops`](../resolve-open-loops/SKILL.md).
- The task is changing Lore's own extension source under `extensions/lore` — that's general engineering, though this skill's reference notes give useful background.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Stabilisation-guard blocked the session on open loops | No | [`resolve-open-loops`](../resolve-open-loops/SKILL.md) |
| Writing, reflecting on, or verifying Lore memories | Yes | - |
| Setting up a recurring profile-refresh or reflection automation | Yes | - |
| Implementing/fixing Lore's own extension code | No | general engineering |

## Inputs to gather

**Required before writing**

- Whether the target `domainKey` already exists (an existing domain needs its full field set resupplied, or it gets reset).
- Whether this is a recurring automation or a one-off request.

**Helpful if present**

- Desired `lookbackHours`/`includeOtherRepositories` for a reflection call.
- Whether the memory belongs global (follows the assistant everywhere) or repo-scoped.

## First move

1. Check `memory_status` to confirm Lore is available.
2. Decide global vs. domain/repo scope before writing anything.
3. For a reflection call, pick an explicit `lookbackHours` rather than free-text date phrasing.

## Workflow

1. Prefer Lore's own retrieval/reflection tools for temporal or cross-repo recall questions; fall back to raw `session-store`/`lore.db` SQL only for verification or coverage gaps.
2. On `lore_retain` calls against an existing `domainKey`, always pass the full `domainKind`/`domainTitle`/`domainMission`/`domainDirectives` set (see [reference notes](references/tool-behavior-notes.md#domain-upserts-fully-replace-not-merge)).
3. On `lore_reflect` calls needing temporal coverage, pass `lookbackHours` explicitly and treat `recentSessionCount`/`trace.recentSessionCount` as the authoritative signal, not the summary text.
4. For a **recurring** automation writing a `refreshable_observation`, never call `persistObservation: true` unconditionally — read the current summary, synthesize an evolved narrative, write it back with a scoped update, and always refresh `updated_at`/`last_refreshed_at` (see [reference notes](references/tool-behavior-notes.md#persistobservation-clobbers-dont-auto-persist-on-every-run)).
5. For a **one-off** rich profile/analysis, synthesize the narrative yourself instead of relying on `persistObservation`'s mechanical keyword-cluster summary, write it via a scoped update preserving other columns, then verify with `memory_explain(mode: "session_start")`.
6. After any write, verify ground truth directly in `lore.db`/`session-store.db` — a specific-sounding success report can diverge from what was actually persisted.
7. Place stable identity/style facts (preferred tone, name to use) as **global** memories; treat repository isolation as the default retrieval scope but not a hard wall — allow labeled cross-repo fallback when local recall is weak.
8. For unscoped temporal recall ("what did we do last Thursday?"), default to cross-workspace search; stay repo-local only when the user explicitly scopes it.
9. For backfilling more than ~20 sessions, use `memory_backfill` with `mode: "controlled"` and its resumable actions rather than the one-shot legacy mode (see [reference notes](references/tool-behavior-notes.md#memory_backfill-modes-and-caps)).
10. When exporting approved improvements for human review or sharing outside the CLI, call `memory_portable_bundle` with `format: "okf"` instead of the default `json` format (see [reference notes](references/tool-behavior-notes.md#portable-export-formats-json-vs-okf)); render the result with `node scripts/visualize-okf-bundle.mjs --bundle <dir>` in `extensions/lore` for a browsable graph view.
11. To make an OKF bundle's concepts actually retrievable by the assistant (not just human-viewable), call `memory_portable_bundle` with `action: "import"` and `format: "okf"` (see [reference notes](references/tool-behavior-notes.md#okf-import-via-memory_portable_bundle-actionimport-formatokf-only)); this is always a manual, explicit call — never wire it into a hook or schedule.
12. Before reloading the Lore extension to capture a baseline, account for `autoProcessOnSessionStart` — a reload can consume deferred extraction jobs and mutate the baseline you're measuring.
13. When validating `lore.db` snapshot/restore behavior, prefer in-process extension tool validation over external Node probes to avoid misleading lock errors from a stale or parallel process.

## Outputs

- A Lore write or reflection whose reported outcome has been verified against `lore.db`/`session-store.db` directly.
- Correctly scoped memories and domain upserts that don't silently reset existing enrichment.
- A recurring automation that evolves its stored narrative instead of clobbering it every run.
- A portable export (json or OKF) containing only reviewed/approved improvement artifacts, never raw memory content.
- An OKF import that lands as retrievable `type: "okf_concept"` semantic memory, verified via `memory_search` — not just a visualized/read bundle.

## Guardrails

- Never treat a narrated Lore write as done because the summary sounds specific — verify the row exists.
- Never omit domain fields on a `lore_retain` call that references an existing `domainKey`.
- Never rely on free-text temporal phrasing for `lore_reflect` coverage — pass `lookbackHours`.
- Never call `persistObservation: true` unconditionally on every run of a recurring automation.
- Never invoke `memory_portable_bundle` `action: "import"` from a hook, schedule, or any automatic trigger — it must stay a deliberate, explicit tool call, since it promotes externally sourced content into retrievable memory.
- `recentSessionCount` capping and `lore_retain` durability were historically unreliable but are now fixed (`extensions/lore` PR #48) — see [reference notes](references/tool-behavior-notes.md#fixed-recentsessioncount-and-durability-extensionslore-pr-48) before assuming you still need a manual workaround.

## Validation

- After any write, re-query `lore.db`/`session-store.db` (or `memory_explain(mode: "session_start")`) to confirm the row/observation exists with the expected content.
- Confirm a domain upsert didn't silently reset `domainKind`/`domainTitle`/`domainMission`/`domainDirectives`.
- Confirm a reflection's `recentSessionCount`/`trace` shows real coverage before trusting a "last day"/"last week" refresh.
- Smoke test:
  - should trigger: "Set up a daily Lore automation to refresh my working-style profile without polluting future context."
  - should not trigger: "The stabilisation-guard blocked my session on 3 open loops." (→ `resolve-open-loops`)

## Examples

- "Write a `lore_retain` call that updates the existing `matt` domain's mission without wiping its directives."
- "My daily profile-refresh automation should evolve the stored narrative instead of overwriting it every run."
- "Verify whether this `lore_reflect` call for 'last day' actually pulled real session evidence or just echoed existing memories."
- "Backfill 200 sessions of history into Lore without hitting the 20-session cap."
- "Export the approved improvement artifacts as OKF markdown so I can review them in a PR instead of raw JSON."
- "Import this OKF bundle a teammate sent me so the assistant can actually recall its concepts later, not just view them."

## Reference files

- [`references/tool-behavior-notes.md`](references/tool-behavior-notes.md) — domain full-replace semantics, `persistObservation` mechanics, `memory_backfill` modes/caps, and the durability/count-cap fix history
- [`resolve-open-loops`](../resolve-open-loops/SKILL.md) — route here instead when the stabilisation-guard blocked the session on open_loop/assistant_goal items
- [`copilot-instructions-deprecated.md`](../../copilot-instructions-deprecated.md) — archived original rule text this skill consolidates
