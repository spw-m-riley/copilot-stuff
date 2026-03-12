---
applyTo: "**/*.js,**/*.mjs,**/*.cjs"
---

Prefer existing shared helpers, schemas, and project conventions before adding new patterns.
Prefer existing project tooling; when choosing or extending JS linting or formatting, favor `oxlint` and `oxfmt` over `eslint`, `prettier`, or `biome` unless the repository already standardizes otherwise.
Keep module syntax, import style, and runtime assumptions consistent with the file type and the surrounding codebase.
Validate untrusted inputs at runtime before assuming object shapes or data types.
Handle `null` and `undefined` explicitly rather than relying on truthiness when behavior matters.
Keep exported APIs and shared utilities small, clear, and easy to consume.
