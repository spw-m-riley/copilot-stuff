---
name: codebase-design
description: "Use when a module, interface, adapter, or seam boundary needs precise structural vocabulary, or when checking whether a boundary is deep, testable, or well-factored; not for running an audit or an implementation workflow directly."
metadata:
  category: architecture
  audience: general-coding-agent
  maturity: draft
  kind: reference
---

# Codebase design

Use this skill for shared vocabulary and structural checks about module boundaries — module, interface, adapter, depth, and seam — plus the deletion test, interface-as-test-surface framing, the two-adapters rule, and dependency categories. It is a lookup and decision-support reference, not a workflow with its own outputs; it exists so `test-driven-development`, `code-review`, `systematic-debugging`, and `improve` can share one consistent structural vocabulary instead of each reinventing it.

## Use this skill when

- You need precise terms for a module boundary, interface, adapter, or seam instead of vaguer words like "layer" or "component."
- You are deciding whether a module's boundary is healthy (deep) or leaky (shallow) using the deletion test.
- You are deciding where a test should attach, or whether a mock belongs at the interface or somewhere deeper.
- You are designing a new interface and want to check it against the two-adapters rule before finalizing its shape.
- You are classifying a module's dependencies to decide which ones actually need a seam.
- `systematic-debugging` reached a confirmed root cause with no correct seam to apply the fix.
- `test-driven-development`'s boundary-mocking guidance needs clarity on where the boundary actually is.
- `code-review` or `improve` needs vocabulary to describe a structural finding precisely (shallow module, leaking interface, missing seam).

## Do not use this skill when

- You need to actually run a TDD red/green/refactor cycle — use [`test-driven-development`](../test-driven-development/SKILL.md).
- You need a structured review with findings, evidence, and a verdict — use [`code-review`](../code-review/SKILL.md).
- You need to reproduce and root-cause an active failure — use [`systematic-debugging`](../systematic-debugging/SKILL.md).
- You need a full repository audit and executable plans — use [`improve`](../improve/SKILL.md).
- The request is to implement the fix or refactor now, not to reason about the boundary first — do the implementation directly, using this skill's vocabulary only if it clarifies the design.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Need shared vocabulary for a module/interface/seam boundary | Yes | - |
| Deciding if a boundary is deep/shallow via the deletion test | Yes | - |
| Running the actual red/green/refactor cycle | No | [`test-driven-development`](../test-driven-development/SKILL.md) |
| Producing a structured review verdict with evidence | No | [`code-review`](../code-review/SKILL.md) |
| Root-causing an active failure | No | [`systematic-debugging`](../systematic-debugging/SKILL.md) |
| Running a full repository audit with implementation plans | No | [`improve`](../improve/SKILL.md) |

## Core vocabulary

Module, interface, adapter, depth, and seam are defined precisely in [`references/vocabulary.md`](references/vocabulary.md), along with the deletion test and the interface-as-test-surface framing.

## Two-adapters rule

An interface's shape is not trustworthy until at least two adapters (a real one and a faithful test fake counts) have to implement it — see [`references/two-adapters-rule.md`](references/two-adapters-rule.md) for how to apply it without over-building speculative adapters.

## Dependency categories

Not every dependency needs a seam. [`references/dependency-categories.md`](references/dependency-categories.md) sorts dependencies into stable/pure, volatile-external, internal-collaborator, cross-cutting/policy, and vendored/frozen, so you can tell which ones actually warrant one.

## Validation

- Confirm the vocabulary used matches [`references/vocabulary.md`](references/vocabulary.md) exactly (module, interface, adapter, depth, seam) rather than inventing synonyms.
- Confirm a deep/shallow judgment names what the deletion test would find, not just a general impression.
- Confirm a two-adapters-rule check considers a test fake as a valid second adapter before concluding an interface is under-designed.
- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/codebase-design/SKILL.md` after any change to this package.
- Smoke test:
  - should trigger: "Is this module's boundary actually deep, or does it just rename its own internals? Apply the deletion test."
  - should not trigger: "Write a failing test for this new retry behavior and implement it." (→ `test-driven-development`)

## Examples

- "This mock needs three internal collaborators stubbed out to isolate one unit — is the seam in the wrong place?"
- "We're about to add a second real adapter for this interface; sanity-check the interface shape against the two-adapters rule first."
- "I found the root cause of this bug but there's no clean interface to apply the fix — help me figure out whether a seam is missing here."
- "Classify this module's dependencies so we know which ones actually need an interface versus which are fine to call directly."

## Reference files

- [`references/vocabulary.md`](references/vocabulary.md) - module/interface/adapter/depth/seam definitions, the deletion test, and interface-as-test-surface framing
- [`references/two-adapters-rule.md`](references/two-adapters-rule.md) - why an interface needs at least two adapters (a fake counts) before its shape is trustworthy
- [`references/dependency-categories.md`](references/dependency-categories.md) - sorting dependencies into stable/pure, volatile-external, internal-collaborator, cross-cutting/policy, and vendored/frozen
