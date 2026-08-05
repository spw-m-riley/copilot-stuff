---
description: 'Guidance for Go source files in this workspace'
applyTo: "**/*.go"
---

# Go guidance

## Guidance

- Keep package boundaries clear and avoid leaking package-local types or type aliases into shared contracts.
- Use function-type contracts carefully; remember Go's function types are not covariant.
- Be deliberate with toolchain overrides and version management; verify the active toolchain before blaming code.
- Run the repository's standard formatting, test, and build or typecheck commands for the touched Go packages.
- Confirm the active toolchain and any exported `GOROOT`/`GOTOOLDIR` overrides before treating version mismatches as code failures.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->

150. [GO] Always interpret the fact-find rewrite's "single lambda" preference as one lambda per area/category (for example `investmentexperience-lambda`, `protection-lambda`) unless the user explicitly says to merge areas into a shared binary - this correction clarified that separate area lambdas are the intended architecture

151. [GO] When deduplicating shared helper types in Go, do not leave package-local type aliases as the finished design; prefer using the shared type directly from its owning package unless a compatibility shim is explicitly required - Matt explicitly rejected `type OptionalString = optional.String` as not Go-like

152. [GO] When passing a package-specific error-constructor function into a shared helper that accepts `func(string) error`, wrap constructors returning concrete error types in a local closure so the argument matches exactly - Go function types are not covariant, so `func(string) *DomainError` does not satisfy `func(string) error`

153. [GO] Before treating Go compile-version mismatches as a code problem, check for exported GOROOT/GOTOOLDIR overrides and unset them if they point at an older install than the active toolchain - this session showed a stale GOROOT forced a Go 1.26.1 toolchain to load 1.25.5 stdlib/tools and produced misleading version-mismatch failures
154. [GO] Prefer the standard library by default, but when CLI or similar plumbing would otherwise require custom reinvention, ask Matt before introducing a well-established package like Cobra instead of rejecting it solely because it is non-stdlib - this session clarified that stdlib-first is a preference, not an absolute ban
155. [GO] When GitHub Actions `govulncheck` failures are entirely standard-library findings fixed in a later Go patch release, update the repo's pinned Go toolchain version before touching workflow YAML - this session showed a Dependabot action-bump PR inheriting a baseline `go 1.25.5` vulnerability failure rather than causing a CI wiring regression
156. [GO] When an `ObserveRun` dashboard test uses `t.TempDir()` and invalid dashboard roots, wait for the background finished-event delivery failure before the test returns - Linux CI can otherwise race TempDir cleanup against late diagnostic writes and fail with `directory not empty`
157. [GO] When Go tests read repository files as realistic samples, only depend on tracked repo files rather than local-only dotfiles or ignored paths - this `ma` CI failure came from a prose test reading an untracked `.github/copilot-instructions.md` that existed locally but not in GitHub Actions
158. [GO] When normalizing imported Go skill packages, set `metadata.kind: reference` for lookup-heavy guides before validation unless the skill truly needs task-only sections; otherwise the validator will require `## Inputs to gather`, `## First move`, and `## Workflow` - this sweep hit that exact mismatch while converting the remaining imported skills
