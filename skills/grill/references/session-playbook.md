# Session playbook

Shared patterns for running an effective interrogation session.

## Shared interrogation patterns

- Resolve foundational terms before dependent decisions.
- Walk one branch at a time. Finish one line of questioning before starting the next.
- Provide your recommended answer with every question.
- Invent specific scenarios that probe edge cases.
- Pick scenarios that stress concept boundaries.
- Use the user's own domain language.
- Cross-reference claims against code.
- Cross-reference claims against existing docs.
- Do not assume the code is right.
- Catch overloaded terms immediately.
- If the question is "how does X currently work?", explore the codebase instead of asking the user.
- If the question is "should X work this way?", ask the user.
- When in doubt, check the code first and present what you found, then ask whether the current behaviour is intended.
- The session is complete when every branch of the decision tree has been resolved and the user confirms shared understanding.

## Docs-specific guidance

- When a term is resolved, update CONTEXT.md immediately. Do not wait for the session to end.
- List rejected aliases under _Avoid_.
- All resolved terms are captured in CONTEXT.md (`interrogate-with-docs` mode only).
- Any qualifying decisions have been offered as ADRs (`interrogate-with-docs` mode only).
