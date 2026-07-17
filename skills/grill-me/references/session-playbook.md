# Session playbook

Shared patterns for running an effective interrogation session.

## Question sequencing

- Resolve foundational terms before dependent decisions.
- Walk one branch at a time. Finish one line of questioning before starting the next.
- Provide your recommended answer with every question.

## Scenario construction

- Invent specific scenarios that probe edge cases.
- Pick scenarios that stress concept boundaries.
- Use the user's own domain language.

## Contradiction surfacing

- Cross-reference claims against code.
- Cross-reference claims against existing docs.
- Do not assume the code is right.

## Fuzzy-term resolution

- Catch overloaded terms immediately.
- When a term is resolved, update CONTEXT.md immediately. Do not wait for the session to end.
- List rejected aliases under _Avoid_.

## When to explore instead of ask

- If the question is "how does X currently work?", explore the codebase instead of asking the user.
- If the question is "should X work this way?", ask the user.
- When in doubt, check the code first and present what you found, then ask whether the current behaviour is intended.

## When to stop

The session is complete when every branch of the decision tree has been resolved and the user confirms shared understanding.
