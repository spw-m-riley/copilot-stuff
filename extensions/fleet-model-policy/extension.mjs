import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";

const FLEET_MODEL_POLICY = [
  "Fleet model steering (prompt-level only):",
  "- For implementation, coding, and execution subtasks in fleet mode, prefer GPT-5.3-codex.",
  "- Preserve default built-in behavior for research, review, and configuration tasks unless the user explicitly requests otherwise.",
  "- Respect explicit user model or agent requests over this policy.",
  "- Do not apply session-wide model switches, runtime patching, or custom-agent retagging.",
].join("\n");

const FLEET_CHILD_MODEL_POLICY = [
  "Fleet child delegation policy:",
  "- This delegated child appears implementation-oriented; prefer GPT-5.3-codex unless the user explicitly requested otherwise.",
  "- Respect explicit user model or agent requests over this policy.",
  "- Do not apply session-wide model switches, runtime patching, or custom-agent retagging.",
].join("\n");

const IMPLEMENTATION_ALLOW_KEYWORDS = [
  "implement",
  "implementation",
  "code",
  "coding",
  "edit",
  "fix",
  "patch",
  "task",
  "execute",
  "execution",
  "build",
  "test",
  "debug",
];

const IMPLEMENTATION_DENY_KEYWORDS = [
  "research",
  "review",
  "reviewer",
  "plan",
  "planning",
  "explore",
  "config",
  "configure",
];

const MAX_ACTIVE_SESSIONS = 32;
const activeContextBySession = new Map();

function normalizePrompt(prompt) {
  return typeof prompt === "string" ? prompt.trim() : "";
}

function normalizeSessionId(sessionId) {
  return typeof sessionId === "string" ? sessionId.trim() : "";
}

function setActiveContext(sessionId, context) {
  if (!sessionId || !context) {
    return;
  }

  if (activeContextBySession.has(sessionId)) {
    activeContextBySession.delete(sessionId);
  }

  activeContextBySession.set(sessionId, context);

  while (activeContextBySession.size > MAX_ACTIVE_SESSIONS) {
    const [oldestSessionId] = activeContextBySession.keys();
    activeContextBySession.delete(oldestSessionId);
  }
}

function clearActiveContext(sessionId) {
  if (!sessionId) {
    return;
  }

  activeContextBySession.delete(sessionId);
}

function getChildMetadataText(input) {
  const metadata = [
    input?.agentName,
    input?.agentDisplayName,
    input?.agentDescription,
    input?.subagent?.agentName,
    input?.subagent?.agentDisplayName,
    input?.subagent?.agentDescription,
  ]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .trim()
    .toLowerCase();

  return metadata;
}

function shouldInjectFleetChildContext(input) {
  const metadata = getChildMetadataText(input);
  if (!metadata) {
    return false;
  }

  const hasAllowKeyword = IMPLEMENTATION_ALLOW_KEYWORDS.some((keyword) =>
    metadata.includes(keyword),
  );
  const hasDenyKeyword = IMPLEMENTATION_DENY_KEYWORDS.some((keyword) =>
    metadata.includes(keyword),
  );

  return hasAllowKeyword && !hasDenyKeyword;
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
      const sessionId = normalizeSessionId(input.sessionId);

      if (!prompt || !isFleetModePrompt(prompt)) {
        clearActiveContext(sessionId);
        return;
      }

      const context = {
        kind: "fleet-model-policy",
        matched: true,
        payload: FLEET_CHILD_MODEL_POLICY,
      };

      setActiveContext(sessionId, context);

      await session.log("fleet-model-policy: cached parent context", {
        ephemeral: true,
        sessionId,
      });
      await session.log("Fleet model policy injected", { ephemeral: true });
      return { additionalContext: FLEET_MODEL_POLICY };
    },
    onSubagentStart: async (input) => {
      if (!shouldInjectFleetChildContext(input)) {
        return;
      }

      const sessionId = normalizeSessionId(input.sessionId);
      const cachedContext = activeContextBySession.get(sessionId);

      if (cachedContext?.matched && cachedContext.kind === "fleet-model-policy") {
        await session.log("fleet-model-policy: correlation proof sessionId hit", {
          ephemeral: true,
          sessionId,
        });
        await session.log("fleet-model-policy: injected child context", {
          ephemeral: true,
          sessionId,
        });
        return { additionalContext: cachedContext.payload };
      }

      await session.log("fleet-model-policy: correlation proof sessionId miss", {
        ephemeral: true,
        sessionId,
      });
      return;
    },
    onSessionEnd: async (input) => {
      const sessionId = normalizeSessionId(input.sessionId);
      clearActiveContext(sessionId);
    },
  },
});
