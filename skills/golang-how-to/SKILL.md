---
name: golang-how-to
description: "Golang skills orchestrator — always active on any Golang coding, review, debug, or setup task."
metadata:
  category: golang
  audience: developer
  maturity: stable
  kind: reference
---

**Persona:** You are a Go skills orchestrator. For every Go task, identify all relevant skills and load them together — a task rarely belongs to a single skill.

**Dependencies:** `gopls` — `go install golang.org/x/tools/gopls@latest`; the built-in `LSP` tool also needs `ENABLE_LSP_TOOL=1` and a Go language server wired (see [Code navigation with gopls](#code-navigation-with-gopls)).

## Modes

- **Orchestrate** — load the primary skill plus all applicable secondary skills simultaneously.
- **Disambiguate** — see [references/skill-disambiguation.md](references/skill-disambiguation.md).
- **Configure** — see [references/configure-mode.md](references/configure-mode.md).

## Skill loading

Load the primary skill and all applicable secondary skills at the same time.

See [references/skill-catalog.md](references/skill-catalog.md) for the full catalog and routing table.

## Code navigation with gopls

`gopls` gives semantic code intelligence for Go — go-to-definition, references, diagnostics, package API, symbol search, refactoring. See `samber/cc-skills-golang@golang-gopls` for the full capability matrix and workflows.

`gopls` only reasons about code in the local build. For ecosystem facts, use `golang-pkg-go-dev` (`godig`).

## `godig` vs gopls vs Context7 vs govulncheck

Four tools can answer dependency questions:

- **Context7** — generic docs when no better source exists.
- **`godig`** — published ecosystem facts from pkg.go.dev.
- **`gopls`** — your resolved local build, including `replace` directives.
- **`govulncheck`** — whole-tree vulnerability audit.

Pick by task:

| Task | Tool | How |
| --- | --- | --- |
| Find where a symbol is defined in your own repo | `gopls` | `samber/cc-skills-golang@golang-gopls` |
| Understand a file's intra-package dependencies | `gopls` | `samber/cc-skills-golang@golang-gopls` |
| Jump into a dependency's exact resolved source | `gopls` | `samber/cc-skills-golang@golang-gopls` |
| Get diagnostics right after an edit | `gopls` | `samber/cc-skills-golang@golang-gopls` |
| Check whether your current build can reach a known vulnerability | `gopls` | `samber/cc-skills-golang@golang-gopls` |
| Whole-tree vulnerability audit across the module | `govulncheck` | `samber/cc-skills-golang@golang-security` |
| List available versions of a published package | `godig` | `godig versions <path>` |
| Check known CVEs for a package/version | `godig` | `godig vulns <path>` |
| See exported symbols/signatures of a published package | `godig` | `godig symbols` / `symbol doc` |
| Get runnable code examples for a symbol | `godig` | `godig symbol examples` |
| Read a package's rendered README/docs | `godig` | `godig module readme` / `package doc` |
| See who imports a package across the public ecosystem | `godig` | `godig imported-by` |
| Search for a package or library candidate | `godig` | `godig search` |
| Check a package's or module's license | `godig` | `godig package licenses` / `module licenses` |
| Get docs for a non-Go library, or a Go module not indexed on pkg.go.dev | Context7 | `resolve-library-id` / `query-docs` |

## Use this skill when

- Working on Go coding, review, debug, or setup tasks.
- You need to choose the right Go skill cluster for a request.

## Do not use this skill when

- The task is unrelated to Go.

## Validation

- Keep the reference files list in sync with every on-disk support file.
- Run the local skill-library validator after editing this package.

## Examples

- should trigger: "How should I structure this Go refactor?"
- should not trigger: "How do I update a JavaScript workflow?"

## Reference files

- [`references/skill-catalog.md`](references/skill-catalog.md) - full catalog by category
- [`references/skill-disambiguation.md`](references/skill-disambiguation.md) - boundary tables and routing examples
- [`references/configure-mode.md`](references/configure-mode.md) - configure workflow
- [`references/by-category.md`](references/by-category.md) - compatibility catalog reference
- [`references/disambiguation.md`](references/disambiguation.md) - compatibility disambiguation reference
- [`references/project-config.md`](references/project-config.md) - compatibility config reference
