---
applyTo: "**/*.go"
---

Prefer existing modules, naming conventions, error patterns, and type design before introducing new Go structure.
Keep package boundaries clear and avoid leaking package-local types or type aliases into shared contracts.
Use function-type contracts carefully; remember Go's function types are not covariant.
Be deliberate with toolchain overrides and version management; verify the active toolchain before blaming code.
Keep error handling, constructors, and helper wrappers readable and type-safe.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->

34. [GO] Always interpret the fact-find rewrite's "single lambda" preference as one lambda per area/category (for example `investmentexperience-lambda`, `protection-lambda`) unless the user explicitly says to merge areas into a shared binary - this correction clarified that separate area lambdas are the intended architecture

37. [GO] When deduplicating shared helper types in Go, do not leave package-local type aliases as the finished design; prefer using the shared type directly from its owning package unless a compatibility shim is explicitly required - Matt explicitly rejected `type OptionalString = optional.String` as not Go-like

44. [GO] When passing a package-specific error-constructor function into a shared helper that accepts `func(string) error`, wrap constructors returning concrete error types in a local closure so the argument matches exactly - Go function types are not covariant, so `func(string) *DomainError` does not satisfy `func(string) error`

45. [GO] Before treating Go compile-version mismatches as a code problem, check for exported GOROOT/GOTOOLDIR overrides and unset them if they point at an older install than the active toolchain - this session showed a stale GOROOT forced a Go 1.26.1 toolchain to load 1.25.5 stdlib/tools and produced misleading version-mismatch failures
