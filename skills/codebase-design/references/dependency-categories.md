# Dependency categories

Use this reference to classify a module's dependencies before deciding where a seam is needed. Not every dependency needs to be abstracted behind an interface — only the categories where substitution or isolation genuinely matters.

## Categories

- **Stable/pure dependencies** — standard library calls, pure functions, well-understood language features. No seam needed; these are safe to depend on directly everywhere.
- **Volatile external dependencies** — network calls, databases, filesystems, clocks, random sources, third-party APIs. These almost always deserve a seam (an interface plus at least one adapter), because they are the dependencies that are slow, flaky, or impossible to control deterministically in a test — this is the same boundary category `test-driven-development`'s boundary-mocking guidance mocks.
- **Internal collaborators** — other modules within the same codebase that are stable, cheap, and deterministic to call directly. These usually do not need a seam of their own; wrapping every internal collaborator in an interface "just in case" is the speculative-generality smell, not good design.
- **Cross-cutting/policy dependencies** — logging, feature flags, configuration, authorization checks. These often deserve a narrow seam even though they feel like "just infrastructure," because tests frequently need to observe or control them (assert something was logged, flip a flag) without wiring up the full real system.
- **Vendored/frozen dependencies** — a dependency intentionally pinned or vendored because upgrading it is high-risk or out of scope. Note this explicitly when it appears in an audit (`improve`) so a "why is this old?" finding doesn't get raised without the context that it was a deliberate choice.

## Using this in practice

1. When adding a new module, sort its dependencies into these categories before deciding what to abstract. Only volatile-external and cross-cutting/policy dependencies default to needing a seam; stable/pure and internal-collaborator dependencies default to being called directly.
2. When `systematic-debugging` reaches a confirmed root cause with no correct seam to apply a fix, check whether the offending dependency is actually a volatile-external or cross-cutting dependency that was never given a seam — that is usually the missing boundary to add before the fix can land cleanly.
3. When `code-review` or `improve` flags excessive mocking in tests, cross-check the mocked dependency against this list — mocking an internal collaborator that belongs in the "internal collaborators" category is itself the finding, not a reason to add more abstraction.
