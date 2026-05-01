---
description: 'Guidance for Go source files in this workspace'
applyTo: "**/*.go"
---

# Go guidance

## Purpose and Scope

- Applies to `**/*.go` files in this workspace.
- Use these rules for low-churn Go edits that respect package boundaries, toolchain realities, and existing error patterns.

## Core Guidance

- Prefer existing modules, naming conventions, error patterns, and type design before introducing new Go structure.
- Keep package boundaries clear and avoid leaking package-local types or type aliases into shared contracts.
- Use function-type contracts carefully; remember Go's function types are not covariant.
- Be deliberate with toolchain overrides and version management; verify the active toolchain before blaming code.
- Keep error handling, constructors, and helper wrappers readable and type-safe.

## Validation Expectations

- Run the repository's standard formatting, test, and build or typecheck commands for the touched Go packages.
- Confirm the active toolchain and any exported `GOROOT`/`GOTOOLDIR` overrides before treating version mismatches as code failures.

## Maintenance Notes

- Keep `## Learned Rules` as the final section in the file; do not add new sections after it.
- Append new learned rules without renumbering existing entries; numbering gaps can reflect archived or superseded rules.
- Use `[GO]` for Go-specific learned rules in this file and keep broader workflow or repository-policy guidance in the root instructions.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->

34. [GO] Always interpret the fact-find rewrite's "single lambda" preference as one lambda per area/category (for example `investmentexperience-lambda`, `protection-lambda`) unless the user explicitly says to merge areas into a shared binary - this correction clarified that separate area lambdas are the intended architecture

35. [GO] When deduplicating shared helper types in Go, do not leave package-local type aliases as the finished design; prefer using the shared type directly from its owning package unless a compatibility shim is explicitly required - Matt explicitly rejected `type OptionalString = optional.String` as not Go-like

36. [GO] When passing a package-specific error-constructor function into a shared helper that accepts `func(string) error`, wrap constructors returning concrete error types in a local closure so the argument matches exactly - Go function types are not covariant, so `func(string) *DomainError` does not satisfy `func(string) error`

37. [GO] Before treating Go compile-version mismatches as a code problem, check for exported GOROOT/GOTOOLDIR overrides and unset them if they point at an older install than the active toolchain - this session showed a stale GOROOT forced a Go 1.26.1 toolchain to load 1.25.5 stdlib/tools and produced misleading version-mismatch failures
38. [GO] Prefer the standard library by default, but when CLI or similar plumbing would otherwise require custom reinvention, ask Matt before introducing a well-established package like Cobra instead of rejecting it solely because it is non-stdlib - this session clarified that stdlib-first is a preference, not an absolute ban
39. [GO] When GitHub Actions `govulncheck` failures are entirely standard-library findings fixed in a later Go patch release, update the repo's pinned Go toolchain version before touching workflow YAML - this session showed a Dependabot action-bump PR inheriting a baseline `go 1.25.5` vulnerability failure rather than causing a CI wiring regression
40. [GO] When an `ObserveRun` dashboard test uses `t.TempDir()` and invalid dashboard roots, wait for the background finished-event delivery failure before the test returns - Linux CI can otherwise race TempDir cleanup against late diagnostic writes and fail with `directory not empty`
41. [GO] When Go tests read repository files as realistic samples, only depend on tracked repo files rather than local-only dotfiles or ignored paths - this `ma` CI failure came from a prose test reading an untracked `.github/copilot-instructions.md` that existed locally but not in GitHub Actions
