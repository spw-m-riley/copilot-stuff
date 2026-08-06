# Architecture heuristics

Use this reference as an optional deeper lens on top of [`audit-playbook.md`](audit-playbook.md)'s "Tech Debt & Architecture" category (category 5) when a repository audit needs sharper structural signal. It does not replace the audit playbook's finding format, prioritization rubric, or categories — it adds heuristics for finding and labeling architecture findings within that same format.

## Recent hot spots

Combine churn with risk instead of treating either alone as a finding:

- Use `git log --since=<window> --name-only` (or the repo's equivalent) to find files with the highest recent change frequency.
- Cross-reference high-churn files against test coverage and structural complexity. A file that changes often *and* has weak tests *and* is architecturally central (high fan-in) is the highest-leverage refactor candidate in the repo — rank it above an equally messy file that rarely changes.
- A high-churn file that is well-tested and clean is not a finding; churn alone is not evidence of a problem.

## Deletion test and deep modules

Borrow this test from [`codebase-design`](../../codebase-design/SKILL.md) when judging whether a module's boundary is healthy: could this module be deleted and reimplemented behind its current interface without the rest of the codebase noticing? If yes, it is a **deep module** — a simple interface hiding real complexity — and that is a strength worth naming explicitly in the audit, not just an absence of a finding. If no (many callers would need to change because they depend on internals, not the interface), that shallow-module gap is itself a tech-debt finding: name the leaking internals and the callers that reach through them.

## ADR conflict warning

Before flagging a structural pattern as a finding, check whether it is explained by an existing ADR (`docs/adr/`) or an explicit trade-off note elsewhere in the repo's domain docs. Then:

- **If the code matches the ADR's decision**: this is by-design, not a finding — say so explicitly so the user knows it was checked, not missed.
- **If the code has drifted from what the ADR says**: report the drift as its own finding. State plainly that the doc and the code disagree, and let the user decide which one is wrong — do not silently pick a side.
- **If a new architecture recommendation would contradict an existing ADR's decision**: flag the conflict directly in the finding rather than proposing the change as if the ADR did not exist. A recommendation that quietly reverses a recorded decision needs to say so, with a pointer to the ADR, so the user is choosing to revisit it rather than discovering the conflict later.

## Recommendation-strength labels

Architecture findings often mix a hard problem with a debatable direction. Alongside the existing `Impact`/`Effort`/`Risk`/`Confidence` fields in the audit playbook's finding format, label the recommendation itself with one of:

- **Must-fix** — an active correctness, safety, or maintainability cost with clear evidence; leaving it is actively harmful, not just suboptimal.
- **Recommended** — a clear improvement with a reasonable cost; most maintainers would choose to do this once they see the evidence.
- **Consider** — a plausible improvement where reasonable engineers could disagree on whether the trade-off is worth it; present the trade-off honestly rather than pushing a verdict.
- **Worth discussing** — a direction or philosophy question (often overlapping with the audit playbook's "Direction" category) that needs stakeholder buy-in before it becomes a plan, not just an executor.

Use these labels to help the user triage a long findings list quickly; they do not replace `Confidence` (how sure the finding is real) or `Impact`/`Effort` (how much it matters and costs) — a finding can be high-confidence and still only "Consider" if the improvement is genuinely a judgment call.
