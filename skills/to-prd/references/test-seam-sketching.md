# Test-seam sketching

Use this reference when `Testing Decisions` needs to name where a test seam should live, without turning the PRD into an implementation document. This does not relax the guardrail against file paths or code snippets in `Implementation Decisions` — it gives `Testing Decisions` a concrete way to describe seams in prose.

## Sketching a seam in prose

A test seam is the boundary a test will exercise: an interface, an adapter edge, or a module entry point where behavior can be verified without reaching into internals. Describe it the way you would describe any other capability in the PRD:

- Name the capability the seam exposes (`the retry scheduler's public "attempt" entry point`), not a file or class name.
- Name the boundary it isolates (`the payment gateway adapter`, `the notification dispatch boundary`), so the closest prior art in the repo is easy to find.
- State what a test at that seam should be able to observe or control (`can inject a failing gateway response without touching the real network`).

This keeps `Testing Decisions` grounded in the same evidence-first style as the rest of the PRD, without drifting into code.

## The narrow prototype-snippet exception

Sometimes a decision genuinely cannot be recorded faithfully in prose alone — for example, a prototype spike already produced the shape of a new interface, and the PRD's job is to record that decision, not to re-derive it from scratch. In that narrow case:

- **One snippet only**, and only when it captures a structural decision (an interface signature, a seam boundary, a type shape) already reached during prototyping — not a snippet written fresh for the PRD.
- Keep it short: the smallest fragment that records the decision (a function signature, an interface declaration), not a full implementation.
- Place it in `Further Notes`, not in `Implementation Decisions` or `Testing Decisions` — those sections stay snippet-free per the base guardrail.
- Label it explicitly as a structural decision snapshot from prototyping, not as instructions to copy verbatim (`Prototype spike settled on this seam shape:`), so a reader does not mistake it for a mandate to preserve exact code.
- If there is no prototype-derived shape to record — the decision is still open, or was reached purely through discussion — do not manufacture a snippet. Describe the decision in prose instead.

This exception exists once, for one purpose: recording a real decision that already has a concrete shape. It is not a general license to add code examples to a PRD.
