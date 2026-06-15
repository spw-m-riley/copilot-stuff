# Smoke Test Prompts

These are the manual routing checks for validating the `execution-strategy` skill.

## Test Environment

All checks are manual. Use a fresh CLI session with the skill available, then:

1. Run `/skills reload`.
2. Run `/skills info execution-strategy` to confirm discoverability.
3. Submit each prompt below and record which skill the agent actually invokes plus the top-level decision it returns.

## Routing Checks

| Scenario | Prompt | Expected skill | Expected top-level result |
| --- | --- | --- | --- |
| Inline decision | "I have a two-line README tweak and one validator to run. Should I keep this inline, serial, or parallel before I dispatch anything?" | `execution-strategy` | Recommends `inline` because the work is too small to split. |
| Serial due to overlap | "One lane would update `package.json` scripts while another lane refreshes the lockfile and generated metadata. Can I run them in parallel?" | `execution-strategy` | Recommends `serial` because the lanes share mutable manifests and generated outputs. |
| Parallel with worktrees | "I have two independent refactors in different packages. They touch different files, each needs its own commit, and I want to run them at the same time. What execution strategy should I use?" | `execution-strategy` | Recommends `parallel` and routes mutating checkout setup to `git-worktrees` before dispatch. |
| Route away to git-worktrees | "Create two worktrees for parallel agent lanes so my main checkout stays untouched." | `git-worktrees` | `execution-strategy` should not be the chosen skill. |
| Route away to context-map | "Map the likely files and tests for this feature before we decide how to implement it." | `context-map` | `execution-strategy` should not be the chosen skill. |

## Pass Criteria

- The three positive prompts invoke `execution-strategy`.
- The route-away prompts invoke the named adjacent skill instead.
- The returned decision matches the expected top-level result closely enough that the next move is obvious.
- Any prompt that expands into new shared mutable state causes the agent to downgrade from `parallel` to `serial` instead of forcing concurrency.
