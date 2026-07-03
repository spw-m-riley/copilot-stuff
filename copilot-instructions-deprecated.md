# Deprecated Copilot Instructions

This file contains rules that have been superseded, are no longer applicable, or have been migrated. They are preserved here for historical reference and context.

## About This Archive

- Deprecated rules do not apply to current work
- New rules should not be added here; they belong in the active `copilot-instructions.md`
- If you encounter a deprecated rule, refer to its supersession note for current guidance
- This archive is not scanned at session start

## Deprecated Rules

### Rule 25 (Deprecated: Superseded by Rule 26)

**Original text:**
```
25. [ACTIONS] Before declaring a todo done, always verify the target worktree is clean except for the intended slice and commit that slice first - reporting completion with a dirty worktree causes false-done status and rollback churn.
```

**Reason for deprecation:** Rule 26 is the canonical formulation with the same core lesson. Rule 26 also explicitly references Rule 60 for acknowledgment of this supersession.

**Current guidance:** See Rule 26 — "Never report a todo as done while the target worktree has uncommitted changes; validate, commit the finalized slice, confirm clean status, then update SQL status"

---

### Lua Rule 6 (Deprecated: Superseded by Lua Rule 5)

**Original text:**
```
6. [NEOVIM] When validating a Neovim config worktree outside the live `~/.config/nvim` path, use rule 5 as the canonical base procedure; this historical entry is retained because it captured the same lesson before the more precise `XDG_CONFIG_HOME` parent-directory guidance was added later
```

**Reason for deprecation:** Rule 5 is the canonical procedure. Rule 6 was a refinement that becomes redundant with Rule 5's explicit guidance.

**Current guidance:** See Lua Rule 5 — "When validating a Neovim config from a repo checkout or worktree, explicitly point `nvim` at that config with `XDG_CONFIG_HOME`/`NVIM_APPNAME`"

### Rules 34, 37, 44, 45 (Deprecated: Removed without archive)

**Original text:** Not available — these rules were removed from the active ruleset during earlier sessions without a deprecation record being created at the time.

**Reason for deprecation:** Content was either consolidated into other rules, superseded by newer guidance, or captured a one-off correction that did not generalize. Exact text was not preserved.

**Current guidance:** Refer to the active ruleset in `copilot-instructions.md`. The numbering gaps are acknowledged and preserved per the "never delete rules" policy.

---

### Rule 31 (Deprecated: Superseded by Rule 73)

**Original text:**
```
31. [ACTIONS] Never present a user-requested plan as complete until the default Jason/Freddy review round has finished and any active planning agents have been reconciled - skipping the review loop and handing off while planners are still active creates avoidable confusion and rework
```

**Reason for deprecation:** Rule 73 is the canonical version and encodes the explicit `/plan-review-loop` skill invocation that replaced the older ambient phrasing.

**Current guidance:** See Rule 73 in `copilot-instructions.md`.

---

### Rules 42-43 (Moved to github-workflows.instructions.md)

**Original text:**
```
42. [ACTIONS] When triaging repeated GitHub Actions failures on the same PR, inspect the earliest failing run before assuming later attempts share the same root cause - this session showed one PR first failed from a stray `package-lock.json` cache artifact and later failed separately with a `yarn install` `Invalid URL`
43. [ACTIONS] When a GitHub Actions package-install failure depends on a pinned runtime, reproduce it with the exact pinned Node/Yarn versions before changing more workflow auth or registry settings - this session showed `yarn install` failed under Volta `node` `20.0.0` but passed under newer `20.19.x`, making the runtime pin the real fix
```

**Reason for deprecation:** These are workflow-file-specific lessons and now live in the dedicated GitHub Actions instruction file under the narrower `[GITHUB-ACTIONS]` category.

**Current guidance:** See Rules 16-17 in `instructions/github-workflows.instructions.md`.

---

### Rule 57 (Moved to github-workflows.instructions.md)

