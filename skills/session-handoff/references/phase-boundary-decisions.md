# Phase-boundary decisions

Use this reference when it is unclear whether the right move at a phase boundary is to keep going, clear context, write a handoff, delegate to a subagent, or compact. These options are not interchangeable — picking the wrong one either loses context that mattered or carries noise forward that should have been dropped.

## The decision order

Work through these in order; stop at the first one that genuinely fits. Each option is progressively more disruptive to continuity, so prefer the earliest fit rather than defaulting to the most disruptive option out of caution.

1. **Continue** — the current context is still coherent, the task is not at a real phase boundary, and there is no noise problem yet. Do nothing; this reference does not apply.
2. **Clear** — the task is genuinely finished and nothing from this session needs to carry forward (no open loops, no follow-up work, no resumable state worth preserving). A plain context clear is enough; a handoff artifact would just be documenting nothing.
3. **Handoff** — a research or planning phase is ending, the context is noisy, or work is moving to a fresh session, lane, or subagent, and there is real state worth preserving (decisions, blockers, refs, validation status). This is the case this skill (`session-handoff`) exists for — write `session-state/<sessionId>/handoff.md` before clearing or compacting.
4. **Subagent** — the remaining work is scoped enough to delegate to a background or parallel agent without losing the current session's context, and the current session should keep working on something else rather than pausing. Prefer this over a handoff when the current session stays alive and only a bounded sub-task needs to run separately; write a handoff first if the subagent needs durable resumable state rather than a one-shot prompt.
5. **Compact** — the context needs to shrink but the session is continuing in place (not moving to a new lane, session, or agent). Compacting without a preceding handoff is fine when nothing durable needs to survive the compaction; if durable state does need to survive, write the handoff first, then compact.

## Why order matters

- Choosing **clear** or **compact** when a **handoff** was warranted silently drops blockers, traps/dead-ends, and pending decisions that the next phase would have needed — the next agent re-derives what this session already knew.
- Choosing **handoff** when a plain **continue** or **clear** would do adds unnecessary artifact overhead and gives a future reader a stale file to reconcile against reality.
- Choosing **subagent** when the real need is a **handoff** hands a bounded prompt to a background agent that lacks the accumulated context a resumable handoff would have captured.

## Quick self-check

Ask, in order: is the task actually at a boundary? Is there real state worth preserving? Is the next step in the same session or a new one? Is it bounded enough to delegate as a one-shot, or does it need durable resumable state? The first "no" you hit tells you which option above applies.
