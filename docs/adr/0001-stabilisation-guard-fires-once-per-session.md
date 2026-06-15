# ADR 0001: stabilisation-guard fires once per session

- Status: Accepted
- Date: 2026-06-12
- Consumer: `extensions/stabilisation-guard/README.md`

## Context

The `stabilisation-guard` extension is designed to make unresolved Lore items visible before implementation starts. On sessions with active `open_loop` or `assistant_goal` memories, the extension can deny write-oriented tools (`edit`, `create`, `apply_patch`) as a forcing function.

The consumer-facing behavior is documented in `extensions/stabilisation-guard/README.md`, which links to this ADR. The main design question was whether the guard should block repeatedly or only once.

Repeated denials would maximize enforcement, but they also create high friction in normal coding flows, especially after the user has already seen and acknowledged the warning.

## Decision

When unresolved stabilisation items exist, the extension denies the first write-tool invocation once per session, then stands down for the remainder of that session.

`onSessionStart` remains responsible for surfacing unresolved items in context, and the single deny event acts as an initial acknowledgement checkpoint rather than a persistent gate.

## Consequences

- **Lower disruption:** users are interrupted once, not continuously.
- **Clear prompt to acknowledge risk:** the first attempted mutation still triggers an explicit pause.
- **Session-scoped behavior is predictable:** after the first deny, subsequent write calls proceed.
- **Not a hard enforcement mechanism:** users can continue editing in the same session even if open loops remain unresolved, so team process still needs Lore hygiene (for example, resolving loops via the `resolve-open-loops` skill).
