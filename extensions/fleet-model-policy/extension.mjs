import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";

const FLEET_MODEL_POLICY = [
  "Fleet model steering (prompt-level only):",
  "- For implementation, coding, and execution subtasks in fleet mode, prefer GPT-5.3-codex.",
  "- Preserve default built-in behavior for research, review, and configuration tasks unless the user explicitly requests otherwise.",
  "- Respect explicit user model or agent requests over this policy.",
  "- Do not apply session-wide model switches, runtime patching, or custom-agent retagging.",
].join("\n");

function normalizePrompt(prompt) {
  return typeof prompt === "string" ? prompt.trim() : "";
}

// Fleet entry points converge on the same orchestration prompt in the foreground
// session. Match that prompt first, with a narrow raw `/fleet` fallback.
function isFleetModePrompt(prompt) {
  return (
    prompt.startsWith("You are now in fleet mode") ||
    /^\/fleet(?:\s|$)/u.test(prompt)
  );
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onUserPromptSubmitted: async (input) => {
      const prompt = normalizePrompt(input.prompt);
      if (!prompt || !isFleetModePrompt(prompt)) {
        return;
      }

      await session.log("Fleet model policy injected", { ephemeral: true });
      return { additionalContext: FLEET_MODEL_POLICY };
    },
  },
});
