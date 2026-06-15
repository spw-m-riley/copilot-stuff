# Confidence anchors and evidence rules

This skill uses fixed confidence anchors so findings stay comparable across reviewers. Confidence is about how strongly the evidence supports the claim, not how severe the outcome would be.

## Confidence anchors

| Value | Meaning | When to use it |
| --- | --- | --- |
| `0` | No reliable support yet | Keep only as a private note while investigating; do not report as a formal finding. |
| `25` | Weak suspicion | There is a pattern worth checking, but proof is incomplete or strongly assumption-dependent. Usually suppress from the final findings list. |
| `50` | Plausible issue | The code shape suggests a real problem, but a key assumption or missing context still needs confirmation. |
| `75` | Strongly supported | The code, tests, diff, or docs show a concrete problem with only small remaining uncertainty. |
| `100` | Directly demonstrated | The failure or contradiction is explicit in the diff, code flow, build output, or spec. |

## Minimum evidence bar

Every reported finding needs all of the following:

1. **A concrete location** in `locations[]`.
2. **At least one evidence item** in `evidence[]` with a short excerpt.
3. **A causal explanation** that connects the evidence to the stated impact.
4. **A confidence value** chosen from the fixed anchors above.

## Escalation guidance by severity

- `critical` or `high` findings should usually have either:
  - two independent evidence items, or
  - one direct reproducer / validator confirmation plus a precise location.
- `medium` findings can rely on one strong code-path argument if it is specific.
- `low` findings should still be actionable; do not use low severity as a dumping ground for vague ideas.

## Evidence kinds

Use the narrowest truthful `evidence.kind` value.

| Kind | Good use |
| --- | --- |
| `diff` | The change itself introduces the problem or removes a safeguard. |
| `code` | A nearby implementation detail proves the impact. |
| `test` | Existing or newly run tests show the behavior. |
| `build` | Compiler, linter, or CI output confirms the issue. |
| `docs` | Internal documentation contradicts the change or proves expected behavior. |
| `spec` | A contract or protocol definition proves incompatibility. |
| `runtime` | A real execution trace, log, or manual repro demonstrates the failure. |

## Suppress these anti-patterns

Do not report a formal finding when the claim is mostly one of these:

- "This might be cleaner if..."
- "I usually prefer..."
- "A different abstraction could..."
- "This file has other issues too" without tying them to the diff.
- "Tests are missing" without naming the observable risk or the unverified branch.
- "Potential race" / "possible security issue" with no path, trigger, or contradiction.

## Validator expectations

The second-pass validator should be able to answer one of these for each finding:

- `confirmed` — the claim is supported.
- `rejected` — the claim does not survive scrutiny.
- `clean` — used only when there are no findings and the validator agrees.
- `not_run` — temporary placeholder before validation.

If the validator cannot confirm the core assumption, downgrade the confidence or change the recommendation to `needs_more_proof`.
