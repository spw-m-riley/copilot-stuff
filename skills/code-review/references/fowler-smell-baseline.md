# Fowler-style smell baseline (non-binding)

Use this reference as an optional lens for spotting maintainability concerns, not as a mechanical checklist. The [`assets/findings.schema.json`](../assets/findings.schema.json) `category` field is free-form — a smell can be recorded under `maintainability` or `design` when it clears the evidence bar in [`confidence-and-evidence.md`](confidence-and-evidence.md), the same as any other finding.

## Why non-binding

Every smell below is a heuristic, not a rule. A codebase can have a "long method" that is genuinely the clearest shape for its problem, or a "duplication" that is actually two concepts that only look alike today. Treat this list as a set of questions worth asking, not a set of violations worth flagging automatically. A smell is only a finding once it clears the same evidence and confidence bar as any other review claim — do not pad a review with smell mentions that have no concrete impact on the reviewed change.

## Common smells worth asking about

- **Long method / long function** — does the length make the behavior hard to verify in this diff, or is it just visually large?
- **Large class / god object** — is responsibility genuinely scattered, or is this a natural aggregation point for the domain?
- **Duplicated code** — are these two blocks the same concept that should share one source of truth, or superficially similar code solving different problems?
- **Feature envy** — does a method reach into another module's internals more than its own, suggesting the logic belongs elsewhere?
- **Shotgun surgery** — does this diff touch many unrelated files for one conceptual change, hinting at a missing seam? See [`codebase-design`](../../codebase-design/SKILL.md) for seam vocabulary if this recurs.
- **Primitive obsession** — are domain concepts represented as loose strings/numbers where a small type would prevent an entire class of bugs?
- **Speculative generality** — does this diff add configurability, abstraction, or parameters with no current caller that needs them?
- **Long parameter list** — does the signature make call sites error-prone or hard to read?
- **Divergent change / parallel inheritance** — does one change here force a matching change somewhere else for reasons that feel structural rather than incidental?

## How to use this in a review

1. Ask the relevant questions above only where the diff's shape actually raises them — do not run every question against every file.
2. If a question surfaces a real, evidenced concern, record it as a normal finding with `category` such as `maintainability` and the smell name in the title or summary (for example, "Feature envy: `OrderSummary.render` reaches into `Cart` internals for three fields").
3. If the smell is present but has no concrete impact on this change (pre-existing, unrelated to the diff, or purely a matter of taste), leave it out of the findings or note it only as non-blocking context — do not let a style label substitute for the impact/evidence bar the rest of the review requires.
4. When a smell recurs across a diff (the same duplication pattern in three call sites), report it once with all locations rather than as three separate findings.
