import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import {
  normalizePrompt,
  normalizeSessionId,
  readChildMetadata as readSharedChildMetadata,
  setBoundedContext,
} from "../_shared/context-policy.mjs";

/**
 * Plan Review Policy Extension
 * 
 * Injects planning rules and guidelines into /plan mode context.
 * 
 * Integrates with plan-review-orchestrator extension (non-conflicting):
 * - Both extensions activate independently on /plan slash command
 * - Both maintain separate session state (no collision)
 * - Both inject context additively for reviewer and helper subagents
 * - Coordination: policy provides guidelines, orchestrator provides dispatch logic
 * 
 * See plan-review-orchestrator/extension.mjs for orchestration details.
 */

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

function readSessionId(input) {
  return normalizeSessionId(input?.sessionId);
}

function isPlanSlashCommand(prompt) {
  return /^\/plan(?:\s|$)/u.test(prompt);
}

function setActiveContext(sessionId, context) {
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return;
  }
  setBoundedContext(
    activeContextBySession,
    sessionId,
    context,
    MAX_ACTIVE_SESSION_CONTEXTS,
  );
}

function clearActiveContext(sessionId) {
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return;
  }
  activeContextBySession.delete(sessionId);
}

function readChildMetadata(input) {
  return readSharedChildMetadata(input, { trimValues: true });
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
