---
name: golang-cli
description: "Use when build or review a go cli command tree; not when another Go skill is a better fit."
metadata:
  category: go
  audience: general-coding-agent
  maturity: draft
  kind: reference
---

# Imported Go CLI Guide

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
| The request is specifically about go cli applications. | Yes | - |
| The request is better served by an adjacent Go skill. | No | Route Cobra-specific work to [`golang-spf13-cobra`](../../golang-spf13-cobra/SKILL.md) and Viper configuration work to [`golang-spf13-viper`](../../golang-spf13-viper/SKILL.md). |

## Guardrails

- Keep the guidance focused on go cli applications work.
- Prefer the narrower Go skill when the request clearly fits one.
- Do not turn this skill into a generic catch-all.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-cli/SKILL.md`.
- Smoke test:
  - should trigger: "Build or review a Go CLI command tree."
  - should not trigger: "Fix a deadlock in a Go worker pool."

## Examples

- "Add a new Go CLI subcommand with flags and config loading."
- "Review this command for stdout/stderr and exit-code issues."
- "Explain the best structure for a small Go CLI tool."

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
| The request is specifically about go cli applications. | Yes | - |
| The request is better served by an adjacent Go skill. | No | Route Cobra-specific work to [`golang-spf13-cobra`](../../golang-spf13-cobra/SKILL.md) and Viper configuration work to [`golang-spf13-viper`](../../golang-spf13-viper/SKILL.md). |

## Guardrails

- Keep the guidance focused on go cli applications work.
- Prefer the narrower Go skill when the request clearly fits one.
- Do not turn this skill into a generic catch-all.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/golang-cli/SKILL.md`.
- Smoke test:
  - should trigger: "Build or review a Go CLI command tree."
  - should not trigger: "Fix a deadlock in a Go worker pool."

## Examples

- "Add a new Go CLI subcommand with flags and config loading."
- "Review this command for stdout/stderr and exit-code issues."
- "Explain the best structure for a small Go CLI tool."

## Reference files

- [`assets/examples/args.go`](../assets/examples/args.go)
- [`assets/examples/cli_test.go`](../assets/examples/cli_test.go)
- [`assets/examples/completion.go`](../assets/examples/completion.go)
- [`assets/examples/config.go`](../assets/examples/config.go)
- [`assets/examples/exit_codes.go`](../assets/examples/exit_codes.go)
- [`assets/examples/flags.go`](../assets/examples/flags.go)
- [`assets/examples/main.go`](../assets/examples/main.go)
- [`assets/examples/output.go`](../assets/examples/output.go)
- [`assets/examples/root.go`](../assets/examples/root.go)
- [`assets/examples/serve.go`](../assets/examples/serve.go)
- [`assets/examples/signal.go`](../assets/examples/signal.go)
- [`assets/examples/version.go`](../assets/examples/version.go)
- [`evals/evals.json`](../evals/evals.json)

## Imported content
**Persona:** You are a Go CLI engineer. You build tools that feel native to the Unix shell — composable, scriptable, and predictable under automation.

**Modes:**

- **Build** — creating a new CLI from scratch: follow the project structure, root command setup, flag binding, and version embedding sections sequentially.
- **Extend** — adding subcommands, flags, or completions to an existing CLI: read the current command tree first, then apply changes consistent with the existing structure.
- **Review** — auditing an existing CLI for correctness: check the Common Mistakes table, verify `SilenceUsage`/`SilenceErrors`, flag-to-Viper binding, exit codes, and stdout/stderr discipline.

# Go CLI Best Practices

Use Cobra + Viper as the default stack for Go CLI applications. Cobra provides the command/subcommand/flag structure and Viper handles configuration from files, environment variables, and flags with automatic layering. This combination powers kubectl, docker, gh, hugo, and most production Go CLIs.

When using Cobra or Viper, refer to the library's official documentation and code examples for current API signatures.

For trivial single-purpose tools with no subcommands and few flags, stdlib `flag` is sufficient.

## Quick Reference

| Concern             | Package / Tool                       |
| ------------------- | ------------------------------------ |
| Commands & flags    | `github.com/spf13/cobra`             |
| Configuration       | `github.com/spf13/viper`             |
| Flag parsing        | `github.com/spf13/pflag` (via Cobra) |
| Colored output      | `github.com/fatih/color`             |
| Table output        | `github.com/olekukonko/tablewriter`  |
| Interactive prompts | `github.com/charmbracelet/bubbletea` |
| Version injection   | `go build -ldflags`                  |
| Distribution        | `goreleaser`                         |

## Project Structure

Organize CLI commands in `cmd/myapp/` with one file per command. Keep `main.go` minimal — it only calls `Execute()`.

```
myapp/
├── cmd/
│   └── myapp/
│       ├── main.go              # package main, only calls Execute()
│       ├── root.go              # Root command + Viper init
│       ├── serve.go             # "serve" subcommand
│       ├── migrate.go           # "migrate" subcommand
│       └── version.go           # "version" subcommand
├── go.mod
└── go.sum
```

`main.go` should be minimal — see [assets/examples/main.go](../assets/examples/main.go).

## Root Command Setup

The root command initializes Viper configuration and sets up global behavior via `PersistentPreRunE`. See [assets/examples/root.go](../assets/examples/root.go).

Key points:

- `SilenceUsage: true` MUST be set — prevents printing the full usage text on every error
- `SilenceErrors: true` MUST be set — lets you control error output format yourself
- `PersistentPreRunE` runs before every subcommand, so config is always initialized
- Logs go to stderr, output goes to stdout

## Subcommands

Add subcommands by creating separate files in `cmd/myapp/` and registering them in `init()`. See [assets/examples/serve.go](../assets/examples/serve.go) for a complete subcommand example including command groups.

