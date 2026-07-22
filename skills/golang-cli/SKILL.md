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
| Implement Cobra-specific command behavior. | Yes | [`references/cobra-guide.md`](references/cobra-guide.md) |
| Implement Viper-specific configuration loading. | Yes | [`references/viper-guide.md`](references/viper-guide.md) |

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
- [`references/cobra-guide.md`](./references/cobra-guide.md) - Cobra command-tree, flags, completions, generators, and testing guide
- [`references/cobra-commands-and-args.md`](./references/cobra-commands-and-args.md) - Cobra hook lifecycle and argument validators
- [`references/cobra-completions.md`](./references/cobra-completions.md) - Cobra shell completion reference
- [`references/cobra-flags.md`](./references/cobra-flags.md) - Cobra flags and pflag reference
- [`references/cobra-generators.md`](./references/cobra-generators.md) - Cobra documentation and scaffolding generators
- [`references/cobra-testing.md`](./references/cobra-testing.md) - Cobra command testing patterns
- [`references/cobra-evals.json`](./references/cobra-evals.json) - Cobra activation evaluation cases
- [`references/viper-guide.md`](./references/viper-guide.md) - Viper configuration layering, binding, unmarshaling, reload, and testing guide
- [`references/viper-binding-and-env.md`](./references/viper-binding-and-env.md) - Viper environment and flag binding reference
- [`references/viper-sources-and-formats.md`](./references/viper-sources-and-formats.md) - Viper config sources, formats, and remote KV reference
- [`references/viper-testing-and-isolation.md`](./references/viper-testing-and-isolation.md) - Viper test isolation reference
- [`references/viper-unmarshal.md`](./references/viper-unmarshal.md) - Viper unmarshaling and struct mapping reference
- [`references/viper-watch-and-reload.md`](./references/viper-watch-and-reload.md) - Viper hot-reload reference
- [`references/viper-evals.json`](./references/viper-evals.json) - Viper activation evaluation cases
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
