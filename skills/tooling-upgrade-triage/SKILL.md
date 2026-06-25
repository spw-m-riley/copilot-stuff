---
name: tooling-upgrade-triage
description: Use when a package manager, runtime version, or toolchain upgrade pipeline fails — including topgrade runs, uv/pip resolver conflicts, Homebrew errors, Go or Node toolchain upgrade failures, and lock file breakage. Not when the CI job itself is failing (→ github-actions-failure-triage) or when the dependency change is a deliberate library version bump (→ golang-dependency-management).
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: draft
  kind: task
---

# Tooling upgrade triage

Use this skill when an upgrade tool or package manager fails to update cleanly and you need to identify the layer that broke, why it broke, and the smallest safe fix.

## Use this skill when

- `topgrade` fails and the output doesn't make it clear which underlying tool is the culprit.
- `uv`, `pip`, or `pip-compile` reports a resolver conflict or lock file error during an upgrade.
- Homebrew fails to update or upgrade a formula (dependency conflict, tap error, build failure).
- A Go or Node toolchain upgrade (`go get toolchain`, `nvm install`, `volta install`) fails or leaves the environment broken.
- A lock file becomes stale, inconsistent, or regeneration fails after upgrading dependencies.
- A post-upgrade tool breaks at runtime even though the upgrade itself appeared to succeed.

## Do not use this skill when

- The failure is in a CI job that calls an upgrade step; the job itself is what needs diagnosis (→ [`github-actions-failure-triage`](../github-actions-failure-triage/SKILL.md)).
- The task is deliberately upgrading a library dependency in code — choosing versions, vetting changelogs, resolving conflicts (→ [`golang-dependency-management`](../golang-dependency-management/SKILL.md)).
- The failure is an OS-level or system package issue that requires admin or infrastructure access.
- The underlying tool is a custom in-house script, not a known package manager or runtime toolchain.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| `topgrade` fails, unclear which tool broke | Yes | - |
| `uv`, `pip`, `pip-compile` resolver or lock error | Yes | - |
| Homebrew formula conflict, tap error, or build failure | Yes | - |
| Go/Node toolchain upgrade breaks environment | Yes | - |
| Lock file stale or regeneration fails | Yes | - |
| CI workflow fails, not the upgrade tool itself | No | [`github-actions-failure-triage`](../github-actions-failure-triage/SKILL.md) |
| Deliberate library version bump with changelog review | No | [`golang-dependency-management`](../golang-dependency-management/SKILL.md) |
| System or OS package failure requiring admin access | No | escalate to user |

## Inputs to gather

**Required before acting**

- The exact error output from the failing tool or upgrade run (not just the exit code).
- Which tool failed: the top-level runner (`topgrade`) or a specific package manager layer.
- The operating system and shell environment.

**Helpful if present**

- The full `topgrade` output when it is the runner, so the failing step can be identified.
- Lock file contents or dependency manifest before/after the attempted upgrade.
- The tool version that was running before the attempted upgrade and the target version.
- Recent changes to the environment (OS update, new Homebrew tap, Python version change) that may have triggered the failure.

**Only investigate if encountered**

- Network or registry availability (only if a connection error appears in the output).
- Build-tool dependencies for native extensions (only if a compilation step fails).
- Transitive dependency graphs (only if the resolver explicitly names conflicting packages).

## First move

1. Identify the failing layer: is `topgrade` itself broken, or is one of the tools it delegates to failing? Read the full output before assuming.
2. Look for the exact error class using [`references/upgrade-failure-buckets.md`](references/upgrade-failure-buckets.md).
3. Check the known tool inventory for that package manager's common failure modes using [`references/tool-inventory.md`](references/tool-inventory.md).

## Workflow

