# Smoke Test Prompts

These are manual discoverability and routing checks for the `code-review` skill. They follow the same repo practice used by other interactive skill packages: reload, inspect, then run realistic prompts by hand.

## Test environment

1. Start a fresh CLI session in this repo.
2. Run `/skills reload`.
3. Run `/skills info code-review`.
4. Record which skill the agent actually invokes for each scenario.

## Scenario 1: Discoverability

### Invocation

```text
/skills info code-review
```

### Pass criteria

- The skill appears with the expected name and description.
- The description clearly signals structured review, evidence, confidence, and validator confirmation.

## Scenario 2: Structured review trigger

### Invocation

```text
Review this patch and return a findings JSON with severity, confidence, evidence, and a validator pass.
```

### Pass criteria

- The agent invokes `code-review`.
- The next action is to classify scope and start a structured findings artifact.

## Scenario 3: Review-comment near-miss

### Invocation

```text
Address the open PR review comments, push fixes, and wait for checks.
```

### Pass criteria

- The agent does not invoke `code-review`.
- The request routes to `review-comment-resolution` instead.

## Scenario 4: CI specialist routing

### Invocation

```text
Review this GitHub Actions diff, call out merge blockers, and use a specialist if the workflow rollout risk is unclear.
```

### Pass criteria

- The agent invokes `code-review`.
- The review plan mentions conditional routing to `ci-migration-orchestrator` for workflow-specific concerns.

## Scenario 5: TypeScript API specialist routing

### Invocation

```text
Review this TypeScript handler diff and be strict about missing runtime coverage or response-shape regressions.
```

### Pass criteria

- The agent invokes `code-review`.
- The review plan mentions conditional routing to `typescript-api-test-generator` if stronger runtime-test evidence is needed.

## Scenario 6: Out-of-scope planning request

### Invocation

```text
Write a PRD for this feature idea.
```

### Pass criteria

- The agent does not invoke `code-review`.
- The request routes away to a planning or PRD-oriented skill.
