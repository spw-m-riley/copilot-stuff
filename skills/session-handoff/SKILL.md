---
name: session-handoff
description: "Use when ending research/planning, compacting noisy context, or handing off work to another session/lane."
metadata:
  kind: task
---

# Session handoff

## Use this skill when

- A research or planning phase is ending and implementation will happen later or in another lane.
- The context window is noisy and a `/compact` is likely before the next phase.
- Work is moving to a fresh worktree, sub-agent, or next session.
- The user explicitly says "handoff", "create a handoff", or asks for resumable session context.

## Do not use this skill when

- A short chat summary is enough and no durable artifact is needed.
- The user needs a general workflow-contract artifact rather than the session's resumable state.
- The task is still active in the same context with no phase boundary or handoff recipient.
- The user wants a PRD, issue list, or codebase documentation instead of session continuation notes.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Create `session-state/<sessionId>/handoff.md` so the next session can resume | Yes | - |
| Convert a plan, review, or execution record into a formal contract | No | [`workflow-contracts`](../workflow-contracts/SKILL.md) |
| Write a PRD for issue-tracker handoff | No | [`to-prd`](../to-prd/SKILL.md) |
| Break approved work into tickets | No | [`to-issues`](../to-issues/SKILL.md) |

## Inputs to gather

**Required before writing**

- The current goal and why the handoff is needed.
- The current session identifier and the repo-relative `session-state/<sessionId>/` directory.
- Current state: completed work, partial findings, blockers, and active assumptions.
- Pending decisions and next actions.
- Relevant branches, commits, PRs, issues, agents, or shell sessions.
- The active worktree path, if work is happening outside the main checkout.

**Helpful if present**

- Existing plan, research notes, review artifacts, or workflow contracts that should be referenced.
- Validation commands already run and their outcomes.
- Files or directories that the next session should inspect first.

**Only investigate if encountered**

- Dirty worktree status that could mislead the next agent.
- Background agents or long-running processes whose state must be closed or resumed.
- Missing session folder; create only the per-session folder needed for the handoff.

## First move

1. Identify the current `session-state/<sessionId>/` folder from the active session context or existing session-state layout.
2. Inspect the current branch/worktree status and collect concrete refs, commands, and artifact paths.
3. Create or update `handoff.md` in that per-session folder; do not invent another location.

## Workflow

1. Confirm the handoff audience: next session, sub-agent, implementation lane, reviewer, or future self.
2. Summarize the goal in one short paragraph grounded in the user's request.
3. Capture current state as bullets: done, in progress, blocked, and known unknowns.
4. List pending decisions separately from next actions so the next agent can avoid treating open questions as instructions.
5. Record refs that matter: branch names, commits, PRs, issues, worktree paths, background agent IDs, and artifact paths.
6. Include validation status: commands run, pass/fail result, and commands still needed.
7. Keep the artifact concise enough to read after `/compact`; link to heavier artifacts instead of copying them.
8. Re-read the handoff as the next agent and repair any missing status, path, or next-action ambiguity.

## Outputs

- `session-state/<sessionId>/handoff.md` in the current repository's session-state tree.
- A concise artifact covering goal, current state, pending decisions, next actions, relevant refs, validation status, and active worktree path.
- A final chat note that names the handoff path and the immediate next action.

## Guardrails

- Use the per-session `session-state/<sessionId>/` folder; never create a parallel handoff location.
- Keep paths repo-relative when possible and avoid user-specific absolute paths in reusable instructions.
- Do not invent branch names, commits, PRs, or validation results. Mark unknowns explicitly.
- Do not copy large chat transcripts into the artifact; synthesize and link to durable files instead.
- Keep worktree boundaries explicit when a fresh lane will continue the work.
- Follow `session-artifacts.instructions.md` for session-state Markdown artifacts.

## Anti-patterns

- Writing a generic summary that omits blockers, dirty status, or validation commands.
- Storing the handoff in a root note, scratch file, or ad hoc docs path instead of the session folder.
- Mixing pending decisions into the next-action list as if they were already approved.
- Leaving the next agent to infer which branch or worktree contains the real state.

## Validation

- Confirm `session-state/<sessionId>/handoff.md` exists and is the only new handoff location.
- Confirm the artifact includes goal, current state, pending decisions, next actions, refs, validation status, and active worktree path or an explicit "none".
- Confirm commands and refs are factual, not inferred from memory.
- Confirm the next action is obvious within a few seconds of reading the file.
- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/session-handoff/SKILL.md` after changing this skill.
- Smoke test:
  - should trigger: "Create a handoff before we compact; implementation will continue in a fresh worktree."
  - should not trigger: "Turn this plan into a formal execution contract with status fields." (→ `workflow-contracts`)

## Examples

- "Create a handoff for the next session before we switch from research to implementation."
- "This context is getting noisy; write the session handoff and then we can compact."
- "Hand this branch off to a sub-agent in a fresh worktree with the blockers and validation commands."

## Reference files

- [`session-artifacts.instructions.md`](../../instructions/session-artifacts.instructions.md) - policy for session-state Markdown artifacts.
- [`workflow-contracts`](../workflow-contracts/SKILL.md) - adjacent contract-oriented handoff workflow.
