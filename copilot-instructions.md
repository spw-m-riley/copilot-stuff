# User-level Copilot instructions

- Prefer existing skills, playbooks, project conventions, and existing tools before inventing a fresh workflow or adding new tooling.
- Make precise, low-churn changes that match the repository's existing patterns, scripts, formatting, linting, and tests.
- Prefer live repository state, installed versions, and actual config files over stale templates, docs, or assumptions when behavior depends on the environment.
- When parallel work happens in a Git repository, prefer isolated worktrees with one worktree per agent or task.

## Domain language awareness

- When entering any repository, check for `CONTEXT.md` (or `CONTEXT-MAP.md`) at the repo root. If present, read it and use its vocabulary consistently in code, comments, commit messages, and conversation.
- This repository's own `CONTEXT.md` lives at `~/.copilot/CONTEXT.md` and defines terms like Lore, Coherence (legacy), `ma`, RTK, skill, agent, extension, instruction file, and learned rule.
- Do not add general programming concepts to `CONTEXT.md` — only project-specific domain terms belong there.
- If `CONTEXT-MAP.md` exists, the repo has multiple bounded contexts; read the map to find the relevant `CONTEXT.md` for the current work.

## Git signing and 1Password policy

- Never bypass commit, tag, or push-related signing/auth flows that are configured through GPG, SSH signing, or 1Password.
- Never disable signing with flags or config overrides such as `--no-gpg-sign`, `git -c commit.gpgsign=false`, changing `commit.gpgsign`, changing `tag.gpgsign`, swapping `gpg.program`, or similar one-off bypasses.
- Never work around 1Password-managed Git authentication or signing by changing credential helpers, SSH agents, askpass programs, or by substituting alternative credentials just to get a commit or push through.
- If commit or push is blocked by signing, GPG, SSH, or 1Password, stop and surface the blocker clearly. Ask the user to unlock, sign in, approve, or repair the existing trusted setup instead of bypassing it.

## Planning policy

- In plan mode, default to using the `/plan-review-loop` skill before treating the plan as complete.
- Use the explicit `/plan-review-loop` skill invocation: `Use the /plan-review-loop skill to review and refine the current plan`
- The default reviewers are Jason (implementation/execution focus) and Freddy (architecture/risk focus); both must approve in the same round for plan approval.
- Do not treat the plan as approved until the `/plan-review-loop` skill returns unanimous approval from all configured reviewers in the same round.
- If any reviewer requests changes, update the plan and re-invoke the skill for another review round.
- The skill enforces a 3-round maximum; if not approved after round 3, you decide the next step outside the skill.
- To customize reviewers, edit or create persona files in `skills/plan-review-loop/references/personas/` before invoking the skill.
- Stay in planning mode until you explicitly ask to implement.

## Session hygiene

- Use `/tasks` as the default status surface for background agents, shells, and other long-running work.
- Use `/compact` after long research or exploration phases, or when accumulated background results have made the active context noisy.
- Refresh or create a handoff artifact before switching from research or planning into implementation when the next phase would otherwise need to reconstruct state from chat history.

## RTK usage

- Use RTK as the token-saving command layer in this workspace.
- When an RTK equivalent exists for a shell command, run the `rtk ...` form directly instead of the raw command.
- Run RTK meta commands directly when you need RTK-specific insight or passthrough behavior:
  - `rtk gain`
  - `rtk gain --history`
  - `rtk discover`
  - `rtk proxy <cmd>`
- Verify RTK with `rtk --version`, `rtk gain`, and `which rtk`. If `rtk gain` fails unexpectedly, check for the `reachingforthejack/rtk` name collision.
- The `rtk-hook` extension runs `rtk hook copilot` before Bash tool calls. For normal shell work, follow RTK's steer toward the `rtk ...` equivalent instead of retrying the raw command.
- In Copilot CLI, RTK currently works as deny-with-suggestion rather than transparent rewrite because the CLI does not honor `updatedInput`.
- Typical mappings: `git status` -> `rtk git status`, `rg foo .` -> `rtk grep foo .`

## Self-Correcting Rules Engine

This file will contain a growing ruleset that improves over time. **At session start, read the entire relevant "Learned Rules" section before doing anything.**

### How it works

