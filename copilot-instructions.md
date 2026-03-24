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
- Keep plans implementation-ready: include concrete tasks, dependencies, validation, and rollout notes rather than high-level prose.
- When the work can be parallelized safely, make the plan fleet-ready and prefer isolated worktrees per agent or task.
- Stay in planning mode until I explicitly ask to implement.

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
