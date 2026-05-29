# session-journal

Writes human-readable per-session narrative journals and primes the next session with the latest entry.

## Storage path

Journal files are written to:

```text
~/.copilot/session-state/journal/YYYY-MM-DD-HH-MM.md
```

The directory is fixed. Filenames are derived only from the session-end timestamp in ISO-style UTC form; user input is never interpolated into paths.

## File format

Each journal is Markdown with these sections:

```markdown
## Decisions
## Discoveries
## Open loops
```

The extension derives bullets from `onSessionEnd` hook metadata such as `summary`, `finalMessage`, `error`, `reason`, `sessionId`, and `workingDirectory`. If a section is absent from the available metadata, the journal records an explicit fallback bullet instead of writing Lore data.

## Priming mechanism

On `onSessionStart`, the extension reads the newest journal file, truncates it to the first 80 lines, and returns it as priming context. The output includes both `additionalContext` and `modifiedConfig.additionalContext` so the current SDK can inject the context while preserving the planned modified-config shape.

If no prior journal exists, startup is a no-op. If the prior file is malformed or missing expected sections, the extension still primes with the raw narrative and adds a warning note.

## Retention

Rotation is user-controlled. Delete or archive old files under `~/.copilot/session-state/journal/` whenever they are no longer useful; the extension always reads only the lexicographically latest timestamped `*.md` file.

## Distinct from Lore

This extension does not write into Lore. Journals are plain narrative artifacts that Lore may backfill from later through a separate workflow.

## Validation

```sh
node --check extensions/session-journal/extension.mjs
node extensions/session-journal/tests/run.mjs
node extensions/session-journal/tests/run.mjs --smoke
```
