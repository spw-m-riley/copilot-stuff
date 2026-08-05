---
name: api-smoke-validation
description: "Use when API endpoints need hurl smoke tests for auth, status, or response-shape regressions and hurl is already in use in the repository."
disable-model-invocation: true
metadata:
  category: testing
  audience: general-coding-agent
  maturity: stable
  kind: task
---

# API smoke validation

Use this skill when you need fast, scriptable API smoke checks with `hurl` so endpoint regressions are caught immediately after a change. This skill only runs when explicitly invoked: this config repo has no API endpoints or `.hurl` fixtures of its own, so there is no in-repo evidence to justify implicit routing in an arbitrary target repository. Confirm `hurl` is installed (or the target repo already has `.hurl` files) before treating this as the right tool.

## Use this skill when

- The user explicitly asks for hurl-based API smoke checks, or the target repository already has `.hurl` files in use.
- You changed API handlers, routing, auth checks, or request/response shaping and confirmed `hurl` is available.
- You need a minimal, repeatable request suite that verifies critical paths quickly.
- A branch needs confidence in endpoint health before heavier integration coverage.
- Existing hurl files can be reused or small targeted ones can be added.

## Do not use this skill when

- `hurl` is not installed and the repository has no existing `.hurl` files, and the user has not explicitly asked to add hurl as a new dependency.
- The task is full contract testing, load testing, or deep integration test design.
- There is no runnable API target environment for smoke requests.
- The request is non-HTTP validation unrelated to endpoint behavior.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| Quick endpoint sanity checks after API changes | Yes | - |
| Full behavior change requiring TDD-first feature implementation | No | `test-driven-development` |
| Non-HTTP pipeline or CI troubleshooting with failing workflow jobs | No | `github-actions-failure-triage` |

## Inputs to gather

- Base URL and target environment for smoke execution.
- Critical endpoints and methods to validate.
- Required auth mode (token, API key, session cookie) and safe test credentials.
- Expected response status, key headers, and minimal body assertions.

## First move

1. Confirm `hurl` is installed (`hurl --version`) or the repository already has `.hurl` files; if neither is true, stop and confirm with the user before adding a new dependency.
2. Select the smallest endpoint set that represents service health and changed behavior.
3. Write or update targeted `hurl` requests with explicit assertions.
4. Run the smoke file and capture first failure before broadening coverage.

## Workflow

1. Identify must-pass paths (for example health check, core read, core write, auth-protected endpoint).
2. Create or update `hurl` scenarios with deterministic inputs and explicit assertions:
   - status code
   - critical headers
   - minimal response body checks
3. Parameterize environment-specific values through variables or env files.
4. Run `hurl` for the targeted suite and fix the smallest API issue exposed.
5. Re-run until smoke requests are stable.
6. If failures are environment/setup related, report the blocker and keep test artifacts reusable.

## Outputs

- Focused `hurl` smoke scenarios tied to changed API surfaces.
- Failure evidence and minimal fixes applied.
- Repeatable command for local or CI smoke execution.

## Guardrails

- Do not hardcode sensitive credentials in hurl files.
- Keep assertions specific enough to catch regressions but stable enough to avoid noise.
- Avoid turning smoke coverage into a full end-to-end suite in this skill.
- Prefer deterministic fixtures and idempotent requests where practical.

## Validation

- Smoke suite passes against the intended target environment.
- Assertions cover changed behavior and core health paths.
- Relevant repository checks for touched files still pass.

- Smoke test:
  - should trigger: "Add hurl smoke checks for POST /orders after auth changes."
  - should not trigger: "Write full behavior tests for the orders API." (→ `test-driven-development`)

## Examples

- "After auth middleware changes, add hurl smoke checks for unauthenticated vs authenticated responses on `/v1/profile`."
- "Validate `POST /orders` and `GET /orders/:id` with hurl after request-body validation changes, keeping checks minimal and repeatable."

## Reference files

- [`references/hurl-smoke-patterns.md`](references/hurl-smoke-patterns.md) - practical request/assertion patterns for stable smoke coverage
