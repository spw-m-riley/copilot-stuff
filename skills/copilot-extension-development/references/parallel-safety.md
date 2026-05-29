# Parallel safety

Use the abstraction **never batch a producer with its consumer** when coordinating worktrees, branches, generated files, or validation artifacts.

A producer is any operation that creates, removes, or mutates state another operation needs to read. A consumer is any follow-up operation that assumes that state exists or has settled.

## Rule of thumb

Run producer and consumer steps in separate turns or commands when the consumer depends on the producer's result. Examples:

- Create a worktree, then inspect or edit inside it only after creation succeeds.
- Generate a file, then read or validate it in a later step.
- Finish a merge, cherry-pick, or commit before pushing the branch that depends on it.