**Original text:**
```
57. [ACTIONS] When the user asks only for a scoped artifact such as a composite action, deliver just that artifact and avoid extra tests, validators, or workflow rewiring unless explicitly requested - over-executing beyond the asked-for slice frustrated Matt
```

**Reason for deprecation:** This lesson is specific to workflow-scoped artifacts such as composite actions and is now tracked with the rest of the GitHub Actions guidance.

**Current guidance:** See Rule 18 in `instructions/github-workflows.instructions.md`.

---

### Rule 60 (Deprecated: Historical note absorbed by Rule 26)

**Original text:**
```
60. [ACTIONS] Treat rule 26 as the canonical completion/worktree-cleanliness gate; rule 25 is retained only as historical context because both rules captured the same lesson and were creating duplicate guidance
```

**Reason for deprecation:** This was a meta-note about earlier consolidation, not a distinct reusable instruction.

**Current guidance:** See Rule 26 in `copilot-instructions.md` and Rule 25's archive entry above.

---

### Rule 62 (Moved to lua.instructions.md)

**Original text:**
```
62. [OTHER] When the user scopes a Lua/Neovim change to the smallest truthful implementation lane, stop extra doc or runtime probing once the required wiring is clear and ship the scoped change with the agreed validation commands - this correction explicitly prioritized implementation over more Progress-payload research
```

**Reason for deprecation:** This is a Neovim/Lua-specific execution lesson and now belongs in the Lua instruction file.

**Current guidance:** See Rule 31 in `instructions/lua.instructions.md`.

---

### Rule 63 (Deprecated: Superseded by Rule 64)

**Original text:**
```
63. [OTHER] When planning merge resolution and the user says `origin/develop` reflects the intended end state after a partial revert, treat `origin/develop` as authoritative for those reverted areas instead of preserving the branch's newer-looking tooling changes - this session showed the npm/esbuild migration was incomplete, non-working, and meant to be removed
```

**Reason for deprecation:** This captured a one-off repository-state clarification that Rule 64 now explicitly says should not be stored as a durable global lesson.

**Current guidance:** Use task-local context for repo-state clarifications unless they generalize beyond the immediate repository state.

---

### Rule 65 (Deprecated: Superseded by Rule 64)

**Original text:**
```
65. [OTHER] Treat rule 1 as superseded historical context rather than an active reusable instruction; one-off repo-state clarifications belong in the task context unless they generalize beyond the immediate repository state
```

**Reason for deprecation:** This was a cleanup note around the durable-rule threshold and no longer adds reusable guidance beyond Rule 64.

**Current guidance:** See Rule 64 in `copilot-instructions.md`.

---

### Rules 74-76 (Moved to markdown.instructions.md)

**Original text:**
```
74. [OTHER] In Mermaid flowcharts intended for GitHub README rendering, prefer quoted node labels and avoid inline edge text when labels contain punctuation or parentheses - GitHub's Mermaid parser is stricter than permissive examples and rejected an unquoted `Response (output tokens)` node plus annotated edge syntax
75. [OTHER] In Mermaid flowcharts intended for GitHub README rendering, prefer top-down layouts and short labels once a diagram has nested groups or more than a few nodes - GitHub's renderer shrinks wide diagrams aggressively, which made the context-window diagram hard to read until it was simplified and stacked vertically
76. [OTHER] In Mermaid flowcharts intended for GitHub README rendering, use explicit fill and stroke styling for major groups when category distinctions matter - GitHub's default dark-theme rendering can collapse nested diagrams into low-contrast grey boxes that are harder to read
```

**Reason for deprecation:** These are Markdown-specific documentation-rendering rules and now live in the dedicated Markdown instruction file.

**Current guidance:** See Rules 1-3 in `instructions/markdown.instructions.md`.

---

### Rules 88, 89, 97 (Deprecated: Repo-specific one-offs per Rule 64)

