/**
 * Plan Review Orchestrator Extension
 * 
 * Automatically dispatches multiple reviewer agents when plan mode is active,
 * tracks their approvals across multiple rounds, and coordinates plan revisions
 * until all reviewers approve or a termination condition is met.
 * 
 * Integrates with plan-review-policy extension (non-conflicting).
 */

import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import {
  normalizePrompt,
  normalizeSessionId,
  readChildMetadata as readSharedChildMetadata,
  setBoundedContext,
} from "../_shared/context-policy.mjs";
import { readPlanReviewOrchestratorEnabled } from "../lore/lib/rollout-flags.mjs";
import { PlanOrchestrator } from "./lib/orchestrator.mjs";
import {
  parseReviewerResponse,
  extractFeedback,
  hasVerdictToken,
} from "./lib/approval-tracker.mjs";
import {
  generateReviewerContext,
  generateRevisionRequest,
  isReviewerAgent,
  matchReviewerAgent,
  formatApprovalSummary,
  formatResponseSummary,
} from "./lib/reviewer-dispatch.mjs";

const MAX_ACTIVE_SESSION_CONTEXTS = 64;

// Default reviewer configuration (Jason + Freddy from plan-review-policy)
const DEFAULT_PLAN_REVIEWERS = [
  "gpt-5.3-codex", // Jason
  "claude-sonnet-4.6", // Freddy
];

// Session orchestration state: sessionId -> PlanOrchestrator
const orchestratorBySession = new Map();

// Track reviewer feedback for revision requests
const reviewerFeedbackBySession = new Map();

function readSessionId(input) {
  return normalizeSessionId(input?.sessionId);
}

function isPlanSlashCommand(prompt) {
  return /^\/plan(?:\s|$)/u.test(prompt);
}

function getOrchestrator(sessionId) {
  if (!orchestratorBySession.has(sessionId)) {
    return null;
  }
  return orchestratorBySession.get(sessionId);
}

function setOrchestrator(sessionId, orchestrator) {
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return;
  }

  if (orchestrator === null) {
    orchestratorBySession.delete(sessionId);
    return;
  }

  setBoundedContext(
    orchestratorBySession,
    sessionId,
    orchestrator,
    MAX_ACTIVE_SESSION_CONTEXTS,
  );
}

function clearOrchestrator(sessionId) {
  setOrchestrator(sessionId, null);
  reviewerFeedbackBySession.delete(sessionId);
}

function getReviewerFeedback(sessionId) {
  if (!reviewerFeedbackBySession.has(sessionId)) {
    reviewerFeedbackBySession.set(sessionId, new Map());
  }
  return reviewerFeedbackBySession.get(sessionId);
}

function recordReviewerFeedback(sessionId, reviewerId, feedback) {
  const feedbackMap = getReviewerFeedback(sessionId);
  feedbackMap.set(reviewerId, feedback);
}

/**
 * Hash a string for plan change detection
 * Simple hash for MVP - could be upgraded to crypto.subtle.digest
 */
