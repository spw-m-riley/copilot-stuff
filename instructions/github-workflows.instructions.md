---
description: 'Guidance for GitHub Actions workflow files in this workspace'
applyTo: "**/.github/workflows/*.{yml,yaml}"
---

# GitHub Actions workflow guidance

## Purpose and Scope

- Applies to `**/.github/workflows/*.{yml,yaml}` files in this workspace.
- Use these rules for GitHub Actions workflow structure, deployment safety, and CI review expectations.

## Core Guidance

- Keep workflows explicit, deterministic, and easy to scan.
- Prefer existing repository patterns, reusable workflows, and trusted actions before adding bespoke job graphs or large inline shell scripts.
- Set `permissions` deliberately and keep them as narrow as the workflow needs.
- Keep triggers, path filters, concurrency, caching, and matrix expansion intentional so workflows only run when they should.
- Keep job names, runner choices, and step boundaries clear; extract repeated logic rather than duplicating it across jobs.

## Validation Expectations

- Run `actionlint` against all changed workflows and fix any issues it finds.
- Re-check pinned `uses:` references, `permissions`, `concurrency`, and artifact path changes in the final diff before treating the workflow update as ready.

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

## Maintenance Notes

- Keep `## Learned Rules` as the final section in the file; do not add new sections after it.
- Append new learned rules without renumbering existing entries; numbering gaps can reflect archived or superseded rules.
- Use `[GITHUB-ACTIONS]` for GitHub Actions-specific learned rules in this file.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->

1. [GITHUB-ACTIONS] When a packaging job writes build artifacts into a subdirectory (e.g. `iac/tf/.assets-web-app`) and then uploads them with `upload-artifact`, the `path` in the upload step must match the exact directory the job wrote to — not a parent directory. Verify staging paths end-to-end across package and deploy jobs; a mismatch (e.g. uploading `artifact-staging/iac/tf/.assets-*` when the job staged to `artifact-staging/.assets-*`) silently produces empty artifacts and causes downstream apply jobs to fail with missing plan files.
2. [GITHUB-ACTIONS] Always verify which workflow or run actually deployed a commit before inferring the pipeline from repository files or historical patterns - the same commit can be deployed through a different active workflow than the legacy config suggests
3. [GITHUB-ACTIONS] When fixing SPW GitHub Actions workflows, search for the relevant shared workflow or shared action first instead of replacing repository setup with bespoke workflow steps just because another repo provides a superficial example - the user explicitly corrected a move toward custom `setup-node` steps and pointed to shared Node setup instead
4. [GITHUB-ACTIONS] Never inject a fake `CIRCLECI` environment variable from GitHub Actions workflows to steer downstream script behavior; prefer the standard `CI` signal or an explicit repo-owned variable with a truthful name - the user explicitly said `CIRCLECI` should not be mentioned for this compatibility case
5. [GITHUB-ACTIONS] In this repository's pull-request workflows, do not keep fork-specific eligibility gates unless another explicit requirement needs them - Matt clarified PRs come from the private SPW org flow rather than untrusted forks, so fork-only guards added unnecessary waiting and complexity
6. [GITHUB-ACTIONS] When Release Please is expected to trigger post-release publishing, do not rely on a separate `release: published` workflow if Release Please is using the default `GITHUB_TOKEN`; chain the publish job in the same workflow via Release Please outputs or use an explicit non-`GITHUB_TOKEN` token, because `GITHUB_TOKEN`-created release events will otherwise leave releases without downstream assets - this session produced an empty extension release until the publish step was moved into the Release Please workflow
7. [GITHUB-ACTIONS] When a single-package Release Please repo feeds GoReleaser v2 release jobs, disable component-prefixed tags with `include-component-in-tag: false` so future tags stay plain semver (`vX.Y.Z`); GoReleaser rejects tags like `gh-depdash-v1.1.1` as invalid semantic versions and the publish job fails before building assets
8. [GITHUB-ACTIONS] In this repository's workflows, keep `Schroders-Personal-Wealth/github-action-configure-nodejs` on `@beta` unless Matt explicitly asks to change it - he explicitly corrected an attempted pin to `@v1.0.0`
9. [GITHUB-ACTIONS] When adding broad baseline workflow guidance to this instruction file, explicitly preserve any more specific learned-rule exceptions instead of writing blanket requirements that contradict them - this session's initial SHA-pinning rule conflicted with the documented `github-action-configure-nodejs@beta` exception
10. [GITHUB-ACTIONS] When simplifying release workflows for this repository, preserve defined releases and release numbers because Matt uses them for Datadog correlation; simplify around main-based tags/releases and immutable artifact promotion rather than removing versioned releases altogether
11. [GITHUB-ACTIONS] When simplifying workflows in this repo, keep straightforward environment mapping, provenance writing, and smoke-check steps inline unless extraction makes the workflow visibly easier to scan; only pull logic out when it meaningfully reduces brittle API/JSON/control-flow complexity - Matt explicitly said the first refactor felt more complicated rather than simpler
12. [GITHUB-ACTIONS] When a repo-local composite action in this workspace needs substantial inline Node logic, move that code into a checked-in `.js` entrypoint and keep `action.yml` as a thin wrapper for inputs/env/output wiring - Matt explicitly called out the large inline guard script as a maintenance problem
13. [GITHUB-ACTIONS] When repo-specific workflow logic in this workspace is only invoked from one workflow path, prefer calling a single checked-in JS script directly from the workflow over adding a repo-local composite action wrapper that only forwards inputs or env - Matt explicitly said the thin manual-promotion-guard wrapper was still not simple enough, so this supersedes Rule 12 for that shape
14. [GITHUB-ACTIONS] When Matt scopes a task to workflow files, keep repository edits inside the workflow slice unless he explicitly asks for docs, tests, or app-code follow-ons - he corrected the branch after seeing extra unstaged changes beyond the workflow work
15. [GITHUB-ACTIONS] When resetting files outside a workflow slice, do not use the existing PR file list as the only keep-set if there are uncommitted workflow changes you just made; preserve the intended local workflow files first or you can delete your own uncommitted slice by mistake - this reset removed the locally created `lib/github-actions/` workflow helper because it had not been added to the PR yet
16. [GITHUB-ACTIONS] When triaging repeated GitHub Actions failures on the same PR, inspect the earliest failing run before assuming later attempts share the same root cause - this session showed one PR first failed from a stray `package-lock.json` cache artifact and later failed separately with a `yarn install` `Invalid URL`
17. [GITHUB-ACTIONS] When a GitHub Actions package-install failure depends on a pinned runtime, reproduce it with the exact pinned Node/Yarn versions before changing more workflow auth or registry settings - this session showed `yarn install` failed under Volta `node` `20.0.0` but passed under newer `20.19.x`, making the runtime pin the real fix
18. [GITHUB-ACTIONS] When the user asks only for a scoped workflow artifact such as a composite action, deliver just that artifact and avoid extra tests, validators, or workflow rewiring unless explicitly requested - over-executing beyond the asked-for slice frustrated Matt