1. **Isolate the failing layer.** Run the specific tool that failed independently (e.g. `brew upgrade <formula>`, `uv lock`, `go get toolchain@latest`) to confirm the error is reproducible outside the meta-runner.
2. **Classify the failure bucket.** Use [`references/upgrade-failure-buckets.md`](references/upgrade-failure-buckets.md) to name the failure type before proposing a fix.
3. **Check environment state.** Confirm the active runtime versions, PATH, and relevant env vars (`GOPATH`, `GOBIN`, `UV_PYTHON`, `VOLTA_HOME`, etc.) match what the tool expects.
4. **Apply the smallest fix for the bucket:**
   - Resolver conflict → pin, exclude, or remove the conflicting constraint; regenerate the lock file.
   - Lock file drift → delete and regenerate the lock file from the manifest, not by hand.
   - Network/registry → confirm registry reachability; check for proxy config, corporate CA, or offline mode flags.
   - Binary/build failure → install missing build dependencies; check for incompatible architecture (arm64 vs amd64).
   - Runtime version mismatch → align the tool's required runtime with the installed version; use a version manager.
   - Topgrade runner config → check `~/.config/topgrade.toml` for a disabled or misconfigured section; re-enable or fix the relevant step.
5. **Verify the fix.** Re-run only the previously failing tool or step, not the full upgrade pipeline, until the isolated step passes.
6. **Re-run the full pipeline.** Only after the isolated fix passes, run the full upgrade again to confirm no cascading failures.
7. **Record any permanent constraint changes.** If a pin or exclusion was added, document why in the manifest or lock file comment.

## Outputs

- Identification of the failing layer (meta-runner, package manager, or runtime) and exact failure bucket.
- The smallest safe fix applied to resolve the identified failure.
- Confirmation that the previously failing tool or step now passes.
- A note on any constraints added or environment changes made, so they can be revisited or removed later.

## Guardrails

- **Never** delete a lock file or `go.sum` without regenerating it immediately; a missing lock file leaves the environment in a worse state than the failure.
- **Never** widen version constraints speculatively just to silence a resolver conflict; confirm the wider range is intentional.
- **Never** run the full upgrade pipeline as a diagnostic step; isolate the failing tool first.
- **Should** prefer version pins or excludes over downgrading the tool itself unless the tool version is the direct cause.
- **Should** check whether the failure is reproducible on a clean shell before assuming environment corruption.
- **Should not** diagnose network issues at the package level if the registry is clearly reachable from the same shell.

## Validation

- Re-run the specific failing command independently and confirm it exits cleanly.
- Re-run the full upgrade pipeline and confirm no new failures were introduced by the fix.
- If a lock file was regenerated, confirm the diff is limited to the intended changes.
- If a constraint was added, confirm it satisfies the existing transitive graph.
- Smoke test:
  - should trigger: "`topgrade` fails and I can't tell which tool caused it."
  - should trigger: "`uv lock` fails with a resolver conflict after adding a new dependency."
  - should trigger: "`brew upgrade` fails because of a dependency conflict in a formula."
  - should not trigger: "The CI `pip install` step fails in my GitHub Actions workflow." (→ `github-actions-failure-triage`)
  - should not trigger: "I want to bump the Go version of my `go.mod` to 1.24." (→ `golang-dependency-management`)

## Examples

- "`topgrade` exits with errors; isolate which tool failed, reproduce the error directly, and apply the smallest fix."
- "`uv lock` reports a resolver conflict after I added a new package; identify the conflicting transitive constraint and pin to the compatible range."
- "`brew upgrade` fails because `libfoo` conflicts with an installed formula; trace the dependency graph and resolve the conflict without downgrading unrelated packages."
- "After a Go toolchain upgrade, `go build` fails on a binary that was working before; identify whether the issue is the toolchain version, a module dependency, or a build tag change."

## Reference files

- [`references/upgrade-failure-buckets.md`](references/upgrade-failure-buckets.md) — failure categories, symptoms, first checks, and fix strategies
- [`references/tool-inventory.md`](references/tool-inventory.md) — known tools (topgrade, uv, Homebrew, Go, Node/Volta, npm), their failure modes, and environment variables to check
