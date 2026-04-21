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
