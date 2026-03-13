---
name: project-references-migration
description: Migrate multi-package or layered TypeScript codebases to project references safely and incrementally.
metadata:
  category: typescript
  audience: general-coding-agent
  maturity: stable
---

# Project references migration

## Use this skill when

- The repository has multiple TypeScript packages or layers and needs faster, more reliable builds.
- The user wants to adopt `tsc -b` project references incrementally.
- Declaration output, package boundaries, or editor performance are suffering in a growing TypeScript workspace.

## Do not use this skill when

- The repository is a small single-project TypeScript setup.
- The task is only to fix one package's local `tsconfig`.
- The workspace already has healthy project references and only needs routine maintenance.
- The main goal is strictness hardening or general `tsconfig` cleanup rather than adopting `composite`, `references`, or `tsc -b`.

## Inputs to gather

**Required before editing**

- The package or layer graph and their current `tsconfig` files.
- The existing build and typecheck commands.
- Whether each package emits declarations, JavaScript, or types only.
- Output directories, package exports, and path alias usage.

**Helpful if present**

- Existing workspace tooling such as Nx, Turborepo, pnpm workspaces, or custom scripts.
- Known circular dependencies.
- Editor or CI pain points that motivate the migration.

## First move

1. Inventory the package graph and current `tsconfig` chain.
2. Pick one leaf or low-risk package as the pilot migration surface.
3. Confirm how declarations, outputs, and package boundaries work today before adding references.

## Workflow

1. Create or normalize a shared base config only for settings that truly belong across referenced packages.
2. Enable `composite` and the required declaration settings on the pilot package.
3. Add explicit `references` only where the dependency graph is already real.
4. Align output directories, package exports, and path aliases with the referenced build layout.
5. Migrate packages incrementally from leaves upward.
6. Switch scripts to `tsc -b` or the repository's equivalent only after the referenced graph is coherent.

## Guardrails

- **Must not** migrate the whole workspace in one leap without a proven pilot.
- **Must not** introduce circular references to mirror accidental runtime coupling.
- **Should** keep runtime resolution, package exports, and declaration output aligned.
- **Should** prefer real package boundaries over giant shared path-alias surfaces.
- **May** leave exceptional packages on local configs temporarily when the graph is not ready.

## Validation

- Run the repository's referenced build or the nearest equivalent after each migration batch.
- Confirm declarations and outputs land in the expected locations.
- Run the typecheck workflow that consumes cross-package imports, not just the referenced build.
- Open a consuming file in the editor when possible, trigger go-to-definition on an imported symbol, and confirm it resolves to the expected referenced package source or fresh declarations rather than stale outputs.

## Examples

- "Migrate this TypeScript monorepo to project references without breaking package builds."
- "Set up `tsc -b` incrementally starting with the leaf packages."
- "Our workspace typecheck is too slow. Move us toward project references safely."

## Reference files

- [`references/migration-checklist.md`](references/migration-checklist.md) - staged checklist for introducing project references without destabilizing the workspace.