**Original text:**
```
88. [REVIEW] When Matt confirms a platform is retired for the active repository (for example Sonar in `aws-referral-api-v2`), treat new review comments tied to that platform as cleanup/removal work rather than further integration fixes - this session clarified that remaining Sonar references should be removed, not updated
89. [WORKFLOW] In `aws-referral-api-v2`, when a local commit is blocked only by the `validate:gitleaks` leg and Matt says gitleaks is not needed for that slice, skip only the gitleaks leg while keeping the rest of the commit hook path intact - this session needed the workflow branch committed without bypassing CircleCI config validation or lint-staged
97. [WORKFLOW] In the `software-factories` repo, when generating a relative path from `factories/<repo>/` back to the real target checkout under `~/work/`, use `../../<repo>` rather than `../<repo>` because the factory directory adds one more path segment than the factories root - this session's first `targetRepoPath` pointed back at the generated factory instead of the real sibling repo
```

**Reason for deprecation:** All three are tied to a single repository's state at a single moment, which Rule 64 explicitly says should not be captured as durable global rules. If the situations recur, the lessons belong in the relevant repo's own `CONTEXT.md` or `.github/copilot-instructions.md`, not in the global `~/.copilot` ledger.

**Current guidance:** Rule 64 — "Never capture a one-off repo-state clarification as a durable learned rule unless it reflects a reusable preference or general practice."

---

### Rules 48, 49, 55 (Deprecated: Superseded by `git-signing-troubleshoot` skill)

**Original text:**
```
48. [GIT] When 1Password SSH signing fails with `failed to fill whole buffer` in this `~/.copilot` workflow, treat it as an external approval or app-interop blocker after validating the staged diff and the configured signing path; do not keep inventing alternate Git/signing routes once the same trusted `op-ssh-sign` failure is reproduced directly - this session showed the remaining work can be narrowed to signed commit approval even when the repo content is ready
49. [SECURITY] When inspecting 1Password SSH key items with `op`, never fetch the full item payload just to confirm metadata; restrict the query to non-secret fields because a plain `op item get` on an SSH key can expose private-key material unnecessarily - this signing investigation only needed item identity and public-key metadata
55. [GIT] When troubleshooting 1Password-backed Git signing in this `~/.copilot` workflow, use the actual signed `git commit` as the source of truth before declaring the path blocked; `op whoami` can still report `account is not signed in` even after app delegation is healthy enough for a normal commit to succeed - this session only unblocked after retrying the real Git commit directly
```

**Reason for deprecation:** All three are fully absorbed by the `git-signing-troubleshoot` skill's Workflow and Guardrails sections (that skill already cited `copilot-instructions.md` as source material before this archival). Keeping them active in the global ledger was pure duplication.

**Current guidance:** See `skills/git-signing-troubleshoot/SKILL.md` — Workflow steps 4-6 and Guardrails.

---

### Rules 20, 22, 23, 24, 26, 27, 36, 46, 50 (Deprecated: Folded into `git-worktrees` skill guardrails)

