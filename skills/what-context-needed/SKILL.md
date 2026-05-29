---
name: what-context-needed
description: "Use when the user asks what files or context are needed before answering a codebase question; not when enough context is already available."
metadata:
  category: workflow
  audience: general-coding-agent
  maturity: draft
  kind: task
---

# What Context Needed

Use this skill to ask for the smallest useful set of files before answering a question that depends on unseen repository context.

## Use this skill when

- The user explicitly asks what files or context are needed.
- A question cannot be answered accurately without seeing repository files.
- You need to separate must-see context from nice-to-have context before proceeding.

## Do not use this skill when

- You already have enough relevant files in context; answer directly.
- The task is to map a large codebase; use `context-map` or `acquire-codebase-knowledge`.
- The user asks you to make changes autonomously; inspect files yourself instead of asking for a file list.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| List needed files before answering a question | Yes | - |
| Build a multi-file pre-edit map yourself | No | `context-map` |
| Create onboarding documentation for an existing repo | No | `acquire-codebase-knowledge` |

## Inputs to gather

**Required before editing**

- The user's question or intended change.
- Any files already visible in conversation.
- Known repository area, language, or feature if mentioned.

**Helpful if present**

- Error messages, command output, or stack traces.
- Recent diffs or PR context.
- Test names or symbols involved.

**Only investigate if encountered**

- Configuration files only if the question depends on build, lint, or runtime behavior.
- Docs only if terminology or product behavior is unclear.

## First move

1. Restate the question in one sentence.
2. Identify must-see files first, limiting the list to files required for an accurate answer.
3. Separate optional context and uncertainties from required context.

## Workflow

1. List `Must See` files with a short reason for each.
2. List `Should See` files only when they would materially improve completeness.
3. List files already available in the conversation.
4. State uncertainties that remain without the requested context.
5. After the user provides files or asks you to proceed, answer the original question using the new context.

## Outputs

- A prioritized context request organized as Must See, Should See, Already Have, and Uncertainties.
- Concise reasoning for why each file matters.
- No speculative answer that depends on missing context.

## Guardrails

- Do not ask for broad repository dumps when a small file set is enough.
- Do not use this skill to avoid available code-search tools in an autonomous coding session.
- Keep the list actionable and path-oriented.

## Validation

- Check that every Must See file has a reason tied to the user's question.
- Smoke test: should trigger for "Before answering, tell me what files you need to see for this auth bug."
- Smoke test: should not trigger for "Refactor this known file"; inspect and edit directly.

## Examples

- "What files do you need before explaining this build failure?"
- "Before answering my architecture question, tell me what context you need."
- "What should I paste so you can review this API handler?"

## Reference files

- [`references/upstream-notes.md`](references/upstream-notes.md) - normalized notes from the upstream awesome-copilot skill used for this local fork

## Learned Rules

No learned rules yet.
