---
name: graphify
description: "Use when mapping a codebase, tracing file relationships, or building a graph from a folder of code/docs/media; not when another repository exploration skill is a better fit."
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: draft
  kind: task
---

# Graphify

Use this skill when you need to turn a folder of files into a navigable knowledge graph, answer relationship questions from an existing graph, or refresh a graphify-out corpus with updated extraction, update, or query steps.

## Use this skill when

- You need to build or refresh a graphify corpus from code, docs, papers, images, or video.
- You need to answer architecture, path, explain, or query questions against an existing graphify output.
- You need graph-aware extraction, community detection, or transcribe support for media files.
- The user invoked `/graphify`, `graphify query`, `graphify path`, or `graphify explain`.

## Do not use this skill when

- The user wants a general codebase exploration summary without graph output.
- A narrower knowledge-base or code mapping skill is a better first stop.
- The task is unrelated to graphify outputs, extraction, or graph queries.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| The request is specifically about graphify graphs, queries, or refreshes. | Yes | - |
| The request is general repository exploration without a graph output. | No | [`acquire-codebase-knowledge`](../acquire-codebase-knowledge/SKILL.md) or [`context-map`](../context-map/SKILL.md) |

## Inputs to gather

**Required before starting**

- The target path, URL, or query intent.
- Whether the user wants a fresh extraction, update, cluster-only run, or a query against an existing graph.
- Whether media transcription is likely needed.

**Helpful if present**

- The corpus size, output format preference, and any graph store target.
- Existing graphify-out artifacts to reuse.
- Any constraints around watch mode, merge mode, or export targets.

**Only investigate if encountered**

- GitHub URL clone or multi-path merge behavior.
- Whisper/transcription tuning for audio or video files.
- Neo4j/FalkorDB push flows or wiki export shape.

## First move

1. Check whether graphify-out/graph.json already exists and whether the request is a query or a rebuild.
2. Decide whether the task is full pipeline, update, cluster-only, add/watch, or query/path/explain.
3. Read the relevant support file(s) for the chosen mode before running commands.

## Workflow

1. **Confirm the mode.** Determine whether to run a fresh build, update, cluster-only pass, add/watch flow, or query/path/explain request.
2. **Read the matching support file.** Use the reference file that matches the requested operation before running commands.
3. **Prefer query fast-path.** If `graphify-out/graph.json` exists and the user asked a relationship question, run query/path/explain before rebuilding.
4. **Respect explicit rebuild flags.** If the user asked for `--update`, `--cluster-only`, add/watch, or URL/merge extraction, run that mode directly.
5. **Execute graphify deliberately.** Follow the local graphify flow for the chosen mode and preserve the audit trail.
6. **Verify outputs.** Check the generated graph, report, and exports that the mode promises.
7. **Leave a clear handoff.** State where outputs landed and which follow-up query or export step is now available.

## Outputs

- A graphify-out corpus, report, or query result matching the requested mode.
- Any generated export artifacts such as HTML, JSON, GraphML, or wiki output.
- A clear note about the next graph action the user can take.

## Guardrails

- Keep the task focused on graph construction, query, or refresh work.
- Do not guess at the right mode when an existing graph can answer the question directly.
- Do not use this skill for unrelated repository exploration when a narrower skill is a better fit.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/graphify/SKILL.md`.
- Smoke test:
  - should trigger: "Graphify this repo and let me query the relationships."
  - should not trigger: "Map the files I need to edit for a small TypeScript fix."

## Examples

- "`/graphify ./` and generate the graph outputs."
- "`graphify query \"What depends on this module?\"`"
- "`graphify explain \"this subsystem\"`"

## Reference files

- [`references/add-watch.md`](./references/add-watch.md)
- [`references/extraction-spec.md`](./references/extraction-spec.md)
- [`references/exports.md`](./references/exports.md)
- [`references/github-and-merge.md`](./references/github-and-merge.md)
- [`references/hooks.md`](./references/hooks.md)
- [`references/query.md`](./references/query.md)
- [`references/transcribe.md`](./references/transcribe.md)
- [`references/update.md`](./references/update.md)
- [`.graphify_version`](./.graphify_version)
