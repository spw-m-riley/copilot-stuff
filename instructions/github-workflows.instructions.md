---
applyTo: "**/.github/workflows/*.{yml,yaml}"
---

- Keep workflows explicit, deterministic, and easy to scan.
- Prefer existing repository patterns, reusable workflows, and trusted actions before adding bespoke job graphs or large inline shell scripts.
- Set `permissions` deliberately and keep them as narrow as the workflow needs.
- Keep triggers, path filters, concurrency, caching, and matrix expansion intentional so workflows only run when they should.
- Keep job names, runner choices, and step boundaries clear; extract repeated logic rather than duplicating it across jobs.
- Run `actionlint` against all changed workflows and fix any issues it finds

## Baseline Workflow Guardrails

- Pin every `uses:` reference to a full commit SHA and include a version comment for readability unless a more specific local rule documents an allowed exception; do not commit mutable refs such as `@v4`, `@main`, or `@latest` by default.
- Set `permissions` explicitly. Start from `contents: read` at the workflow level and widen scopes only for the jobs that need additional access.
- Prefer OIDC or another short-lived federated auth path for cloud access instead of long-lived cloud credentials stored as repository secrets when federation is available.
- When a workflow uses shared resources or can hang on external systems, pair intentional `concurrency` settings with explicit `timeout-minutes` so stalled runs fail predictably.
- Default `actions/checkout` to `fetch-depth: 1`; only fetch full history when release, tagging, or other history-aware steps actually need it.
- For protected deployments, use GitHub `environment` rules with the right reviewers, branch restrictions, and secrets; include post-deploy smoke checks and keep rollback steps clear and testable.
- Use artifacts to pass built outputs and publish test, coverage, or security results when downstream jobs or reviewers need them; set `retention-days` intentionally and keep artifact names and paths exact.

## Review Checklist

- Are all `uses:` references pinned to a commit SHA or covered by a documented local exception, and are `permissions` explicit?
- Do long-running or shared-resource jobs set appropriate `concurrency` and `timeout-minutes` values?
- Do checkout steps use the right `fetch-depth` for the job's actual history needs?
- Do protected deployment jobs use the right `environment` controls, smoke checks, and rollback expectations?
- Do artifact producers and consumers agree on exact names, paths, and `retention-days`?

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [ACTIONS] When a packaging job writes build artifacts into a subdirectory (e.g. `iac/tf/.assets-web-app`) and then uploads them with `upload-artifact`, the `path` in the upload step must match the exact directory the job wrote to — not a parent directory. Verify staging paths end-to-end across package and deploy jobs; a mismatch (e.g. uploading `artifact-staging/iac/tf/.assets-*` when the job staged to `artifact-staging/.assets-*`) silently produces empty artifacts and causes downstream apply jobs to fail with missing plan files.
2. [ACTIONS] Always verify which workflow or run actually deployed a commit before inferring the pipeline from repository files or historical patterns - the same commit can be deployed through a different active workflow than the legacy config suggests
3. [ACTIONS] When fixing SPW GitHub Actions workflows, search for the relevant shared workflow or shared action first instead of replacing repository setup with bespoke workflow steps just because another repo provides a superficial example - the user explicitly corrected a move toward custom `setup-node` steps and pointed to shared Node setup instead
4. [ACTIONS] Never inject a fake `CIRCLECI` environment variable from GitHub Actions workflows to steer downstream script behavior; prefer the standard `CI` signal or an explicit repo-owned variable with a truthful name - the user explicitly said `CIRCLECI` should not be mentioned for this compatibility case
5. [ACTIONS] In this repository's pull-request workflows, do not keep fork-specific eligibility gates unless another explicit requirement needs them - Matt clarified PRs come from the private SPW org flow rather than untrusted forks, so fork-only guards added unnecessary waiting and complexity
6. [ACTIONS] When Release Please is expected to trigger post-release publishing, do not rely on a separate `release: published` workflow if Release Please is using the default `GITHUB_TOKEN`; chain the publish job in the same workflow via Release Please outputs or use an explicit non-`GITHUB_TOKEN` token, because `GITHUB_TOKEN`-created release events will otherwise leave releases without downstream assets - this session produced an empty extension release until the publish step was moved into the Release Please workflow
7. [ACTIONS] When a single-package Release Please repo feeds GoReleaser v2 release jobs, disable component-prefixed tags with `include-component-in-tag: false` so future tags stay plain semver (`vX.Y.Z`); GoReleaser rejects tags like `gh-depdash-v1.1.1` as invalid semantic versions and the publish job fails before building assets
8. [ACTIONS] In this repository's workflows, keep `Schroders-Personal-Wealth/github-action-configure-nodejs` on `@beta` unless Matt explicitly asks to change it - he explicitly corrected an attempted pin to `@v1.0.0`
9. [ACTIONS] When adding broad baseline workflow guidance to this instruction file, explicitly preserve any more specific learned-rule exceptions instead of writing blanket requirements that contradict them - this session's initial SHA-pinning rule conflicted with the documented `github-action-configure-nodejs@beta` exception
