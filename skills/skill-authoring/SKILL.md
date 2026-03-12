# Skill authoring

Use this skill when creating or revising an Agent Skill under `skills/<name>/SKILL.md`.

## Non-negotiable rule

If the request is ambiguous, ask clarifying questions first and do not make assumptions about scope, naming, behavior, or required examples.

## What good skills contain

- A clear purpose and when to use the skill.
- Concrete triggers or example prompts.
- Inputs the agent should collect before acting.
- A repeatable workflow the agent can follow.
- Guardrails, validation steps, and handoff expectations.

## Authoring workflow

1. Clarify the user’s intent, audience, and scope.
2. Choose a concise, kebab-case skill name.
3. Write a `SKILL.md` that is easy for an LLM to follow quickly.
4. Keep instructions actionable and specific rather than abstract.
5. Include examples and failure cases when they change behavior.
6. Validate that the skill does not conflict with broader instructions or duplicate an existing skill.

## Suggested structure

```md
# <Skill name>

Use this skill when ...

## Inputs

- ...

## Workflow

1. ...

## Guardrails

- ...

## Examples

- ...
```

## Quality checklist

- The skill name matches the directory name.
- The workflow is sequential and concrete.
- The guardrails prevent common failure modes.
- The instructions are concise enough to scan quickly.
- Missing requirements are surfaced as questions, not guessed.
