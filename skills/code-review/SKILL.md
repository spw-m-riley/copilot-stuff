---
name: code-review
description: "Use when asked to review a diff, pull request, branch, or patch with explicit evidence, confidence scoring, validator confirmation, and machine-readable findings output — not when the work is already about resolving existing review comments."
metadata:
  category: code-review
  audience: general-coding-agent
  maturity: draft
  kind: task
---

# Code review

Use this skill when the task is to produce a structured review result for a code change, not just an informal opinion. The workflow stays disciplined: classify scope first, inspect the diff, record only evidence-backed findings, run a validator pass, and return both a concise narrative summary and a JSON findings artifact.

## Use this skill when

- The user asks for a structured review of a diff, patch, branch, worktree, or pull request.
- The output needs explicit severity, confidence, evidence, or a machine-readable findings file.
- The change spans enough files or risk that a scope pass should separate primary changes from pre-existing noise.
- You need a second-pass validator before reporting findings as final.
- A downstream phase may consume the findings as a durable artifact instead of free-form prose.

## Do not use this skill when

- The task is to address existing review comments or GitHub review threads that already exist; route to [`review-comment-resolution`](../review-comment-resolution/SKILL.md).
- The main task is diagnosing a known failing test, runtime error, or incident rather than reviewing a proposed change; route to `systematic-debugging`.
- The request is only to push a branch, update a PR, or wait for checks without reviewing code quality; route to `github-cli-pr-workflow`.
- The user only wants a lightweight thumbs-up or casual summary with no structured findings output.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Structured review of a diff or PR with findings, evidence, and a clear verdict | Yes | - |
| Existing review threads need to be classified, fixed, and pushed | No | [`review-comment-resolution`](../review-comment-resolution/SKILL.md) |
| Known failure needs root-cause debugging before any review verdict matters | No | `systematic-debugging` |
| The next step is PR lifecycle work, not review | No | `github-cli-pr-workflow` |
| Review findings need a durable follow-on contract after the verdict | Pairs | [`workflow-contracts`](../workflow-contracts/SKILL.md) |
| Comparing two or more repositories for parity, gaps, or reference-guided implementation | No | [`cross-repo-diff`](../cross-repo-diff/SKILL.md) |

## Inputs to gather

**Required before reviewing**

- The review target: diff file, pull request number, branch pair, patch, or worktree path.
- The intended review scope and whether the review is read-only or can include fixes.
- The base and head context needed to understand what changed.
- Any repository validation commands that can confirm or weaken a suspected finding.

**Helpful if present**

- Architectural context, acceptance criteria, or plan artifacts for the reviewed change.
- Known hot spots such as auth, CI, data migrations, or test harness changes.
- Prior review notes that are informative but not yet authoritative findings.

**Only investigate if encountered**

- Pre-existing issues outside the authored diff that only matter because the change touches them.
- External documentation or vendor contracts needed to validate a claim.
- Specialist surfaces that benefit from conditional persona routing in [`references/persona-routing.md`](references/persona-routing.md).

## First move

1. Classify the review surface with [`references/diff-scope.md`](references/diff-scope.md) before making any claims.
2. Read the primary diff carefully and open only the supporting context needed to test a suspected issue.
3. Start a provisional findings list using [`assets/findings.schema.json`](assets/findings.schema.json) so every claim is forced into severity, confidence, and evidence fields early.

## Workflow

