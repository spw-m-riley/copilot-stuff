---
name: golang-cli
description: "Use when building or reviewing a Go CLI command tree, flags, exits, configuration layering, or shell behavior; not for non-CLI Go code."
metadata:
  category: go
  audience: general-coding-agent
  maturity: draft
  kind: reference
---

# Go CLI Applications

Use this skill when you are building, modifying, or reviewing a Go command-line tool and need help with flags, config, exits, or shell behavior.

## Use this skill when

- The work is about a Go CLI command tree, argument parsing, configuration layering, version embedding, or shell completion.
- The request mentions Cobra, Viper, urfave/cli, or stdlib flag behavior.
- You need CLI-specific testing or stdout/stderr discipline.

## Do not use this skill when

- The code is not a command-line program.
- You need Cobra- or Viper-specific guidance that should route to a narrower skill.
- The problem is general Go runtime behavior rather than CLI behavior.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Design or review a general Go CLI command tree and shell contract. | Yes | - |
| Implement Cobra-specific command behavior. | No | [`golang-spf13-cobra`](../golang-spf13-cobra/SKILL.md) |
| Implement Viper-specific configuration loading. | No | [`golang-spf13-viper`](../golang-spf13-viper/SKILL.md) |

## Guardrails

- Preserve the repository's existing CLI framework and command conventions.
- Keep stdout machine-readable when commands are intended for composition; send diagnostics to stderr.
- Avoid hidden exits in reusable command logic so tests can assert errors and exit-code mapping.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-cli/SKILL.md`.
- Smoke test:
  - should trigger: "Add a Go CLI subcommand with flags, completion, and predictable exit codes."
  - should not trigger: "Fix a deadlock in a Go worker pool."

## Examples

- "Add a new Go CLI subcommand with flags and config loading."
- "Review this command for stdout/stderr and exit-code issues."
- "Explain the best structure for a small Go CLI tool."

## Reference files

- [`references/imported-guide.md`](./references/imported-guide.md) - comprehensive Go CLI design and implementation guide
- [`assets/examples/args.go`](./assets/examples/args.go) - argument validation example
- [`assets/examples/cli_test.go`](./assets/examples/cli_test.go) - CLI test example
- [`assets/examples/completion.go`](./assets/examples/completion.go) - shell completion example
- [`assets/examples/config.go`](./assets/examples/config.go) - configuration layering example
- [`assets/examples/exit_codes.go`](./assets/examples/exit_codes.go) - exit-code mapping example
- [`assets/examples/flags.go`](./assets/examples/flags.go) - flag definition example
- [`assets/examples/main.go`](./assets/examples/main.go) - main entrypoint example
- [`assets/examples/output.go`](./assets/examples/output.go) - stdout and stderr example
- [`assets/examples/root.go`](./assets/examples/root.go) - root command example
- [`assets/examples/serve.go`](./assets/examples/serve.go) - subcommand example
- [`assets/examples/signal.go`](./assets/examples/signal.go) - signal handling example
- [`assets/examples/version.go`](./assets/examples/version.go) - version command example
- [`evals/evals.json`](./evals/evals.json) - activation evaluation cases
