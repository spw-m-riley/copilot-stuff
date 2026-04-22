/**
 * Approval token detection and response parsing
 */

const APPROVAL_PATTERN = /\[PLAN-APPROVED\]/i;
const REJECTION_PATTERN = /\[PLAN-REVISE-NEEDED\]/i;

/**
 * Parse reviewer response to extract approval status
 * 
 * Strict parsing: requires explicit token for approval/rejection.
 * If neither token is found, defaults to rejection (safe default).
 * 
 * @param {string} response - Reviewer's response text
 * @returns {object} { verdict: 'approved'|'rejected', extracted: string, confidence: 'explicit'|'default' }
 */
export function parseReviewerResponse(response) {
  if (!response || typeof response !== "string") {
    return {
      verdict: "rejected",
      extracted: "",
      confidence: "default",
      reason: "Empty or invalid response",
    };
  }

  const hasApproval = APPROVAL_PATTERN.test(response);
  const hasRejection = REJECTION_PATTERN.test(response);

  if (hasApproval && hasRejection) {
    // Ambiguous: both tokens present - treat as rejection (safer)
    return {
      verdict: "rejected",
      extracted: extractTokenMarkers(response),
      confidence: "explicit",
      reason: "Both [PLAN-APPROVED] and [PLAN-REVISE-NEEDED] found - ambiguous",
    };
  }

  if (hasApproval) {
    return {
      verdict: "approved",
      extracted: extractTokenMarkers(response),
      confidence: "explicit",
      reason: "[PLAN-APPROVED] token found",
    };
  }

  if (hasRejection) {
    return {
      verdict: "rejected",
      extracted: extractTokenMarkers(response),
      confidence: "explicit",
      reason: "[PLAN-REVISE-NEEDED] token found",
    };
  }

  // No token found - treat as rejection with default confidence
  return {
    verdict: "rejected",
    extracted: "",
    confidence: "default",
    reason: "No approval token found - explicit [PLAN-APPROVED] or [PLAN-REVISE-NEEDED] required",
  };
}

/**
 * Extract feedback/context around approval tokens
 * Returns lines containing or near the token markers
 * 
 * @param {string} response - Response text
 * @returns {string} Extracted feedback context
 */
export function extractFeedback(response) {
  if (!response || typeof response !== "string") {
    return "";
  }

  const lines = response.split("\n");
  const relevantLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Include lines with tokens and surrounding context (2 lines before/after)
    if (APPROVAL_PATTERN.test(line) || REJECTION_PATTERN.test(line)) {
      const start = Math.max(0, i - 2);
      const end = Math.min(lines.length, i + 3);

      for (let j = start; j < end; j++) {
        if (!relevantLines.includes(lines[j])) {
          relevantLines.push(lines[j]);
        }
      }
    }
  }

  return relevantLines.join("\n").trim();
}

/**
 * Extract just the token markers from response
 * @param {string} response - Response text
 * @returns {string} Extracted tokens
 */
export function extractTokenMarkers(response) {
  if (!response || typeof response !== "string") {
    return "";
  }

  const tokens = [];

  if (APPROVAL_PATTERN.test(response)) {
    tokens.push("[PLAN-APPROVED]");
  }

  if (REJECTION_PATTERN.test(response)) {
    tokens.push("[PLAN-REVISE-NEEDED]");
  }

  return tokens.join(" + ");
}

/**
 * Check if response contains any approval tokens
 * @param {string} response - Response text
 * @returns {boolean}
 */
export function hasApprovalToken(response) {
  if (!response || typeof response !== "string") return false;
  return APPROVAL_PATTERN.test(response);
}

/**
 * Check if response contains any rejection tokens
 * @param {string} response - Response text
 * @returns {boolean}
 */
export function hasRejectionToken(response) {
  if (!response || typeof response !== "string") return false;
  return REJECTION_PATTERN.test(response);
}

/**
 * Check if response contains any verdict token
 * @param {string} response - Response text
 * @returns {boolean}
 */
export function hasVerdictToken(response) {
  if (!response || typeof response !== "string") return false;
  return APPROVAL_PATTERN.test(response) || REJECTION_PATTERN.test(response);
}
