# Findings artifact schema

Use this reference when creating or validating the structured output for the `code-review` skill. The canonical machine contract lives in [`../assets/findings.schema.json`](../assets/findings.schema.json); this file explains how to populate it consistently.

## Root object

| Field | Required | Meaning |
| --- | --- | --- |
| `schema_version` | Yes | Fixed string: `1.0` for the current local contract. |
| `review_target` | Yes | What was reviewed: diff, pull request, branch, patch, or worktree. |
| `summary` | Yes | Overall verdict and high-level counts for the review. |
| `findings` | Yes | Array of evidence-backed findings. Empty array is allowed for a clean review. |

## `review_target`

| Field | Required | Notes |
| --- | --- | --- |
| `kind` | Yes | One of `diff`, `pull_request`, `branch`, `patch`, `worktree`. |
| `label` | Yes | Human-readable identifier such as `PR #42` or `auth-fix.diff`. |
| `repository` | No | Repository or package label when useful in a cross-repo workflow. |
| `base_ref` | No | Base branch, commit, or tag used to frame the review. |
| `head_ref` | No | Head branch, commit, or patch label used to frame the review. |

## `summary`

| Field | Required | Notes |
| --- | --- | --- |
| `verdict` | Yes | `approve`, `revise`, or `blocked`. |
| `scope_classification` | Yes | Overall review breadth: `focused`, `mixed`, or `broad`. |
| `finding_count` | Yes | Integer count of the entries in `findings`. Keep it in sync manually. |
| `validator_status` | No | `not_run`, `clean`, `confirmed_findings`, or `disputed_findings`. |
| `notes` | No | Brief summary of clean areas, known limits, or why the verdict is blocked. |

## Finding object

Each entry in `findings` represents one concrete issue or concern.

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Stable reviewer-local identifier such as `F001`. |
| `title` | Yes | Short statement of the issue. |
| `category` | No | Free-form grouping like `correctness`, `security`, `testing`, or `ci`. |
| `severity` | Yes | `critical`, `high`, `medium`, or `low`. |
| `confidence` | Yes | One of `0`, `25`, `50`, `75`, `100`; see [`confidence-and-evidence.md`](confidence-and-evidence.md). |
| `summary` | No | One or two sentences explaining impact. |
| `diff_scope` | Yes | Per-finding ownership of the reviewed surface. |
| `locations` | Yes | Concrete file/line pointers for where the concern lives. |
| `recommendation` | Yes | `fix_now`, `defer`, `accept_risk`, or `needs_more_proof`. |
| `owner` | No | Team, subsystem, or role likely to own the fix. |
| `evidence` | Yes | One or more proof items backing the claim. |
| `validator` | Yes | Status from the second-pass validator. |
| `persona_routes` | No | Optional specialist-agent routes used to confirm or extend the finding. |

## Nested objects

### `diff_scope`

| Field | Required | Notes |
| --- | --- | --- |
| `classification` | Yes | `primary`, `secondary`, or `pre-existing`. |
| `rationale` | Yes | One sentence for why the issue belongs to that class. |

### `locations[]`

| Field | Required | Notes |
| --- | --- | --- |
| `path` | Yes | Repo-relative path when possible. |
| `line_start` | No | First relevant line number. |
| `line_end` | No | Last relevant line number. |

### `evidence[]`

| Field | Required | Notes |
| --- | --- | --- |
| `kind` | Yes | `diff`, `code`, `test`, `build`, `docs`, `spec`, or `runtime`. |
| `excerpt` | Yes | Short quote or paraphrase of the supporting proof. |
| `path` | No | File or artifact path for the evidence. |
| `line_start` | No | Start line for the excerpt when known. |
| `line_end` | No | End line for the excerpt when known. |

### `validator`

| Field | Required | Notes |
| --- | --- | --- |
| `status` | Yes | `not_run`, `clean`, `confirmed`, or `rejected`. |
| `agent` | No | `code-review`, `general-purpose`, or `manual`. |
| `notes` | No | Short validator explanation or disagreement note. |

### `persona_routes[]`

| Field | Required | Notes |
| --- | --- | --- |
| `agent` | Yes | One of `implementation-planner`, `typescript-api-test-generator`, `ci-migration-orchestrator`, or `web-research-analyst` from [`persona-routing.md`](persona-routing.md). |
| `mode` | Yes | `always_on` or `conditional`. |
| `reason` | Yes | Why the specialist view was used. |

## Minimal clean review example

```json
{
  "schema_version": "1.0",
  "review_target": {
    "kind": "pull_request",
    "label": "PR #42"
  },
  "summary": {
    "verdict": "approve",
    "scope_classification": "focused",
    "finding_count": 0,
    "validator_status": "clean",
    "notes": "Primary auth changes reviewed; no evidence-backed defects found."
  },
  "findings": []
}
```

## Populated finding example

```json
{
  "id": "F001",
  "title": "Nil response path skips error handling",
  "category": "correctness",
  "severity": "high",
  "confidence": 75,
  "summary": "The new early return bypasses the existing fallback and can surface an empty response.",
  "diff_scope": {
    "classification": "primary",
    "rationale": "The issue is introduced directly by the changed branch in this diff."
  },
  "locations": [
    {
      "path": "src/handler.ts",
      "line_start": 48,
      "line_end": 52
    }
  ],
  "recommendation": "fix_now",
  "evidence": [
    {
      "kind": "diff",
      "excerpt": "The new guard returns before the fallback branch runs.",
      "path": "src/handler.ts",
      "line_start": 48,
      "line_end": 52
    }
  ],
  "validator": {
    "status": "confirmed",
    "agent": "code-review",
    "notes": "Second pass agreed that the fallback is now unreachable."
  }
}
```
