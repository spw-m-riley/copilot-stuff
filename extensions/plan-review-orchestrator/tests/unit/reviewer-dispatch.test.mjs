/**
 * Unit tests for approval token parsing and reviewer dispatch
 */

import {
  parseReviewerResponse,
  extractFeedback,
  extractTokenMarkers,
  hasApprovalToken,
  hasRejectionToken,
  hasVerdictToken,
} from "../../lib/approval-tracker.mjs";

import {
  isReviewerAgent,
  matchReviewerAgent,
  generateReviewerContext,
  generateRevisionRequest,
  formatApprovalSummary,
  formatResponseSummary,
} from "../../lib/reviewer-dispatch.mjs";
import {
  DEFAULT_REVIEWER_ROLE_IDS,
  getReviewerRole,
  resolveReviewerRole,
} from "../../lib/reviewer-roles.mjs";

import { PlanOrchestrator } from "../../lib/orchestrator.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `Assertion failed: ${message}\nExpected: ${expected}\nActual: ${actual}`
    );
  }
}

// ============================================================================
// Approval Token Tests
// ============================================================================

/**
 * Test: Parse explicit approval
 */
export function testParseExplicitApproval() {
  const response =
    "The plan looks well-structured. All steps are clear. [PLAN-APPROVED]";

  const result = parseReviewerResponse(response);

  assertEqual(result.verdict, "approved", "Should be approved");
  assertEqual(result.confidence, "explicit", "Should be explicit");

  console.log("✓ testParseExplicitApproval passed");
}

/**
 * Test: Parse explicit rejection
 */
export function testParseExplicitRejection() {
  const response =
    "The dependencies are unclear. Needs clarification. [PLAN-REVISE-NEEDED]";

  const result = parseReviewerResponse(response);

  assertEqual(result.verdict, "rejected", "Should be rejected");
  assertEqual(result.confidence, "explicit", "Should be explicit");

  console.log("✓ testParseExplicitRejection passed");
}

/**
 * Test: Parse case-insensitive
 */
export function testParseCaseInsensitive() {
  const response1 = "Looking good [plan-approved]";
  const response2 = "Needs work [PLAN-REVISE-NEEDED]";
  const response3 = "Almost there [plan-revise-needed]";

  const result1 = parseReviewerResponse(response1);
  const result2 = parseReviewerResponse(response2);
  const result3 = parseReviewerResponse(response3);

  assertEqual(result1.verdict, "approved", "Should parse lowercase approved");
  assertEqual(result2.verdict, "rejected", "Should parse uppercase rejected");
  assertEqual(result3.verdict, "rejected", "Should parse mixed case rejected");

  console.log("✓ testParseCaseInsensitive passed");
}

/**
 * Test: Parse ambiguous (both tokens)
 */
export function testParseAmbiguous() {
  const response =
    "Good structure but missing details [PLAN-APPROVED] yet [PLAN-REVISE-NEEDED]";

  const result = parseReviewerResponse(response);

  assertEqual(result.verdict, "rejected", "Should be rejected when ambiguous");
  assertEqual(result.confidence, "explicit", "Should still be explicit");
  assert(
    result.reason.includes("ambiguous"),
    "Should mention ambiguity in reason"
  );

  console.log("✓ testParseAmbiguous passed");
}

/**
 * Test: Parse missing token
 */
export function testParseMissingToken() {
  const response = "The plan looks pretty good, but I have some concerns.";

  const result = parseReviewerResponse(response);

  assertEqual(result.verdict, "rejected", "Should default to rejected");
  assertEqual(result.confidence, "default", "Should be default confidence");
  assert(
    result.reason.includes("token"),
    "Should mention missing token"
  );

  console.log("✓ testParseMissingToken passed");
}

/**
 * Test: Parse empty response
 */
export function testParseEmptyResponse() {
  const result = parseReviewerResponse("");

  assertEqual(result.verdict, "rejected", "Empty should be rejected");
  assertEqual(result.confidence, "default", "Should be default confidence");

  console.log("✓ testParseEmptyResponse passed");
}

/**
 * Test: Parse null response
 */
export function testParseNullResponse() {
  const result = parseReviewerResponse(null);

  assertEqual(result.verdict, "rejected", "Null should be rejected");
  assertEqual(result.confidence, "default", "Should be default confidence");

  console.log("✓ testParseNullResponse passed");
}

/**
 * Test: Extract feedback around approval token
 */
