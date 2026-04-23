---
description: 'Guidance for TypeScript source files in this workspace'
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript guidance

## Purpose and Scope

- Applies to `**/*.ts` and `**/*.tsx` files in this workspace.
- Use these rules for type safety, boundary validation, and low-churn TypeScript edits.

## Core Guidance

- Use strict TypeScript.
- Prefer existing shared types, helpers, and schemas before adding new ones.
- Prefer existing project tooling; when choosing or extending TS linting or formatting, favor `oxlint` and `oxfmt` over `eslint`, `prettier`, or `biome` unless the repository already standardizes otherwise.
- Do not introduce `any` outside test files; prefer `unknown` at boundaries and narrow with type guards.
- Avoid unsafe type assertions, especially `as unknown as`; use a guard, parser, or shared helper instead.
- Model distinct states with discriminated unions and use exhaustive checks for switches.
- Validate untrusted inputs at runtime before treating them as typed values.
- Handle `null` and `undefined` explicitly instead of relying on non-null assertions.
- Keep exported APIs and shared utilities easy to consume with clear parameter and return types.

## Validation Expectations

- Run the repository's standard typecheck, test, and lint commands for the touched TypeScript surface.
- Prefer repo-local commands over ad hoc compiler invocations, and keep `oxlint`/`oxfmt` in the loop when the repository already uses them.

## Maintenance Notes

- Keep `## Learned Rules` as the final section in the file; do not add new sections after it.
- Append new learned rules without renumbering existing entries; numbering gaps can reflect archived or superseded rules.
- Use `[TYPESCRIPT]` for TypeScript-specific learned rules in this file and keep broader cross-cutting workflow guidance in the root instructions unless it clearly belongs here.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
