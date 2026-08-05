---
description: 'Guidance for JavaScript files in this workspace'
applyTo: "**/*.js,**/*.mjs,**/*.cjs"
---

# JavaScript guidance

## Guidance

- Prefer existing project tooling; when choosing or extending JS linting or formatting, favor `oxlint` and `oxfmt` over `eslint`, `prettier`, or `biome` unless the repository already standardizes otherwise.
- Keep module syntax, import style, and runtime assumptions consistent with the file type and the surrounding codebase.
- Validate untrusted inputs at runtime before assuming object shapes or data types.
- Handle `null` and `undefined` explicitly rather than relying on truthiness when behavior matters.
- Run the repository's standard lint, test, and runtime validation commands for the touched JavaScript surface.
- Prefer syntax checks or extension-runtime validation over bare Node import probes when the runtime injects dependencies that plain Node does not provide.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->

1. [JAVASCRIPT] When validating Markdown structure in JS tooling, match actual heading lines and ignore fenced code blocks with correctly paired fence delimiters - substring searches create false positives from prose and mismatched fence handling creates false negatives
2. [JAVASCRIPT] When matching Markdown headings in JS validators, treat lines indented by 4 or more spaces as code blocks, not headings - otherwise indented examples can incorrectly satisfy required-heading checks
3. [JAVASCRIPT] When matching CommonMark ATX headings in JS validators, accept optional closing hashes on heading lines - exact string equality rejects valid headings that users or formatters may write as `## heading ##`
4. [JAVASCRIPT] When building SQLite FTS queries in JS, strip punctuation like hyphens and slashes down to plain alphanumeric tokens before issuing `MATCH` - leaving operator-like punctuation in the query can turn search terms into malformed expressions and trigger runtime SQL errors such as `no such column`
5. [JAVASCRIPT] When migrating SQLite schemas in JS, add new columns to existing tables before creating indexes or running queries that reference them - `CREATE TABLE IF NOT EXISTS` does not retrofit old tables, so index creation can fail with `no such column` during live migrations
15. [JAVASCRIPT] When deduping JS records that carry both `last_seen_at` and `updated_at`, compare the freshest timestamp across both fields for every candidate instead of trusting `last_seen_at` alone - older explicit last-seen values can otherwise mask newer updates during migrations or merge passes
16. [JAVASCRIPT] When mechanically rewriting large JS source ranges, do not locate function boundaries by raw brace counting over source text; use explicit sentinel lines or AST/range data instead - braces inside strings and object literals can terminate a text scan early and corrupt the rewrite
17. [JAVASCRIPT] When a Node.js test suite in this workspace exercises temp-home or DB-backed fixtures through shared runtime helpers, disable suite concurrency explicitly before trusting failures or fixes - the backfill-controlled tests only behaved deterministically once the suite opted out of node:test parallel scheduling
18. [JAVASCRIPT] Avoid JSON import assertions in standalone `.mjs` helper scripts that need to run across local and GitHub Actions Node versions; use `fs.readFileSync` with `JSON.parse` instead - Node 24 rejected `import packageJson from './package.json' assert { type: 'json' }` during workflow-helper smoke validation
20. [JAVASCRIPT] When a Markdown validator requires named structural headings, enforce exactly one occurrence of each required heading rather than presence alone - duplicated routing sections passed the skill validator until uniqueness became part of the contract
21. [JAVASCRIPT] When joining request paths onto a validated URL in JavaScript, never construct a new URL from a string that can begin with `//`; assign a normalized pathname or otherwise guarantee a single leading slash, because a root base path plus `/endpoint` can become a protocol-relative URL and silently replace the validated host - the Lore local-inference review reproduced a loopback base URL escaping to `http://chat/completions`
24. [WORKFLOW] Always honor the active `.fallowrc` scope, especially `ignorePatterns`, before choosing JavaScript or TypeScript analysis targets or remediation plans - this workspace explicitly keeps some extension surfaces out of root health analysis
25. [WORKFLOW] When making non-trivial JavaScript or TypeScript changes in a repo where Fallow is available, run a Fallow maintainability pass (`health`, and `dupes` or `dead-code` as relevant) before calling the slice maintainable - this session caught real hotspots only after Fallow was added to the validation loop
26. [WORKFLOW] Never run repository health analyzers like `fallow health` in parallel with tests that scaffold or generate workspace files; wait for mutating tests to finish so the analysis reflects steady-state contents
27. [WORKFLOW] When adding local audit configuration for tools like Knip or Fallow, include each repo's real runtime or framework entrypoints instead of relying only on broad project globs - entrypoint-aware configs produce more accurate audit output
