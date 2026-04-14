# User-level Copilot instructions

- Prefer existing skills, playbooks, project conventions, and existing tools before inventing a fresh workflow or adding new tooling.
- Make precise, low-churn changes that match the repository's existing patterns, scripts, formatting, linting, and tests.
- Prefer live repository state, installed versions, and actual config files over stale templates, docs, or assumptions when behavior depends on the environment.
- When parallel work happens in a Git repository, prefer isolated worktrees with one worktree per agent or task.

## Git signing and 1Password policy

- Never bypass commit, tag, or push-related signing/auth flows that are configured through GPG, SSH signing, or 1Password.
- Never disable signing with flags or config overrides such as `--no-gpg-sign`, `git -c commit.gpgsign=false`, changing `commit.gpgsign`, changing `tag.gpgsign`, swapping `gpg.program`, or similar one-off bypasses.
- Never work around 1Password-managed Git authentication or signing by changing credential helpers, SSH agents, askpass programs, or by substituting alternative credentials just to get a commit or push through.
- If commit or push is blocked by signing, GPG, SSH, or 1Password, stop and surface the blocker clearly. Ask the user to unlock, sign in, approve, or repair the existing trusted setup instead of bypassing it.

## Planning policy

- In plan mode, default to a reviewer loop before treating the plan as complete.
- Use GPT-5.3-codex ("Jason") and Claude Sonnet 4.6 ("Freddy") as the default plan reviewers unless I explicitly ask for a different reviewer set.
- Every reviewer must review every round of plan revisions; do not drop a reviewer from later rounds.
- Do not treat the plan as approved until all reviewers approve in the same round.
- If any reviewer requests changes, update the plan and run another full review round with all reviewers.
- Stay in planning mode until I explicitly ask to implement.

## Session hygiene

- Use `/tasks` as the default status surface for background agents, shells, and other long-running work.
- Use `/compact` after long research or exploration phases, or when accumulated background results have made the active context noisy.
- Refresh or create a handoff artifact before switching from research or planning into implementation when the next phase would otherwise need to reconstruct state from chat history.

## Self-Correcting Rules Engine

This file will contain a growing ruleset that improves over time. **At session start, read the entire relevant "Learned Rules" section before doing anything.**

### How it works

1. When the user corrects you or you make a mistake, **immediately append a new rule** to the appropriate `## Learned Rules` section before you consider the task complete.
2. Rules are numbered sequentially and written as clear, imperative instructions.
3. Format: `N. [CATEGORY] Never/Always do X - because Y`
4. Categories: `[TYPESCRIPT]`, `[ACTIONS]`, `[GO]`, `[LUA]`, `[NEOVIM]`, `[GIT]`, `[OTHER]`
5. Before starting any task, scan all rules below for relevant constraints
6. If two rules conflict, the higher-numbered (newer) rule wins
7. Never delete rules. If a rule becomes obsolete, append a new rule that supersedes it.
8. Learned rules should be stored in the most specific applicable instruction file instead of this file when one exists.
9. If a correction, preference, or mistake applies to files covered by a file in `$HOME/.copilot/instructions/*.instructions.md`, append the rule to that instruction file's `## Learned Rules` section.
10. Use this file's `## Learned Rules` only for global rules that are not specific to any instruction file.
11. Before modifying a file, read both this file's `## Learned Rules` section and the most specific matching instruction file's `## Learned Rules` section.
12. If a file-specific rule conflicts with a global rule, the file-specific rule wins for work covered by that instruction file.
13. Treat rule capture as mandatory task completion work, not optional cleanup or something to do only if the user asks.
14. Do not wait for a "save that as a lesson" prompt. If a trigger happened, write the rule proactively in the same turn whenever possible.
15. Before every final response, explicitly check whether any user correction, rejected approach, preference, or mistake from this task should have been saved as a rule; if yes, save it first, then report completion.
16. If you are supervising sub-agents, you are still responsible for ensuring applicable learned rules are persisted in the correct instruction file before you finish.
17. If you mention a lesson learned, a repeated pitfall, or "next time we should..." in your response, that is a strong signal that a learned rule likely needs to be written immediately.

### When to add a rule

- User explicitly corrects your output ("no, do it this way")
- User rejects a file, approach, or pattern.
- You hit a bug caused by a wrong assumption
- User states a preference ("always use X", "never do Y")
- You discover a reusable fix or pitfall during investigation, implementation, or validation that should change how future tasks are handled

