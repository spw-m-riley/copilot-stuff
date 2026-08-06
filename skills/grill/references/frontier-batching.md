# Frontier/round batching (optional)

Use this reference only when the user explicitly asks for faster-moving interrogation or when a genuinely independent set of questions has piled up with no dependency between them. **The one-at-a-time default in `SKILL.md` stays the default.** This file describes a narrow, opt-in variation, not a replacement for it.

## What "frontier" means here

At any point in the decision tree, some open questions depend on an earlier answer (ask them one at a time, in order) and some do not depend on each other at all — they sit at the same "frontier" of the tree. The default behavior is still to ask even independent questions one at a time. Frontier batching only kicks in when the user opts in.

## When batching is allowed

- The user explicitly asks to move faster, batch questions, or reduce round-trips.
- Two or more open questions are genuinely independent: neither answer changes what the other question should ask or how it should be interpreted.
- The batch stays small enough to read and answer in one pass — treat more than three or four questions in one round as a wall of questions, which the base guardrail already forbids.

## How to batch without becoming a wall of questions

1. Group only questions from the same frontier (no dependency between them); never batch a question whose answer would change a later question in the same batch.
2. Present each question with your recommended answer, exactly as the one-at-a-time mode requires — batching removes round-trips, not the recommended-answer discipline.
3. Keep the batch short and scannable: a numbered list of independent questions, not a merged paragraph.
4. After the user answers the batch, return to one-at-a-time (or another small batch) for the next frontier — do not keep batching by default once the explicit request is satisfied.
5. If mid-batch it turns out two "independent" questions were not actually independent (the user's answer to one changes the other), stop, acknowledge it, and resume one-at-a-time for the rest of that frontier.

## Non-blocking fact-finding subagent rule

Some open questions are really requests for a fact the codebase already contains (see the base workflow's "explore instead of asking" rule). When one or more such factual questions can be answered by exploration rather than by the user:

- Dispatch exploration as background work (a background `explore` agent or direct tool search) instead of pausing the interrogation to wait on it synchronously, when the exploration is not needed to ask the very next question.
- Keep asking the user questions that genuinely need their judgment while the fact-finding runs in the background — do not block the whole session on a lookup the user cannot answer any faster than the codebase can.
- Fold the finding back into the session as soon as it resolves: state what was found, then continue the decision tree from there instead of re-asking the user something the exploration already answered.
- Never dispatch a background fact-finding pass for something that itself requires a user decision — that is still a question, not a lookup, and belongs in the normal one-at-a-time (or batched-frontier) flow.

## What does not change

- The default remains one question at a time with a recommended answer.
- The no-wall-of-questions guardrail in `SKILL.md` still applies — frontier batching is a bounded exception, not a license to dump every open question at once.
- `interrogate-with-docs` mode's rule to update CONTEXT.md inline, without batching documentation updates, is unaffected by this reference.