1. When the user corrects you or you make a mistake, **immediately append a new rule** to the appropriate `## Learned Rules` section before you consider the task complete.
2. Rules are numbered sequentially when created and written as clear, imperative instructions. Do not renumber after archival; numbering gaps can reflect archived or superseded rules.
3. Format: `N. [CATEGORY] Never/Always do X - because Y`
4. Categories: `[TYPESCRIPT]`, `[JAVASCRIPT]`, `[GO]`, `[TERRAFORM]`, `[YAML]`, `[JSON]`, `[NEOVIM]`, `[MARKDOWN]`, `[GITHUB-ACTIONS]`, `[COMMUNICATION]`, `[DOCS]`, `[EXTENSIONS]`, `[GIT]`, `[INSTRUCTIONS]`, `[MEMORY]`, `[RESEARCH]`, `[REVIEW]`, `[SEARCH]`, `[SECURITY]`, `[SHELL]`, `[WORKFLOW]`, `[WORKTREE]`
5. Before starting any task, scan all rules below for relevant constraints
6. If two rules conflict, the higher-numbered (newer) rule wins
7. Never remove a rule from the active file without first archiving its text and rationale in `copilot-instructions-deprecated.md`; if a rule should stay active but change, append a newer rule that supersedes it.
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

### Rule Migration

When a global rule becomes too specialized to a file type or appears in multiple file-type instruction files:
1. Create the file-type rule in `$HOME/.copilot/instructions/<TYPE>.instructions.md`
2. If the root file still needs a routing reminder, replace the old active rule with a brief note pointing to the file-type instruction file
3. Archive the superseded active-rule text and rationale in `copilot-instructions-deprecated.md` before removing it from the active ruleset
4. In the file-type instruction file, reference the parent global rule if needed

**Important workflow-category note:** Use `[GITHUB-ACTIONS]` for GitHub Actions workflow patterns. The older `[ACTIONS]` label is retired for new rules because it became overloaded with Copilot CLI execution-flow guidance.

File-type instruction files (`typescript.instructions.md`, `lua.instructions.md`, etc.) should use their own file-type categories unless the file itself is the workflow surface covered by `github-workflows.instructions.md`.

## File-Type Instruction Files

Rules specific to file types are documented in dedicated instruction files. This table shows which categories are covered where:

| Pattern | File | Category |
|---------|------|----------|
| `**/*.ts,**/*.tsx` | typescript.instructions.md | [TYPESCRIPT] |
| `**/*.go` | go.instructions.md | [GO] |
| `**/*.lua` | lua.instructions.md | [NEOVIM]* |
| `**/*.tf,**/*.tfvars,**/*.hcl` | terraform.instructions.md | [TERRAFORM] |
| `**/*.yml,**/*.yaml` | yaml.instructions.md | [YAML] |
| `**/*.json,**/*.jsonc,**/*.code-workspace` | json.instructions.md | [JSON] |
| `**/*.js,**/*.mjs,**/*.cjs` | javascript.instructions.md | [JAVASCRIPT] |
| `**/*.md` | markdown.instructions.md | [MARKDOWN] |
| `session-state/**/*.md` | session-artifacts.instructions.md | [WORKFLOW] |
| `**/.github/workflows/*.{yml,yaml}` | github-workflows.instructions.md | [GITHUB-ACTIONS] |

*Notes: `lua.instructions.md` uses `[NEOVIM]` because this workspace's Lua surface is primarily Neovim-oriented. `json.instructions.md` uses `[JSON]` for JSON-owned config-policy rules because the file scope itself anchors those lessons. `session-artifacts.instructions.md` uses `[WORKFLOW]` because those Markdown files are execution artifacts rather than general docs. `github-workflows.instructions.md` uses `[GITHUB-ACTIONS]` for workflow-specific patterns.

**Cross-cutting categories:**
- `[COMMUNICATION]` — user-facing phrasing, status updates, naming, and answer-shape rules
- `[DOCS]` — documentation scope, placement, and doc-file tracking rules
- `[EXTENSIONS]` — Copilot CLI extensions, plugin/runtime behavior, and environment constraints
- `[GIT]` — Git workflow and signing
- `[INSTRUCTIONS]` — instruction-file, skill-file, and learned-rule maintenance
- `[MEMORY]` — Lore/Coherence retrieval, backfill, rollout, and scope behavior
- `[RESEARCH]` — research methodology and authoritative-source selection
- `[REVIEW]` — review-loop and approval-handling behavior
- `[SEARCH]` — repository/code search strategy and scope control
- `[SECURITY]` — secret handling and exposure-avoidance rules
- `[SHELL]` — bash and shell-command safety pitfalls
- `[WORKFLOW]` — Copilot CLI execution flow, planning cadence, scoping, and task-status discipline
- `[WORKTREE]` — worktree isolation, cleanliness gates, and parallel-lane coordination

## Worktree Audit Cadence

Worktrees in `.worktrees/` are audited **monthly** for orphaned directories (no branch activity in 30 days). Use `mr_worktree_remove <ID>` to clean up inactive or merged worktrees.

## Learned Rules Review Cadence

Learned Rules are reviewed quarterly during checkpoint planning phases. Superseded rules are archived to `copilot-instructions-deprecated.md`. See the rules consolidation tracking artifact (Phase 2 baseline) for history.

## Deprecated Rules

