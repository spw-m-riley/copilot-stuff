---
applyTo: "**/.github/workflows/*.{yml,yaml}"
---

- Keep workflows explicit, deterministic, and easy to scan.
- Prefer existing repository patterns, reusable workflows, and trusted actions before adding bespoke job graphs or large inline shell scripts.
- Set `permissions` deliberately and keep them as narrow as the workflow needs.
- Keep triggers, path filters, concurrency, caching, and matrix expansion intentional so workflows only run when they should.
- Keep job names, runner choices, and step boundaries clear; extract repeated logic rather than duplicating it across jobs.
- Run `actionlint` against all changed workflows and fix any issues it finds

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [ACTIONS] When a packaging job writes build artifacts into a subdirectory (e.g. `iac/tf/.assets-web-app`) and then uploads them with `upload-artifact`, the `path` in the upload step must match the exact directory the job wrote to — not a parent directory. Verify staging paths end-to-end across package and deploy jobs; a mismatch (e.g. uploading `artifact-staging/iac/tf/.assets-*` when the job staged to `artifact-staging/.assets-*`) silently produces empty artifacts and causes downstream apply jobs to fail with missing plan files.
2. [ACTIONS] Always verify which workflow or run actually deployed a commit before inferring the pipeline from repository files or historical patterns - the same commit can be deployed through a different active workflow than the legacy config suggests
3. [ACTIONS] When fixing SPW GitHub Actions workflows, search for the relevant shared workflow or shared action first instead of replacing repository setup with bespoke workflow steps just because another repo provides a superficial example - the user explicitly corrected a move toward custom `setup-node` steps and pointed to shared Node setup instead
