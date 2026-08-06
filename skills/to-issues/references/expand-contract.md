# Expand-contract (exception for wide mechanical refactors)

Use this reference only for genuinely wide, mechanical refactors — a rename, type migration, or API signature change that touches many call sites with no behavior change per site. It is a narrow exception to the vertical-slice default in [`slicing-guide.md`](slicing-guide.md), not a replacement for it.

## When this exception applies

- The change is mechanical: the same transformation is applied at every call site (rename a field, widen a type, swap a deprecated API for its replacement), with no per-site product decision to make.
- The change is wide: it touches enough call sites that one vertical slice cannot demo or verify the whole thing meaningfully, and splitting it into per-feature vertical slices would just recreate the same mechanical diff N times with extra coordination overhead.
- There is no way to make the change atomically in one safe step (a single-commit rename across a large codebase would break in-flight work, cross-service contracts, or a rolling deploy).

If the refactor is small enough to land as one vertical slice, or if it bundles real behavior changes alongside the mechanical part, use the normal tracer-bullet slicing instead — do not reach for expand-contract by default.

## The three phases as slices

Break the refactor into three sequential slices instead of one-slice-per-caller:

1. **Expand** — add the new shape (field, type, API) alongside the old one, without removing or changing the old path yet. Both old and new consumers keep working. This slice is almost always `AFK`.
2. **Migrate** — move consumers over to the new shape in dependency order, in batches sized for safe, verifiable review (not necessarily one call site per issue, but grouped by natural boundary: module, service, or package). Each migration batch should still be independently verifiable — tests pass, no behavior change — even though it is not a "vertical" slice in the tracer-bullet sense.
3. **Contract** — remove the old shape once all consumers have migrated and nothing depends on it. This slice's acceptance criterion includes confirming zero remaining references to the old path, not just "the new path works."

## Applying the slicing guide's other rules

- Still mark each phase's issues `AFK` unless a specific migration batch needs a human decision (for example, an external contract that cannot be changed without coordination).
- Still make dependencies explicit: **Contract** always blocks on every **Migrate** slice completing; **Migrate** batches block on **Expand** landing first.
- Still write concrete acceptance criteria per slice, even though the criteria are "no behavior change, tests still pass" rather than a new user-facing outcome.
- Do not silently mix expand-contract issues with vertical-slice issues in the same breakdown without labeling which kind each is — a reviewer approving the breakdown needs to know some issues are intentionally horizontal.
