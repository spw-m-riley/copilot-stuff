# Metadata contract for local skills

This document defines the canonical frontmatter contract for every skill under `skills/*/SKILL.md`. The validator (`scripts/validate-skill-library.mjs`) encodes the required and forbidden rules mechanically. This file documents the decisions behind them.

## Allowed top-level keys

The following top-level keys are valid in a skill frontmatter block:

| Key | Status | Notes |
| --- | --- | --- |
| `name` | **Required** | Kebab-case, matches the directory name exactly. |
| `description` | **Required** | Single-line YAML string. Minimum 20 characters. Trigger-phrase required. |
| `metadata` | **Required** (block) | Contains all skill lifecycle and classification fields. |
| `disable-model-invocation` | **Optional** | Boolean runtime control. When `true`, the skill remains explicitly user-invoked instead of being selected implicitly by the model. Use for interactive or side-effectful workflows. |

**Any other top-level key is forbidden.** The following keys are explicitly banned because they belong elsewhere:

| Banned key | Why banned | Where it belongs instead |
| --- | --- | --- |
| `argument-hint` | Runtime hint, not skill identity | Reference file or `## Inputs to gather` |
| `compatibility` | Operational detail, not skill identity | Reference file or guardrail |
| `license` | Attribution, not skill identity | Commit message or `PROVENANCE.md` |
| `author` | Attribution, not skill identity | Commit message or `PROVENANCE.md` |
| `inspired-by` | Attribution, not skill identity | Commit message or `PROVENANCE.md` |

## Required `metadata` fields

| Field | Status | Valid values |
| --- | --- | --- |
| `metadata.category` | **Required** | `authoring`, `ci`, `migrations`, `typescript`, `version-control`, `workflow`, or another concise domain label. |
| `metadata.audience` | **Required** | `general-coding-agent` for most skills. Use a more specific value only for narrowly specialized skills. |
| `metadata.maturity` | **Required** | `draft` for new or unvalidated skills; `stable` after smoke-test validation and live use. |
| `metadata.kind` | **Required** | `task` or `reference`. |

### What `metadata.kind` means

- `task` — a multi-step playbook with explicit inputs, outputs, and validation steps. The skill body should include `## Inputs to gather`, `## First move`, `## Workflow`, and `## Outputs`.
- `reference` — lookup-heavy guidance where the main value is navigation, conventions, or examples. Replace the task-specific sections with a concise navigation block and direct links to support files.

## Allowed optional `metadata` fields

Skill-specific behavioral flags may be added under `metadata` as documented optional extensions. Each optional extension must be:

1. Documented here with its name, meaning, and the skill(s) that use it.
2. Validated or checked by the validator when it affects workflow behavior.

| Optional field | Status | Meaning | Used by |
| --- | --- | --- | --- |
| `metadata.reader_testing` | **Documented optional extension** | Signals that reader-testing is a required stage in the skill workflow. Valid value: `required`. | `doc-coauthoring` |

**Do not add arbitrary skill-specific fields** to `metadata` without documenting them here first. If a field applies to only one skill and does not change how the validator or authoring system reasons about the skill, consider moving it to a `references/` file instead.

## Forbidden `metadata` fields

The following `metadata` keys are explicitly banned because they carry upstream provenance rather than local lifecycle information:

| Banned key | Source | Where it belongs instead |
| --- | --- | --- |
| `metadata.github-path` | Upstream awesome-copilot import | Remove. Preserve attribution in a `PROVENANCE.md` or commit message if needed. |
| `metadata.github-ref` | Upstream awesome-copilot import | Remove. |
| `metadata.github-repo` | Upstream awesome-copilot import | Remove. |
| `metadata.github-tree-sha` | Upstream awesome-copilot import | Remove. |
| `metadata.author` | Upstream attribution | Commit message or `PROVENANCE.md`. |
| `metadata.inspired-by` | Upstream attribution | Commit message or `PROVENANCE.md`. |
| `metadata.version` | Upstream versioning | Not needed in local library; use git for history. |
| `metadata.enhancements` | Upstream feature list | Move to `## Reference files` or a `references/` file. |

## Special-case decisions

### Route-target validation and the mention allowlist

The validator checks `## Do not use this skill when` and `## Routing boundary` for two classes of stale routing: a markdown link pointing at a local file that no longer exists, and a bare backtick mention shaped like a skill or agent name (`some-kebab-name`) that does not resolve to `skills/some-kebab-name/SKILL.md` or `agents/some-kebab-name.agent.md`.

Some bare mentions in those sections are deliberately not local skills or agents — a CLI tool name in a "situation" column, or a built-in review capability that is not tracked under `skills/` or `agents/`. Add those to `ROUTE_MENTION_ALLOWLIST` in `scripts/validate-skill-library.mjs` with a short comment explaining why the mention is intentional prose rather than a stale route. Do not add an entry just to silence a genuinely broken route — fix the route instead.

### Entry-point/router skills and the `## Routing boundary` heading