Some rules have been superseded or are no longer applicable. See `copilot-instructions-deprecated.md` for the archive.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
<!-- Active rules: 104. Numbering is append-only; gaps reflect archived rules in `copilot-instructions-deprecated.md`. -->

1. [GIT] Never bypass GPG signing or 1Password-managed Git auth/signing for commits, tags, or pushes; if that trusted path blocks progress, stop and ask the user to restore or approve it instead - previous behavior tried to work around the user's security setup
2. [INSTRUCTIONS] Always persist applicable learned rules proactively in the same turn you discover the lesson or receive the correction; never wait for the user to ask for a lesson summary or remind you to save it - prior sessions missed recording reusable lessons unless prompted
3. [COMMUNICATION] Never recommend a Copilot CLI status line just to mirror information already visible in the default UI; only suggest it when it adds genuinely missing or derived state - user explicitly said the obvious candidate fields are already visible and not compelling
4. [WORKFLOW] When introducing a shared structured artifact contract, always document the valid values for every shared status field on each contract type that uses it - leaving one contract type unspecified makes templates look valid while downstream agents still have to guess the allowed states
5. [WORKFLOW] Never propose or evaluate GitHub-side remote coding-agent setup for this `~/.copilot` workflow - the user said those agents are not allowed here
6. [MEMORY] When capturing a coherence baseline before extraction or ranking changes, account for `autoProcessOnSessionStart` before reloading the extension - a reload can consume deferred extraction jobs and mutate the would-be baseline under unchanged logic
7. [WORKFLOW] When planning a follow-on phase after work is already implemented, always separate completed work from the new delta so the plan does not repackage finished capabilities as upcoming scope - the user flagged that the first Phase 2 draft sounded like what already existed
8. [EXTENSIONS] After reloading extensions or changing tool availability, validate newly added extension tools sequentially instead of batching them with other extension tool calls - an interrupted post-reload tool batch broke the flow and the user explicitly asked for more care
9. [MEMORY] When validating `coherence.db` snapshot/restore behavior, prefer in-process extension tool validation over external Node probes; otherwise a stale or parallel Copilot process can hold the database open and produce misleading lock errors during restore
10. [RESEARCH] When a research task already has enough validated evidence to support the requested deliverable, stop extending the investigation and write the report immediately - delaying the write-up with more incremental checks frustrated the user and slowed delivery
11. [MEMORY] When scoping Copilot session history by repository, do not trust `session-store.db` `sessions.repository` alone; if `session-state/<sessionId>/workspace.yaml` provides repository metadata, prefer that effective workspace repo for retrieval and backfill - session-store rows can reflect a researched target repo while the actual local working repo is different
12. [COMMUNICATION] Before any step that may take a while or disrupt active tool streams (for example extension reloads followed by extension-tool calls), tell the user first and prefer a stream-safe path such as separating the steps or using direct local scripts - hidden long operations and stream-destroyed follow-ups made progress look like stalling
13. [MEMORY] In the coherence system, treat repository isolation as the default retrieval scope, not a hard wall; allow transferable cross-repo memories and examples to surface as clearly labeled fallback context when the prompt suggests reuse or local recall is weak - the user wants useful prior art like CI migrations without polluting normal repo-specific memory
14. [MEMORY] In the coherence system, store stable identity facts that should follow the assistant across repositories (for example the assistant name the user uses) as global memories rather than repo-scoped memories - the user expects direct address by name to carry across projects
15. [MEMORY] When the user asks for a full coherence backfill, do not rely on the `memory_backfill` tool for archives larger than 20 sessions; it hard-clamps both `limit` and `batchSize` to 20, so verify coverage and use the underlying modules or fix the cap first - this session showed the public tool can silently stop well short of a true full import
16. [WORKFLOW] When the user explicitly says to stop investigating and ship the smallest coherent scoped change, switch immediately to implementation or mark the todo blocked; do not keep exploring for perfect certainty - the user wants momentum and bounded execution over prolonged investigation
17. [MEMORY] In the coherence system, treat unscoped temporal recall prompts like "What did we do last Thursday?" as cross-workspace by default, and only keep them repo-local when the user explicitly scopes to the current repo/config - the user wants temporal recall to answer broad work-history questions unless narrowed
18. [COMMUNICATION] In the coherence system, when the user expresses a standing preference for a friendly, conversational, colleague-like tone with occasional humor, persist it as a durable global style preference with guardrails instead of treating it as a one-off prompt tweak - the user wants the voice to feel like solving problems together, not just a transient instruction
19. [DOCS] When the user asks to keep documentation updated with each improvement, update the relevant repository docs in the same implementation slice rather than deferring doc sync - the user explicitly wants docs to stay current as features land
20. [WORKTREE] When continuing implementation from a dirty local checkout in a fresh worktree, account for the uncommitted tracked and untracked baseline first; a new worktree starts from `HEAD` only and can silently omit the real local state needed for correct follow-on edits
21. [WORKFLOW] Never mark a SQL todo `done` in the same batch as an unverified validation or smoke-test command; wait for the command to succeed first, then update status - this session needed avoidable status rollbacks after a failing post-change smoke test
22. [WORKTREE] When a worktree already contains broad copied baseline changes, always surface focused file-level diffs for the requested slice so the concrete implementation is visible amid unrelated pending changes - the user explicitly said they could not see the router-core worktree diffs
23. [WORKTREE] When a parallel implementation lane is already active for the same slice, stop at the current safe point unless you already have concrete validated changes or a clearly better quick-to-validate improvement - the user explicitly asked to avoid extra churn on router-core work when another lane is active
24. [WORKTREE] When the user says a slice is being promoted into main, stop at the next safe point, make no further edits, and leave SQL status unchanged unless post-validation proves it is wrong - the user wants promotion handoff stability and no extra churn

