import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";

const MAX_ACTIVE_SESSION_CONTEXTS = 64;
const REVIEWER_ALLOW_LIST = ["review", "reviewer"];
const HELPER_ALLOW_LIST = ["plan", "planner", "task", "implementation", "general-purpose"];
const HELPER_DENY_LIST = ["research", "review", "reviewer", "explore", "config", "configure"];
const PLAN_REVIEW_RULES = [
  "- In plan mode, default to a reviewer loop before treating the plan as complete.",
  '- Use GPT-5.3-codex ("Jason") and Claude Sonnet 4.6 ("Freddy") as the default plan reviewers unless the user explicitly asks for a different reviewer set.',
  "- Every reviewer must review every round of plan revisions; do not drop a reviewer from later rounds.",
  "- Do not treat the plan as approved until all reviewers approve in the same round.",
  "- If any reviewer requests changes, update the plan and run another full review round with all reviewers.",
  "- Keep plans implementation-ready: include concrete tasks, dependencies, validation, and rollout notes rather than high-level prose.",
  "- When the work can be parallelized safely, make the plan fleet-ready and prefer isolated worktrees per agent or task.",
  "- Stay in planning mode until the user explicitly asks to implement.",
];

const PLAN_REVIEW_POLICY = ["Planning defaults for this user:", ...PLAN_REVIEW_RULES].join("\n");
const REVIEWER_CHILD_CONTEXT = [
  "This delegated child agent is reviewing a /plan workflow.",
  ...PLAN_REVIEW_RULES,
].join("\n");
const HELPER_CHILD_CONTEXT = [
  "This delegated child agent is helping produce or refine a /plan workflow.",
  ...PLAN_REVIEW_RULES,
].join("\n");
const activeContextBySession = new Map();

function normalizePrompt(prompt) {
  return typeof prompt === "string" ? prompt.trim() : "";
}

function readSessionId(input) {
  if (typeof input?.sessionId !== "string") {
    return null;
  }
  const sessionId = input.sessionId.trim();
  return sessionId.length > 0 ? sessionId : null;
}

function isPlanSlashCommand(prompt) {
  return /^\/plan(?:\s|$)/u.test(prompt);
}

function capCachedSessions() {
  while (activeContextBySession.size > MAX_ACTIVE_SESSION_CONTEXTS) {
    const oldestSessionId = activeContextBySession.keys().next().value;
    if (typeof oldestSessionId !== "string") {
      return;
    }
    activeContextBySession.delete(oldestSessionId);
  }
}

function setActiveContext(sessionId, context) {
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return;
  }
  activeContextBySession.set(sessionId, context);
  capCachedSessions();
}

function clearActiveContext(sessionId) {
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return;
  }
  activeContextBySession.delete(sessionId);
}

function readChildMetadata(input) {
  const parts = [input?.agentName, input?.agentDisplayName, input?.agentDescription]
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return parts.join(" ").toLowerCase();
}

function includesKeyword(haystack, keywords) {
  return keywords.some((keyword) => haystack.includes(keyword));
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onUserPromptSubmitted: async (input) => {
      const prompt = normalizePrompt(input.prompt);
      const sessionId = readSessionId(input);
      if (!prompt || !isPlanSlashCommand(prompt)) {
        clearActiveContext(sessionId);
        return;
      }

      setActiveContext(sessionId, { kind: "plan-review-policy", matched: true });
      return { additionalContext: PLAN_REVIEW_POLICY };
    },
    onSubagentStart: async (input) => {
      const sessionId = readSessionId(input);
      if (typeof sessionId !== "string") {
        return;
      }

      const activeContext = activeContextBySession.get(sessionId);
      if (activeContext?.kind !== "plan-review-policy" || activeContext.matched !== true) {
        return;
      }

      const childMetadata = readChildMetadata(input);
      if (childMetadata.length === 0) {
        return;
      }

      if (includesKeyword(childMetadata, REVIEWER_ALLOW_LIST)) {
        await session.log("plan-review-policy: injected reviewer child context", { ephemeral: true });
        return { additionalContext: REVIEWER_CHILD_CONTEXT };
      }

      if (
        !includesKeyword(childMetadata, HELPER_DENY_LIST) &&
        includesKeyword(childMetadata, HELPER_ALLOW_LIST)
      ) {
        await session.log("plan-review-policy: injected helper child context", { ephemeral: true });
        return { additionalContext: HELPER_CHILD_CONTEXT };
      }
    },
    onSessionEnd: async (input) => {
      const sessionId = readSessionId(input);
      clearActiveContext(sessionId);
    },
  },
});
