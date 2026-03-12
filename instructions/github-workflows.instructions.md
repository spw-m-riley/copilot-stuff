---
applyTo: "**/.github/workflows/*.{yml,yaml}"
---

Keep workflows explicit, deterministic, and easy to scan.
Prefer existing repository patterns, reusable workflows, and trusted actions before adding bespoke job graphs or large inline shell scripts.
Set `permissions` deliberately and keep them as narrow as the workflow needs.
Keep triggers, path filters, concurrency, caching, and matrix expansion intentional so workflows only run when they should.
Keep job names, runner choices, and step boundaries clear; extract repeated logic rather than duplicating it across jobs.
