# Residual-risk gate

Use this gate when implementation and verification are otherwise complete, but one or more actionable findings still remain unresolved.

This gate is **manual prompt/workflow guidance only**. It does not imply hook automation, policy enforcement, or automatic artifact generation.

## When to run it

Run the gate before choosing merge, PR, keep, or discard if any of these still exist:

- unresolved reviewer findings that are still valid or partially valid
- accepted code-review findings that were not fixed in the current batch
- known correctness, reliability, or operational risks with a concrete user-visible consequence
- follow-up work that is still required for safe shipping

If no actionable findings remain, skip this gate and continue with the normal branch-finishing decision.

## Required behavior

- Make an explicit choice for **each** unresolved actionable finding.
- Do not collapse multiple findings into a vague "known issues remain" summary.
- Do not proceed to merge or PR while findings remain unclassified.
- If the safe choice is unclear, choose `stop`.

## Allowed decisions

| Decision | Use when | Required output |
| --- | --- | --- |
| `fix now` | The finding is real and should be resolved before shipping | Fix it, re-run relevant validation, then continue only if the finding is gone |
| `defer to tracker` | The finding is real but safe to ship now if follow-up is explicitly owned | Record the tracker link/ID, owner if known, and the reason shipping now is acceptable |
| `accept with durable record` | The finding is real, shipping will still proceed, and the acceptance decision needs a durable audit trail | Write a [`review-outcome-v1`](../../workflow-contracts/assets/review-outcome-v1.md) artifact that records the accepted residual risk |
| `stop` | The finding is too risky, under-evidenced, or too ambiguous to ship responsibly | Stop the branch-finishing flow and report the blocker clearly |

## `accept with durable record`

When the decision is `accept with durable record`, reuse the existing [`review-outcome-v1`](../../workflow-contracts/assets/review-outcome-v1.md) shape from [`workflow-contracts`](../../workflow-contracts/SKILL.md). Do **not** invent a new artifact format.

Minimum required frontmatter:

```yaml
---
contract_type: review-outcome
contract_version: v1
created_by: <reviewer or agent name>
status: approve
---
```

Minimum required headings:

- `## critical_issues`
- `## evidence`
- `## next_action`

Minimum content expectations for a residual-risk acceptance:

- `## critical_issues` names the accepted residual finding(s) in concrete terms.
- `## evidence` explains why shipping is still acceptable now, including mitigations, scope limits, or validation that reduces the risk.
- `## next_action` names the post-ship follow-up, monitoring, or owner handoff.

See [`contract-spec.md`](../../workflow-contracts/references/contract-spec.md) for the canonical required headings and status values.

## Relationship to review disposition

This gate assumes the finding is already considered actionable. If the open item is actually outdated, not valid, superseded, or not actionable yet, classify it first using [`comment-disposition.md`](comment-disposition.md) instead of forcing it through the residual gate.

## Compact summary shape

After the gate, report the result with one entry per unresolved finding:

```md
- finding: <short label>
  decision: fix now | defer to tracker | accept with durable record | stop
  rationale: <one sentence>
  record: <tracker link/id, artifact path, or "n/a">
```