## Flags

See [assets/examples/flags.go](../assets/examples/flags.go) for all flag patterns:

### Persistent vs Local

- **Persistent** flags are inherited by all subcommands (e.g., `--config`)
- **Local** flags only apply to the command they're defined on (e.g., `--port`)

### Required Flags

Use `MarkFlagRequired`, `MarkFlagsMutuallyExclusive`, and `MarkFlagsOneRequired` for flag constraints.

### Flag Validation with RegisterFlagCompletionFunc

Provide completion suggestions for flag values.

### Always Bind Flags to Viper

This ensures `viper.GetInt("port")` returns the flag value, env var `MYAPP_PORT`, or config file value — whichever has highest precedence.

## Argument Validation

Cobra provides built-in validators for positional arguments. See [assets/examples/args.go](../assets/examples/args.go) for both built-in and custom validation examples.

| Validator                   | Description                          |
| --------------------------- | ------------------------------------ |
| `cobra.NoArgs`              | Fails if any args provided           |
| `cobra.ExactArgs(n)`        | Requires exactly n args              |
| `cobra.MinimumNArgs(n)`     | Requires at least n args             |
| `cobra.MaximumNArgs(n)`     | Allows at most n args                |
| `cobra.RangeArgs(min, max)` | Requires between min and max         |
| `cobra.ExactValidArgs(n)`   | Exactly n args, must be in ValidArgs |

## Configuration with Viper

Viper resolves configuration values in this order (highest to lowest precedence):

1. **CLI flags** (explicit user input)
2. **Environment variables** (deployment config)
3. **Config file** (persistent settings)
4. **Defaults** (set in code)

See [assets/examples/config.go](../assets/examples/config.go) for complete Viper integration including struct unmarshaling and config file watching.

### Example Config File (.myapp.yaml)

```yaml
port: 8080
host: localhost
log-level: info
database:
  dsn: postgres://localhost:5432/myapp
  max-conn: 25
```

With the setup above, these are all equivalent:

- Flag: `--port 9090`
- Env var: `MYAPP_PORT=9090`
- Config file: `port: 9090`

## Version and Build Info

Version SHOULD be embedded at compile time using `ldflags`. See [assets/examples/version.go](../assets/examples/version.go) for the version command and build instructions.

## Exit Codes

Exit codes MUST follow Unix conventions:

| Code  | Meaning           | When to Use                               |
| ----- | ----------------- | ----------------------------------------- |
| 0     | Success           | Operation completed normally              |
| 1     | General error     | Runtime failure                           |
| 2     | Usage error       | Invalid flags or arguments                |
| 64-78 | BSD sysexits      | Specific error categories                 |
| 126   | Cannot execute    | Permission denied                         |
| 127   | Command not found | Missing dependency                        |
| 128+N | Signal N          | Terminated by signal (e.g., 130 = SIGINT) |

See [assets/examples/exit_codes.go](../assets/examples/exit_codes.go) for a pattern mapping errors to exit codes.

## I/O Patterns

See [assets/examples/output.go](../assets/examples/output.go) for all I/O patterns:

- **stdout vs stderr**: NEVER write diagnostic output to stdout — stdout is for program output (pipeable), stderr for logs/errors/diagnostics
- **Detecting pipe vs terminal**: check `os.ModeCharDevice` on stdout
- **Machine-readable output**: support `--output` flag for table/json/plain formats
- **Colors**: use `fatih/color` which auto-disables when output is not a terminal

## Signal Handling

Signal handling MUST use `signal.NotifyContext` to propagate cancellation through context. See [assets/examples/signal.go](../assets/examples/signal.go) for graceful HTTP server shutdown.

## Shell Completions

Cobra generates completions for bash, zsh, fish, and PowerShell automatically. See [assets/examples/completion.go](../assets/examples/completion.go) for both the completion command and custom flag/argument completions.

## Testing CLI Commands

Test commands by executing them programmatically and capturing output. See [assets/examples/cli_test.go](../assets/examples/cli_test.go).

Use `cmd.OutOrStdout()` and `cmd.ErrOrStderr()` in commands (instead of `os.Stdout` / `os.Stderr`) so output can be captured in tests.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Writing to `os.Stdout` directly | Tests can't capture output. Use `cmd.OutOrStdout()` which tests can redirect to a buffer |
| Calling `os.Exit()` inside `RunE` | Cobra's error handling, deferred functions, and cleanup code never run. Return an error, let `main()` decide |
| Not binding flags to Viper | Flags won't be configurable via env/config. Call `viper.BindPFlag` for every configurable flag |
| Missing `viper.SetEnvPrefix` | `PORT` collides with other tools. Use a prefix (`MYAPP_PORT`) to namespace env vars |
| Logging to stdout | Unix pipes chain stdout — logs corrupt the data stream for the next program. Logs go to stderr |
| Printing usage on every error | Full help text on every error is noise. Set `SilenceUsage: true`, save full usage for `--help` |
| Config file required | Users without a config file get a crash. Ignore `viper.ConfigFileNotFoundError` — config should be optional |
| Not using `PersistentPreRunE` | Config initialization must happen before any subcommand. Use root's `PersistentPreRunE` |
| Hardcoded version string | Version gets out of sync with tags. Inject via `ldflags` at build time from git tags |
| Not supporting `--output` format | Scripts can't parse human-readable output. Add JSON/table/plain for machine consumption |

## Related Skills

See `samber/cc-skills-golang@golang-project-layout`, `samber/cc-skills-golang@golang-dependency-injection`, `samber/cc-skills-golang@golang-testing`, `samber/cc-skills-golang@golang-design-patterns` skills.
