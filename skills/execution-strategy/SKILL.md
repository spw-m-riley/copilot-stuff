---
name: execution-strategy
description: "Use when choosing inline, serial, or parallel work before dispatching agents, especially with file overlap or shared state."
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Execution strategy

Use this skill before launching subagents or parallel lanes when a task could be handled inline, serially, or in parallel. The goal is to choose the cheapest safe execution mode, make file-overlap checks explicit, and route multi-lane mutating Git work to [`git-worktrees`](../git-worktrees/SKILL.md) before edits start.

## Use this skill when

- You are about to split a task across subagents, background agents, or multiple work lanes.
- You need a concrete inline vs serial vs parallel decision instead of a vague "these seem independent" judgment.
- More than one lane may edit repo files, generated artifacts, or other shared mutable state.
- You need to decide whether parallel mutating work requires isolated Git worktrees first.

## Do not use this skill when

- The work is already small enough to finish directly in one lane, usually about five tool calls or fewer.
- You only need a file/discovery map before planning edits; route to [`context-map`](../context-map/SKILL.md).
- You already know the next step is to create or clean up worktrees; route straight to [`git-worktrees`](../git-worktrees/SKILL.md).
- You are diagnosing one failing code path rather than choosing execution topology; route to [`systematic-debugging`](../systematic-debugging/SKILL.md).

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| You have a task that may be handled inline, serially, or in parallel and need to choose safely before dispatching work. | Yes | - |
| You only need a pre-edit map of likely files, owners, or test surfaces. | No | [`context-map`](../context-map/SKILL.md) |
| You already decided on multiple mutating Git lanes and now need isolated checkouts. | No | [`git-worktrees`](../git-worktrees/SKILL.md) |
| You are debugging a single failure and want root-cause isolation rather than multi-lane execution planning. | No | [`systematic-debugging`](../systematic-debugging/SKILL.md) |

## Inputs to gather

**Required before editing**

- The concrete outcome and the candidate lanes you might split it into.
- The expected write set for each lane: files, directories, generated outputs, or durable artifacts it may change.
- Shared mutable state each lane could touch: manifests, lockfiles, schemas, migrations, session artifacts, branches, worktrees, servers, ports, or caches.
- Whether each lane is read-only research, mutating implementation, or validation-only.

**Helpful if present**

- Existing worktrees, long-running agents, or background shells already using the same repo state.
- Repo-specific validation commands that can prove each lane independently.
- Expected handoff shape: one combined change, one commit per lane, or one PR per lane.

**Only investigate if encountered**

- Hidden generators, formatters, or codegen steps that rewrite shared files outside the obvious target paths.
- Nested repositories, submodules, or path-specific ownership rules that narrow where a lane may write.
- Shared external state such as local databases, seeded fixtures, or snapshot directories.

## First move

1. List the candidate lanes and label each one `read-only`, `mutating`, or `validation-only`.
2. Write down the expected write set for each lane before launching any subagent.
3. Run the overlap check in [`references/file-overlap-check.md`](references/file-overlap-check.md) and choose the cheapest safe mode.

## Workflow

1. **Decide whether subagents are needed at all.** If the work is one coherent change, the file scope is narrow, or you can finish directly with a short inspect → edit → verify loop, keep it inline.
2. **Define lanes before dispatch.** For each candidate lane, capture goal, write set, shared mutable state, and validation command.
3. **Classify overlap.** Use [`references/file-overlap-check.md`](references/file-overlap-check.md) to mark each lane pair as `hard overlap`, `soft overlap`, or `no overlap`.
4. **Choose the execution mode.**
   - **Inline** when there is only one real lane, the scope is still fuzzy, or the write sets are mostly unknown.
   - **Serial** when lanes depend on each other, any pair has hard overlap, or soft overlap would make validation or merge ownership ambiguous.
   - **Parallel** only when every concurrent lane has a clear owner, a disjoint write set, and no shared mutable state that can be rewritten behind another lane's back.
5. **Route worktree-required cases immediately.** If two or more parallel lanes will mutate Git-tracked files, invoke [`git-worktrees`](../git-worktrees/SKILL.md) first and create one worktree per mutating lane before dispatching agents.
6. **Dispatch with explicit non-overlap contracts.** Tell each subagent which files it may touch, what is off-limits, and when it must stop and escalate because scope expanded.
7. **Reassess after each lane finishes.** If a lane discovers new files, shared state, or merge conflicts, collapse back to serial or inline rather than forcing unsafe parallelism.

## Outputs

- A concrete execution choice: `inline`, `serial`, or `parallel`.
- A short lane table with goal, write set, overlap status, and validation owner for each lane.
- A worktree decision stating either `no worktree needed` or `route to git-worktrees before edits`.
- Dispatch guidance naming what can proceed now, what must wait, and what conditions would force replanning.

## Guardrails

- Treat an unknown write set as overlap until clarified; do not assume independence.
- Never run two mutating lanes in parallel inside the same Git checkout.
- Never parallelize lanes that both touch the same file, the same generated output, or the same durable artifact path.
- Treat shared manifests, lockfiles, migration chains, snapshot/golden files, and session output paths as mutable state even when the primary code files differ.
- Read-only research can run in parallel with mutating work only if it does not edit files, create shared artifacts, or steal ownership of the same conclusion.
- Prefer serial execution when the merge owner, validation owner, or rollback plan is unclear.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs` after editing this package.
- Read the lane decision back to yourself and confirm each concurrent pair has an explicit `no overlap` justification.
- Manually exercise the routing checks in [`assets/smoke-test-prompts.md`](assets/smoke-test-prompts.md).
- Smoke test:
  - should trigger: "Should I do this change inline, serially, or in parallel before I launch subagents?"
  - should not trigger: "Create two worktrees for these branches and keep my main checkout clean." (→ [`git-worktrees`](../git-worktrees/SKILL.md))

## Examples

- "I have three subtasks for this repo change. Decide whether I should keep them inline, run them serially, or split them across parallel agents."
- "Before I launch subagents, check whether these lanes overlap on files, lockfiles, or generated output."
- "I think these two refactors are independent. Tell me if they are safe to run in parallel and whether I need worktrees first."

## Reference files

- [`references/file-overlap-check.md`](references/file-overlap-check.md) - pairwise overlap worksheet, shared-state checklist, and worktree routing rules
- [`assets/smoke-test-prompts.md`](assets/smoke-test-prompts.md) - manual routing checks for inline, serial, parallel, and route-away cases
