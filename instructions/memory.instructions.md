---
description: 'Guidance for Lore, session history, and memory-aware workflows'
applyTo: "**/*"
---

# Memory and Lore guidance

## Guidance

- Treat Lore as the active memory system; Coherence-named surfaces are compatibility history unless migration support is requested.
- When historical context or repository precedent could affect routing or implementation, query Lore and the session store in parallel, reconcile their evidence, and let the combined result influence the approach.
- When scoping Copilot session history by repository, prefer the effective workspace repository from `session-state/<sessionId>/workspace.yaml` over `sessions.repository` when the two differ.
- When improving instruction files from prior-session patterns or repeated mistakes, query Lore for relevant episodic and semantic evidence first; keep only accurate, non-duplicate, non-discoverable guidance.
- If stabilisation-guard surfaces unresolved `open_loop` or `assistant_goal` items, use `/resolve-open-loops` to inventory and triage them instead of repeatedly retrying blocked writes or launching more fleet sessions.
- When adding the next Lore local-inference configuration change, provide a persistent setting for model-backed `lore_reflect` calls while keeping that setting false by default.
- Never treat `localInference: used (embeddings: used)` as proof that a Lore reflection is high quality; compare the model's conclusions with the rendered supporting evidence and report synthesis drift plainly.
- Preserve repository scope when recalling or backfilling history.
- Distinguish retrieved evidence from model-generated synthesis before using it to justify an implementation decision.
- Do not close an open loop or forget a global memory without the user's explicit disposition.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
11. [MEMORY] When scoping Copilot session history by repository, do not trust `session-store.db` `sessions.repository` alone; if `session-state/<sessionId>/workspace.yaml` provides repository metadata, prefer that effective workspace repo for retrieval and backfill - session-store rows can reflect a researched target repo while the actual local working repo is different.
59. [MEMORY] Treat Lore as the active memory system in this workspace; interpret remaining Coherence-named files or rules as legacy compatibility guidance unless a task explicitly targets migration support - the root repo should read Lore-first while preserving compatibility history.
135. [MEMORY] When adding the next Lore local-inference configuration change, provide a persistent default opt-in for model-backed `lore_reflect` calls while keeping that setting false by default.
136. [MEMORY] Never treat `localInference: used (embeddings: used)` as proof that a Lore reflection is high quality; compare the configured local-inference model's conclusions with the rendered supporting evidence and report synthesis drift plainly.
140. [MEMORY] When stabilisation-guard surfaces unresolved `open_loop` or `assistant_goal` items, use `/resolve-open-loops` to inventory and triage them instead of repeatedly retrying the blocked write or launching more fleet sessions; the guard fires once per session and stale items can otherwise multiply friction across child sessions.
142. [MEMORY] When improving instruction files from prior-session patterns or repeated mistakes, query Lore for relevant episodic and semantic evidence before deciding what to add; compare its candidates against the live instruction set and keep only accurate, non-duplicate, non-discoverable guidance.
143. [MEMORY] Whenever memory, recalled context, prior decisions, or repository or cross-repository precedent is needed, use Lore and the session store in parallel rather than treating either as sufficient alone; reconcile conflicts, preserve repository scope, and let the combined evidence influence routing and implementation choices.
