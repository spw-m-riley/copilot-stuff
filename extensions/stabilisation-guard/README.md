# stabilisation-guard

A Copilot CLI extension that surfaces unresolved open loops and stabilisation goals at the start of a session, then denies the first `edit`/`create`/`apply_patch` call once to ensure they are acknowledged before implementation begins.

## Behaviour

| Hook | Action |
|------|--------|
| `onSessionStart` | Queries `lore.db` for active `open_loop` and `assistant_goal` memories scoped to the current repository. Injects a warning block as `additionalContext` if any are found. |
| `onPreToolUse` | Denies the first `edit`, `create`, or `apply_patch` call in the session when active items exist. Stands down after firing once — subsequent calls in the same session proceed without interruption. |

See [docs/adr/0001-stabilisation-guard-fires-once-per-session.md](../../docs/adr/0001-stabilisation-guard-fires-once-per-session.md) for the reasoning behind the once-per-session approach.

## lore.db schema coupling

This extension reads `lore.db` **directly** because extension hook handlers cannot invoke other extensions' tools at runtime. See [docs/adr/0003-stabilisation-guard-reads-lore-db-directly.md](../../docs/adr/0003-stabilisation-guard-reads-lore-db-directly.md) for the full trade-off.

The query touches a small, stable subset of the `semantic_memory` table:

| Column | Purpose |
|--------|---------|
| `type` | Filter to `open_loop` and `assistant_goal` |
| `content` | Display text shown to the user |
| `scope` | Filter to `repo` (current repo) and `global` |
| `repository` | Match against the current git remote |
| `superseded_by` | Exclude resolved or replaced memories |
| `updated_at` | Order most-recent items first |

The extension also reads `lore_schema_version.version` on every session start. If the version exceeds `SUPPORTED_SCHEMA_VERSION` (currently `15`), the guard disables itself and logs a warning rather than failing noisily.

**If you are making a lore schema migration that renames or removes any of the columns above, update `SUPPORTED_SCHEMA_VERSION` in `extension.mjs` and verify the query still works before releasing.**

## Configuration

No configuration file — the extension is controlled entirely by lore.db content.

The lore.db path is resolved from `LORE_COPILOT_HOME` (env var) → `~/.copilot/lore.db`, matching the convention used by the lore extension itself.

## Failure modes

The extension **fails open** on all errors: if `lore.db` is absent, locked, or returns unexpected results, the guard simply does not fire and the session continues normally.
