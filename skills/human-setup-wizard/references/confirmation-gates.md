# Confirmation gates

Use this reference when deciding where a human-only setup walkthrough needs an explicit stop-and-confirm point, rather than letting the reader move straight through every step.

## When a step needs a gate

Add an explicit confirmation gate before any step that is:

- **Irreversible** — deleting a resource, rotating a credential that invalidates the old one, or any action with no clean undo.
- **Billing-relevant** — creating a paid resource, upgrading a plan, or anything that starts a charge.
- **Destructive to existing state** — overwriting an existing configuration, account, or environment that may already be in use.
- **Externally visible** — an action another person or system will observe (sending an invite, posting to a shared channel, publishing a key).

Steps that only read information, open a settings page, or prepare a value locally do not need a gate.

## Gate format

Write each gate as an explicit pause the reader must act on, not a passive warning they can skim past:

```md
> **STOP — confirm before continuing**
> This step will <precise consequence, e.g. "permanently delete the existing API key">.
> Type `CONFIRM` below and press enter only once you are ready to proceed.
```

- State the precise consequence in plain language, not a vague "this cannot be undone."
- Require an explicit typed or checked acknowledgment, not just a "press enter to continue" that could be muscle memory.
- Place the gate immediately before the step it protects, not bundled earlier where the reader might forget it by the time they act.

## What a gate does not replace

A confirmation gate protects against the reader acting on autopilot; it does not replace static validation of the walkthrough itself, and it does not make an irreversible step safe to script or auto-execute. The walkthrough remains something a human reads and acts on manually — see the `SKILL.md` guardrail against end-to-end execution.
