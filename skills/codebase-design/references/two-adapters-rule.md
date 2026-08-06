# The two-adapters rule

Use this rule when deciding whether an interface is genuinely well-designed, or only looks well-designed because it has never been asked to support a second implementation.

## The rule

**Don't fully trust an interface's shape until at least two real adapters implement it.** A single-adapter interface tends to accidentally leak the shape of that one concrete implementation into the "abstract" contract — parameters, error types, or return shapes that only make sense for the one real system behind it. The moment a second adapter is needed (a different database, a fake for tests, a new external provider), the interface's hidden assumptions surface as friction: the second adapter cannot honor the contract cleanly, or has to do awkward translation to pretend it can.

## Applying it

- **A test double counts as the second adapter.** You do not need two production integrations to apply this rule — a real adapter plus a faithful in-memory/fake adapter used in tests is usually enough to expose interface assumptions that only the first concrete system satisfied naturally.
- When writing a new interface, sketch (even just mentally) what a second adapter would need before finalizing the shape. If the second adapter would need to synthesize data the interface doesn't ask for, or ignore data the interface forces on it, the interface is leaking the first adapter's assumptions.
- When reviewing an existing single-adapter interface in `code-review`, treat "would a second adapter be awkward here?" as a legitimate structural question, not speculative gold-plating — it is a concrete predictor of the shallow-module smell the deletion test also catches.
- Do not over-apply this as a mandate to build speculative second adapters nobody needs yet; the rule is about designing the interface as if a second adapter could exist, not about building one preemptively. Building an adapter nobody needs is the "speculative generality" smell in `code-review`'s Fowler-style baseline, not good architecture.

## Signal this rule is being violated

- The interface's method names or parameters read like the one real system's API (its field names, its error codes) rather than a domain-level contract.
- Tests for the module can only use a mock that reimplements the real adapter's internal quirks instead of a simple fake that just satisfies the contract.
- Adding a second real integration required changing the interface itself rather than just adding a new adapter behind the existing one.
