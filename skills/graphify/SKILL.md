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
3. **Execute graphify deliberately.** Follow the local graphify flow for the chosen mode and preserve the audit trail.
4. **Verify outputs.** Check the generated graph, report, and exports that the mode promises.
5. **Leave a clear handoff.** State where outputs landed and which follow-up query or export step is now available.

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

## Imported content

Turn any folder of files into a navigable knowledge graph with community detection, an honest audit trail, and three outputs: interactive HTML, GraphRAG-ready JSON, and a plain-language GRAPH_REPORT.md.

## Usage

```
/graphify                                             # full pipeline on current directory → Obsidian vault
/graphify <path>                                      # full pipeline on specific path
/graphify https://github.com/<owner>/<repo>           # clone repo then run full pipeline on it
/graphify https://github.com/<owner>/<repo> --branch <branch>  # clone a specific branch
/graphify <url1> <url2> ...                           # clone multiple repos, build each, merge into one cross-repo graph
/graphify <path> --mode deep                          # thorough extraction, richer INFERRED edges
/graphify <path> --update                             # incremental - re-extract only new/changed files
/graphify <path> --directed                           # build directed graph (preserves edge direction: source→target)
/graphify <path> --whisper-model medium                # use a larger Whisper model for better transcription accuracy
/graphify <path> --cluster-only                       # rerun clustering on existing graph
/graphify <path> --no-viz                             # skip visualization, just report + JSON
/graphify <path> --html                               # (HTML is generated by default - this flag is a no-op)
/graphify <path> --svg                                # also export graph.svg (embeds in Notion, GitHub)
/graphify <path> --graphml                            # export graph.graphml (Gephi, yEd)
/graphify <path> --neo4j                              # generate graphify-out/cypher.txt for Neo4j
/graphify <path> --neo4j-push bolt://localhost:7687   # push directly to Neo4j
/graphify <path> --falkordb                           # generate graphify-out/cypher.txt for FalkorDB
/graphify <path> --falkordb-push falkordb://localhost:6379   # push directly to FalkorDB
/graphify <path> --mcp                                # start MCP stdio server for agent access
/graphify <path> --watch                              # watch folder, auto-rebuild on code changes (no LLM needed)
/graphify <path> --wiki                               # build agent-crawlable wiki (index.md + one article per community)
/graphify <path> --obsidian --obsidian-dir ~/vaults/my-project  # write vault to custom path (e.g. existing vault)
/graphify add <url>                                   # fetch URL, save to ./raw, update graph
/graphify add <url> --author "Name"                   # tag who wrote it
/graphify add <url> --contributor "Name"              # tag who added it to the corpus
/graphify query "<question>"                          # BFS traversal - broad context
/graphify query "<question>" --dfs                    # DFS - trace a specific path
/graphify query "<question>" --budget 1500            # cap answer at N tokens
/graphify path "AuthModule" "Database"                # shortest path between two concepts
/graphify explain "SwinTransformer"                   # plain-language explanation of a node
```

## What graphify is for

Drop any folder of code, docs, papers, images, or video into graphify and get a queryable knowledge graph. Persistent across sessions, honest audit trail (EXTRACTED/INFERRED/AMBIGUOUS), community detection surfaces cross-document connections you wouldn't think to ask about.

## What You Must Do When Invoked

If the user invoked `/graphify --help` or `/graphify -h` (with no other arguments), print the contents of the `## Usage` section above verbatim and stop. Do not run any commands, do not detect files, do not default the path to `.`. Just print the Usage block and return.

**Fast path — existing graph:** Before doing anything else, check whether `graphify-out/graph.json` exists. The expected location is `graphify-out/graph.json` relative to the **current working directory** (i.e. the project root where you are running commands). If it exists AND the user's request is a natural-language question about the codebase (e.g. "How does X work?", "What calls Y?", "Trace the data flow through Z") and NOT an explicit rebuild command (`--update`, `--cluster-only`, or a bare path/URL that implies fresh extraction): **skip Steps 1–5 entirely and jump straight to `## For /graphify query`.** Run `graphify query "<question>"` immediately. Do not run detect. Do not check corpus size. Do not ask the user to narrow. The graph is already built — use it.

If no path was given, use `.` (current directory). Do not ask the user for a path.

If the path argument starts with `https://github.com/` or `http://github.com/`, treat it as a GitHub URL - run Step 0 before anything else, then continue with the resolved local path.

Follow these steps in order. Do not skip steps.

### Step 0 - GitHub repos and multi-path merge (only if a URL or several paths)

Only when the path is one or more `https://github.com/...` URLs, or several local subfolders to merge. See `references/github-and-merge.md` for the clone, cross-repo merge, and monorepo flow, then continue with the resolved local path. A plain local path skips this step.

### Step 1 - Ensure graphify is installed

```bash
# Detect the correct Python interpreter (handles uv tool, pipx, venv, system installs)
PYTHON=""
GRAPHIFY_BIN=$(which graphify 2>/dev/null)
# 1. uv tool installs — most reliable on modern Mac/Linux
if [ -z "$PYTHON" ] && command -v uv >/dev/null 2>&1; then
    _UV_PY=$(uv tool run graphifyy python -c "import sys; print(sys.executable)" 2>/dev/null)
    if [ -n "$_UV_PY" ]; then PYTHON="$_UV_PY"; fi
fi
# 2. Read shebang from graphify binary (pipx and direct pip installs)
if [ -z "$PYTHON" ] && [ -n "$GRAPHIFY_BIN" ]; then
    _SHEBANG=$(head -1 "$GRAPHIFY_BIN" | tr -d '#!')
    case "$_SHEBANG" in
        *[!a-zA-Z0-9/_.-]*) ;;
```
