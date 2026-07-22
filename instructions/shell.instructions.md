---
description: 'Guidance for safe shell, CLI, and command-backed execution'
applyTo: "**/*"
---

# Shell and CLI guidance

## Purpose and Scope

- Applies to shell commands, CLI tools, validation commands, temporary command inputs, and command-backed decisions.
- Prefer direct, inspectable commands over opaque shell construction.

## Core Guidance

- Avoid shell command substitution in verification steps when a small explicit loop or plain-argument command is clearer and safer.
- Use `printf '%s\n' ...` or `printf --` when a heading or value could begin with `-`.
- Isolate best-effort diagnostics such as benchmark diffs from required validation so `|| true` cannot mask an earlier failure.
- Resolve Go-installed helper binaries from `go env GOBIN` instead of assuming `~/go/bin` or `GOPATH/bin`.
- When passing multiline Markdown to a CLI flag, write it to a temporary file and use the tool's `--body-file` option.
- When authoring VHS tapes, avoid escaped double quotes inside `Type` commands; use shell-safe quoting or Lua long brackets.

## Validation Expectations

- Run command-backed decisions directly and report the observed result.
- Keep required checks fail-fast and inspect the final exit status before updating task state.
- Keep temporary files and generated diagnostics inside the allowed workspace scope.

## Maintenance Notes

- Keep `## Learned Rules` as the final section in the file; do not add new sections after it.
- Append new learned rules without renumbering existing entries; numbering gaps can reflect archived or superseded entries.
- Use `[SHELL]` for shell and CLI execution rules.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
40. [SHELL] When a bash-tool verification step would rely on shell command substitution like `$(...)`, prefer a small Python loop or another plain-argument form instead - this session's history verification tripped the shell-safety guard even though the intent was benign.
53. [SHELL] When using shell `printf` in bash tool commands, do not pass a format string that starts with `-` directly; use `printf '%s\n' ...` or `printf --` so headings like `--- STATUS ---` are not parsed as options - this session's stage-and-commit command failed before running because of that shell pitfall.
77. [SHELL] When chaining long bash validation commands, isolate best-effort steps like benchmark diffs in braces or separate commands; a trailing `|| true` can mask earlier failing test or build steps because shell `&&`/`||` precedence is left-associative.
82. [SHELL] When invoking Go-installed helper binaries in this workspace, resolve them from `go env GOBIN` instead of assuming `~/go/bin` or `GOPATH/bin`.
121. [SHELL] When passing multi-line Markdown body text to a CLI flag, write the body to a temp file with the create tool and pass `--body-file <path>` instead of relying on nested heredoc command substitution.
132. [SHELL] When authoring VHS tapes, avoid escaped double quotes inside `Type "..."` commands; use shell-safe single quotes plus Lua long brackets or another quote-free form.
