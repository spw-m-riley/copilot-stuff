# Validator pass contract

Use this reference after drafting findings. The validator is a second-pass reviewer whose job is to confirm or dispute the existing findings set, not to restart the whole review from scratch.

## Which validator mode to use

| Mode | Use when | Expected output |
| --- | --- | --- |
| `code-review` | The question is mostly diff-local and benefits from a fast, high-signal pass. | Per-finding `confirmed` or `rejected` plus short notes. |
| `general-purpose` | The findings depend on broader repo context, subtle reasoning, or cross-file interactions. | Same JSON-only verdict shape, with more explanation in `notes`. |
| manual self-check | Tooling or environment makes subagent validation impractical. | Update `validator.status` carefully and say validation was manual. |

## Validator prompt template

```text
You are validating an existing structured code review. Do not invent new findings.

Inputs:
- review target: <diff / PR / branch / patch>
- review scope notes: <focused|mixed|broad plus caveats>
- findings JSON: <current findings object>
- requested checks: confirm or reject each finding based only on the supplied evidence and any directly necessary repo context

Rules:
1. Output JSON only.
2. Keep the same finding IDs.
3. For each finding, return one status: confirmed, rejected, or needs_more_proof.
4. Do not add a new finding ID.
5. If the finding is too weak, say what proof is missing.
6. If there are zero findings, return a clean verdict only if you agree the reviewed surface is clear.
```

## Suggested validator response shape

```json
{
  "validator_status": "confirmed_findings",
  "findings": [
    {
      "id": "F001",
      "status": "confirmed",
      "notes": "The fallback is unreachable after the new early return."
    }
  ]
}
```

## Merge rules back into the main findings artifact

- Map `confirmed` to `validator.status: confirmed`.
- Map `rejected` to `validator.status: rejected` and either remove the finding or explain why it remains `needs_more_proof`.
- If every finding is rejected and no new evidence appears, prefer removing weak findings over keeping noisy ones.
- If there are no findings and the validator agrees, set `summary.validator_status: clean`.

## Guardrails

- Never let the validator expand scope into a fresh exploratory review.
- Never report validator output as final if it is not JSON-decidable.
- Never keep a high-confidence finding after the validator clearly rejects its core premise.
