# Codebase design vocabulary

Core terms for talking about module boundaries precisely. Use these terms consistently across `test-driven-development`, `code-review`, `systematic-debugging`, and `improve` instead of vaguer words like "layer" or "component."

## Module

A unit of code with one clear responsibility and a boundary other code interacts through, rather than reaching into. A module can be a class, a package, a service, or a single well-scoped file — size is not what makes something a module; a stable, intentional boundary is.

## Interface

The contract a module exposes: the functions, types, or endpoints other code is allowed to depend on. Everything not part of the interface is an internal detail that can change freely without breaking callers. A module with a wide, leaky interface (many exported internals) gives callers no reason not to depend on things that should be free to change.

## Adapter

A thin implementation of an interface that connects a module's abstract contract to one concrete external system (a real database, a real HTTP client, a fake/in-memory version for tests). An adapter should contain little to no business logic of its own — its job is translation between the interface and one specific concrete world.

## Depth

**Depth** (from Ousterhout's *A Philosophy of Software Design*) is the ratio between what an interface hides and how simple that interface is. A **deep module** has a simple interface hiding substantial complexity (a filesystem API hiding disk layout, caching, and permissions behind `open`/`read`/`write`). A **shallow module** has an interface about as complicated as its implementation — it saves the caller little and mostly just renames its own internals.

Prefer deep modules when designing new boundaries: a simple interface with room to change the implementation freely is more valuable than an elaborate interface that mirrors implementation detail one-to-one.

## Seam

A point in the code where behavior can be substituted without editing the surrounding code — usually an interface boundary with at least one real implementation and one alternate (test double, adapter, or configuration variant). A seam is what makes a piece of behavior independently testable or replaceable. Code with no seam at a boundary that genuinely needs one is code that cannot be tested or changed safely without editing everything downstream of it — see the deletion test below for one way to check whether a seam is doing its job.

## The deletion test

Ask: **could this module be deleted and completely reimplemented behind its current interface, with zero changes required in the rest of the codebase?**

- **Passes** → the module is deep enough that its boundary is doing real work; this is a healthy seam.
- **Fails** → callers depend on internals, not just the interface (they reach through it, assume its implementation details, or duplicate logic that belongs inside it). This is a shallow-module smell worth naming as a finding in `code-review` or `improve`, and a signal in `systematic-debugging` that a "no correct seam" situation may be exactly this: callers coupled to internals with no clean place to apply a fix.

The deletion test is a thought experiment, not something you need to actually perform — running it mentally against a module under review is usually enough to tell whether its boundary is deep or shallow.

## Interface as test surface

The interface a module exposes is usually the right place for a test to attach, because it is the contract that is supposed to stay stable while internals change:

- A test written against the interface survives internal refactors (renamed private helpers, reorganized internal state) without needing edits — this is the structural reason `test-driven-development`'s anti-pattern guidance calls implementation-coupled tests a smell.
- A test written against internals (private methods, internal call counts) breaks on refactors that changed nothing observable, and it usually means the interface itself is too shallow to trust as a test surface — the fix is often to strengthen the interface, not to test around it.
- When boundary-mocking in `test-driven-development` needs a mock or fake, mock at the interface, not at an internal collaborator one level below it — the interface is the seam that is meant to be substitutable.
