# Mocha to Jest migration

Use this skill when migrating JavaScript or TypeScript tests from Mocha, Chai, or Sinon to Jest.

## Focus

- Translate test structure, assertions, spies, stubs, and hooks.
- Keep behavior equivalent while reducing incidental churn.
- Fit the repository’s existing Jest conventions and CI setup.

## Workflow

1. Identify the Mocha, Chai, and Sinon patterns in use.
2. Convert a small representative file first and verify the project’s Jest setup.
3. Replace assertion styles with idiomatic Jest expectations.
4. Replace mocks, spies, and stubs with Jest equivalents.
5. Convert shared setup and teardown patterns carefully.
6. Migrate incrementally and run the relevant tests after each batch.

## Guardrails

- Avoid bulk mechanical rewrites without validation.
- Preserve async behavior, timer behavior, and module mocking semantics explicitly.
- Keep test names and intent stable unless the user asks for broader cleanup.
- Watch for memory or environment differences in CI after migration.