export function testExtractFeedback() {
  const response = `Plan structure is good.
Dependencies are well-defined.
Timeline seems reasonable.
[PLAN-APPROVED]
Overall this is well thought out.`;

  const feedback = extractFeedback(response);

  assert(feedback.length > 0, "Should extract feedback");
  assert(feedback.includes("[PLAN-APPROVED]"), "Should include token");
  assert(
    feedback.includes("Dependencies are well-defined"),
    "Should include context"
  );

  console.log("✓ testExtractFeedback passed");
}

/**
 * Test: Extract token markers
 */
export function testExtractTokenMarkers() {
  const response1 = "This is good [PLAN-APPROVED]";
  const response2 = "This needs work [PLAN-REVISE-NEEDED]";
  const response3 = "No token here";

  assertEqual(
    extractTokenMarkers(response1),
    "[PLAN-APPROVED]",
    "Should extract approval token"
  );
  assertEqual(
    extractTokenMarkers(response2),
    "[PLAN-REVISE-NEEDED]",
    "Should extract rejection token"
  );
  assertEqual(extractTokenMarkers(response3), "", "Should return empty for no token");

  console.log("✓ testExtractTokenMarkers passed");
}

/**
 * Test: Has approval token
 */
export function testHasApprovalToken() {
  assert(
    hasApprovalToken("Looks good [PLAN-APPROVED]"),
    "Should detect approval"
  );
  assert(
    !hasApprovalToken("Needs work [PLAN-REVISE-NEEDED]"),
    "Should not detect approval in rejection"
  );
  assert(!hasApprovalToken("No token"), "Should not detect missing token");

  console.log("✓ testHasApprovalToken passed");
}

/**
 * Test: Has rejection token
 */
export function testHasRejectionToken() {
  assert(
    hasRejectionToken("Needs work [PLAN-REVISE-NEEDED]"),
    "Should detect rejection"
  );
  assert(
    !hasRejectionToken("Looks good [PLAN-APPROVED]"),
    "Should not detect rejection in approval"
  );
  assert(!hasRejectionToken("No token"), "Should not detect missing token");

  console.log("✓ testHasRejectionToken passed");
}

/**
 * Test: Has verdict token
 */
export function testHasVerdictToken() {
  assert(
    hasVerdictToken("Looks good [PLAN-APPROVED]"),
    "Should detect approval verdict"
  );
  assert(
    hasVerdictToken("Needs work [PLAN-REVISE-NEEDED]"),
    "Should detect rejection verdict"
  );
  assert(!hasVerdictToken("No token"), "Should not detect missing verdict");

  console.log("✓ testHasVerdictToken passed");
}

// ============================================================================
// Reviewer Agent Detection Tests
// ============================================================================

/**
 * Test: Detect reviewer agent from metadata
 */
export function testIsReviewerAgent() {
  assert(
    isReviewerAgent("code-review"),
    "Should detect code-review"
  );
  assert(
    isReviewerAgent("GPT-5.3-Codex Reviewer Agent"),
    "Should detect 'Reviewer' keyword"
  );
  assert(
    isReviewerAgent("review-bot"),
    "Should detect 'review' prefix"
  );
  assert(
    !isReviewerAgent("implementation-agent"),
    "Should not detect non-reviewer"
  );
  assert(
    !isReviewerAgent("planner"),
    "Should not detect planner"
  );

  console.log("✓ testIsReviewerAgent passed");
}

/**
 * Test: Match reviewer agent to ID
 */
export function testMatchReviewerAgent() {
  const reviewerMap = new Map([
    ["jason", "pending"],
    ["freddy", "pending"],
  ]);

  const match1 = matchReviewerAgent("gpt-5.3-codex", reviewerMap);
  const match2 = matchReviewerAgent("claude-sonnet-4.6", reviewerMap);
  const match3 = matchReviewerAgent("unknown-model", reviewerMap);

  assertEqual(match1, "jason", "Should match GPT model to Jason role");
  assertEqual(match2, "freddy", "Should match Claude model to Freddy role");
  assertEqual(match3, null, "Should return null for unknown");

  console.log("✓ testMatchReviewerAgent passed");
}

/**
 * Test: Match reviewer with partial name
 */
export function testMatchReviewerPartial() {
  const reviewerMap = new Map([
    ["jason", "pending"],
    ["freddy", "pending"],
  ]);

  const match1 = matchReviewerAgent("GPT Review Agent", reviewerMap);
  const match2 = matchReviewerAgent("Claude Reviewer", reviewerMap);

  assertEqual(match1, "jason", "Should match partial GPT");
  assertEqual(match2, "freddy", "Should match partial Claude");

  console.log("✓ testMatchReviewerPartial passed");
}