**Original text:**
```
20. [WORKTREE] When continuing implementation from a dirty local checkout in a fresh worktree, account for the uncommitted tracked and untracked baseline first; a new worktree starts from `HEAD` only and can silently omit the real local state needed for correct follow-on edits
22. [WORKTREE] When a worktree already contains broad copied baseline changes, always surface focused file-level diffs for the requested slice so the concrete implementation is visible amid unrelated pending changes - the user explicitly said they could not see the router-core worktree diffs
23. [WORKTREE] When a parallel implementation lane is already active for the same slice, stop at the current safe point unless you already have concrete validated changes or a clearly better quick-to-validate improvement - the user explicitly asked to avoid extra churn on router-core work when another lane is active
24. [WORKTREE] When the user says a slice is being promoted into main, stop at the next safe point, make no further edits, and leave SQL status unchanged unless post-validation proves it is wrong - the user wants promotion handoff stability and no extra churn
26. [WORKTREE] Never report a todo as done while the target worktree has uncommitted changes; validate, commit the finalized slice, confirm clean status, then update SQL status - this correction flagged a false-complete report on a dirty worktree
27. [WORKTREE] When launching or verifying a dependent implementation worktree, always confirm the branch already contains the prerequisite commit(s) before treating the lane as active - this session showed a supposed follow-on retrieval lane was still based on the Wave 1 doctor baseline and wasted time exploring the wrong code
36. [WORKTREE] When validating completion in this `~/.copilot` workspace, always check nested git repositories such as `extensions/lore` separately; the parent repo status can look clean while nested repo changes are still uncommitted - this session showed a false-finalization risk when only the parent `git status` was inspected
46. [WORKTREE] When a task is assigned to a specific git worktree, make the edits inside that worktree path and verify that worktree's status before claiming progress - editing the main checkout can leave the isolated lane untouched and produce a false sense of completion
50. [WORKTREE] When reviewing a scoped task in a worktree that also contains other known task diffs, ignore pre-existing out-of-scope changes unless they directly interfere with the requested slice - this correction clarified that already-integrated Task 2 changes should not be reported as Task 4 review failures
```

**Reason for deprecation:** These 9 rules described hard-won worktree hygiene lessons that the `git-worktrees` skill's Guardrails section didn't yet capture. Consolidated into 6 Guardrail bullets in that skill (dirty-baseline accounting, done-while-dirty, nested-repo checks, prerequisite-commit verification, out-of-scope-diff handling, parallel-lane/promotion stop-points) rather than left as 9 separate flat rules.

**Current guidance:** See `skills/git-worktrees/SKILL.md` — Guardrails section.

---

### Rules 94, 99 (Deprecated: Folded into `skill-authoring` checklist)

