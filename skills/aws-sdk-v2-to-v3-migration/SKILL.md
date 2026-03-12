---
name: aws-sdk-v2-to-v3-migration
description: Migrate JavaScript or TypeScript code from AWS SDK v2 to AWS SDK v3 safely and incrementally.
metadata:
  category: migrations
  audience: general-coding-agent
  maturity: stable
---

# AWS SDK v2 to v3 migration

## Use this skill when

- The user asks to migrate `aws-sdk` v2 usage to the modular v3 packages.
- You find v2 patterns such as `import AWS from 'aws-sdk'`, `require('aws-sdk')`, or `new AWS.S3()`.
- The work includes updating tests, mocks, or helpers tied to v2 client behavior.

## Do not use this skill when

- The codebase already uses `@aws-sdk/client-*` packages — it is already on v3.
- The task is about AWS infrastructure or CDK, not SDK client calls.

## Inputs to gather

**Required before editing**
- Which services are in use (S3, DynamoDB, SQS, STS, etc.).
- The module system in use (ESM, CJS) and whether TypeScript is involved.

**Helpful if present**
- Existing config sources for region, credentials, endpoints, retries, and timeouts.
- Custom wrappers, pagination helpers, stream handling, or document marshalling logic.

**Only investigate if encountered**
- Non-standard credential chain or custom endpoint configuration.

## First move

Run a quick inventory before editing any files:

```sh
grep -r "require('aws-sdk')\|from 'aws-sdk'" --include="*.ts" --include="*.js" -l
grep -r "new AWS\." --include="*.ts" --include="*.js" -l
```

List the services found, then start with the smallest self-contained service surface.
Consult [`references/service-mappings.md`](references/service-mappings.md) for the
correct v3 package names and API shapes before writing any code.

## Workflow

1. Inventory all `aws-sdk` v2 imports and the services in use.
2. Group changes by service so imports and call sites stay coherent.
3. Map each v2 client, helper, and API call to the v3 equivalent using the service mappings reference.
4. Install the required `@aws-sdk/client-<service>` packages (and any utility packages such as `@aws-sdk/lib-storage`).
5. Replace `new AWS.Service()` with the corresponding v3 client and explicit configuration.
6. Replace method calls with `client.send(new Command(...))`, preserving input shapes and response handling.
7. Update helpers, mocks, and tests to fit the v3 client-and-command model using the testing mocks reference.
8. Validate pagination, streaming, document marshalling, retries, and error handling where used.

## Guardrails

- **Must** preserve region, credentials, endpoint, and retry configuration explicitly.
- **Must** not mix v2 and v3 patterns in the same migrated surface unless a staged migration plan exists.
- **Should** prefer incremental service-by-service migrations when the surface area is large.
- **Should** not replace typed wrappers with `unknown` or `any` shortcuts just to clear type errors.

## Validation

- Run the existing tests or targeted checks that cover the migrated services.
- Confirm no imports still pull from the v2 `aws-sdk` package on the migrated surface.
- Spot-check real behavior for pagination, streams, uploads, marshalling, and expected error types.

## Examples

- "Migrate this Lambda from `aws-sdk` v2 S3 calls to SDK v3 without changing behavior."
- "Convert our DynamoDB document client helper to AWS SDK v3 and update the tests too."
- "I'm getting type errors after upgrading aws-sdk — help me finish the v3 migration."
- "Update our shared S3 helper and the mocks in the test suite to SDK v3."

## Reference files

- [`references/service-mappings.md`](references/service-mappings.md) — v2→v3 package names, client construction, API call patterns, pagination, DynamoDB DocumentClient, streaming, and error handling.
- [`references/testing-mocks.md`](references/testing-mocks.md) — replacing v2 mock patterns with `@aws-sdk/client-mock`, `jest.spyOn`, or dependency injection.
