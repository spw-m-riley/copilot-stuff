# Category and lifecycle states

Use this reference to classify a raw issue or PR consistently, independent of which tracker (GitHub, Jira, Linear, or anything else) hosts it. These are triage-vocabulary concepts, not tracker fields — do not assume any of them map onto a specific tracker's labels or workflow states without checking.

## Categories

- **Bug** — reports behavior that diverges from what the system is documented or expected to do.
- **Feature request** — asks for new capability that does not exist yet.
- **Question** — asks how something works or whether something is possible; often resolves without a code change.
- **Duplicate** — restates a concept already covered by another issue; needs a pointer to the original, not independent triage.
- **Needs-info** — cannot be classified yet because the report is missing reproduction steps, expected behavior, or scope.
- **Out-of-scope** — a real request, but one the project has already decided (or should decide) not to take on; record the reason, don't just close silently.

## Lifecycle states

- **Triage** — received, not yet classified or scoped.
- **Ready** — classified, scoped, and has a durable behavioral brief; ready for planning or ticket breakdown.
- **In progress** — actively being worked, whether by a human or an agent.
- **Blocked** — work has started but cannot continue without an external decision, dependency, or missing information.
- **Closed** — resolved (fixed, answered, or explicitly rejected with a rationale) or superseded by a duplicate.

## Applying category and state together

An issue's category and lifecycle state are independent axes — track both, not one collapsed field. A `feature request` can be `blocked` on a design decision; a `bug` can be `ready` for implementation the moment reproduction is confirmed. Do not infer one axis from the other; classify each explicitly.

## When classification itself is the finding

Sometimes the most useful triage output is realizing the issue is `duplicate`, `needs-info`, or `out-of-scope` — that is a complete and valid triage result, not a failure to classify. Say so plainly instead of forcing a behavioral brief out of a report that does not have enough signal yet, or that the project has already decided not to pursue.
