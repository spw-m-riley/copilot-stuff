---
description: 'Guidance for custom agent definitions and agent invocation'
applyTo: "agents/**/*.agent.md"
---

# Custom agent guidance

## Guidance

- Keep each agent's scope explicit and route only work that benefits from its specialist context.
- After creating or changing an agent, verify that the runtime loads it successfully before treating the change as complete.
- When removing an agent, remove its related documentation and glossary/context entries in the same slice unless they are intentionally retained.

Invocation-time and `herdr` pane guidance lives in `copilot-instructions.md` (`## Tools` and `## Learned Rules`) so it attaches whenever an agent is invoked, not only while editing `agents/*.agent.md`.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [WORKFLOW] After creating or changing any custom agent under `agents/*.agent.md`, always verify the agent loads successfully in the runtime before treating the work as complete - Matt requested removing `waffle` after it failed to load reliably
2. [DOCS] When removing a custom agent at Matt's request, remove its related documentation and glossary/context entries in the same change unless Matt explicitly asks to keep them - this correction asked for Waffle-related docs to be removed too
