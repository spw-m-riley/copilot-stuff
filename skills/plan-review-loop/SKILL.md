---
name: plan-review-loop
description: "Use when a completed /plan needs explicit multi-reviewer approval and refinement before implementation begins."
disable-model-invocation: true
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# Plan review loop

Use this skill to run structured plan reviews after `/plan` completes, with customizable reviewer personas and explicit approval gates.

## Use this skill when

- A `/plan` is complete and you want reviewers (Jason and Freddy by default) to analyze it before implementation begins
- A plan was revised after reviewer feedback and needs another structured approval round
- You want documented approval gates with explicit verdict tokens before committing to an implementation
- You need feedback from implementation-risk and architectural-risk perspectives on the same plan

## Do not use this skill when

- You do not yet have a completed `/plan` to review (use `/plan` first)
- You need ad-hoc human review outside the structured skill workflow (do that separately)
- The decision is already made and the plan is final (no review needed)

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| A finished plan needs structured multi-reviewer approval before implementation | Yes | — |
| You want stress-testing of a design and CONTEXT.md updated, or fast informal critique without a full review loop | No | [`grill`](../grill/SKILL.md) |
| The plan is already approved and implementation has started | No | proceed with implementation |

## Inputs to gather

**Required**

- A completed `/plan` output from the current session

**Optional**

- Custom reviewer personas (default: Jason and Freddy) defined in `references/personas/`
- Prior reviewer feedback to incorporate if re-invoking for another round

## First move

1. After `/plan`, invoke explicitly: `Use the /plan-review-loop skill to review and refine the current plan`.
2. Collect reviewer verdict tokens: `[PLAN-APPROVED]` or `[PLAN-REVISE-NEEDED]`.
3. Unanimous same-round approval means ready; any revise token means update and rerun.
4. Stop at 3 rounds if unanimous approval is not reached.

## Workflow

1. Invoke after `/plan` finishes.
2. Run one review round across configured reviewers (Jason/Freddy by default).
3. Parse exact verdict tokens.
4. Decide: unanimous approve in same round → proceed; any revise token → revise and rerun; after round 3 without unanimity → stop and decide next step outside skill.
5. Optionally customize reviewers in `references/personas/*.md`.

## Outputs

- A same-round approval decision with exact reviewer verdict tokens.
- A revised plan request when any reviewer returns `[PLAN-REVISE-NEEDED]`.
- A max-rounds handoff when three review rounds complete without unanimous approval.

## Guardrails

- Do not modify the plan yourself between rounds; the skill parses reviewer tokens to determine completion status
- Do not exceed 3 review rounds without explicit decision outside this skill
- Verdict tokens are case-sensitive and exact: `[PLAN-APPROVED]` and `[PLAN-REVISE-NEEDED]` only
- Missing, malformed, or ambiguous tokens (multiple tokens in one response) block approval
- All configured reviewers must return a verdict in the same round for unanimous approval

## Validation

The skill validates successfully when:

- All persona files in `references/personas/` conform to the schema documented in `references/personas/README.md`
- Verdict tokens (`[PLAN-APPROVED]` / `[PLAN-REVISE-NEEDED]`) are preserved unchanged and exactly matched
- The round logic enforces a 3-round maximum and unanimous same-round approval requirement

- Smoke test:
  - should trigger: "Use Jason and Freddy to review this finished /plan before implementation."
  - should not trigger: "Stress-test this design and update CONTEXT.md as we go." (→ `grill`)

## Examples

- "Use Jason and Freddy to review this finished `/plan` before implementation."
- "Re-run plan review after I revised rollback and validation details."
- "Add `references/personas/alice.md` and run the loop with Alice included."

## Reference files

- [`references/personas/README.md`](references/personas/README.md) — persona schema, YAML frontmatter, and customization guide
- [`references/review-contract.md`](references/review-contract.md) — detailed verdict tokens, round rules, and approval criteria
- [`references/personas/jason.md`](references/personas/jason.md) — Jason persona (implementation/execution focus)
- [`references/personas/freddy.md`](references/personas/freddy.md) — Freddy persona (architecture/risk focus)
- [`assets/smoke-test-prompts.md`](assets/smoke-test-prompts.md) — manual validation scenarios (5 test cases: approve, revise, mixed, max-rounds, persona-swap)
