# Safe secret handling in a setup walkthrough

Use this reference so a generated walkthrough never becomes the place a real secret ends up committed or exposed.

## Never write a real secret value into the artifact

- Use placeholders for every credential, key, or token the walkthrough asks the reader to obtain (`<YOUR_API_KEY>`, `sk-***redacted***`), never a real value pasted from chat or a prior session.
- If the conversation already contains a real secret value, do not copy it into the walkthrough even as an "example" — redact it the same way [`session-handoff`](../../session-handoff/SKILL.md) redacts secrets in handoff artifacts.
- Point the reader at where the real value should live once obtained: a password manager, the platform's own secret store, or an environment variable the reader sets locally — never a value hardcoded into a checked-in file.

## Guide the reader's storage choice explicitly

Each step that produces a credential should say, in the walkthrough itself, where that credential should be stored — do not leave the reader to guess:

```md
1. Generate a new API key in the provider's dashboard.
2. Store it in your password manager under `<service name>`, or export it as `<ENV_VAR_NAME>` in your local shell profile.
3. Do not paste the key into this document, a commit, or a chat message.
```

## Static-only validation applies to secret handling too

Confirm the walkthrough *describes* safe handling correctly; do not verify safe handling by actually generating a real credential and checking where it landed. The generated document is reviewed for correctness of the instructions, not executed to prove they work — see the `SKILL.md` guardrail against end-to-end execution.

## If existing secrets are already exposed

If, while drafting a setup walkthrough, you discover a secret already committed or exposed elsewhere in the repository, stop and route to [`secret-scan-triage`](../../secret-scan-triage/SKILL.md) instead of trying to remediate it as part of this skill.