**Original text:**
```
94. [INSTRUCTIONS] In `skills/*/SKILL.md` `## Reference files` sections, do not wrap upstream source paths like `guides/foo/bar.md` in backticks unless those files exist locally in the skill package - the skill validator treats backticked path-like strings as required local references and will fail on missing upstream-only paths
99. [INSTRUCTIONS] In `skills/*/SKILL.md`, always list at least one existing local file in `## Reference files`; never use a placeholder like `None` because the skill validator requires a resolvable local reference target - this session's new skills failed validation until adjacent local skill or instruction files were linked
```

**Reason for deprecation:** Both are pure `skill-authoring` validator implementation trivia — narrower than a global rule, and directly actionable only while authoring a skill package. Moved into the Progressive disclosure section of that skill's own checklist, next to the general reference-file guidance they refine.

**Current guidance:** See `skills/skill-authoring/references/checklist.md` — Progressive disclosure section.

---

### Rules 6, 9, 13, 14, 15, 17, 18, 32, 108, 109, 112, 113, 116, 117, 118, 119, 120, 122 (Deprecated: Consolidated into `lore-memory-operations` skill)

**Original text:**
```
6. [MEMORY] When capturing a coherence baseline before extraction or ranking changes, account for `autoProcessOnSessionStart` before reloading the extension - a reload can consume deferred extraction jobs and mutate the would-be baseline under unchanged logic
9. [MEMORY] When validating `coherence.db` snapshot/restore behavior, prefer in-process extension tool validation over external Node probes; otherwise a stale or parallel Copilot process can hold the database open and produce misleading lock errors during restore
13. [MEMORY] In the coherence system, treat repository isolation as the default retrieval scope, not a hard wall; allow transferable cross-repo memories and examples to surface as clearly labeled fallback context when the prompt suggests reuse or local recall is weak - the user wants useful prior art like CI migrations without polluting normal repo-specific memory
14. [MEMORY] In the coherence system, store stable identity facts that should follow the assistant across repositories (for example the assistant name the user uses) as global memories rather than repo-scoped memories - the user expects direct address by name to carry across projects
15. [MEMORY] When the user asks for a full coherence backfill, do not rely on the `memory_backfill` tool for archives larger than 20 sessions; it hard-clamps both `limit` and `batchSize` to 20, so verify coverage and use the underlying modules or fix the cap first - this session showed the public tool can silently stop well short of a true full import
17. [MEMORY] In the coherence system, treat unscoped temporal recall prompts like "What did we do last Thursday?" as cross-workspace by default, and only keep them repo-local when the user explicitly scopes to the current repo/config - the user wants temporal recall to answer broad work-history questions unless narrowed
18. [COMMUNICATION] In the coherence system, when the user expresses a standing preference for a friendly, conversational, colleague-like tone with occasional humor, persist it as a durable global style preference with guardrails instead of treating it as a one-off prompt tweak - the user wants the voice to feel like solving problems together, not just a transient instruction
32. [MEMORY] When the user asks cross-repository temporal recall or work-history questions in this `~/.copilot` workflow, use Lore retrieval/reflection tools first and only fall back to raw `session_store` SQL for verification or gaps - the user expects Lore to be the primary memory interface for that kind of recall
108. [MEMORY] Never treat a narrated Lore write (`memory_domain`, `semantic_memory`, `refreshable_observation`) as done because a summary claims success or describes a "safe fallback" - query `lore.db` directly to confirm the rows actually exist before proceeding; a detailed, specific-sounding report can diverge completely from what was actually persisted
109. [MEMORY] Always pass the full `domainKind`/`domainTitle`/`domainMission`/`domainDirectives` set on every `lore_retain` call that references an existing `domainKey` - `upsertMemoryDomain` fully replaces the domain row rather than merging, so any call that omits these fields silently resets a previously-enriched domain back to bare defaults (`kind: custom`, empty mission/directives)
112. [MEMORY] When a Lore profile refresh asks for "the last day" of sessions, verify the reflection output actually includes temporal/session evidence before trusting it; if source accounting shows only style reminders or cross-repo examples, treat the refresh as degraded and avoid updating ambient persona memories from it - this run persisted an observation but provided no last-day session coverage
113. [MEMORY] Never rely on free-text "last day"/"last week" phrasing for `lore_reflect` temporal coverage on compound analytical prompts; pass the explicit `lookbackHours` parameter instead, and check the returned `recentSessionCount`/`trace.recentSessionCount` as the authoritative degradation signal rather than eyeballing summary text (refines rule #112 now that a structural signal exists) - root cause was that `inferDateFromPrompt` never recognized "last day" and `pureTemporalRecall` requires zero non-date content terms, so compound prompts with dozens of content terms could never trigger the session-lookup path regardless of date-phrase fixes
116. [MEMORY] `lore_reflect`'s `persistObservation` always snapshots that single call's own mechanically-generated `summary` (keyword-frequency clustering over selected evidence, not LLM synthesis), and no tool exposes a way to write a custom/pre-synthesized summary into a `refreshable_observation` - for a genuinely rich one-off profile, synthesize the narrative directly and write it with a scoped, parameterized direct DB update (preserving all other columns), then live-verify via `memory_explain(mode: "session_start")`
117. [MEMORY] A recurring automation that persists into a `refreshable_observation` must never call `persistObservation: true` unconditionally every run - that mechanically clobbers any richer synthesized content with `lore_reflect`'s own thin keyword-cluster summary; instead have it read the current summary first, synthesize an evolved narrative (preserve durable traits, fold in new signal, cap length), and write it back via a scoped parameterized DB update - refresh `updated_at`/`last_refreshed_at` every successful run regardless, so freshness never lapses even when the narrative text itself doesn't change
118. [MEMORY] Never trust a Lore automation's self-reported actions (e.g., "retained memory X", "sessions found: N") without checking `lore.db`/`session-store.db` directly - a run can genuinely execute a tool call, get a real success response with a valid-looking ID, and still not have durably persisted the row (see rule #120), so ground-truth verification is the only reliable check
119. [MEMORY] `lore_reflect`'s reported `recentSessionCount` is capped at `Math.max(3, Math.min(limit*2, 20))` (12 with the default `limit:6`) via `fetchRecentSessionsForLookback`'s `findSessionsSince` call, not a true `COUNT(*)` - it was sized for evidence-selection performance (`selectReflectEntries` only ever keeps the top 4 of a deduped ≤20 candidate pool) and was never reconsidered when reused as a user-facing degradation/reporting signal; treat "0" as a reliable degradation signal but treat any positive N as "at least N, capped," never as an exact count
120. [MEMORY] A `lore_retain` call can report `success: true` with a real generated memory ID that never becomes durably queryable in `lore.db` - root cause is a multi-process WAL race: many long-lived `copilot` CLI processes (11 observed via `lsof lore.db`) hold independent connections open to the same file via Node's experimental built-in `node:sqlite` `DatabaseSync` (`journal_mode=WAL`, `busy_timeout=5000`, no explicit `synchronous` pragma, no app-level write queue), and `close()` issues `PRAGMA wal_checkpoint(TRUNCATE)` which can race a concurrent writer; confirmed by finding the missing row's raw bytes present in `lore.db-wal` but absent from the main db file and every live query - any critical `lore_retain`/`insertSemanticMemory` write (especially from unattended automation) should re-SELECT by the returned id immediately after to confirm durability before reporting success, since the tool layer itself cannot currently detect this failure mode (fixed and merged in `extensions/lore` PR #48 via `close()` using `wal_checkpoint(PASSIVE)` plus an independent-connection `verifySemanticMemoryDurability` check wired into every write path)
122. [MEMORY] Rules #119 and #120 are fixed and merged (`extensions/lore` PR #48, merged 2026-07-03): `lore_reflect`'s `recentSessionCount` now comes from `SessionStoreReader.countSessionsSince()` - an exact `COUNT(*)` cross-repo, or a hydrated count flagged `capped: true` at its own ceiling when repository-scoped - instead of the evidence-fetch cap, and every `insertSemanticMemory` write is confirmed durable via an independent read-only connection (`verifySemanticMemoryDurability`) before success is reported, with `close()` switched from `wal_checkpoint(TRUNCATE)` to `PASSIVE`. Treat #119/#120 as historical root-cause records only; current `lore_reflect`/`lore_retain` output can be trusted at face value for these two specific failure modes without manual ground-truth re-verification
```

**Reason for deprecation:** Rules #6, #9, #13, #14, #15, #17, #18 originally named "the coherence system," a predecessor extension no longer present in `extensions/` (only legacy schema docs remain). Live-code audit confirmed Lore inherited the same mechanics identically (`autoProcessOnSessionStart` config key, `memory_backfill` tool name, `crossRepo`/`includeOtherRepositories` scoping) — the guidance was still fully valid, just mislabeled. Rule #15 additionally had a substantive gap: Lore since added a `mode: "controlled"` resumable `memory_backfill` path (limit/batchSize up to 100, `preview`/`start`/`resume`/`status`/`restore` actions) that supersedes the original "use the underlying modules" workaround. Combined with the already-Lore-labeled rules #32, #108, #109, #112, #113, #116, #117, #118, #119, #120, #122, this whole cluster of ~18 rules represented Lore-tool operating knowledge with no dedicated skill home. Consolidated into one new skill rather than left as flat, terminology-drifted rules.

**Current guidance:** See `skills/lore-memory-operations/SKILL.md` and its `references/tool-behavior-notes.md`.

---

## Adding a Deprecated Rule

When a rule becomes obsolete:
1. Move it here with full context
2. Add a note: "DEPRECATED: [reason]. See [current guidance] instead."
3. Keep the rationale for historical understanding
4. Remove from active `copilot-instructions.md`

Example format:

```
### Rule X (Deprecated: reason)

**Original:** [full rule text]

**Reason for deprecation:** The tool changed, the pattern evolved, or this approach is no longer recommended.

**Current guidance:** Use rule Y instead, or see [link to updated approach].
```
