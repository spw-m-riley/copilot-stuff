---
description: 'Guidance for custom agent definitions and agent invocation'
applyTo: "agents/**/*.agent.md"
---

# Custom agent guidance

## Guidance

- Keep each agent's scope explicit and route only work that benefits from its specialist context.
- After creating or changing an agent, verify that the runtime loads it successfully before treating the change as complete.
- Invoke `/agent <name>` with the bare agent name first; send the task as a separate follow-up message.
- For pane-backed agent work, confirm the pane is processing the submitted prompt before trusting a successful command return.
- When removing an agent, remove its related documentation and glossary/context entries in the same slice unless they are intentionally retained.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [WORKFLOW] After creating or changing any custom agent under `agents/*.agent.md`, always verify the agent loads successfully in the runtime before treating the work as complete - Matt requested removing `waffle` after it failed to load reliably
2. [DOCS] When removing a custom agent at Matt's request, remove its related documentation and glossary/context entries in the same change unless Matt explicitly asks to keep them - this correction asked for Waffle-related docs to be removed too
3. [EXTENSIONS] `/agent <name>` joins every token after the command into one string used as the exact agent lookup id (`e.join(" ").trim()` in the CLI source) - it does not parse "agent name" separately from "prompt to send it." Appending a prompt on the same line makes the whole trailing text the lookup string, which matches no agent. Correct usage is always two steps: send `/agent <name>` alone first, confirm the switch, then send the task as a separate follow-up message
4. [SHELL] `herdr pane run <pane> "<text>"` can leave text sitting unsubmitted in a pane's input box instead of actually submitting it; always re-read the pane immediately after sending to confirm the text left the input box and the process started working, and use `herdr pane send-keys <pane> Enter` to submit if it did not
5. [SHELL] When using `herdr wait output <pane> --match <marker>`, do not trust a match if the marker text is also present verbatim in the instruction just sent to that pane; cross-check pane status or the marker's position in the transcript before treating the task as complete
