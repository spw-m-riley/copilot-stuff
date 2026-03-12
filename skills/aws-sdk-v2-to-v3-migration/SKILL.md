# AWS SDK v2 to v3 migration

Use this skill when migrating JavaScript or TypeScript code from AWS SDK v2 to AWS SDK v3.

## Focus

- Replace v2 service clients with modular v3 clients and commands.
- Update imports, construction patterns, and call sites safely.
- Preserve behavior around pagination, retries, errors, and credential usage.

## Workflow

1. Inventory all `aws-sdk` v2 imports and the services in use.
2. Group changes by service so imports and call sites stay coherent.
3. Replace `new AWS.Service()` usage with the corresponding v3 client.
4. Replace method calls with `client.send(new Command(...))`.
5. Update mocks and tests to fit the new client and command model.
6. Validate pagination, streaming, marshalling, and error handling where used.

## Guardrails

- Do not mix v2 and v3 patterns in the same migrated surface unless there is a temporary staged migration plan.
- Preserve region, credentials, endpoint, and retry configuration explicitly.
- Prefer incremental service-by-service migrations when the surface area is large.
- Validate changed code with existing tests or targeted checks before declaring the migration done.