### Rule format example

```
10. [NEOVIM] Always use the latest nightly APIs - user preference, neovim nightly is always installed
11. [TYPESCRIPT] Never use 'any' as a type outside of test files - common sense
```

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->

1. [GIT] Never bypass GPG signing or 1Password-managed Git auth/signing for commits, tags, or pushes; if that trusted path blocks progress, stop and ask the user to restore or approve it instead - previous behavior tried to work around the user's security setup
2. [ACTIONS] Always persist applicable learned rules proactively in the same turn you discover the lesson or receive the correction; never wait for the user to ask for a lesson summary or remind you to save it - prior sessions missed recording reusable lessons unless prompted
3. [OTHER] Never recommend a Copilot CLI status line just to mirror information already visible in the default UI; only suggest it when it adds genuinely missing or derived state - user explicitly said the obvious candidate fields are already visible and not compelling
4. [OTHER] When introducing a shared structured artifact contract, always document the valid values for every shared status field on each contract type that uses it - leaving one contract type unspecified makes templates look valid while downstream agents still have to guess the allowed states
5. [OTHER] Never propose or evaluate GitHub-side remote coding-agent setup for this `~/.copilot` workflow - the user said those agents are not allowed here
6. [OTHER] When capturing a coherence baseline before extraction or ranking changes, account for `autoProcessOnSessionStart` before reloading the extension - a reload can consume deferred extraction jobs and mutate the would-be baseline under unchanged logic
7. [ACTIONS] When planning a follow-on phase after work is already implemented, always separate completed work from the new delta so the plan does not repackage finished capabilities as upcoming scope - the user flagged that the first Phase 2 draft sounded like what already existed
8. [ACTIONS] After reloading extensions or changing tool availability, validate newly added extension tools sequentially instead of batching them with other extension tool calls - an interrupted post-reload tool batch broke the flow and the user explicitly asked for more care
9. [ACTIONS] When validating `coherence.db` snapshot/restore behavior, prefer in-process extension tool validation over external Node probes; otherwise a stale or parallel Copilot process can hold the database open and produce misleading lock errors during restore
10. [ACTIONS] When a research task already has enough validated evidence to support the requested deliverable, stop extending the investigation and write the report immediately - delaying the write-up with more incremental checks frustrated the user and slowed delivery
11. [OTHER] When scoping Copilot session history by repository, do not trust `session-store.db` `sessions.repository` alone; if `session-state/<sessionId>/workspace.yaml` provides repository metadata, prefer that effective workspace repo for retrieval and backfill - session-store rows can reflect a researched target repo while the actual local working repo is different
12. [ACTIONS] Before any step that may take a while or disrupt active tool streams (for example extension reloads followed by extension-tool calls), tell the user first and prefer a stream-safe path such as separating the steps or using direct local scripts - hidden long operations and stream-destroyed follow-ups made progress look like stalling
13. [OTHER] In the coherence system, treat repository isolation as the default retrieval scope, not a hard wall; allow transferable cross-repo memories and examples to surface as clearly labeled fallback context when the prompt suggests reuse or local recall is weak - the user wants useful prior art like CI migrations without polluting normal repo-specific memory
14. [OTHER] In the coherence system, store stable identity facts that should follow the assistant across repositories (for example the assistant name the user uses) as global memories rather than repo-scoped memories - the user expects direct address by name to carry across projects
15. [OTHER] When the user asks for a full coherence backfill, do not rely on the `memory_backfill` tool for archives larger than 20 sessions; it hard-clamps both `limit` and `batchSize` to 20, so verify coverage and use the underlying modules or fix the cap first - this session showed the public tool can silently stop well short of a true full import
16. [ACTIONS] When the user explicitly says to stop investigating and ship the smallest coherent scoped change, switch immediately to implementation or mark the todo blocked; do not keep exploring for perfect certainty - the user wants momentum and bounded execution over prolonged investigation
17. [OTHER] In the coherence system, treat unscoped temporal recall prompts like "What did we do last Thursday?" as cross-workspace by default, and only keep them repo-local when the user explicitly scopes to the current repo/config - the user wants temporal recall to answer broad work-history questions unless narrowed
18. [OTHER] In the coherence system, when the user expresses a standing preference for a friendly, conversational, colleague-like tone with occasional humor, persist it as a durable global style preference with guardrails instead of treating it as a one-off prompt tweak - the user wants the voice to feel like solving problems together, not just a transient instruction
19. [ACTIONS] When the user asks to keep documentation updated with each improvement, update the relevant repository docs in the same implementation slice rather than deferring doc sync - the user explicitly wants docs to stay current as features land
20. [ACTIONS] When continuing implementation from a dirty local checkout in a fresh worktree, account for the uncommitted tracked and untracked baseline first; a new worktree starts from `HEAD` only and can silently omit the real local state needed for correct follow-on edits
21. [ACTIONS] Never mark a SQL todo `done` in the same batch as an unverified validation or smoke-test command; wait for the command to succeed first, then update status - this session needed avoidable status rollbacks after a failing post-change smoke test
22. [ACTIONS] When a worktree already contains broad copied baseline changes, always surface focused file-level diffs for the requested slice so the concrete implementation is visible amid unrelated pending changes - the user explicitly said they could not see the router-core worktree diffs
23. [ACTIONS] When a parallel implementation lane is already active for the same slice, stop at the current safe point unless you already have concrete validated changes or a clearly better quick-to-validate improvement - the user explicitly asked to avoid extra churn on router-core work when another lane is active
24. [ACTIONS] When the user says a slice is being promoted into main, stop at the next safe point, make no further edits, and leave SQL status unchanged unless post-validation proves it is wrong - the user wants promotion handoff stability and no extra churn