/**
 * Test: Match reviewer with null map
 */
export function testMatchReviewerNullMap() {
  const match = matchReviewerAgent("gpt-5.3-codex", null);

  assertEqual(match, null, "Should return null for null map");

  console.log("✓ testMatchReviewerNullMap passed");
}

// ============================================================================
// Context Generation Tests
// ============================================================================

/**
 * Test: Generate reviewer context
 */
export function testGenerateReviewerContext() {
  const orchestrator = new PlanOrchestrator();
  orchestrator.initialize(["reviewer1", "reviewer2"]);

  const context = generateReviewerContext(orchestrator, 1, 3, "jason");

  assert(context.length > 0, "Should generate non-empty context");
  assert(context.includes("plan review"), "Should mention plan review");
  assert(context.includes("Jason"), "Should include reviewer display name");
  assert(
    context.includes("execution details"),
    "Should include role-specific rubric guidance"
  );
  assert(context.includes("[PLAN-APPROVED]"), "Should include approval token");
  assert(context.includes("[PLAN-REVISE-NEEDED]"), "Should include rejection token");
  assert(context.includes("Round 1"), "Should mention round 1");

  console.log("✓ testGenerateReviewerContext passed");
}

/**
 * Test: Generate reviewer context round info
 */
export function testGenerateReviewerContextRounds() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 5 });
  orchestrator.initialize(["a", "b", "c"]);

  const context1 = generateReviewerContext(orchestrator, 1, 5, "jason");
  const context3 = generateReviewerContext(orchestrator, 3, 5, "freddy");

  assert(context1.includes("Round 1 of 5"), "Should include round 1 of 5");
  assert(context3.includes("Round 3 of 5"), "Should include round 3 of 5");
  assert(context1.includes("1 of 3 reviewers"), "Should mention reviewer count");

  console.log("✓ testGenerateReviewerContextRounds passed");
}

/**
 * Test: Generate revision request
 */
export function testGenerateRevisionRequest() {
  const orchestrator = new PlanOrchestrator();
  orchestrator.initialize(["reviewer1", "reviewer2"]);

  const feedback = new Map([
    ["reviewer1", "Dependencies are unclear"],
    ["reviewer2", "Timeline needs adjustment"],
  ]);

  const request = generateRevisionRequest(feedback, orchestrator);

  assert(request.length > 0, "Should generate non-empty request");
  assert(request.includes("revision"), "Should mention revision");
  assert(request.includes("reviewer1"), "Should include reviewer1 feedback");
  assert(request.includes("reviewer2"), "Should include reviewer2 feedback");
  assert(request.includes("round 1"), "Should mention round 1");

  console.log("✓ testGenerateRevisionRequest passed");
}

/**
 * Test: Format approval summary
 */
export function testFormatApprovalSummary() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["a", "b", "c"]);

  orchestrator.recordApproval("a", true);
  orchestrator.recordApproval("b", false);

  const summary = formatApprovalSummary(orchestrator);

  assert(summary.length > 0, "Should generate non-empty summary");
  assert(summary.includes("Round 1/3"), "Should include round info");
  assert(summary.includes("a: approved"), "Should include a approval");
  assert(summary.includes("b: rejected"), "Should include b rejection");
  assert(summary.includes("c: pending"), "Should include c pending");

  console.log("✓ testFormatApprovalSummary passed");
}

/**
 * Test: Format response summary
 */
export function testFormatResponseSummary() {
  const response = {
    verdict: "approved",
    confidence: "explicit",
    reason: "[PLAN-APPROVED] token found",
    extracted: "[PLAN-APPROVED]",
  };

  const summary = formatResponseSummary(response);

  assert(summary.length > 0, "Should generate non-empty summary");
  assert(summary.includes("[PLAN-APPROVED]"), "Should include token");
  assert(summary.includes("token found"), "Should include reason");

  console.log("✓ testFormatResponseSummary passed");
}

/**
 * Test: Format response summary with default verdict
 */
export function testFormatResponseSummaryDefault() {
  const response = {
    verdict: "rejected",
    confidence: "default",
    reason: "No approval token found",
  };

  const summary = formatResponseSummary(response);

  assert(summary.includes("default"), "Should mention default verdict");
  assert(summary.includes("No approval token"), "Should include reason");

  console.log("✓ testFormatResponseSummaryDefault passed");
}

// ============================================================================
// Edge Cases and Integration Tests
// ============================================================================

/**
 * Test: Parse response with extra whitespace
 */
