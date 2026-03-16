import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";

const PLAN_REVIEW_POLICY = [
  "Planning defaults for this user:",
  "- In plan mode, default to a reviewer loop before treating the plan as complete.",
  '- Use GPT-5.3-codex ("Jason") and Claude Sonnet 4.6 ("Freddy") as the default plan reviewers unless the user explicitly asks for a different reviewer set.',
  "- Every reviewer must review every round of plan revisions; do not drop a reviewer from later rounds.",
  "- Do not treat the plan as approved until all reviewers approve in the same round.",
  "- If any reviewer requests changes, update the plan and run another full review round with all reviewers.",
  "- Keep plans implementation-ready: include concrete tasks, dependencies, validation, and rollout notes rather than high-level prose.",
  "- When the work can be parallelized safely, make the plan fleet-ready and prefer isolated worktrees per agent or task.",
  "- Stay in planning mode until the user explicitly asks to implement.",
].join("\n");

function normalizePrompt(prompt) {
  return typeof prompt === "string" ? prompt.trim() : "";
}

function isPlanSlashCommand(prompt) {
  return /^\/plan(?:\s|$)/u.test(prompt);
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onUserPromptSubmitted: async (input) => {
      const prompt = normalizePrompt(input.prompt);
      if (!prompt || !isPlanSlashCommand(prompt)) {
        return;
      }

      return { additionalContext: PLAN_REVIEW_POLICY };
    },
  },
});
