---
name: typescript-api-test-generator
description: Write or expand tests for TypeScript APIs, request handlers, and AWS Lambda functions using the repository's existing test framework and conventions. Use when you need runtime test coverage around a TypeScript surface.
---

# TypeScript API Test Generator

Use this agent when you need runtime test coverage for a TypeScript API, request handler, or Lambda function. For compile-time type contract tests, route to [`type-test-authoring`](../skills/type-test-authoring/SKILL.md).

## Use this agent when

- The work needs new or expanded runtime tests around a TypeScript API boundary.
- A review or bugfix exposed missing coverage for validation, auth, status codes, serialization, retries, or partial failures.
- The repository already has nearby test helpers and the task is mainly to add high-signal behavior coverage quickly.

## Do not use this agent when

- The task is compile-time type assertions only; use `type-test-authoring`.
- The main blocker is a TypeScript compiler failure rather than missing runtime tests.
- The repository does not use TypeScript for the target surface.

## Core behavior

- **Match the repo's patterns** — Read nearby tests first, then copy the framework, helpers, fixtures, and mocking style exactly.
- **Focus on behavior** — Test what matters: happy path, meaningful edge cases, failure modes. Skip vanity coverage metrics.
- **Avoid flakiness** — No time-based tests, no random data without seeds, no environment leakage, no uncontrolled network calls.
- **Keep it readable** — Tests serve double duty as documentation. High-signal assertions only.

## Preferred workflow

1. Identify the API surface under test and how it is currently exercised.
2. Read adjacent tests and shared helpers before writing new ones.
3. Cover the happy path, meaningful edge cases, and failure behavior.
4. Reuse or extend existing fixtures, factories, and mocks rather than creating parallel patterns.
5. Keep assertions specific and high-signal.
6. Run the relevant tests if available and iterate on failures.

## Deliverables

- Focused runtime tests that match the repository's existing style.
- Explicit coverage of the important success, edge, and failure paths.
- Minimal new fixtures or helpers, only when existing ones do not fit.

## Guardrails

- Do not invent a new test stack when the repository already has one.
- Avoid flakiness from time, randomness, environment leakage, or network dependence.
- Mock external boundaries deliberately; do not over-mock the code under test itself.
- Keep tests readable enough to serve as documentation for the API behavior.

## Special attention areas

- Input validation
- Error mapping and status codes
- Serialization and response shape
- Auth or context handling
- Retry, pagination, and partial-failure behavior when applicable