export function testParseWithWhitespace() {
  const response1 = "  [PLAN-APPROVED]  ";
  const response2 = "\n\n[PLAN-REVISE-NEEDED]\n\n";

  const result1 = parseReviewerResponse(response1);
  const result2 = parseReviewerResponse(response2);

  assertEqual(result1.verdict, "approved", "Should handle leading/trailing space");
  assertEqual(result2.verdict, "rejected", "Should handle newlines");

  console.log("✓ testParseWithWhitespace passed");
}

/**
 * Test: Parse response with multiple lines of context
 */
export function testParseMultilineContext() {
  const response = `Looking at the plan, I have several observations:

1. The structure is logical and well-organized
2. Dependencies are clearly stated
3. Timeline has some concerns

However, overall this is good work.

[PLAN-APPROVED]

Let me know if you need any clarification.`;

  const result = parseReviewerResponse(response);

  assertEqual(result.verdict, "approved", "Should parse approval in context");
  assertEqual(result.confidence, "explicit", "Should be explicit verdict");

  console.log("✓ testParseMultilineContext passed");
}

/**
 * Test: Extract feedback preserves context
 */
export function testExtractFeedbackPreservesContext() {
  const response = `Initial comments about structure.
More context here.
This is important.
[PLAN-APPROVED]
Concluding remarks.
Final thoughts.`;

  const feedback = extractFeedback(response);

  assert(
    feedback.includes("[PLAN-APPROVED]"),
    "Should include the token"
  );
  assert(
    feedback.includes("This is important"),
    "Should include surrounding context"
  );

  console.log("✓ testExtractFeedbackPreservesContext passed");
}

/**
 * Test: Extract tokens from both approved and rejected mixed
 */
export function testExtractMixedTokens() {
  const response =
    "Good parts here [PLAN-APPROVED] but also issues [PLAN-REVISE-NEEDED]";

  const tokens = extractTokenMarkers(response);

  assert(tokens.includes("[PLAN-APPROVED]"), "Should include approval");
  assert(tokens.includes("[PLAN-REVISE-NEEDED]"), "Should include rejection");
  assert(tokens.includes("+"), "Should separate with +");

  console.log("✓ testExtractMixedTokens passed");
}

/**
 * Test: Match reviewer with display names
 */
export function testMatchReviewerDisplayNames() {
  const reviewerMap = new Map([
    ["jason", "pending"],
    ["freddy", "pending"],
  ]);

  // Jason is typically used for GPT
  const match1 = matchReviewerAgent("Jason", reviewerMap);
  // Freddy is typically used for Claude
  const match2 = matchReviewerAgent("Freddy", reviewerMap);

  assertEqual(match1, "jason", "Should match Jason display name to role");
  assertEqual(match2, "freddy", "Should match Freddy display name to role");

  console.log("✓ testMatchReviewerDisplayNames passed");
}

/**
 * Test: Reviewer role registry contract
 */
export function testReviewerRoleRegistryContract() {
  assertEqual(
    DEFAULT_REVIEWER_ROLE_IDS.join(","),
    "jason,freddy",
    "Should expose stable default reviewer role ids"
  );

  const jason = getReviewerRole("jason");

  assert(jason, "Should return Jason role");
  assertEqual(jason.id, "jason", "Should preserve stable role id");
  assertEqual(jason.displayName, "Jason", "Should expose display name");
  assert(
    jason.aliases.includes("gpt-5.3-codex"),
    "Should include model alias without making it the role id"
  );
  assert(
    jason.persona.includes("execution details"),
    "Should expose persona guidance"
  );
  assert(
    jason.rubric.length > 0,
    "Should expose rubric guidance"
  );
  assert(
    jason.preferredModels.includes("gpt-5.3-codex"),
    "Should expose preferred model hints"
  );

  console.log("✓ testReviewerRoleRegistryContract passed");
}

/**
 * Test: Resolve reviewer role aliases
 */
export function testResolveReviewerRoleAlias() {
  const resolvedJason = resolveReviewerRole(" GPT-5.3-Codex ");
  const resolvedFreddy = resolveReviewerRole("freddy");
  const resolvedUnknown = resolveReviewerRole("unknown-reviewer");

  assertEqual(resolvedJason?.id, "jason", "Should resolve model hint to Jason role");
  assertEqual(resolvedFreddy?.id, "freddy", "Should resolve display alias to Freddy role");
  assertEqual(resolvedUnknown, null, "Should return null for unknown aliases");

  console.log("✓ testResolveReviewerRoleAlias passed");
}

/**
 * Test: Is reviewer agent case insensitive
 */
