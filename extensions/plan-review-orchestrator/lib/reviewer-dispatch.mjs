/**
 * Reviewer dispatch and context injection
 */

/**
 * Dispatch reviewers for a review round
 * 
 * This function generates context prompts that will be injected via hooks.
 * The actual dispatch happens through SDK context injection on subagent start.
 * 
 * @param {object} orchestrator - PlanOrchestrator instance
 * @param {number} round - Current round number
 * @param {number} totalRounds - Total reviewers
 * @returns {string} Context prompt for reviewer guidance
 */
export function generateReviewerContext(orchestrator, round, totalRound) {
  if (!orchestrator.state) {
    return "";
  }

  const reviewerCount = orchestrator.state.reviewers.size;
  const roundInfo = `Round ${round} of ${orchestrator.state.maxRounds}`;

  const instructions = [
    `You are a plan reviewer (1 of ${reviewerCount} reviewers in ${roundInfo}).`,
    "",
    "Your role:",
    "1. Review the plan for clarity, completeness, and feasibility",
    "2. Check that tasks are concrete, dependencies are clear, and validation steps are present",
    "3. Ensure the plan is implementation-ready",
    "",
    "Provide your detailed feedback and end with exactly one of:",
    "- [PLAN-APPROVED] — Plan is ready to implement",
    "- [PLAN-REVISE-NEEDED] — Revisions are required before approval",
    "",
    "All reviewers must approve in the same round before the plan is considered complete.",
  ].join("\n");

  return instructions;
}

/**
 * Generate revision request for planner
 * 
 * @param {object} reviewerFeedback - Map of reviewerId -> feedback
 * @param {object} orchestrator - PlanOrchestrator instance
 * @returns {string} Context for planner revision
 */
export function generateRevisionRequest(reviewerFeedback, orchestrator) {
  if (!orchestrator.state) {
    return "";
  }

  const feedbackEntries = Array.from(reviewerFeedback.entries())
    .map(([reviewerId, feedback]) => {
      return `**${reviewerId}:**\n${feedback}`;
    })
    .join("\n\n");

  const instructions = [
    `Plan reviewers have provided feedback in round ${orchestrator.state.round}.`,
    "",
    "Please revise the plan to address the following feedback points:",
    "",
    feedbackEntries,
    "",
    "After revision, the plan will be reviewed again by all reviewers.",
  ].join("\n");

  return instructions;
}

/**
 * Determine if a subagent response looks like a reviewer
 * 
 * Checks metadata to detect review/reviewer agent names
 * @param {object} childMetadata - Child agent metadata from hook input
 * @returns {boolean}
 */
export function isReviewerAgent(childMetadata) {
  if (!childMetadata || typeof childMetadata !== "string") {
    return false;
  }

  const normalized = childMetadata.toLowerCase();

  // Check for reviewer-related keywords
  return (
    normalized.includes("review") ||
    normalized.includes("reviewer") ||
    normalized.includes("code-review")
  );
}

/**
 * Match reviewer agent to an orchestrator reviewer ID
 * 
 * @param {string} agentName - Agent name from hook input
 * @param {Map} reviewerMap - Map of reviewerIds from orchestrator
 * @returns {string|null} Matched reviewer ID or null
 */
export function matchReviewerAgent(agentName, reviewerMap) {
  if (!agentName || !reviewerMap || reviewerMap.size === 0) {
    return null;
  }

  const normalized = agentName.toLowerCase();

  // Check for exact or partial matches
  for (const reviewerId of reviewerMap.keys()) {
    const idNormalized = reviewerId.toLowerCase();

    // Check for exact match
    if (normalized === idNormalized) {
      return reviewerId;
    }

    // Check for keyword inclusion (e.g., agent name contains model keywords)
    if (
      (normalized.includes("gpt") && idNormalized.includes("gpt")) ||
      (normalized.includes("claude") && idNormalized.includes("claude"))
    ) {
      // Check version/model match
      const gptMatch =
        normalized.includes("gpt") && idNormalized.includes("gpt");
      const claudeMatch =
        normalized.includes("claude") && idNormalized.includes("claude");

      if (gptMatch || claudeMatch) {
        return reviewerId;
      }
    }

    // Fallback: check for agent display names (e.g., "Jason", "Freddy")
    if (
      (idNormalized.includes("gpt") && normalized.includes("jason")) ||
      (idNormalized.includes("claude") && normalized.includes("freddy"))
    ) {
      return reviewerId;
    }
  }

  return null;
}

/**
 * Format approval summary for logging
 * @param {object} orchestrator - PlanOrchestrator instance
 * @returns {string}
 */
export function formatApprovalSummary(orchestrator) {
  if (!orchestrator.state) {
    return "Orchestrator not initialized";
  }

  const states = orchestrator.getReviewerStates();
  const entries = Array.from(states.entries())
    .map(([id, status]) => `  ${id}: ${status}`)
    .join("\n");

  return (
    `Round ${orchestrator.state.round}/${orchestrator.state.maxRounds}:\n` +
    entries
  );
}

/**
 * Format detailed response for logging
 * @param {object} response - Response object from parseReviewerResponse
 * @returns {string}
 */
export function formatResponseSummary(response) {
  if (!response) {
    return "No response";
  }

  const parts = [response.reason];

  if (response.confidence === "default") {
    parts.push(`(default verdict, confidence: ${response.confidence})`);
  }

  if (response.extracted) {
    parts.push(`Tokens: ${response.extracted}`);
  }

  return parts.join(" | ");
}
