---
applyTo: "**/*.js,**/*.mjs,**/*.cjs"
---

Prefer existing shared helpers, schemas, and project conventions before adding new patterns.
Prefer existing project tooling; when choosing or extending JS linting or formatting, favor `oxlint` and `oxfmt` over `eslint`, `prettier`, or `biome` unless the repository already standardizes otherwise.
Keep module syntax, import style, and runtime assumptions consistent with the file type and the surrounding codebase.
Validate untrusted inputs at runtime before assuming object shapes or data types.
Handle `null` and `undefined` explicitly rather than relying on truthiness when behavior matters.
Keep exported APIs and shared utilities small, clear, and easy to consume.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [JAVASCRIPT] When validating Markdown structure in JS tooling, match actual heading lines and ignore fenced code blocks with correctly paired fence delimiters - substring searches create false positives from prose and mismatched fence handling creates false negatives
2. [JAVASCRIPT] When matching Markdown headings in JS validators, treat lines indented by 4 or more spaces as code blocks, not headings - otherwise indented examples can incorrectly satisfy required-heading checks
3. [JAVASCRIPT] When matching CommonMark ATX headings in JS validators, accept optional closing hashes on heading lines - exact string equality rejects valid headings that users or formatters may write as `## heading ##`
