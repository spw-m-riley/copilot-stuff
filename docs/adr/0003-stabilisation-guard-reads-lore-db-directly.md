# ADR 0003: stabilisation-guard reads lore.db directly

- Status: Accepted
- Date: 2026-06-12
- Consumer: `extensions/stabilisation-guard/README.md`

## Context

The `stabilisation-guard` extension needs to evaluate unresolved `open_loop` and `assistant_goal` memories at session start and before first mutation.

The extension README (`extensions/stabilisation-guard/README.md`) documents this dependency and links to this ADR because it is a key architectural trade-off.

An obvious option was to query Lore through extension tools, but Copilot CLI hook handlers cannot reliably call another extension's tool surface during hook execution. The guard must still work during early session lifecycle hooks, where availability and timing are constrained.

## Decision

The guard queries `lore.db` directly using a narrow, version-gated SQL read:

- Read only the minimum fields required from `semantic_memory`
- Filter to `open_loop` and `assistant_goal`
- Respect scope (`repo`, `global`) and unresolved state (`superseded_by IS NULL`)
- Check `lore_schema_version` and disable guard behavior if schema is newer than the extension's supported version
- Fail open if the database is missing, locked, or unreadable

## Consequences

- **Works in hook lifecycle:** no dependency on cross-extension runtime tool calls.
- **Tight coupling to Lore schema:** schema changes require compatibility updates in the guard.
- **Operational safety:** fail-open behavior avoids blocking coding sessions on transient DB issues.
- **Maintenance obligation:** schema-affecting Lore changes must coordinate updates to this extension and its README guidance.
