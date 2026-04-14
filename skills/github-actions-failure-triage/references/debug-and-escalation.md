# Debug and escalation

Use this guide after you have concrete evidence from the failing run.

## When a rerun is justified

Rerun when:

- the failure looks flaky and the original logs are already understood
- you need to verify a narrowly targeted fix
- the repository workflow already depends on rerun-based confirmation

Do not use reruns as a substitute for reading the failure first.
Do not rerun just to gather "more data" unless you can say what new evidence the rerun is expected to produce.

## When extra debug logging is justified

Consider extra debug logging when:

- the current logs do not explain why the runner or step behaved as it did
- the problem appears to depend on runner setup or step execution details
- a normal rerun would still leave the root cause ambiguous

Remember:

- enabling extra GitHub Actions debug logging may require repository access or admin help
- the relevant surfaces are typically `ACTIONS_RUNNER_DEBUG` and `ACTIONS_STEP_DEBUG`
- higher verbosity changes the investigation surface, so explain why it is needed before asking for it

Red flags:

- rerunning the same unexplained failure more than once without a new hypothesis
- asking for debug logging before the failing surface and likely bucket are identified
- treating "it passed once" as proof when the logs still do not explain the failure

## When to escalate

Escalate instead of guessing when the root cause depends on:

- organization or environment secrets and variables you cannot inspect safely
- self-hosted runner fleet health, labels, capacity, or admin-managed images
- branch protection, required checks, or environment protection rules outside the repository workflow files
- a broader CI redesign or migration decision rather than a targeted failure fix

## When to hand off to another local workflow

- Route to `circleci-to-github-actions-migration` if the real problem is migration parity or staged cutover design.
- Route to `ci-migration-orchestrator` if the work is broad, high-touch, or spans multiple workflows and environments.
- Route to `review-comment-resolution` if the primary task is handling review comments rather than diagnosing a failing run directly.
- Route to `git-worktrees` if isolated parallel work is the blocker rather than diagnosis.

## How to report a blocker

When stopping on escalation, report:

- the exact failing surface
- the evidence gathered
- the most likely bucket and root cause
- why the next action is out of scope for this skill
- the cleanest handoff target or admin action needed
