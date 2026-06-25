---
name: cross-repo-diff
description: Use when comparing two or more repositories for feature parity, functional drift, implementation differences, or to use one repo as a reference guide for how another should be built or migrated — especially when the comparison spans CI configs, API surfaces, dependency sets, or code patterns.
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: draft
  kind: task
---

# Cross-repo diff

Use this skill to systematically compare repositories and produce an actionable gap or parity report — whether the goal is finding what one repo is missing, validating equivalence after a migration, or using a reference repo as a guide for implementing something in the target.

## Use this skill when

- You need to compare two repos for functional or feature differences (e.g. "what does repo A have that repo B doesn't?").
- You're using one or more existing repos as reference implementations to guide how something should be built or migrated in a target repo.
- You want to audit whether a set of sibling repos are consistent in their CI config, dependency versions, or structural patterns.
- You need to verify parity after a migration (e.g. confirm repo B's GitHub Actions config achieves the same outcomes as repo A's CircleCI config).
- You're investigating how several similar projects differ before deciding on a canonical pattern.

## Do not use this skill when

- The comparison is within a single repository (branches, PRs, or commits) — use standard diff tools or [`code-review`](../code-review/SKILL.md).
- The goal is purely to review code quality or find bugs, not to understand structural differences between repos — use [`code-review`](../code-review/SKILL.md).
- The goal is a full CircleCI-to-GitHub-Actions migration with phased rollout — use [`circleci-to-github-actions-migration`](../circleci-to-github-actions-migration/SKILL.md) (cross-repo-diff can inform that decision but does not drive the migration itself).

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Compare two or more repos for parity or structural differences | Yes | - |
| Use one repo as a guide for migrating or implementing in another | Yes | - |
| Audit a fleet of repos for consistency | Yes | - |
| Diff a PR or branch within one repo | No | [`code-review`](../code-review/SKILL.md) |
| Execute a CircleCI→GitHub Actions migration | No | [`circleci-to-github-actions-migration`](../circleci-to-github-actions-migration/SKILL.md) |
| Full fleet-wide CI standardisation rollout | No | `ci-migration-orchestrator` agent |
| Audit one repo's code quality or maintainability | No | [`fallow`](../fallow/SKILL.md) |

## Inputs to gather

**Required before starting**

- The **target repo** — the repo you want to change, improve, or validate.
- At least one **reference repo** — the repo(s) you are comparing against or using as a guide.
- The **comparison goal** — parity check, gap analysis, reference-guided implementation, or consistency audit.
- The **comparison dimensions** — which surfaces matter: CI/CD config, dependencies, API surface, code patterns, configuration, documentation, or a mix.

**Helpful if present**

- Whether the reference repo is known to be more complete, more modern, or simply an example of a different approach.
- Any known areas where the repos are intentionally different (e.g. one uses ECS, another uses Lambda).
- Prior migration notes, ADRs, or CONTEXT.md files in either repo.

**Only investigate if encountered**

- Transitive dependency graphs (only when a version mismatch turns out to be indirect).
- Repo-specific secrets, environment variables, or deployment configurations not in committed files.

## First move

1. Identify the target and reference repos, confirm they are accessible, and establish the comparison goal.
2. Choose the comparison dimensions using [`references/comparison-dimensions.md`](references/comparison-dimensions.md).
3. Read the highest-signal files for the chosen dimensions in both repos before drawing any conclusions.

## Workflow

1. **Establish scope.** Agree with the user on target repo, reference repo(s), and which dimensions to compare. Use [`references/comparison-dimensions.md`](references/comparison-dimensions.md) as the menu.
2. **Read reference first.** For each dimension, read the reference repo's surface first to understand the pattern, then read the target repo's equivalent.
3. **Map and classify gaps.** For each dimension, note every difference and assign it a class using the taxonomy in [`references/comparison-dimensions.md`](references/comparison-dimensions.md): `missing`, `diverged`, `intentional`, or `equivalent`.
4. **Prioritise gaps.** Rank differences by impact — things that affect correctness, security, or deployability first; style and preference last.
5. **Produce the diff report** using [`assets/diff-report-template.md`](assets/diff-report-template.md).
6. **Recommend next steps.** For each gap or divergence, state whether to adopt the reference pattern, keep the target's approach, or investigate further.

## Outputs

- A structured gap/parity report using [`assets/diff-report-template.md`](assets/diff-report-template.md), covering each compared dimension.
- A classification for each difference: `missing`, `diverged`, `intentional`, or `equivalent`.
- Prioritised recommendations for which gaps to close, in what order, and why.
- A clear list of surfaces that are confirmed equivalent (so the user knows what they don't need to touch).

## Guardrails

- **Never** assume a difference is intentional without evidence — treat unexplained divergence as a gap until confirmed otherwise.
- **Never** propose changes to the reference repo unless the user explicitly asks; the reference is read-only by default.
- **Never** conflate a style difference with a functional gap — classify accurately before recommending action.
- **Should** read CONTEXT.md or README files in each repo before comparing code to understand intentional architectural differences.
- **Should** start with the highest-signal files for each dimension (e.g. workflow files for CI, `go.mod`/`package.json` for dependencies) rather than exhaustive file-by-file traversal.
- **Should not** collapse all differences into a single list; group by dimension so the user can act on one surface at a time.

## Validation

- Confirm the gap report covers all agreed dimensions and classifies each difference.
- Confirm each `missing` or `diverged` item has a recommendation with a rationale.
- Confirm at least one dimension is reported as `equivalent` (if the repos are related — an all-gaps report usually means a dimension was misread).
- Smoke test:
  - should trigger: "Compare these two repos and tell me what one has that the other doesn't."
  - should trigger: "Use `aws-appointment-portal` as a guide for how our repo should migrate from CircleCI."
  - should trigger: "Are our sibling microservices consistent in how they handle CI, linting, and Node versions?"
  - should not trigger: "Review this PR for bugs." (→ `code-review`)
  - should not trigger: "Migrate our CircleCI config to GitHub Actions." (→ `circleci-to-github-actions-migration`)

## Examples

- "Compare `spw-fact-find` and `aws-referral-processor` to understand how other repos migrated from CircleCI to GitHub Actions, then apply the same pattern to the target repo."
- "We have three sibling Lambda services — check if they're consistent in their runtime versions, CI triggers, and deploy steps."
- "Repo A is the 'gold standard'; identify everything it does that repo B is missing, prioritised by operational impact."
- "After porting the API to Go, verify the new repo's CI config achieves feature parity with the TypeScript original."

## Reference files

- [`references/comparison-dimensions.md`](references/comparison-dimensions.md) — menu of comparison surfaces (CI/CD, dependencies, API, code patterns, configuration, documentation) with high-signal files to read for each
- [`assets/diff-report-template.md`](assets/diff-report-template.md) — structured report template with dimension sections, classification key, and recommendation format
