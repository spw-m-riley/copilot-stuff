---
name: mocha-to-jest-migration
description: Migrate JavaScript or TypeScript tests from Mocha, Chai, or Sinon to Jest incrementally.
metadata:
  category: migrations
  audience: general-coding-agent
  maturity: stable
---

# Mocha to Jest migration

## Use this skill when

- The repository is moving from Mocha, Chai, or Sinon to Jest.
- You find `describe` and `it` tests using Chai assertions or Sinon stubs that need Jest equivalents.
- The work includes test runner config, setup files, fake timers, spies, or snapshot usage.

## Do not use this skill when

- The test suite already uses Jest — the task is not a migration.
- The ask is to add new tests to an existing Mocha suite without converting it.

## Inputs to gather

**Required before editing**
- The existing Mocha, Chai, and Sinon versions and test bootstrap configuration.
- The repository's current or planned Jest configuration and conventions.

**Helpful if present**
- Any test utilities, global setup, environment assumptions, or module mocking patterns.
- The subset of tests to migrate first and the commands used to run them.

**Only investigate if encountered**
- Non-standard Chai plugins (e.g., `chai-as-promised`, `chai-http`) that need separate handling.

## First move

Inventory what needs to migrate before touching any test files:

```sh
grep -r "require('chai')\|from 'chai'\|require('sinon')\|from 'sinon'" --include="*.ts" --include="*.js" -l
grep -r "require('mocha')\|\.mocharc" --include="*.ts" --include="*.js" --include="*.json" -l
```

Then convert a **single small representative file** first, run it under Jest, and confirm the project's Jest setup works before migrating more files.
Consult [`references/assertion-mapping.md`](references/assertion-mapping.md) and [`references/mock-mapping.md`](references/mock-mapping.md) before rewriting patterns.

## Workflow

1. Identify all Mocha, Chai, and Sinon patterns in use.
2. Convert a small representative file first and verify the project's Jest setup.
3. Replace assertion styles with idiomatic Jest expectations using the assertion mapping reference.
4. Replace mocks, spies, and stubs with Jest equivalents using the mock mapping reference.
5. Convert shared setup and teardown patterns carefully (`before`/`after` → `beforeAll`/`afterAll`, `beforeEach`/`afterEach` stay the same).
6. Update test utilities, config, or setup files only where required for parity.
7. Migrate incrementally and run the relevant tests after each batch.

## Guardrails

- **Must** preserve async behavior, timer behavior, and module mocking semantics explicitly.
- **Must not** do bulk mechanical rewrites without validation — migrate in small batches.
- **Should** keep test names and intent stable unless the user asks for broader cleanup.
- **Should** watch for memory or environment differences in CI after migration.

## Validation

- Run the migrated Jest tests after each batch using the repository's existing commands.
- Confirm fake timers, async failures, setup hooks, and mock reset behavior still match intent.
- Check CI behavior if the migration changes test environment defaults or coverage collection.

## Examples

- "Convert this Mocha and Chai test file to Jest without renaming the test cases."
- "Migrate our Sinon-heavy unit tests to Jest mocks and update the shared setup safely."
- "Help me finish converting our test suite from Mocha to Jest — some files are already done."
- "Replace all chai assertions and sinon stubs in this directory with Jest equivalents."

## Reference files

- [`references/assertion-mapping.md`](references/assertion-mapping.md) — Chai BDD and assert-style assertions mapped to Jest matchers.
- [`references/mock-mapping.md`](references/mock-mapping.md) — Sinon spies, stubs, mocks, fake timers, and sandbox patterns mapped to Jest equivalents.
