# Setup walkthrough template

A fresh, vendor-neutral starting point for a human-only setup walkthrough. Fill in the placeholders for the specific service or tool being set up; do not copy an existing vendor's own onboarding wizard content wholesale — write the steps in this repo's own words, parameterized for the actual task.

```md
# Setup: <what is being configured, e.g. "Connect the deploy pipeline to <Provider>">

**This is a manual walkthrough. Follow each step yourself — do not ask an agent to run these steps for you**, since several involve external accounts, credentials, or irreversible actions no agent should perform on your behalf.

## Before you start

- What you'll need: <accounts, existing credentials, access levels required>
- Estimated time: <rough estimate>
- What this walkthrough will NOT do: <explicitly state anything intentionally out of scope>

## Steps

### Step 1: <imperative title>

<Precise instructions for this step, in your own words.>

**Verify**: <what the reader should see/check to confirm this step worked>

### Step 2: <imperative title>

<...>

> **STOP — confirm before continuing** (include only when this step is irreversible, billing-relevant, destructive, or externally visible — see `references/confirmation-gates.md`)
> This step will <precise consequence>.
> Type `CONFIRM` and press enter only once you are ready to proceed.

### Step N: <imperative title>

<...>

## Credential handling

- <For each credential produced during setup: what it is, where to store it (password manager / secret store / local env var), and an explicit reminder not to paste it into this document, a commit, or chat. See `references/secret-handling.md`.>

## Final check

- <A short checklist the reader can use to confirm the whole setup succeeded, described in terms of observable outcomes, not internal implementation.>

## If something goes wrong

- <Where to look for troubleshooting: provider's own docs, a specific error message meaning, or who to ask.>
```
