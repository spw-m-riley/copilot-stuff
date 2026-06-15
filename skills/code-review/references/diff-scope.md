# Diff scope classification

Use this reference before recording findings. The review should say both how wide the overall change is and whether each finding belongs to the authored diff or only adjacent context.

## Overall review breadth

Set `summary.scope_classification` to one of these values:

| Value | Meaning | Typical behavior |
| --- | --- | --- |
| `focused` | One surface or one coherent change set; most context stays near the edited files. | Review deeply; findings should map tightly to the changed lines. |
| `mixed` | A few related surfaces changed together, such as handler + tests + workflow. | Review the primary surface first, then sanity-check supporting files. |
| `broad` | Many subsystems or high-coupling changes moved together. | Narrow the claims, document blind spots, and consider `implementation-planner` as an always-on specialist route. |

## Per-finding ownership

Each finding uses `diff_scope.classification`.

| Value | Meaning | Reporting rule |
| --- | --- | --- |
| `primary` | The issue is introduced directly by changed lines or by a new interaction created in the authored diff. | Normal finding; strongest default path. |
| `secondary` | The issue is outside the edited lines but is pulled into risk by the authored change. | Allowed if the rationale explains the coupling clearly. |
| `pre-existing` | The issue existed already and the current change only exposed or touched it indirectly. | Suppress unless it is genuinely merge-blocking or the user asked for broad debt review. |

## Decision procedure

1. Start with the authored diff and list the files that were intentionally changed.
2. Mark each reviewed file as primary, supporting, or untouched background context.
3. For each candidate finding, ask: "Would this matter if this diff did not exist?"
   - If **no**, it is usually `primary`.
   - If **yes, but this diff makes it reachable or riskier**, it is usually `secondary`.
   - If **yes, and the diff only brushed against it**, it is usually `pre-existing`.
4. If you classify something as `pre-existing` and still report it, say exactly why it blocks or materially changes the review verdict.

## Suppression guidance

Do not turn broad repo debt into review noise.

- Suppress `pre-existing` style or cleanup issues.
- Suppress speculative architecture critiques that are not caused by the diff.
- Downgrade or drop `secondary` findings when the causal link to the diff is weak.
- Prefer a short `notes` entry in `summary` over a formal finding when the issue is informative but not review-blocking.

## Examples

| Situation | Classification | Why |
| --- | --- | --- |
| A new null guard returns before existing fallback logic | `primary` | The bug is introduced by the changed branch itself. |
| The diff adds a new call path that now reaches an old helper with unsafe defaults | `secondary` | The helper was pre-existing, but the authored change creates the risky path. |
| An old flaky test still flakes in untouched CI setup while reviewing a docs-only diff | `pre-existing` | The review target did not meaningfully create or worsen the issue. |