function simpleHash(text) {
  if (!text) return "null";

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    /**
     * Detect /plan slash command and initialize orchestration
     */
    onUserPromptSubmitted: async (input, invocation) => {
      const prompt = normalizePrompt(input.prompt);
      const sessionId = readSessionId(input);

      if (!prompt || !isPlanSlashCommand(prompt)) {
        // Not a plan command - clean up if we have orchestration
        if (sessionId && orchestratorBySession.has(sessionId)) {
          clearOrchestrator(sessionId);
        }
        return;
      }

      if (!sessionId) {
        return;
      }

      // Check if orchestrator is enabled via rollout flag
      if (!readPlanReviewOrchestratorEnabled(invocation?.config)) {
        await session.log(
          "plan-orchestrator: disabled by feature flag",
          { ephemeral: true }
        );
        return;
      }

      // Initialize orchestrator for this session
      const orchestrator = new PlanOrchestrator({
        maxRounds: 3, // Configurable in future
      });

      orchestrator.initialize(DEFAULT_PLAN_REVIEWERS);

      setOrchestrator(sessionId, orchestrator);
      reviewerFeedbackBySession.set(sessionId, new Map());

      await session.log(
        `plan-orchestrator: initialized with ${DEFAULT_PLAN_REVIEWERS.length} reviewers (max ${orchestrator.state.maxRounds} rounds)`,
        { ephemeral: true }
      );
    },

    /**
     * Inject reviewer context when a reviewer agent starts
     */
    onSubagentStart: async (input) => {
      const sessionId = readSessionId(input);
      if (!sessionId) {
        return;
      }

      const orchestrator = getOrchestrator(sessionId);
      if (!orchestrator || !orchestrator.state?.active) {
        return;
      }

      // Parse agent metadata to detect reviewer (consistent with plan-review-policy)
      const childMetadata = readSharedChildMetadata(input, { trimValues: true });

      if (!isReviewerAgent(childMetadata)) {
        return;
      }

      // Match to known reviewer ID
      const reviewerId = matchReviewerAgent(
        childMetadata,
        orchestrator.state.reviewers
      );

      if (!reviewerId) {
        // Not one of our tracked reviewers, skip
        return;
      }

      // Generate and inject reviewer context
      const reviewerContext = generateReviewerContext(
        orchestrator,
        orchestrator.state.round,
        orchestrator.state.reviewers.size
      );

      await session.log(
        `plan-orchestrator: injecting reviewer context for ${reviewerId} (round ${orchestrator.state.round})`,
        { ephemeral: true }
      );

      return { additionalContext: reviewerContext };
    },

    /**
     * Parse reviewer responses and track approvals
     */
    onSubagentEnd: async (input) => {
      const sessionId = readSessionId(input);
      if (!sessionId) {
        return;
      }

      const orchestrator = getOrchestrator(sessionId);
      if (!orchestrator || !orchestrator.state?.active) {
        return;
      }

      // Parse agent metadata (consistent with plan-review-policy)
      const childMetadata = readSharedChildMetadata(input, { trimValues: true });

      if (!isReviewerAgent(childMetadata)) {
        return;
      }

      const reviewerId = matchReviewerAgent(
        childMetadata,
        orchestrator.state.reviewers
      );

      if (!reviewerId) {
        return;
      }

      // Try to extract response from input
      // NOTE: SDK surface unclear - may need alternative detection method
      const response = input?.response || input?.output || "";

      if (!hasVerdictToken(response)) {
        // No verdict token found - treat as ambiguous/missing
        await session.log(
          `plan-orchestrator: ${reviewerId} response missing approval token - treating as rejection`,
          { ephemeral: true }
        );

        orchestrator.recordApproval(reviewerId, false, {
          reason: "No approval token in response",
        });

        recordReviewerFeedback(sessionId, reviewerId, "No clear verdict provided");
      } else {
        // Parse verdict
        const parseResult = parseReviewerResponse(response);
        const approved = parseResult.verdict === "approved";

        orchestrator.recordApproval(reviewerId, approved, {
          reason: parseResult.reason,
          confidence: parseResult.confidence,
        });

        const feedback = extractFeedback(response);
        if (feedback) {
          recordReviewerFeedback(sessionId, reviewerId, feedback);
        }

        await session.log(
          `plan-orchestrator: ${reviewerId} → ${parseResult.verdict} (${parseResult.reason})`,
          { ephemeral: true }
        );
      }

      // Check if all reviewers have voted in this round
      if (orchestrator.getPendingCount() === 0) {
        const completionStatus = orchestrator.isComplete();

        if (completionStatus.complete) {
          await session.log(
            `plan-orchestrator: ✅ ${completionStatus.reason}`,
            { ephemeral: true }
          );
          clearOrchestrator(sessionId);
        } else if (orchestrator.anyRejected()) {
          // Need revisions - prepare context for next round
          const feedback = getReviewerFeedback(sessionId);
          const revisionContext = generateRevisionRequest(feedback, orchestrator);

          await session.log(
            `plan-orchestrator: Revisions needed - starting round ${orchestrator.state.round + 1}`,
            { ephemeral: true }
          );

          orchestrator.nextRound();
          getReviewerFeedback(sessionId).clear();

          // Inject revision request via context
          return { additionalContext: revisionContext };
        }
      } else {
        // Log current round status
        await session.log(
          `plan-orchestrator: Round ${orchestrator.state.round} status:\n${formatApprovalSummary(orchestrator)}`,
          { ephemeral: true }
        );
      }
    },

    /**
     * Clean up state on session end
     */
    onSessionEnd: async (input) => {
      const sessionId = readSessionId(input);
      if (sessionId) {
        clearOrchestrator(sessionId);
      }
    },
  },
});
