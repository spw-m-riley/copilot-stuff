# Behavioral brief template

Use this template to record what an issue or PR is actually asking for in terms of observable behavior — durable enough to hand to `to-prd`, `to-issues`, or an implementer later, independent of which tracker hosted the original report.

```md
# Triage: <short issue/PR title>

## Source

- Tracker: <GitHub / Jira / Linear / other, or "unspecified">
- Reference: <issue/PR number or link, if any>
- Reporter context: <who raised it and any relevant role, e.g. "end user", "internal QA">

## Category

<bug | feature request | question | duplicate | needs-info | out-of-scope — see references/category-and-lifecycle.md>

## Lifecycle state

<triage | ready | in progress | blocked | closed — see references/category-and-lifecycle.md>

## Behavioral brief

<What observable behavior is being requested or reported, in plain language, independent of implementation. For a bug: current behavior vs. expected behavior. For a feature: the capability being asked for and who needs it. Do not describe files, functions, or code — describe what should be true from the outside.>

## Out-of-scope concepts

<Ideas, related requests, or adjacent behavior mentioned in the discussion that are explicitly NOT part of this issue's scope. Record each one with a one-line reason so it is not silently dropped or silently expanded later — write "none identified" rather than omitting this section.>

## Recommended next step

<One of: hand to `to-prd` for full product framing, hand to `to-issues` if scope is already approved and just needs slicing, hand to the relevant GitHub-mechanics skill for tracker operations, or "no further action" with a reason.>
```
