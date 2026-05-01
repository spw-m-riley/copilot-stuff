# ma CLI reference

Use the CLI only when explicit command control matters more than the extension wrapper.

## Read-focused commands

| Command | Purpose | Notes |
| --- | --- | --- |
| `ma smart-read <file> --json` | Classify and reduce a file for context consumption | Best default CLI entry point for unknown file types |
| `ma compress <file> --json` | Compress prose deterministically | Supports `--write` |
| `ma skeleton <file> --json` | Reduce source to declarations and signatures | Read-only |
| `ma minify-schema <file> --json` | Minify JSON or YAML schema files | Supports `--write` |
| `ma dedup <path...> --json` | Report exact and near-duplicate instruction text | Read-only |
| `ma trim-imports <file> --json` | Summarize import blocks for code context | Useful when full skeleton output is still too large |

## Extra CLI-only workflows

| Command | Purpose | Notes |
| --- | --- | --- |
| `ma optimize-md <file> --json` | Optimize markdown structure deterministically | Supports `--write` |
| `ma maintain <directory> --json` | Batch compress and deduplicate instruction files | `--write` creates `.ma.bak` backups |
| `ma compact-history <transcript> --json` | Compact transcript history from an explicit JSON contract | Supports `--write` |
| `ma validate <original> <candidate> --json` | Validate preserved structure between two files | Useful after write-capable commands |

## Mutation notes

- `--write` is the explicit mutation gate for `compress`, `minify-schema`, `optimize-md`, `maintain`, and `compact-history`.
- Prefer non-mutating `--json` runs first when you need to inspect output before deciding to rewrite a file.
- The extension wrapper intentionally exposes only a subset of the CLI surface; use direct CLI commands only when that extra control is actually needed.