1. Identify the review target and classify the overall scope as `focused`, `mixed`, or `broad`.
2. Mark each suspicious area as `primary`, `secondary`, or `pre-existing` using [`references/diff-scope.md`](references/diff-scope.md).
3. Review the primary surface first. Prefer correctness, safety, and merge-blocking concerns over style or speculative cleanup.
4. For each possible finding, apply the confidence anchors and evidence rules in [`references/confidence-and-evidence.md`](references/confidence-and-evidence.md) and the shared review mechanics in [`references/shared-review-operations.md`](references/shared-review-operations.md). Drop or downgrade any claim that cannot meet the evidence bar.
5. Record surviving findings in the JSON shape documented by [`references/findings-schema.md`](references/findings-schema.md) and defined by [`assets/findings.schema.json`](assets/findings.schema.json).
6. Route specialist questions only when needed using [`references/persona-routing.md`](references/persona-routing.md), and record that routing on the affected finding.
7. Run a second-pass validator using the prompt contract in [`references/validator-subagent.md`](references/validator-subagent.md). The validator may confirm, reject, or request more proof, but it must not invent an unrelated new finding set.
8. Finalize the review report with:
   - a verdict: `approve`, `revise`, or `blocked`
   - findings sorted by severity then confidence
   - validator status for each finding
   - a concise human summary of the highest-value issues and any clean areas that were explicitly checked

## Outputs

- A findings artifact that matches [`assets/findings.schema.json`](assets/findings.schema.json).
- A human-readable review summary that calls out the verdict, top findings, and any notable scope limitations.
- Per-finding severity, confidence, evidence, diff-scope classification, and validator disposition.
- Conditional persona-routing notes when a local specialist agent was brought in.

## Guardrails

- Do not report a finding without evidence that points to real code, tests, build output, docs, or diff context.
- Do not pad the review with style nits, hypothetical rewrites, or pre-existing issues unless they materially affect the reviewed change.
- Do not let the validator rewrite the review goal; it is a confirmation pass, not a second independent fishing expedition.
- Do not route every review through every specialist. Add specialist personas only when the diff or the claim needs that lens.
- Do not mix implementation work into a read-only review unless the user explicitly changes the task.
- Prefer a smaller set of high-confidence findings over a longer list of weak suspicions.

## Validation

- Run `node skills/skill-authoring/scripts/validate-skill-library.mjs skills/code-review/SKILL.md` after editing the package.
- Parse [`assets/findings.schema.json`](assets/findings.schema.json) with Node to confirm the schema is valid JSON.
- Read the smoke prompts in [`assets/smoke-test-prompts.md`](assets/smoke-test-prompts.md) and confirm the description alone distinguishes trigger vs near-miss requests.
- Confirm every support file under this package is linked from `## Reference files`.

- Smoke test:
  - should trigger: "Review this patch and return a findings JSON with confidence scores and validator confirmation."
  - should not trigger: "Address the open PR review comments, push fixes, and wait for checks." (→ [`review-comment-resolution`](../review-comment-resolution/SKILL.md))

## Examples

- "Review this PR diff in read-only mode, classify findings by severity and confidence, and return a machine-readable findings file plus a short verdict."
- "Use the code-review skill on `changes.diff`, suppress weak suspicions, run a validator pass, and tell me whether this should block merge."
- "Inspect this worktree for correctness and CI risks, route any workflow-specific concerns to the right specialist, and write the findings as JSON."

## Reference files

- [`references/findings-schema.md`](references/findings-schema.md) - field-by-field guidance for the findings artifact and the meaning of each machine-readable field
- [`references/diff-scope.md`](references/diff-scope.md) - how to classify overall review breadth and per-finding ownership of the changed surface
- [`references/confidence-and-evidence.md`](references/confidence-and-evidence.md) - confidence anchors, evidence bars, and suppression rules for weak claims
- [`references/shared-review-operations.md`](references/shared-review-operations.md) - scope-first, evidence-first, and common guardrails shared with review-comment-resolution
- [`references/validator-subagent.md`](references/validator-subagent.md) - second-pass validator prompt and when to use each validator mode
- [`references/persona-routing.md`](references/persona-routing.md) - always-on vs conditional specialist routing mapped only to real local agents
- [`assets/findings.schema.json`](assets/findings.schema.json) - JSON Schema for structured review findings output
- [`assets/smoke-test-prompts.md`](assets/smoke-test-prompts.md) - manual discoverability and routing checks for this skill
