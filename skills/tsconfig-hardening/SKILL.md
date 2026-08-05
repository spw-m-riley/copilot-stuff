---
name: tsconfig-hardening
description: "Use when tightening TypeScript flags, fixing tsconfig/module-resolution drift, or adding project references safely."
metadata:
  category: typescript
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Tsconfig hardening

## Use this skill when

- The user wants to enable stricter TypeScript settings safely.
- A repository has a confusing `tsconfig` chain that needs cleanup or consolidation.
- Module resolution, emit behavior, or workspace config drift is causing recurring TypeScript issues.
- The user wants to change TypeScript configuration even if that work may produce compiler errors that will need follow-on triage.
- The repository has multiple TypeScript packages or layers and wants to adopt `composite`, `references`, or `tsc -b` incrementally (project-references mode; see [Mode selection](#mode-selection)).

## Do not use this skill when

- The task is to fix one local type error without changing project configuration.
- The build problem is mainly in Babel, bundler, or runtime tooling with no meaningful `tsconfig` change.
- The repository intentionally uses a loose config and the user did not ask to harden it.
- The main task is now triaging the compiler errors caused by an earlier config change rather than changing config further.

## Mode selection

This skill covers two related but distinct workflows. Pick one before starting:

- **Config-hardening mode** (default) — tightening strictness flags, cleaning up an `extends` chain, or fixing module-resolution drift in an existing (usually single-package) config. Follow the main [Workflow](#workflow) below.
- **Project-references mode** — adopting `composite`, `references`, and `tsc -b` incrementally across a multi-package or layered workspace. Follow [Project references mode](#project-references-mode) below instead; use this mode when the repository has multiple TypeScript packages or layers and the goal is faster, more reliable builds or a coherent reference graph, not single-package strictness.

If both are in scope (a workspace needs both stricter flags and a references migration), do the references migration first on a pilot package, then harden strictness per package once the graph is stable — mixing both in one diff makes failures hard to attribute.


## Inputs to gather

**Required before editing**

- The active `tsconfig` files and their `extends` chain.
- The repository's typecheck, build, and test commands.
- The current strictness posture, such as `strict`, `noImplicitAny`, or `noUncheckedIndexedAccess`.
- Whether the project emits JavaScript, declarations, or typechecks only.

**Helpful if present**

- Baseline compiler error counts before changing flags.
- Whether the repository mixes ESM and CJS.
- Package-level overrides in a monorepo.

## First move

1. Inventory the `tsconfig` chain and run `tsc --showConfig` or the nearest equivalent when available.
2. Separate configuration cleanup from code fixes so the diff explains itself.
3. Pick one strictness or resolution problem to address first instead of flipping every flag at once.

## Concrete config diffs

Base config before:

```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false
  }
}
```

Base config after:

```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true
  }
}
```

Use a single-flag step like this before considering `strict: true`; the umbrella switch is only safe when the blast radius is already understood.

Package override before:

```json
{
  "extends": "../../tsconfig.base.json"
}
```

Package override after:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noImplicitOverride": false
  }
}
```

Use a per-package override like this only to defer a base flag temporarily when one package is not ready yet.

## Workflow

1. Capture the current config shape and the commands it affects.
2. Normalize duplicated or conflicting settings across the `extends` chain.
3. Tighten flags in a deliberate order using the reference path below.
4. Keep module, path, include, exclude, and emit settings aligned with the actual build setup.
5. When a config change creates a burst of compiler errors, stop changing config further and switch to `skills/tsc-error-triage/SKILL.md` to work the failures in root-cause order.
6. Re-run typecheck, build, and targeted tests after each meaningful config change.
7. Stop widening the config change once the next flag would mix strictness work with emit, module, or package-layout churn.

## Outputs

- A narrowed `tsconfig` diff that changes one coherent strictness, resolution, module, or emit concern at a time.
- Updated base or package override configs with any deferred flags called out explicitly.
- A stop-or-route decision when compiler errors require `tsc-error-triage` before more hardening.
- Typecheck, build, and targeted-test evidence for each meaningful config batch.

## Guardrails

- **Must not** enable many strictness flags at once without first measuring the failure surface.
- **Must not** change emit, module, or resolution settings casually when the task is only about strictness.
- **Should** preserve existing build outputs unless the user asked for a packaging change.
- **Should** prefer explicit per-package overrides over hidden config drift.
- **May** defer especially noisy flags with a clear note when the repository is not ready yet.
- **Should** stop the config sweep when failures spread beyond one or two localized areas; at that point the work has become compiler triage, not hardening.

## Flag interaction notes

- `strict` is the umbrella switch; do not expect it to be a no-op if package configs were already overriding pieces of it.
- `noUncheckedIndexedAccess` often exposes index-signature and collection usage at once, so land it separately from optional-property changes.
- `exactOptionalPropertyTypes` tends to ripple through object defaults and partial-update helpers, so keep the diff small enough to explain the actual API impact.
- `noImplicitOverride` usually stays local to inheritance hierarchies and is a good follow-up batch after the broader nullability work.
- If a stricter flag would require `module`, `moduleResolution`, or `outDir` changes to stay buildable, pause and re-evaluate the root cause before widening the config patch.

## When to stop widening

Stop broadening the config work when any of these happen:

- the next change would touch both strictness and package-layout concerns
- the remaining failures are spread across unrelated packages
- the config diff no longer fits the current diagnosis in one review pass
- the only remaining fixes are code changes, not config changes

## Project references mode

Use this mode when the repository has multiple TypeScript packages or layers and needs faster, more reliable builds via `tsc -b`, or when declaration output, package boundaries, or editor performance are suffering in a growing workspace. This mode replaces the standalone `project-references-migration` skill; the staged checklist below is the same procedure, folded in here as an explicit mode of `tsconfig-hardening`.

**Do not use this mode when** the repository is a small single-project TypeScript setup, the task is only to fix one package's local `tsconfig`, or the workspace already has healthy project references and only needs routine maintenance — those are ordinary config-hardening mode.

### First moves (project references)

1. Inventory the package graph, current `tsconfig` chain, and any obvious cycles.
2. Pick one leaf or low-risk package as the pilot migration surface, and confirm how declarations, outputs, and package boundaries work today before adding references.
3. Follow [`references/project-references-checklist.md`](references/project-references-checklist.md) for the full staged workflow — pilot config, expanding from leaves upward, and troubleshooting stale editor caches or mismatched build output.

### Project-references guardrails

- **Must not** migrate the whole workspace in one leap without a proven pilot.
- **Must not** introduce circular references to mirror accidental runtime coupling.
- **Should** keep runtime resolution, package exports, and declaration output aligned.
- **Should** prefer real package boundaries over giant shared path-alias surfaces.
- **May** leave exceptional packages on local configs temporarily when the graph is not ready.
- **Should** treat a repeated cycle or stale output mismatch as a sign to pause migration, not to add another config layer.

### Project-references troubleshooting

See [`references/project-references-checklist.md`](references/project-references-checklist.md) § *Troubleshoot output and editor cache* for stale-declaration, wrong-emit-folder, and rootDir/outDir pitfalls.

## Routing boundary

- Use this skill when the primary work is TypeScript configuration cleanup, strictness sequencing, or incremental project-references adoption (see [Mode selection](#mode-selection)).
- Route to [`tsc-error-triage`](../tsc-error-triage/SKILL.md) once config changes have landed and the task becomes source-level compiler error remediation.
- If the TypeScript problem is vague or it's unclear which skill applies, route to [`typescript-triage`](../typescript-triage/SKILL.md).

## Validation

- Run the repository's typecheck command after each config batch.
- Run the build if `tsconfig` affects emit or declaration generation.
- Confirm the final config still matches the intended runtime and package layout.
- Use [`references/hardening-scenarios.md`](references/hardening-scenarios.md) to keep strictness sequencing, stop thresholds, and do-not-widen cases aligned with the maintenance loop.
- In project-references mode: confirm declarations and outputs land in the expected locations, run the typecheck workflow that consumes cross-package imports (not just the referenced build), and open a consuming file to confirm go-to-definition resolves to the expected referenced package source or fresh declarations rather than stale outputs.

- Smoke test:
  - should trigger: "Enable noImplicitAny and clean up this repo's tsconfig chain safely."
  - should trigger: "Add tsconfig references across our TS packages so tsc -b works." (project-references mode)
  - should not trigger: "Fix the source errors from the last typecheck run." (→ `tsc-error-triage`)

## Examples

- `Before`
  ```jsonc
  {
    "compilerOptions": {
      "strict": false,
      "noImplicitAny": false
    }
  }
  ```
  `After`
  ```jsonc
  {
    "compilerOptions": {
      "strict": false,
      "noImplicitAny": true
    }
  }
  ```
- `Before`
  ```jsonc
  {
    "compilerOptions": {
      "baseUrl": "."
    }
  }
  ```
  `After`
  ```jsonc
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": { "@/*": ["src/*"] }
    }
  }
  ```
- Project-references mode `Before`
  ```jsonc
  {
    "compilerOptions": {
      "composite": false
    }
  }
  ```
  `After`
  ```jsonc
  {
    "compilerOptions": {
      "composite": true,
      "declaration": true,
      "declarationMap": true
    },
    "references": [{ "path": "../core" }]
  }
  ```
  Pilot one leaf package first, then validate that `tsc -b` and editor go-to-definition resolve against the fresh declarations instead of stale outputs.

## Reference files

- [`references/strictness-path.md`](references/strictness-path.md) - a safe order for tightening common TypeScript compiler settings and related checks.
- [`references/hardening-scenarios.md`](references/hardening-scenarios.md) - scenario checklist for sequencing strictness work without widening scope.
- [`references/project-references-checklist.md`](references/project-references-checklist.md) - staged checklist for introducing project references without destabilizing the workspace (project-references mode).