26. [WORKTREE] Never report a todo as done while the target worktree has uncommitted changes; validate, commit the finalized slice, confirm clean status, then update SQL status - this correction flagged a false-complete report on a dirty worktree
27. [WORKTREE] When launching or verifying a dependent implementation worktree, always confirm the branch already contains the prerequisite commit(s) before treating the lane as active - this session showed a supposed follow-on retrieval lane was still based on the Wave 1 doctor baseline and wasted time exploring the wrong code
28. [EXTENSIONS] Never batch `extensions_reload` with follow-up extension tool invocations; reload first, then run extension tools in a separate step and report the pause up front - this session stalled when a post-reload `lore_onboard` call was interrupted in the same batch
29. [GIT] Always use conventional-commit syntax for git commit messages and pull request titles unless the user explicitly asks otherwise - repository workflows and automation commonly enforce conventional prefixes like `fix:` and `feat:`
30. [SEARCH] Always scope `glob` and `rg` searches to the smallest relevant subtree instead of broad home-directory searches - overly broad searches can hit protected macOS paths, create permission-noise, and slow down planning work for no benefit
32. [MEMORY] When the user asks cross-repository temporal recall or work-history questions in this `~/.copilot` workflow, use Lore retrieval/reflection tools first and only fall back to raw `session_store` SQL for verification or gaps - the user expects Lore to be the primary memory interface for that kind of recall
33. [COMMUNICATION] Answer the user’s current question directly instead of re-explaining the previous mistake unless they explicitly ask for the reasoning again - repeating the prior explanation after a correction frustrates the user and misses the actual ask
35. [COMMUNICATION] When the user asks to be addressed as Matt, use his name naturally in greetings, acknowledgements, and handoffs without forcing it into every reply - this session clarified the preferred balance for name use
36. [WORKTREE] When validating completion in this `~/.copilot` workspace, always check nested git repositories such as `extensions/lore` separately; the parent repo status can look clean while nested repo changes are still uncommitted - this session showed a false-finalization risk when only the parent `git status` was inspected
38. [GIT] Always ignore local `.worktrees/` directories and never commit them in repositories that use git worktrees - Matt explicitly said `.worktrees` should never be committed, ever
39. [COMMUNICATION] Always introduce yourself as Coda when the user asks for an introduction or asks about your name - the user expects the assistant's chosen name to be used explicitly.
40. [SHELL] When a bash-tool verification step would rely on shell command substitution like `$(...)`, prefer a small Python loop or another plain-argument form instead - this session's history verification tripped the shell-safety guard even though the intent was benign
41. [DOCS] When updating repository documentation, verify the target file is tracked and not ignored before treating the doc task as complete - this session showed that `.github/copilot-instructions.md` can exist locally via global ignores without being part of the repository history
46. [WORKTREE] When a task is assigned to a specific git worktree, make the edits inside that worktree path and verify that worktree's status before claiming progress - editing the main checkout can leave the isolated lane untouched and produce a false sense of completion
47. [INSTRUCTIONS] When cherry-picking a later skill-improvement lane onto a newer integration branch, compare any touched `SKILL.md` files against the current integration content before continuing; keep additive validator or scenario hooks without regressing earlier benchmark or guardrail guidance - this Wave 4 integration showed an older validator lane could silently downgrade `skill-authoring` and `workflow-contracts`
48. [GIT] When 1Password SSH signing fails with `failed to fill whole buffer` in this `~/.copilot` workflow, treat it as an external approval or app-interop blocker after validating the staged diff and the configured signing path; do not keep inventing alternate Git/signing routes once the same trusted `op-ssh-sign` failure is reproduced directly - this session showed the remaining work can be narrowed to signed commit approval even when the repo content is ready
49. [SECURITY] When inspecting 1Password SSH key items with `op`, never fetch the full item payload just to confirm metadata; restrict the query to non-secret fields because a plain `op item get` on an SSH key can expose private-key material unnecessarily - this signing investigation only needed item identity and public-key metadata
50. [WORKTREE] When reviewing a scoped task in a worktree that also contains other known task diffs, ignore pre-existing out-of-scope changes unless they directly interfere with the requested slice - this correction clarified that already-integrated Task 2 changes should not be reported as Task 4 review failures
51. [GIT] Before committing a scoped slice in a dirty worktree, inspect the staged file list and staged diff to confirm only the intended files are included; otherwise pre-existing staged changes can be swept into the commit under the wrong message - this session briefly committed unrelated task files with the Task 5 statusline commit
52. [DOCS] When updating the root `~/.copilot` docs for a nested extension repo, keep the root README high-level and move detailed setup, rollout, maintenance, and product documentation into that extension repo's own docs - Matt explicitly wants Lore documentation to live in the Lore repo instead of being duplicated here
53. [SHELL] When using shell `printf` in bash tool commands, do not pass a format string that starts with `-` directly; use `printf '%s\n' ...` or `printf --` so headings like `--- STATUS ---` are not parsed as options - this session's stage-and-commit command failed before running because of that shell pitfall
54. [GIT] When local `main` is stale or divergent from `origin/main` and the goal is to push a small scoped change, do not rebase the whole local branch first; create a branch from `origin/main`, cherry-pick just the scoped commit, and push that result - Matt explicitly said the earlier push flow was too complicated
55. [GIT] When troubleshooting 1Password-backed Git signing in this `~/.copilot` workflow, use the actual signed `git commit` as the source of truth before declaring the path blocked; `op whoami` can still report `account is not signed in` even after app delegation is healthy enough for a normal commit to succeed - this session only unblocked after retrying the real Git commit directly
56. [REVIEW] Before pushing or creating a PR after asynchronous branch reviews, always read every pending final-review result for the current HEAD or rerun the reviewers on the latest HEAD; earlier approvals are not enough once the branch advances - this session pushed before a late reviewer surfaced another README accuracy issue
58. [REVIEW] When a final review agent reports `APPROVED` but its own reasoning surfaces a concrete plausible defect, inspect the cited code path and verify behavior directly before closing the task - this session found a real latest-attempt output bug despite an approved review status
59. [MEMORY] Treat Lore as the active memory system in this workspace; interpret remaining Coherence-named files or rules as legacy compatibility guidance unless a task explicitly targets migration support - the root repo should read Lore-first while preserving compatibility history
61. [EXTENSIONS] In this environment, `api.githubcopilot.com` is blocked by the corporate firewall — do not suggest any tool that calls it directly (including `llm-github-copilot`, `CopilotChat.nvim`, `codecompanion.nvim`). For LLM commit messages in worktrunk, use the Neovim editor fallback instead of a Copilot-backed CLI tool.
64. [INSTRUCTIONS] Never capture a one-off repo-state clarification as a durable learned rule unless it reflects a reusable preference or general practice - the `origin/develop` vs branch tooling correction in `aws-pme` was specific to this repo at this moment, so the prior rule was too broad
66. [GIT] Never run `git push` in parallel with a merge, cherry-pick, or other branch-promotion step that the push depends on; complete the promotion first, verify local `main` points at the intended commit, then push - this session batched merge and push together and briefly published the pre-merge tip instead of the intended promoted commit
67. [INSTRUCTIONS] Keep `## Learned Rules` as the final section in every instruction file and never add later sections beneath it - Matt explicitly wants new learned rules to append at the true end of those files
68. [INSTRUCTIONS] In the `~/.copilot` repo, keep the top-level `instructions/` directory as the canonical file-scoped instruction catalog and do not add a `.github/instructions` mirror unless Matt explicitly asks for one - he clarified no mirror is needed here
69. [INSTRUCTIONS] Treat `~/.copilot` as the one special user-level config repo where top-level `skills/`, `agents/`, and `instructions/` are canonical; in any other repo, put those assets under `.github/` unless Matt explicitly says otherwise - he clarified this repo is special because it is the source of the assistant's user-level config
70. [INSTRUCTIONS] In the `~/.copilot` repo, always include both `description` and `applyTo` in the YAML frontmatter of every `*.instructions.md` file in the top-level `instructions/` directory, and keep `description` concise about the file's purpose and scope - Matt asked to backfill the missing metadata and make future iterations preserve it
71. [INSTRUCTIONS] Never put user-specific absolute paths or `session-state/` artifacts into shared repo skills, docs, or instruction files; use stable repo-relative paths only - Matt explicitly corrected shared skill references that pointed at local machine paths and private session artifacts
72. [EXTENSIONS] In files under `extensions/`, never reference branded model names or specific model IDs unless Matt explicitly asks for them - he explicitly asked to remove names like Sonnet and `GPT-5.3-codex` from that subtree
73. [WORKFLOW] Never present a user-requested plan as complete until the explicit `/plan-review-loop` skill has run and all default reviewers (Jason and Freddy) approve in the same round; use the skill invocation `Use the /plan-review-loop skill to review and refine the current plan` before marking planning complete (supersedes archived Rule 31's ambient-extension phrasing)
77. [SHELL] When chaining long bash validation commands, isolate best-effort steps like benchmark diffs in braces or separate commands; a trailing `|| true` can mask earlier failing test or build steps because shell `&&`/`||` precedence is left-associative - this session briefly hid a real Phase 1 test failure during validation
78. [RESEARCH] When the user asks about Copilot CLI or extension-runtime capabilities, inspect the bundled CLI/SDK source or other authoritative runtime source first instead of inferring behavior from local `~/.copilot` usage examples - this correction flagged that repo-local extension patterns are not the same thing as the runtime contract
79. [INSTRUCTIONS] In active instruction files, do not use broad catch-all labels like `[ACTIONS]` or `[OTHER]`; use `[GITHUB-ACTIONS]` for workflow rules and prefer narrower cross-cutting or file-scoped categories elsewhere so the main `copilot-instructions.md` stays easier to route and audit - Matt explicitly asked for GitHub Actions-only labeling and more aggressive rule taxonomy cleanup
80. [INSTRUCTIONS] When Matt asks to add operational guidance "into this repo" so Copilot will actually use it, place the actionable content in `copilot-instructions.md` or the matching `*.instructions.md` file rather than only in a standalone doc like `RTK.md` - standalone Markdown is not auto-read by Copilot CLI, so docs-only placement misses the intent
81. [WORKFLOW] Never parallelize tool calls when one call creates a file or directory that another call in the same batch immediately reads - dependent batches can race and produce false `ENOENT` failures, so create the prerequisite first and consume it in a later step
82. [SHELL] When invoking Go-installed helper binaries in this workspace, resolve them from `go env GOBIN` instead of assuming `~/go/bin` or `GOPATH/bin` - this environment installs tools under the active Go toolchain bin path, and the wrong assumption broke the first actionlint validation attempt
83. [EXTENSIONS] When RTK routing matters in this `~/.copilot` workflow, invoke `rtk ...` explicitly instead of assuming the `rtk-hook` extension will block the raw Bash command - this session showed `rtk hook copilot` returning the correct deny-with-suggestion response while the CLI still executed the original `git status`
84. [WORKFLOW] When a repo-local extension or test surface moves to a new path, update the tracked README and CI/test-command references in the same slice before promotion - this `ma` push found a new `extension/` tree while tracked docs and `ci.yml` still pointed at `.github/extensions/ma`, which would have left automation and documentation stale
85. [EXTENSIONS] Before implementing a Copilot CLI hook, verify the hook name exists in the shipped SDK docs/types for the current CLI version; issue specs can mention unsupported surfaces like `onSubagentStart`, and unknown hook keys are silently ignored at runtime
86. [EXTENSIONS] In Copilot CLI session hooks, always normalize `toolArgs` before reading fields like `path`, `view_range`, or `forceReadLargeFiles`; interactive runtime payloads can arrive as JSON strings even when object-shaped args appear elsewhere - this session's MA `onPreToolUse` deny logic silently skipped until stringified args were parsed
87. [WORKFLOW] When Matt asks to complete a pull request description and `gh` CLI access is available, update the PR description directly instead of only drafting text in chat - this correction explicitly requested execution rather than a copy-paste template
90. [EXTENSIONS] Always run RTK directly whenever an equivalent command exists in this `~/.copilot` workflow; do not rely on hook-time deny/suggest behavior for adoption - Matt explicitly wants RTK to run whenever it can be used
91. [WORKFLOW] Always honor the active `.fallowrc` scope (especially `ignorePatterns`) before choosing analysis targets or remediation plans - this correction clarified that `extensions/lore` is explicitly out of scope for root `fallow health`
92. [REVIEW] When a pull request review thread is authored by GitHub's Copilot reviewer and the requested fix has been pushed, resolve the thread unless Matt explicitly says to leave it open - Matt clarified Copilot-authored comments can be resolved once addressed
93. [GITHUB-ACTIONS] When a failing CI log shows an explicit `STS: AssumeRole` `AccessDenied`, treat IAM trust or permission on that role-assumption path as the primary blocker and do not attribute the failure to later Terraform plan drift or tagging changes until the assume-role error is resolved - this Terraform triage initially over-focused on plan output instead of the concrete 403 shown in the run
94. [INSTRUCTIONS] In `skills/*/SKILL.md` `## Reference files` sections, do not wrap upstream source paths like `guides/foo/bar.md` in backticks unless those files exist locally in the skill package - the skill validator treats backticked path-like strings as required local references and will fail on missing upstream-only paths
95. [GIT] When configuring 1Password-backed SSH key routing, verify each candidate key with direct `ssh -T` authentication before treating a plausible key name as correct - this session showed the `Github` item name looked right but only `SPW-Git` actually authenticated for the default GitHub account
96. [GIT] Avoid pinning a 1Password-generated public key as the default `github.com` `IdentityFile` when Neovim `vim.pack` or other Git subprocesses may run without a fully usable agent; prefer an `IdentityAgent`-only default and reserve public-key `IdentityFile` pinning for scoped host aliases that need a specific work key - this session showed `vim.pack` surfacing `Load key ... .pub: invalid format` from that fallback path
98. [WORKFLOW] When making non-trivial JavaScript or TypeScript changes in a repo where Fallow is available, run a Fallow maintainability pass (`health`, and `dupes` or `dead-code` as relevant) before calling the slice maintainable - this session caught the real driver hotspots and duplication only after Matt pointed out Fallow had been skipped
99. [INSTRUCTIONS] In `skills/*/SKILL.md`, always list at least one existing local file in `## Reference files`; never use a placeholder like `None` because the skill validator requires a resolvable local reference target - this session's new skills failed validation until adjacent local skill or instruction files were linked
100. [WORKFLOW] Never run repository health analyzers like `fallow health` in parallel with tests that scaffold or generate workspace files; wait for those mutating tests to finish first so the analysis reflects steady-state repo contents - this session's parallel `npm test` and Fallow run counted transient demo-factory scaffolds and produced a false failing score
101. [WORKFLOW] When adding local audit configuration for tools like Knip or Fallow, include each repo's real runtime or framework entrypoints instead of relying only on broad project globs - Matt explicitly corrected the first pass because entrypoint-aware configs produce more accurate audit output
102. [WORKFLOW] When a standardisation or rollout plan refers to configs introduced during the audit itself, describe the intended fleet-wide adoption scope rather than the temporary current-state count after local setup - Matt explicitly corrected the plan line that said `0 missing` after audit-only configs had already been added everywhere
103. [WORKFLOW] When describing runtime pinning in this audit, treat Volta as a first-class Node version pin alongside `.nvmrc` instead of implying `.nvmrc` is the only valid local runtime contract - Matt explicitly corrected the standardisation text because most audited repos use Volta
104. [WORKFLOW] After creating or changing any custom agent under `agents/*.agent.md`, always verify the agent loads successfully in the runtime before treating the work as complete - Matt requested removing `waffle` after it failed to load reliably
105. [DOCS] When removing a custom agent at Matt's request, remove its related documentation and glossary/context entries in the same change unless Matt explicitly asks to keep them - this correction asked for Waffle-related docs to be removed too
106. [WORKFLOW] When a task names a specific target repo or directory, make the implementation land there instead of a similarly named sibling workspace - this session accidentally built the Go port in aws-pme while the requested code belonged in pme-go
107. [WORKFLOW] When Matt asks for a command-backed decision, run the command directly and report the result instead of only suggesting what he could run - this correction asked for immediate execution (`brew uses --installed node`) rather than guidance alone
108. [MEMORY] Never treat a narrated Lore write (`memory_domain`, `semantic_memory`, `refreshable_observation`) as done because a summary claims success or describes a "safe fallback" - query `lore.db` directly to confirm the rows actually exist before proceeding; a detailed, specific-sounding report can diverge completely from what was actually persisted
109. [MEMORY] Always pass the full `domainKind`/`domainTitle`/`domainMission`/`domainDirectives` set on every `lore_retain` call that references an existing `domainKey` - `upsertMemoryDomain` fully replaces the domain row rather than merging, so any call that omits these fields silently resets a previously-enriched domain back to bare defaults (`kind: custom`, empty mission/directives)
110. [GIT] When `gh` CLI operations like `gh pr create` fail with an Enterprise Managed User / access-restriction error against a personal repo, run `gh auth status` to check for multiple logged-in `github.com` accounts and `gh auth switch -h github.com -u <account>` to the one that actually owns/can access that repo before retrying - SSH-based `git push` can succeed even when the currently active `gh` account lacks API access to the same repo, since they use separate auth paths
111. [GIT] After rebasing or merging a branch onto a target that has undergone a large structural refactor (files split/moved/renamed), never trust a "successfully rebased" / no-conflict report as proof of correctness; immediately run the test suite (and a build/syntax check) before pushing - git's context-based 3-way merge can silently reapply a stale hunk onto a semantically-diverged file when enough surrounding-line context still matches, producing corruption (duplicate imports, resurrected dead code) with zero reported conflicts
112. [MEMORY] When a Lore profile refresh asks for "the last day" of sessions, verify the reflection output actually includes temporal/session evidence before trusting it; if source accounting shows only style reminders or cross-repo examples, treat the refresh as degraded and avoid updating ambient persona memories from it - this run persisted an observation but provided no last-day session coverage
113. [MEMORY] Never rely on free-text "last day"/"last week" phrasing for `lore_reflect` temporal coverage on compound analytical prompts; pass the explicit `lookbackHours` parameter instead, and check the returned `recentSessionCount`/`trace.recentSessionCount` as the authoritative degradation signal rather than eyeballing summary text (refines rule #112 now that a structural signal exists) - root cause was that `inferDateFromPrompt` never recognized "last day" and `pureTemporalRecall` requires zero non-date content terms, so compound prompts with dozens of content terms could never trigger the session-lookup path regardless of date-phrase fixes
114. [COMMUNICATION] Never use a bash `cat`/`echo`/heredoc tool call just to display text that's already fully known (like a drafted prompt, message, or document meant for the user); output it directly in the chat response as a plain code block instead - Matt could not find the redesigned automation prompt because it was only shown inside a bash tool call's output rather than the chat reply itself
115. [WORKFLOW] When Matt says a task should be done "as a one-off," stop designing new parameters/code/PRs for it and instead perform the task directly right now with existing tools and direct data access - he corrected an in-progress plan to add a new `lore_reflect` parameter when he only wanted the deeper analysis actually run once, not built as reusable infrastructure
116. [MEMORY] `lore_reflect`'s `persistObservation` always snapshots that single call's own mechanically-generated `summary` (keyword-frequency clustering over selected evidence, not LLM synthesis), and no tool exposes a way to write a custom/pre-synthesized summary into a `refreshable_observation` - for a genuinely rich one-off profile, synthesize the narrative directly and write it with a scoped, parameterized direct DB update (preserving all other columns), then live-verify via `memory_explain(mode: "session_start")`
117. [MEMORY] A recurring automation that persists into a `refreshable_observation` must never call `persistObservation: true` unconditionally every run - that mechanically clobbers any richer synthesized content with `lore_reflect`'s own thin keyword-cluster summary; instead have it read the current summary first, synthesize an evolved narrative (preserve durable traits, fold in new signal, cap length), and write it back via a scoped parameterized DB update - refresh `updated_at`/`last_refreshed_at` every successful run regardless, so freshness never lapses even when the narrative text itself doesn't change
118. [MEMORY] Never trust a Lore automation's self-reported actions (e.g., "retained memory X", "sessions found: N") without checking `lore.db`/`session-store.db` directly - a run can genuinely execute a tool call, get a real success response with a valid-looking ID, and still not have durably persisted the row (see rule #120), so ground-truth verification is the only reliable check
119. [MEMORY] `lore_reflect`'s reported `recentSessionCount` is capped at `Math.max(3, Math.min(limit*2, 20))` (12 with the default `limit:6`) via `fetchRecentSessionsForLookback`'s `findSessionsSince` call, not a true `COUNT(*)` - it was sized for evidence-selection performance (`selectReflectEntries` only ever keeps the top 4 of a deduped ≤20 candidate pool) and was never reconsidered when reused as a user-facing degradation/reporting signal; treat "0" as a reliable degradation signal but treat any positive N as "at least N, capped," never as an exact count
120. [MEMORY] A `lore_retain` call can report `success: true` with a real generated memory ID that never becomes durably queryable in `lore.db` - root cause is a multi-process WAL race: many long-lived `copilot` CLI processes (11 observed via `lsof lore.db`) hold independent connections open to the same file via Node's experimental built-in `node:sqlite` `DatabaseSync` (`journal_mode=WAL`, `busy_timeout=5000`, no explicit `synchronous` pragma, no app-level write queue), and `close()` issues `PRAGMA wal_checkpoint(TRUNCATE)` which can race a concurrent writer; confirmed by finding the missing row's raw bytes present in `lore.db-wal` but absent from the main db file and every live query - any critical `lore_retain`/`insertSemanticMemory` write (especially from unattended automation) should re-SELECT by the returned id immediately after to confirm durability before reporting success, since the tool layer itself cannot currently detect this failure mode (fixed in `extensions/lore` PR #48 via `close()` using `wal_checkpoint(PASSIVE)` plus an independent-connection `verifySemanticMemoryDurability` check wired into every write path — reassess this rule once that PR is confirmed merged)
121. [SHELL] When passing multi-line Markdown body text to a CLI flag (e.g., `gh pr create --body "$(cat <<'EOF' ... EOF)"`), do not rely on a quoted heredoc nested inside command substitution inside a double-quoted argument; text containing a backtick code-span immediately followed by an apostrophe (e.g., `` `word`'s ``) broke bash parsing with an unmatched-quote error despite the heredoc delimiter being quoted - write the body to a temp file with the `create` tool and pass `--body-file <path>` instead, then delete the temp file after use
