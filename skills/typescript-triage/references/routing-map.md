# TypeScript routing map

Reference for the `typescript-triage` entry skill. Use this when symptom descriptions are ambiguous or when multiple skills could apply.

## Decision tree

### Step 1 — Is `tsc` currently failing?

- **Yes, burst of errors after a refactor, upgrade, or strict-flag addition** → [`tsc-error-triage`](../../tsc-error-triage/SKILL.md)
- **Yes, module resolution or config-related failures** → [`tsconfig-hardening`](../../tsconfig-hardening/SKILL.md)
- **Yes, after enabling `composite` or adding project references** → [`project-references-migration`](../../project-references-migration/SKILL.md)
- **No errors, but code quality work is needed** → continue to Step 2

### Step 2 — What kind of type work is requested?

| Task description | Route to |
| --- | --- |
| Remove or replace `any` in application code | [`typescript-any-eliminator`](../../typescript-any-eliminator/SKILL.md) |
| Validate untrusted JSON, request bodies, or stored records | [`schema-boundary-typing`](../../schema-boundary-typing/SKILL.md) |
| Add compile-time tests for a type contract or regression | [`type-test-authoring`](../../type-test-authoring/SKILL.md) |
| Clean up `tsconfig`, enable stricter flags | [`tsconfig-hardening`](../../tsconfig-hardening/SKILL.md) |
| Set up project references across packages | [`project-references-migration`](../../project-references-migration/SKILL.md) |

## Common skill sequences

These are the typical multi-skill flows. Use them when a single routing is not enough:

| Sequence | When to use |
| --- | --- |
| `tsconfig-hardening` → `tsc-error-triage` | Config change causes new compiler errors |
| `typescript-any-eliminator` → `schema-boundary-typing` | Removing `any` exposes an unvalidated external input |
| `schema-boundary-typing` → `type-test-authoring` | Boundary is now typed; lock it with compile-time tests |
| `project-references-migration` → `tsc-error-triage` | References added but source-level errors remain |
| `tsc-error-triage` → `tsconfig-hardening` | Fixing errors reveals a config root cause |

## Re-routing signals

These patterns indicate the wrong specialist skill was chosen and routing should change:

- `tsc-error-triage` finds that all errors trace to a tsconfig setting → re-route to `tsconfig-hardening`
- `typescript-any-eliminator` finds the `any` is at an external input boundary → route that boundary to `schema-boundary-typing`
- `tsconfig-hardening` triggers a large burst of new errors → pause config work and route to `tsc-error-triage`
- `project-references-migration` surfaces source-level failures unrelated to the reference graph → route those to `tsc-error-triage`
