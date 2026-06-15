# Persona routing

Use this reference when a review needs a specialist lens beyond the base code-review workflow. This file maps only to real local agents in `agents/`.

The valid `persona_routes[].agent` values, in schema order, are:

- `implementation-planner`
- `typescript-api-test-generator`
- `ci-migration-orchestrator`
- `web-research-analyst`

## Routing policy

- Start with the base review workflow yourself.
- Add specialist personas only when the finding depends on a lens the base pass cannot confidently supply.
- Record every specialist route in `persona_routes[]` on the affected finding.
- Prefer one targeted specialist over broadcasting to all agents.

## Always-on vs conditional specialists

| Agent | Mode | Trigger | What the specialist checks |
| --- | --- | --- | --- |
| [`implementation-planner`](../../../agents/implementation-planner.agent.md) | `always_on` for `broad` diffs; otherwise `conditional` | Multi-surface changes, architecture coupling, rollout risk, or unclear next-action cost | Structural risk, boundary changes, rollback impact, and whether the change bundles too much risk together |
| [`typescript-api-test-generator`](../../../agents/typescript-api-test-generator.agent.md) | `conditional` | TypeScript APIs, handlers, Lambda paths, serialization, auth, or missing runtime coverage | Whether the finding needs stronger runtime-test evidence or a sharper edge-case read |
| [`ci-migration-orchestrator`](../../../agents/ci-migration-orchestrator.agent.md) | `conditional` | GitHub Actions, CI migration, cache, artifact, permissions, or deployment workflow diffs | Workflow parity, rollout risk, secret/permission implications, and phased-cutover concerns |
| [`web-research-analyst`](../../../agents/web-research-analyst.agent.md) | `conditional` | Claims that hinge on external docs, vendor behavior, SDK contracts, or prior art | Whether the cited external contract really supports the finding |

## Example routing choices

| Review situation | Route |
| --- | --- |
| Large refactor spans handler code, infrastructure wiring, and rollout steps | `implementation-planner` as `always_on` |
| TS request validation changed and the finding depends on missing runtime coverage | `typescript-api-test-generator` |
| Workflow diff changes OIDC, caches, and release sequencing | `ci-migration-orchestrator` |
| Finding depends on a cloud-provider or SDK behavior claim | `web-research-analyst` |

## Non-routes

Do not route when:

- the concern is already proven by the local diff alone,
- the specialist would only restate the same evidence,
- or the task has shifted from review to implementation or comment resolution.
