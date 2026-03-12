---
applyTo: "**/*.{yml,yaml}"
---

Keep YAML focused on clear structured data, not embedded logic or shell-heavy indirection.
Prefer existing schema shape, key naming, and repository conventions before introducing new patterns.
Prefer existing project tooling; when formatting YAML, favor `oxfmt` over `prettier` or `biome` unless the repository already standardizes otherwise.
Use anchors and aliases sparingly; only reuse them when they make repeated structure clearer rather than harder to scan.
Be explicit about booleans, strings, nulls, and multiline blocks when type or parsing behavior matters.
Keep environment-specific values, secret references, and generated data easy to identify and trace.
