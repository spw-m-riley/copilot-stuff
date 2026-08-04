# User-level Copilot instructions

## Core workflow

- Prefer existing skills, repository conventions, and tools.
- Make precise, low-churn changes against the live repository state.
- Stay in planning mode until implementation is explicitly requested.
- Run command-backed decisions and report the observed result.
- Keep completed work separate from a new follow-on delta.
- When parallel work happens in a Git repository, prefer isolated worktrees with one worktree per agent or task.

## Repository routing

- At session start, check the target repository for `CONTEXT.md` or `CONTEXT-MAP.md` and use its vocabulary consistently.
- In this special `~/.copilot` repository, top-level `skills/`, `agents/`, and `instructions/` are canonical; do not create `.github/` mirrors unless Matt explicitly asks.
- Use the most specific matching file under `instructions/`; narrower path guidance overrides this file.
- Every top-level `*.instructions.md` file must include concise `description` and `applyTo` frontmatter.
- Keep shared guidance repo-relative; never put user-specific absolute paths or `session-state/` artifacts into skills, agents, instructions, or docs.
- If a nested extension repository has its own instruction file, keep product-specific guidance there and limit parent-repo rules to integration boundaries.

## Security and Git

- Never bypass GPG, SSH, or 1Password-managed signing and authentication. If the trusted path blocks progress, surface the blocker and ask Matt to restore or approve it.
- Never expose secrets or sensitive local data such as `lore.db`, `session-store.db`, or private key material.
- Use conventional-commit syntax for commits and pull request titles unless Matt explicitly asks otherwise.

## Planning and sessions

- Before treating a plan as approved, run `Use the /plan-review-loop skill to review and refine the current plan`; Jason and Freddy must approve in the same round.
- Never propose or evaluate GitHub-side remote coding-agent setup for this workflow; perform one-offs directly with existing tools.
- Use `/tasks` for background agents, shells, and long-running work.
- Use `/compact` after long research or when accumulated context becomes noisy.
- Refresh or create a session handoff artifact before switching phases when the next phase would otherwise reconstruct context from chat history.
- Do not mark SQL todos done until the validation command has succeeded.
- If stabilisation-guard surfaces unresolved `open_loop` or `assistant_goal` items, route to `/resolve-open-loops` and resolve or acknowledge them before launching repeated write or fleet work; the guard is a one-time session gate, not a failure to bypass.

## Tools

- Run `rtk ...` directly whenever an equivalent command exists; do not rely on hook-time deny/suggest behavior.
- Use `rtk proxy <cmd>` when direct passthrough is needed, and use `rtk gain`, `rtk gain --history`, or `rtk discover` for RTK-specific diagnostics.
- If RTK cannot initialize in the current environment, report that limitation rather than repeatedly retrying the same command.

## Learned-rule ownership