export function testIsReviewerAgentCaseInsensitive() {
  assert(
    isReviewerAgent("CODE-REVIEW"),
    "Should detect uppercase code-review"
  );
  assert(
    isReviewerAgent("Code-Review"),
    "Should detect mixed case Code-Review"
  );
  assert(
    isReviewerAgent("REVIEWER-AGENT"),
    "Should detect uppercase REVIEWER-AGENT"
  );

  console.log("✓ testIsReviewerAgentCaseInsensitive passed");
}

/**
 * Test: Parse response with unicode characters
 */
export function testParseWithUnicode() {
  const response = "Plan looks great! 🎉 [PLAN-APPROVED] ✓";

  const result = parseReviewerResponse(response);

  assertEqual(result.verdict, "approved", "Should handle unicode");

  console.log("✓ testParseWithUnicode passed");
}

/**
 * Test: Extract feedback with unicode
 */
export function testExtractFeedbackUnicode() {
  const response = `Great structure! 👍
All tasks are clear. ✅
[PLAN-APPROVED]
Ready to implement! 🚀`;

  const feedback = extractFeedback(response);

  assert(feedback.length > 0, "Should extract with unicode");
  assert(feedback.includes("[PLAN-APPROVED]"), "Should include token");

  console.log("✓ testExtractFeedbackUnicode passed");
}

/**
 * Test: Integration - parse and track through orchestrator
 */
export function testIntegrationParseAndTrack() {
  const orchestrator = new PlanOrchestrator();
  orchestrator.initialize(["reviewer1", "reviewer2"]);

  const response1 = "This looks good overall. [PLAN-APPROVED]";
  const response2 = "Needs more detail on timeline. [PLAN-REVISE-NEEDED]";

  const parsed1 = parseReviewerResponse(response1);
  const parsed2 = parseReviewerResponse(response2);

  orchestrator.recordApproval(
    "reviewer1",
    parsed1.verdict === "approved",
    { feedback: extractFeedback(response1) }
  );
  orchestrator.recordApproval(
    "reviewer2",
    parsed2.verdict === "approved",
    { feedback: extractFeedback(response2) }
  );

  assertEqual(
    orchestrator.state.reviewers.get("reviewer1"),
    "approved",
    "Should track approval"
  );
  assertEqual(
    orchestrator.state.reviewers.get("reviewer2"),
    "rejected",
    "Should track rejection"
  );

  console.log("✓ testIntegrationParseAndTrack passed");
}

/**
 * Test: Null and undefined edge cases
 */
export function testNullUndefinedEdgeCases() {
  // Test with various null/undefined-like inputs
  assert(
    !hasApprovalToken(undefined),
    "Should handle undefined"
  );
  assert(
    !hasApprovalToken(null),
    "Should handle null"
  );
  assert(
    !hasRejectionToken(undefined),
    "Should handle undefined"
  );
  assert(
    !hasVerdictToken(null),
    "Should handle null"
  );

  const summary = formatResponseSummary(null);
  assert(summary === "No response", "Should handle null response");

  console.log("✓ testNullUndefinedEdgeCases passed");
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log("Running approval/reviewer dispatch tests...\n");

  const tests = [
    testParseExplicitApproval,
    testParseExplicitRejection,
    testParseCaseInsensitive,
    testParseAmbiguous,
    testParseMissingToken,
    testParseEmptyResponse,
    testParseNullResponse,
    testExtractFeedback,
    testExtractTokenMarkers,
    testHasApprovalToken,
    testHasRejectionToken,
    testHasVerdictToken,
    testIsReviewerAgent,
    testMatchReviewerAgent,
    testMatchReviewerPartial,
    testMatchReviewerNullMap,
    testGenerateReviewerContext,
    testGenerateReviewerContextRounds,
    testGenerateRevisionRequest,
    testFormatApprovalSummary,
    testFormatResponseSummary,
    testFormatResponseSummaryDefault,
    testParseWithWhitespace,
    testParseMultilineContext,
    testExtractFeedbackPreservesContext,
    testExtractMixedTokens,
    testMatchReviewerDisplayNames,
    testReviewerRoleRegistryContract,
    testResolveReviewerRoleAlias,
    testIsReviewerAgentCaseInsensitive,
    testParseWithUnicode,
    testExtractFeedbackUnicode,
    testIntegrationParseAndTrack,
    testNullUndefinedEdgeCases,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      test();
      passed++;
    } catch (e) {
      console.error(`✗ ${test.name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n${passed}/${tests.length} tests passed`);
  if (failed > 0) {
    console.error(`${failed} tests failed`);
    process.exit(1);
  }
}

// Run tests if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  await runAllTests();
}