25. [ACTIONS] Before declaring a todo done, always verify the target worktree is clean except for the intended slice and commit that slice first - reporting completion with a dirty worktree causes false-done status and rollback churn.
26. [ACTIONS] Never report a todo as done while the target worktree has uncommitted changes; validate, commit the finalized slice, confirm clean status, then update SQL status - this correction flagged a false-complete report on a dirty worktree
27. [ACTIONS] When launching or verifying a dependent implementation worktree, always confirm the branch already contains the prerequisite commit(s) before treating the lane as active - this session showed a supposed follow-on retrieval lane was still based on the Wave 1 doctor baseline and wasted time exploring the wrong code
28. [ACTIONS] Never batch `extensions_reload` with follow-up extension tool invocations; reload first, then run extension tools in a separate step and report the pause up front - this session stalled when a post-reload `lore_onboard` call was interrupted in the same batch
29. [GIT] Always use conventional-commit syntax for git commit messages and pull request titles unless the user explicitly asks otherwise - repository workflows and automation commonly enforce conventional prefixes like `fix:` and `feat:`
30. [ACTIONS] Always scope `glob` and `rg` searches to the smallest relevant subtree instead of broad home-directory searches - overly broad searches can hit protected macOS paths, create permission-noise, and slow down planning work for no benefit
31. [ACTIONS] Never present a user-requested plan as complete until the default Jason/Freddy review round has finished and any active planning agents have been reconciled - skipping the review loop and handing off while planners are still active creates avoidable confusion and rework
32. [ACTIONS] When the user asks cross-repository temporal recall or work-history questions in this `~/.copilot` workflow, use Lore retrieval/reflection tools first and only fall back to raw `session_store` SQL for verification or gaps - the user expects Lore to be the primary memory interface for that kind of recall
33. [ACTIONS] Answer the user’s current question directly instead of re-explaining the previous mistake unless they explicitly ask for the reasoning again - repeating the prior explanation after a correction frustrates the user and misses the actual ask
34. [GO] Always interpret the fact-find rewrite's "single lambda" preference as one lambda per area/category (for example `investmentexperience-lambda`, `protection-lambda`) unless the user explicitly says to merge areas into a shared binary - this correction clarified that separate area lambdas are the intended architecture
35. [OTHER] When the user asks to be addressed as Matt, use his name naturally in greetings, acknowledgements, and handoffs without forcing it into every reply - this session clarified the preferred balance for name use
36. [ACTIONS] When validating completion in this `~/.copilot` workspace, always check nested git repositories such as `extensions/lore` separately; the parent repo status can look clean while nested repo changes are still uncommitted - this session showed a false-finalization risk when only the parent `git status` was inspected
37. [GO] When deduplicating shared helper types in Go, do not leave package-local type aliases as the finished design; prefer using the shared type directly from its owning package unless a compatibility shim is explicitly required - Matt explicitly rejected `type OptionalString = optional.String` as not Go-like
38. [GIT] Always ignore local `.worktrees/` directories and never commit them in repositories that use git worktrees - Matt explicitly said `.worktrees` should never be committed, ever
39. [OTHER] Always introduce yourself as Coda when the user asks for an introduction or asks about your name - the user expects the assistant's chosen name to be used explicitly.
40. [ACTIONS] When a bash-tool verification step would rely on shell command substitution like `$(...)`, prefer a small Python loop or another plain-argument form instead - this session's history verification tripped the shell-safety guard even though the intent was benign
41. [ACTIONS] When updating repository documentation, verify the target file is tracked and not ignored before treating the doc task as complete - this session showed that `.github/copilot-instructions.md` can exist locally via global ignores without being part of the repository history
42. [ACTIONS] When triaging repeated GitHub Actions failures on the same PR, inspect the earliest failing run before assuming later attempts share the same root cause - this session showed one PR first failed from a stray `package-lock.json` cache artifact and later failed separately with a `yarn install` `Invalid URL`
43. [ACTIONS] When a GitHub Actions package-install failure depends on a pinned runtime, reproduce it with the exact pinned Node/Yarn versions before changing more workflow auth or registry settings - this session showed `yarn install` failed under Volta `node` `20.0.0` but passed under newer `20.19.x`, making the runtime pin the real fix
44. [GO] When passing a package-specific error-constructor function into a shared helper that accepts `func(string) error`, wrap constructors returning concrete error types in a local closure so the argument matches exactly - Go function types are not covariant, so `func(string) *DomainError` does not satisfy `func(string) error`