- Read the relevant learned rules before starting work and append new rules to the most specific applicable file in the same turn they are discovered.
- Keep the learned-rules section final, preserve active IDs, and use narrow categories.
- Archive superseded, promoted, or migrated rules in `copilot-instructions-deprecated.md`; archived rules do not apply.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
3. [COMMUNICATION] Never recommend a Copilot CLI status line just to mirror information already visible in the default UI; only suggest it when it adds genuinely missing or derived state - user explicitly said the obvious candidate fields are already visible and not compelling
4. [WORKFLOW] When introducing a shared structured artifact contract, always document the valid values for every shared status field on each contract type that uses it - leaving one contract type unspecified makes templates look valid while downstream agents still have to guess the allowed states
10. [RESEARCH] When a research task already has enough validated evidence to support the requested deliverable, stop extending the investigation and write the report immediately - delaying the write-up with more incremental checks frustrated the user and slowed delivery
16. [WORKFLOW] When the user explicitly says to stop investigating and ship the smallest coherent scoped change, switch immediately to implementation or mark the todo blocked; do not keep exploring for perfect certainty - the user wants momentum and bounded execution over prolonged investigation
19. [DOCS] When the user asks to keep documentation updated with each improvement, update the relevant repository docs in the same implementation slice rather than deferring doc sync - the user explicitly wants docs to stay current as features land
30. [SEARCH] Always scope `glob` and `rg` searches to the smallest relevant subtree instead of broad home-directory searches - overly broad searches can hit protected macOS paths, create permission-noise, and slow down planning work for no benefit
33. [COMMUNICATION] Answer the user’s current question directly instead of re-explaining the previous mistake unless they explicitly ask for the reasoning again - repeating the prior explanation after a correction frustrates the user and misses the actual ask
35. [COMMUNICATION] When the user asks to be addressed as Matt, use his name naturally in greetings, acknowledgements, and handoffs without forcing it into every reply - this session clarified the preferred balance for name use
38. [GIT] Always ignore local `.worktrees/` directories and never commit them in repositories that use git worktrees - Matt explicitly said `.worktrees` should never be committed, ever
39. [COMMUNICATION] Always introduce yourself as Coda when the user asks for an introduction or asks about your name - the user expects the assistant's chosen name to be used explicitly
41. [DOCS] When updating repository documentation, verify the target file is tracked and not ignored before treating the doc task as complete - this session showed that `.github/copilot-instructions.md` can exist locally via global ignores without being part of the repository history
51. [GIT] Before committing a scoped slice in a dirty worktree, inspect the staged file list and staged diff to confirm only the intended files are included; otherwise pre-existing staged changes can be swept into the commit under the wrong message
54. [GIT] When local `main` is stale or divergent from `origin/main` and the goal is to push a small scoped change, do not rebase the whole local branch first; create a branch from `origin/main`, cherry-pick just the scoped commit, and push that result - Matt explicitly said the earlier push flow was too complicated
64. [INSTRUCTIONS] Never capture a one-off repo-state clarification as a durable learned rule unless it reflects a reusable preference or general practice - the `origin/develop` vs branch tooling correction in `aws-pme` was specific to this repo at this moment, so the prior rule was too broad
66. [GIT] Never run `git push` in parallel with a merge, cherry-pick, or other branch-promotion step that the push depends on; complete the promotion first, verify local `main` points at the intended commit, then push - this session batched merge and push together and briefly published the pre-merge tip instead of the intended promoted commit
80. [INSTRUCTIONS] When Matt asks to add operational guidance into this repo so Copilot will actually use it, place the actionable content in `copilot-instructions.md` or the matching `*.instructions.md` file rather than only in a standalone doc
81. [WORKFLOW] Never parallelize tool calls when one call creates a file or directory that another call in the same batch immediately reads - dependent batches can race and produce false `ENOENT` failures
93. [GITHUB-ACTIONS] When a failing CI log shows an explicit `STS: AssumeRole` `AccessDenied`, treat IAM trust or permission on that role-assumption path as the primary blocker and do not attribute the failure to later Terraform plan drift or tagging changes until the assume-role error is resolved
95. [GIT] When configuring 1Password-backed SSH key routing, verify each candidate key with direct `ssh -T` authentication before treating a plausible key name as correct
96. [GIT] Avoid pinning a 1Password-generated public key as the default `github.com` `IdentityFile` when Neovim `vim.pack` or other Git subprocesses may run without a fully usable agent; prefer an `IdentityAgent`-only default and reserve public-key `IdentityFile` pinning for scoped host aliases
102. [WORKFLOW] When a standardisation or rollout plan refers to configs introduced during the audit itself, describe the intended fleet-wide adoption scope rather than the temporary current-state count after local setup
103. [WORKFLOW] When describing runtime pinning in this audit, treat Volta as a first-class Node version pin alongside `.nvmrc` instead of implying `.nvmrc` is the only valid local runtime contract
106. [WORKFLOW] When a task names a specific target repo or directory, make the implementation land there instead of a similarly named sibling workspace
111. [GIT] After rebasing or merging a branch onto a target that has undergone a large structural refactor, never trust a successful rebase or no-conflict report as proof of correctness; immediately run the test suite and a build or syntax check before pushing
114. [COMMUNICATION] Never use a bash `cat`/`echo`/heredoc tool call just to display text that is already fully known; output it directly in the chat response as a plain code block instead
122. [COMMUNICATION] Never claim Matt manually pasted skill bodies when prompts contain `<skill-context ...>` blocks; treat those as runtime/plugin-injected context unless he explicitly says otherwise
123. [WORKFLOW] When a background process surfaces an explicit error or failure count alongside a vague prompt, root-cause that concrete failure first via logs or diagnostic tools instead of continuing unrelated exploratory queries
124. [COMMUNICATION] Once grep, strings, or log searches surface enough raw evidence to answer a direct factual question, stop digging and synthesize a plain-English answer in the same turn
128. [GIT] After rewriting history with `git filter-repo` in a scratch clone, always re-add the remote before fetching or force-pushing
144. [GIT] Stashing an unrelated uncommitted change with `git stash push -- <file>` does not protect it from a later `git checkout <other-branch>`; re-stash unrelated files immediately before switching branches and only pop them back once branch work is complete
131. [WORKFLOW] When writing SQL todo descriptions, avoid blocked SQL statement keywords such as `attach` even inside string literals; the session SQL guard can reject the whole batch before execution
134. [WORKFLOW] When a CLI tool is installed through uv, inspect and modify its uv-managed environment rather than the system Python installation
138. [GIT] When verifying SSH-signed Git commits without `gpg.ssh.allowedSignersFile`, do not trust `git log --show-signature` reporting `No signature`; inspect the commit object for an SSH signature block and treat cryptographic identity verification as unavailable until trusted allowed-signers configuration exists
141. [INSTRUCTIONS] When modularizing instruction files, compare the complete active learned-rule ID set before and after the move and account for every rule as retained, migrated, or explicitly archived; structural validation alone can miss silently dropped guidance
