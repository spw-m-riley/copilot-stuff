# TDD anti-patterns and boundary mocking

Use this reference when a test looks green but might not be proving anything, or when mocking choices are unclear. It does not change the RED/GREEN/REFACTOR cycle in `SKILL.md` — it helps you tell a genuine RED from a fake one and a genuine GREEN from a hollow one.

## Tautological tests

A tautological test asserts something that cannot fail given how it is written — it restates the implementation instead of checking behavior.

**Symptoms:**

- The assertion recomputes the same logic the production code uses, so a bug in that logic passes both places.
- The test hardcodes the exact value the implementation currently returns, with no independent basis (a spec, an example, a known-correct calculation) for why that value is right.
- Mocking every collaborator so completely that the test only proves "the mocks return what I told them to return."

**Example:**

```javascript
// Tautological: the test derives "expected" the same way the code does
function calculateTotal(items) {
  return items.reduce((sum, i) => sum + i.price, 0);
}
test("calculateTotal sums prices", () => {
  const items = [{ price: 5 }, { price: 10 }];
  const expected = items.reduce((sum, i) => sum + i.price, 0); // same formula as the code under test
  expect(calculateTotal(items)).toBe(expected);
});
```

**Fix:** assert against an independently known-correct value (`expect(calculateTotal(items)).toBe(15)`), a documented example from the spec, or a property that must hold regardless of implementation (e.g., "total is never negative when all prices are non-negative").

## Implementation-coupled tests

An implementation-coupled test asserts on internal structure or private mechanics rather than observable behavior, so it breaks on any refactor even when behavior is unchanged.

**Symptoms:**

- Asserting on private method calls, internal variable names, or call counts to helper functions that are implementation detail, not contract.
- Snapshotting an internal data structure that has no external consumer.
- A refactor with zero behavior change forces the test to change anyway.

**Example:**

```javascript
// Implementation-coupled: breaks if the internal helper is renamed or inlined,
// even though the public behavior is identical
test("processOrder calls validateItems internally", () => {
  const spy = jest.spyOn(orderModule, "validateItems");
  processOrder(order);
  expect(spy).toHaveBeenCalledTimes(1);
});
```

**Fix:** assert on the public contract instead — the returned value, the thrown error, or an observable side effect (a write to the injected boundary, an emitted event) — not on which private function ran.

## The philosophical difference

Tautological and implementation-coupled tests both give a false sense of safety, but from opposite directions:

- A **tautological test** is too loosely coupled to the *real* behavior — it can never fail even when the behavior is wrong, because it re-derives its own expectation from the same logic.
- An **implementation-coupled test** is too tightly coupled to *incidental* structure — it fails even when the behavior is right, because it is watching mechanics instead of outcomes.

The RED/GREEN/REFACTOR cycle in `SKILL.md` guards against both when followed honestly: a genuinely failing RED test (not one that fails only because of a typo) proves the assertion can actually detect absence of behavior, and a REFACTOR step that keeps tests green without editing them proves the tests are watching behavior, not internals. If a refactor with no behavior change forces test edits, that is a signal the test was implementation-coupled — fix the test's coupling, don't just accept the churn.

## Boundary-mocking guidance

The existing guardrail says: mock boundaries (I/O, network, DB), not core logic under test. Concretely:

- **Mock:** network calls, filesystem access, database clients, system clock, random-number sources, third-party SDK calls, and other true I/O boundaries the test cannot control deterministically otherwise.
- **Do not mock:** the function or module the test is actually specifying, pure helper functions it calls internally, or in-memory collaborators that are cheap and deterministic to run for real.
- **Prefer a fake or in-memory implementation over a mock** when the boundary has meaningful behavior worth exercising (an in-memory repository instead of a fully mocked database client) — a fake that behaves like the real thing catches more real bugs than a mock that only returns canned values.
- **Watch for over-mocking as a smell**: if a test needs to mock three or more internal collaborators to isolate one unit, the seam is probably in the wrong place — see [`codebase-design`](../../codebase-design/SKILL.md) for interface-as-test-surface guidance on where a cleaner boundary should live.
- **Verify mock behavior matches the real boundary's contract** at least once (a contract test, an integration test, or a documented API contract) so the mock does not silently drift from reality.