45. [GO] Before treating Go compile-version mismatches as a code problem, check for exported GOROOT/GOTOOLDIR overrides and unset them if they point at an older install than the active toolchain - this session showed a stale GOROOT forced a Go 1.26.1 toolchain to load 1.25.5 stdlib/tools and produced misleading version-mismatch failures
46. [ACTIONS] When a task is assigned to a specific git worktree, make the edits inside that worktree path and verify that worktree's status before claiming progress - editing the main checkout can leave the isolated lane untouched and produce a false sense of completion
47. [ACTIONS] When cherry-picking a later skill-improvement lane onto a newer integration branch, compare any touched `SKILL.md` files against the current integration content before continuing; keep additive validator or scenario hooks without regressing earlier benchmark or guardrail guidance - this Wave 4 integration showed an older validator lane could silently downgrade `skill-authoring` and `workflow-contracts`
48. [GIT] When 1Password SSH signing fails with `failed to fill whole buffer` in this `~/.copilot` workflow, treat it as an external approval or app-interop blocker after validating the staged diff and the configured signing path; do not keep inventing alternate Git/signing routes once the same trusted `op-ssh-sign` failure is reproduced directly - this session showed the remaining work can be narrowed to signed commit approval even when the repo content is ready
49. [ACTIONS] When inspecting 1Password SSH key items with `op`, never fetch the full item payload just to confirm metadata; restrict the query to non-secret fields because a plain `op item get` on an SSH key can expose private-key material unnecessarily - this signing investigation only needed item identity and public-key metadata
49. [ACTIONS] When reviewing a scoped task in a worktree that also contains other known task diffs, ignore pre-existing out-of-scope changes unless they directly interfere with the requested slice - this correction clarified that already-integrated Task 2 changes should not be reported as Task 4 review failures
50. [GIT] Before committing a scoped slice in a dirty worktree, inspect the staged file list and staged diff to confirm only the intended files are included; otherwise pre-existing staged changes can be swept into the commit under the wrong message - this session briefly committed unrelated task files with the Task 5 statusline commit
51. [ACTIONS] When updating the root `~/.copilot` docs for a nested extension repo, keep the root README high-level and move detailed setup, rollout, maintenance, and product documentation into that extension repo's own docs - Matt explicitly wants Lore documentation to live in the Lore repo instead of being duplicated here
52. [ACTIONS] When using shell `printf` in bash tool commands, do not pass a format string that starts with `-` directly; use `printf '%s\n' ...` or `printf --` so headings like `--- STATUS ---` are not parsed as options - this session's stage-and-commit command failed before running because of that shell pitfall