A thin router skill (see [`layering-guide.md`](layering-guide.md#optional-split-decisions)) exists specifically to dispatch to specialist siblings by symptom, so its whole body is already the routing surface. Such a skill may use a domain-named canonical heading instead of a separate `## Routing boundary` section — for example `typescript-triage` uses `## Symptom routing table`. Do not add a second `## Routing boundary` table underneath it purely to match the leaf-skill convention; that would duplicate the same rows for no added clarity.

This is a **documented special case**, not an unvalidated gap: `ROUTE_SECTION_HEADINGS` in `scripts/validate-skill-library.mjs` also lists a router skill's canonical routing heading (currently `## Symptom routing table`), so its links and bare route mentions get the same dangling-reference check as `## Do not use this skill when` and `## Routing boundary`. When a new router skill is added with its own domain-named routing heading, add that heading to `ROUTE_SECTION_HEADINGS` in the same change rather than leaving its routes unchecked.

### Model invocation versus explicit invocation

Implicit model invocation improves discoverability: the skill description can help the model select the skill without the user naming it. That discoverability has a cost, because the description contributes to model context and adds another candidate to routing and cognitive load on every relevant prompt.

Set `disable-model-invocation: true` when deliberate explicit invocation is the safer or clearer contract: for example, the workflow is interactive, side-effectful, unusually noisy, or should not compete for implicit routing. The skill remains available when the user invokes it by name, while its description is kept out of implicit model selection context. Leave the field absent when broad, low-risk discoverability is part of the skill's value.

### Imported skills

Imported skills must follow the same local frontmatter contract as native skills before they are considered complete. There are no active exceptions for upstream provenance keys, extra top-level keys, or multiline descriptions.

**Resolution pattern:** Adopt local `metadata.category`, `metadata.audience`, `metadata.maturity`, and `metadata.kind`; remove forbidden keys; move reusable operational detail into `references/` or `assets/`; preserve provenance outside frontmatter only when explicitly needed.

### `doc-coauthoring`

This skill uses `metadata.reader_testing: required` as a skill-specific behavioral flag.

**Resolution:** This is the accepted pattern for skill-specific behavioral extensions. The field is documented in the optional extensions table above. Future skill-specific flags should follow the same pattern: add to `metadata`, document here, and add a validator check if the field is meaningful to automation.

## Multiline description policy

The description field must be a single-line YAML string. Quoting is recommended when the text contains punctuation that can confuse YAML parsing, but unquoted plain scalars are valid when they parse cleanly. Multiline block scalars (`|-`, `|`, `>-`, `>`) are **not valid** for skill descriptions. Complex trigger conditions that do not fit comfortably on one line belong in `## Use this skill when`, not in the `description` field.

### Colon-in-description gotcha

A YAML mapping value is terminated the moment a strict parser sees `: ` (colon followed by a space) inside an unquoted plain scalar — the parser reads it as the start of a nested mapping rather than as punctuation inside the description text. This silently truncates or breaks the frontmatter depending on the parser, and the failure mode can be a confusing "missing description" or "invalid frontmatter" error far from the actual cause.

```yaml
# Breaks under a strict YAML parser: the colon-space after "Use when" looks like a second mapping key
description: Use when: the user asks for X or Y
```

```yaml
# Correct: quote the whole value once it contains a colon-space, em dash colon, or similar punctuation
description: "Use when the user asks for X or Y, especially after: a prior review flagged the gap."
```

Quote the description whenever it contains a colon followed by a space, and prefer double quotes so an apostrophe inside the text does not also need escaping. Re-run the validator after any description edit — it re-parses frontmatter and will surface a YAML failure as a missing-key error rather than a syntax error, so don't assume a "missing description" failure always means the key was deleted.

## Frontmatter shape reference

### Minimal valid frontmatter (stable skill)

```yaml
---
name: my-skill
description: "Use when <trigger phrase>. Not when <adjacent skill> is more appropriate."
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: stable
  kind: task
---
```

### Explicit user-invocation frontmatter

Use `disable-model-invocation: true` when a skill should only run after an explicit user request, such as an interactive grilling workflow or a workflow that changes durable project state.

```yaml
---
name: interactive-skill
description: "Use when the user explicitly asks for the interactive workflow."
disable-model-invocation: true
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: stable
  kind: task
---
```

### Minimal valid frontmatter (new draft skill)

```yaml
---
name: my-skill
description: "Use when <trigger phrase>. Not when <adjacent skill> is more appropriate."
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: draft
  kind: task
---
```

### Stable skill with documented optional extension

```yaml
---
name: my-skill
description: "Use when <trigger phrase>."
metadata:
  category: authoring
  audience: general-coding-agent
  maturity: stable
  kind: task
  reader_testing: required
---
```

## Validator enforcement

The validator (`scripts/validate-skill-library.mjs`) currently enforces:

| Rule | Scope | Error or warning |
| --- | --- | --- |
| `name` must match directory | All skills | Error |
| `description` must be ≥ 20 characters | All skills | Error |
| `description` must include a trigger phrase | All skills | Error |
| `metadata.kind` must be `task` or `reference` | All skills | Error |
| **Forbidden top-level keys** | All skills | **Error** (added wave 2) |
| **Forbidden provenance keys in `metadata`** | All skills | **Error** (added wave 2) |
| Required lifecycle fields (`category`, `audience`, `maturity`, `kind`) | All skills | **Error** |
| Required headings must exist, occur exactly once, and stay in order | All skills | Error |
| Support-file links and orphaned support files | All skills | Error |
| **Route-target validation**: markdown links in `## Do not use this skill when` / `## Routing boundary` (plus any router skill's documented canonical routing heading, e.g. `## Symptom routing table`) resolve to an existing local file; bare backtick mentions of a kebab-case, 2+ segment name in those sections resolve to a local `skills/<name>/SKILL.md` or `agents/<name>.agent.md`, unless listed in `ROUTE_MENTION_ALLOWLIST` | All skills | **Error** (added wave 3; router heading added wave 4) |
