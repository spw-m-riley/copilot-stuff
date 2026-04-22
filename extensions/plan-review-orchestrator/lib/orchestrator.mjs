/**
 * Core orchestrator state machine for plan review coordination
 */

/**
 * PlanOrchestrator manages the multi-round approval state machine.
 * 
 * State transitions:
 * - Initialize: Set up reviewers, round 1
 * - Round N: Track reviewer approvals
 * - Next Round: Reset states for re-review
 * - Complete: All reviewers approved or max rounds reached
 */
export class PlanOrchestrator {
  constructor(config = {}) {
    this.maxRounds = config.maxRounds ?? 3;
    this.approvalTokens = config.approvalTokens ?? ["[PLAN-APPROVED]"];
    this.rejectionTokens = config.rejectionTokens ?? ["[PLAN-REVISE-NEEDED]"];
    this.timeoutMs = config.timeoutMs ?? 30000;

    // Runtime state
    this.state = null;
  }

  /**
   * Initialize orchestrator with reviewer list
   * @param {string[]} reviewerIds - List of reviewer agent IDs (e.g., ["gpt-5.3-codex", "claude-sonnet-4.6"])
   */
  initialize(reviewerIds) {
    if (!Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      throw new Error("Invalid reviewerIds: must be non-empty array");
    }

    this.state = {
      active: true,
      round: 1,
      reviewers: new Map(reviewerIds.map((id) => [id, "pending"])),
      maxRounds: this.maxRounds,
      startTime: Date.now(),
      responses: [], // Track all reviewer responses and timestamps
      planHash: null,
    };
  }

  /**
   * Record a reviewer's approval/rejection
   * @param {string} reviewerId - Reviewer agent ID
   * @param {boolean} approved - True if approved, false if rejected/timeout
   * @param {object} meta - Optional metadata (feedback, timestamp, etc)
   */
  recordApproval(reviewerId, approved, meta = {}) {
    if (!this.state) {
      throw new Error("Orchestrator not initialized");
    }

    if (!this.state.reviewers.has(reviewerId)) {
      throw new Error(`Unknown reviewer: ${reviewerId}`);
    }

    const status = approved ? "approved" : "rejected";
    this.state.reviewers.set(reviewerId, status);

    this.state.responses.push({
      reviewerId,
      status,
      round: this.state.round,
      timestamp: Date.now(),
      ...meta,
    });
  }

  /**
   * Check if all reviewers have approved
   * @returns {boolean}
   */
  allApproved() {
    if (!this.state) return false;

    for (const status of this.state.reviewers.values()) {
      if (status !== "approved") {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if any reviewer has rejected
   * @returns {boolean}
   */
  anyRejected() {
    if (!this.state) return false;

    for (const status of this.state.reviewers.values()) {
      if (status === "rejected") {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if orchestration is complete
   * @returns {object} { complete: boolean, reason: string }
   */
  isComplete() {
    if (!this.state) {
      return { complete: false, reason: "Not initialized" };
    }

    if (this.allApproved()) {
      return {
        complete: true,
        reason: `All reviewers approved after ${this.state.round} round(s)`,
      };
    }

    if (this.state.round >= this.state.maxRounds) {
      return {
        complete: true,
        reason: `Max rounds (${this.state.maxRounds}) reached`,
      };
    }

    return { complete: false, reason: "Still reviewing" };
  }

  /**
   * Get current reviewer states
   * @returns {Map<string, string>}
   */
  getReviewerStates() {
    if (!this.state) return new Map();
    return new Map(this.state.reviewers);
  }

  /**
   * Get count of pending reviewers
   * @returns {number}
   */
  getPendingCount() {
    if (!this.state) return 0;

    let count = 0;
    for (const status of this.state.reviewers.values()) {
      if (status === "pending") {
        count++;
      }
    }
    return count;
  }

  /**
   * Prepare for next review round
   * Reset all reviewers to pending state, increment round
   */
  nextRound() {
    if (!this.state) {
      throw new Error("Orchestrator not initialized");
    }

    if (this.state.round >= this.state.maxRounds) {
      throw new Error(
        `Cannot advance: already at max rounds (${this.state.maxRounds})`
      );
    }

    this.state.round++;

    for (const reviewerId of this.state.reviewers.keys()) {
      this.state.reviewers.set(reviewerId, "pending");
    }
  }

  /**
   * Update plan hash to detect revisions
   * @param {string} hash - Hash of current plan
   */
  setPlanHash(hash) {
    if (!this.state) {
      throw new Error("Orchestrator not initialized");
    }
    this.state.planHash = hash;
  }

  /**
   * Get current state snapshot for debugging
   * @returns {object}
   */
  getStateSnapshot() {
    if (!this.state) return null;

    return {
      active: this.state.active,
      round: this.state.round,
      maxRounds: this.state.maxRounds,
      reviewers: Object.fromEntries(this.state.reviewers),
      planHash: this.state.planHash,
      startTime: this.state.startTime,
      responses: this.state.responses,
    };
  }

  /**
   * Clear all state
   */
  clear() {
    this.state = null;
  }
}
