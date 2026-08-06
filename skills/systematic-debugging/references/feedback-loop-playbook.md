# Feedback-loop playbook

Use this reference to pick the fastest reproduction technique before forming a hypothesis. It does not change the one-hypothesis-at-a-time policy in `SKILL.md` — it only helps you get to a trustworthy repro faster so that policy has something solid to run against.

## Completion bar for a reproduction

A reproduction is not "good enough" until it clears all four bars:

- **Reproducible** — running it again produces the same failure, not a maybe.
- **Deterministic** — no dependency on wall-clock time, network flakiness, or unseeded randomness unless the bug itself is about that dependency.
- **Fast** — cheap enough to re-run after every single-hypothesis test without breaking flow (seconds, not minutes, wherever the stack allows it).
- **Agent-runnable** — a single command or tool call reproduces it; it does not require a human to click through a UI or watch a live system.

If a candidate reproduction fails one of these bars, move down the ranked list below until one clears all four, or fall back to the human-in-the-loop technique and say so explicitly.

## Run once before theorizing

Reproduce first, theorize second. Run the chosen technique once, end to end, before writing down a hypothesis. A hypothesis formed before the failure is confirmed firsthand is a guess wearing a hypothesis's clothes — the existing `SKILL.md` guardrail against skipping reproduction still applies here; this playbook is just how you satisfy it quickly.

## Ranked reproduction techniques

Try these roughly in order — each one down the list costs more setup time, so only drop down when the previous one genuinely does not fit the failure:

1. **Failing test** — the fastest and most durable option when the codebase already has a test harness. Write (or find) the smallest test that fails for the reported reason. Doubles as the regression check once the fix lands.
2. **CLI/HTTP fixture** — a saved request, payload, or command invocation that triggers the failure through the same interface a real caller uses. Use when the bug depends on an external-facing contract (API shape, CLI flags) that a unit test would not exercise faithfully.
3. **Trace replay** — capture or reuse a log/trace/event stream from the failing run and replay it in isolation. Use when the bug depends on a specific sequence of inputs or state transitions that is hard to construct by hand but easy to capture once.
4. **Throwaway harness** — a small standalone script that exercises just the suspect code path outside the full application. Use when the surrounding system is too heavy to boot repeatedly but the suspect logic can be called directly.
5. **Fuzz/property loop** — generate varied or randomized inputs against an invariant until one fails. Use when the failure is input-shape-dependent and you do not yet know which input triggers it; keep the loop seeded so a found failure becomes reproducible per the completion bar.
6. **Bisect/differential loop** — compare behavior across commits, environments, or configurations (`git bisect`, environment diffing, dependency pinning) to localize when or where the divergence starts. Use when the failure is a regression and the "before" state is known to work.
7. **Human-in-the-loop fallback** — when none of the above can be made deterministic or agent-runnable (a UI-only interaction, a third-party system with no fixture, a timing-dependent hardware issue), say so explicitly, document the manual steps precisely, and ask a human to execute and report the exact observation. This is a fallback, not a default — exhaust the automatable options first.

## Flaky reproduction-rate guidance

When a failure only reproduces intermittently:

- Run the chosen technique enough times to estimate a rate (for example, 10–20 runs) before concluding it is flaky rather than assuming after one miss.
- Record the observed rate (`fails ~3/10 runs`) rather than a vague "sometimes" — a rate is falsifiable evidence a hypothesis can be tested against.
- Treat a falling or rising reproduction rate across attempts as a signal itself: a rate that changes with load, ordering, or timing usually points at shared state or a race, not at pure randomness.
- Do not accept a hypothesis as confirmed against a flaky repro until the fix changes the rate to 0 (or to the theoretically expected rate) across enough runs to trust the difference is not noise.

## Unique debug tags

When adding temporary logging or trace output to narrow a reproduction, tag it with a unique, greppable marker (a request/trace id, or a one-off string like `DEBUG-2024-repro-142`) so:

- the signal is easy to filter out of noisy shared logs,
- the temporary instrumentation is easy to find and remove once the root cause is confirmed,
- concurrent or repeated runs do not get their debug output cross-contaminated.

Remove debug tags once the fix lands and the reproduction is captured as a permanent regression test; don't let them linger as dead instrumentation.

## Route to architecture design when no correct seam exists

Sometimes reproduction and root-causing succeed, but the fix has nowhere clean to go — the responsible logic is entangled across modules with no interface boundary to change safely. That is no longer a debugging problem. When you reach a confirmed root cause but the codebase has no correct seam to apply the minimal fix, stop and route to [`codebase-design`](../../codebase-design/SKILL.md) to establish the missing module/interface boundary before resuming the fix here.
