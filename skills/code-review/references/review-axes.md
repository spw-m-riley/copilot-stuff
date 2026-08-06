# Review axes: standards vs. spec

Use this reference to keep a finding's framing honest about which question it is actually answering. Most review disagreements trace back to conflating these two axes without noticing.

## The two axes

- **Standards axis** — does this code follow the conventions, idioms, and quality bar this codebase (or language ecosystem) already expects? Style, naming, structure, and the smells in [`fowler-smell-baseline.md`](fowler-smell-baseline.md) live here.
- **Spec axis** — does this code do what it was actually asked to do? Correctness against the stated requirement, acceptance criteria, or ticket description lives here.

A change can fail either axis independently:

- Follows standards, violates spec: idiomatic, well-structured code that solves the wrong problem or misses an acceptance criterion.
- Violates standards, follows spec: a messy or inconsistent implementation that nonetheless does exactly what was asked.
- Both can hold at once, and reviewers frequently blend them into one vague "this isn't right" reaction without saying which axis is unmet.

## How to use this in a review

1. When a finding surfaces, ask explicitly: is this a standards concern, a spec concern, or both? State it in the finding's `summary` so the author knows which bar they missed.
2. Weight spec violations above pure standards violations by default — code that is idiomatic but wrong is usually a higher-severity finding than code that is correct but inconsistent, unless the standards violation itself creates real risk (for example, a missed error-handling convention that hides failures).
3. Do not let a standards-axis nitpick block a merge on its own unless the repository's own conventions treat it as a hard requirement; record it and let severity/confidence in [`confidence-and-evidence.md`](confidence-and-evidence.md) do the prioritization.
4. When spec itself is ambiguous or undocumented, say so explicitly rather than reviewing against an assumed spec — an unstated assumption about intent is not evidence.

This axis is a framing aid, not a new schema field: continue recording findings using the existing `category`, `severity`, and `confidence` fields in [`assets/findings.schema.json`](../assets/findings.schema.json); use this reference to decide how to phrase the `summary` and weigh severity, not to add a new machine-readable axis.
