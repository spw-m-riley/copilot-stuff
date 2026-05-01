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
