/**
 * Unit tests for PlanOrchestrator state machine
 */

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

function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      `Assertion failed: ${message}\nExpected: ${expectedStr}\nActual: ${actualStr}`
    );
  }
}

/**
 * Test: Initialize orchestrator
 */
export function testInitialize() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["gpt-5.3-codex", "claude-sonnet-4.6"]);

  assert(orchestrator.state !== null, "State should be initialized");
  assert(orchestrator.state.active === true, "Should be active");
  assertEqual(orchestrator.state.round, 1, "Should start at round 1");
  assertEqual(
    orchestrator.state.reviewers.size,
    2,
    "Should have 2 reviewers"
  );
  assertEqual(
    orchestrator.state.reviewers.get("gpt-5.3-codex"),
    "pending",
    "Reviewer 1 should be pending"
  );
  assertEqual(
    orchestrator.state.reviewers.get("claude-sonnet-4.6"),
    "pending",
    "Reviewer 2 should be pending"
  );

  console.log("✓ testInitialize passed");
}

/**
 * Test: Record single approval
 */
export function testRecordSingleApproval() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["gpt-5.3-codex", "claude-sonnet-4.6"]);

  orchestrator.recordApproval("gpt-5.3-codex", true);

  assertEqual(
    orchestrator.state.reviewers.get("gpt-5.3-codex"),
    "approved",
    "Should be approved"
  );
  assertEqual(
    orchestrator.state.reviewers.get("claude-sonnet-4.6"),
    "pending",
    "Other should still be pending"
  );
  assert(!orchestrator.allApproved(), "All should not be approved yet");

  console.log("✓ testRecordSingleApproval passed");
}

/**
 * Test: All approved
 */
export function testAllApproved() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["gpt-5.3-codex", "claude-sonnet-4.6"]);

  orchestrator.recordApproval("gpt-5.3-codex", true);
  orchestrator.recordApproval("claude-sonnet-4.6", true);

  assert(orchestrator.allApproved(), "All should be approved");

  const completion = orchestrator.isComplete();
  assert(
    completion.complete === true,
    "Should be complete when all approved"
  );

  console.log("✓ testAllApproved passed");
}

/**
 * Test: Any rejected
 */
export function testAnyRejected() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["gpt-5.3-codex", "claude-sonnet-4.6"]);

  orchestrator.recordApproval("gpt-5.3-codex", true);
  orchestrator.recordApproval("claude-sonnet-4.6", false);

  assert(orchestrator.anyRejected(), "Should detect rejection");
  assert(!orchestrator.allApproved(), "Should not all be approved");

  const completion = orchestrator.isComplete();
  assert(!completion.complete, "Should not be complete with rejection");

  console.log("✓ testAnyRejected passed");
}

/**
 * Test: Next round resets states
 */
export function testNextRound() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["gpt-5.3-codex", "claude-sonnet-4.6"]);

  // Round 1: mixed responses
  orchestrator.recordApproval("gpt-5.3-codex", true);
  orchestrator.recordApproval("claude-sonnet-4.6", false);

  assert(orchestrator.state.round === 1, "Should be round 1");

  // Advance to round 2
  orchestrator.nextRound();

  assertEqual(orchestrator.state.round, 2, "Should be round 2");
  assertEqual(
    orchestrator.state.reviewers.get("gpt-5.3-codex"),
    "pending",
    "Should reset to pending"
  );
  assertEqual(
    orchestrator.state.reviewers.get("claude-sonnet-4.6"),
    "pending",
    "Should reset to pending"
  );

  console.log("✓ testNextRound passed");
}

/**
 * Test: Max rounds termination
 */
export function testMaxRoundsTermination() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 2 });
  orchestrator.initialize(["gpt-5.3-codex", "claude-sonnet-4.6"]);

  // Round 1: rejection
  orchestrator.recordApproval("gpt-5.3-codex", false);
  orchestrator.recordApproval("claude-sonnet-4.6", false);

  let completion = orchestrator.isComplete();
  assert(!completion.complete, "Should not be complete after round 1 rejection");

  orchestrator.nextRound();

  // Round 2: still rejection
  orchestrator.recordApproval("gpt-5.3-codex", false);
  orchestrator.recordApproval("claude-sonnet-4.6", false);

  completion = orchestrator.isComplete();
  assert(completion.complete, "Should be complete after max rounds");
  assert(
    completion.reason.includes("Max rounds"),
    "Reason should mention max rounds"
  );

  console.log("✓ testMaxRoundsTermination passed");
}

/**
 * Test: Pending count
 */
export function testPendingCount() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["a", "b", "c"]);

  assertEqual(orchestrator.getPendingCount(), 3, "All should be pending");

  orchestrator.recordApproval("a", true);
  assertEqual(orchestrator.getPendingCount(), 2, "Two should be pending");

  orchestrator.recordApproval("b", true);
  assertEqual(orchestrator.getPendingCount(), 1, "One should be pending");

  orchestrator.recordApproval("c", false);
  assertEqual(orchestrator.getPendingCount(), 0, "None should be pending");

  console.log("✓ testPendingCount passed");
}

/**
 * Test: Plan hash tracking
 */
export function testPlanHashTracking() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["a", "b"]);

  assert(orchestrator.state.planHash === null, "Initial hash should be null");

  orchestrator.setPlanHash("hash1");
  assertEqual(orchestrator.state.planHash, "hash1", "Hash should be set");

  orchestrator.setPlanHash("hash2");
  assertEqual(orchestrator.state.planHash, "hash2", "Hash should update");

  console.log("✓ testPlanHashTracking passed");
}

/**
 * Test: Response tracking
 */
export function testResponseTracking() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["a", "b"]);

  orchestrator.recordApproval("a", true, { feedback: "looks good" });
  orchestrator.recordApproval("b", false, { feedback: "needs work" });

  assertEqual(orchestrator.state.responses.length, 2, "Should have 2 responses");

  const response1 = orchestrator.state.responses[0];
  assertEqual(response1.reviewerId, "a", "Response 1 should be from a");
  assertEqual(response1.status, "approved", "Response 1 should be approved");
  assertEqual(response1.round, 1, "Response 1 should be round 1");

  const response2 = orchestrator.state.responses[1];
  assertEqual(response2.reviewerId, "b", "Response 2 should be from b");
  assertEqual(response2.status, "rejected", "Response 2 should be rejected");

  console.log("✓ testResponseTracking passed");
}

/**
 * Test: State snapshot
 */
export function testStateSnapshot() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["a", "b"]);
  orchestrator.setPlanHash("abc123");

  const snapshot = orchestrator.getStateSnapshot();

  assert(snapshot !== null, "Snapshot should not be null");
  assertEqual(snapshot.round, 1, "Snapshot should include round");
  assertEqual(snapshot.maxRounds, 3, "Snapshot should include maxRounds");
  assertEqual(snapshot.planHash, "abc123", "Snapshot should include planHash");

  console.log("✓ testStateSnapshot passed");
}

/**
 * Test: Clear state
 */
export function testClearState() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["a", "b"]);

  assert(orchestrator.state !== null, "Should have state");

  orchestrator.clear();

  assert(orchestrator.state === null, "State should be cleared");

  console.log("✓ testClearState passed");
}

/**
 * Test: Error handling - invalid reviewers
 */
export function testErrorInvalidReviewers() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });

  try {
    orchestrator.initialize([]);
    assert(false, "Should throw on empty reviewers");
  } catch (e) {
    assert(
      e.message.includes("non-empty"),
      "Error should mention non-empty array"
    );
  }

  console.log("✓ testErrorInvalidReviewers passed");
}

/**
 * Test: Error handling - unknown reviewer
 */
export function testErrorUnknownReviewer() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["a", "b"]);

  try {
    orchestrator.recordApproval("unknown", true);
    assert(false, "Should throw on unknown reviewer");
  } catch (e) {
    assert(e.message.includes("Unknown reviewer"), "Error should mention unknown");
  }

  console.log("✓ testErrorUnknownReviewer passed");
}

/**
 * Test: Error handling - record approval when not initialized
 */
export function testErrorNotInitialized() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });

  try {
    orchestrator.recordApproval("a", true);
    assert(false, "Should throw when not initialized");
  } catch (e) {
    assert(
      e.message.includes("not initialized"),
      "Error should mention not initialized"
    );
  }

  console.log("✓ testErrorNotInitialized passed");
}

/**
 * Test: Error handling - next round when not initialized
 */
export function testErrorNextRoundNotInitialized() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });

  try {
    orchestrator.nextRound();
    assert(false, "Should throw when not initialized");
  } catch (e) {
    assert(
      e.message.includes("not initialized"),
      "Error should mention not initialized"
    );
  }

  console.log("✓ testErrorNextRoundNotInitialized passed");
}

/**
 * Test: Error handling - next round at max rounds
 */
export function testErrorNextRoundAtMax() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 1 });
  orchestrator.initialize(["a"]);

  try {
    orchestrator.nextRound();
    assert(false, "Should throw when at max rounds");
  } catch (e) {
    assert(
      e.message.includes("max rounds"),
      "Error should mention max rounds"
    );
  }

  console.log("✓ testErrorNextRoundAtMax passed");
}

/**
 * Test: Error handling - set plan hash when not initialized
 */
export function testErrorSetPlanHashNotInitialized() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });

  try {
    orchestrator.setPlanHash("hash");
    assert(false, "Should throw when not initialized");
  } catch (e) {
    assert(
      e.message.includes("not initialized"),
      "Error should mention not initialized"
    );
  }

  console.log("✓ testErrorSetPlanHashNotInitialized passed");
}

/**
 * Test: Multi-round workflow with eventual approval
 */
export function testMultiRoundWorkflow() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["reviewer1", "reviewer2", "reviewer3"]);

  // Round 1: Mixed responses
  orchestrator.recordApproval("reviewer1", true);
  orchestrator.recordApproval("reviewer2", false);
  orchestrator.recordApproval("reviewer3", true);

  let completion = orchestrator.isComplete();
  assert(!completion.complete, "Should not be complete after round 1");

  // Advance to round 2
  orchestrator.nextRound();

  // Round 2: Still mixed
  orchestrator.recordApproval("reviewer1", true);
  orchestrator.recordApproval("reviewer2", true);
  orchestrator.recordApproval("reviewer3", false);

  completion = orchestrator.isComplete();
  assert(!completion.complete, "Should not be complete after round 2");

  // Advance to round 3
  orchestrator.nextRound();

  // Round 3: All approved
  orchestrator.recordApproval("reviewer1", true);
  orchestrator.recordApproval("reviewer2", true);
  orchestrator.recordApproval("reviewer3", true);

  completion = orchestrator.isComplete();
  assert(completion.complete, "Should be complete when all approved");
  assert(
    completion.reason.includes("round(s)"),
    "Reason should mention rounds"
  );

  console.log("✓ testMultiRoundWorkflow passed");
}

/**
 * Test: Response tracking across rounds
 */
export function testResponseTrackingMultiRound() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["a", "b"]);

  // Round 1
  orchestrator.recordApproval("a", true, { feedback: "round1-a" });
  orchestrator.recordApproval("b", false, { feedback: "round1-b" });

  orchestrator.nextRound();

  // Round 2
  orchestrator.recordApproval("a", false, { feedback: "round2-a" });
  orchestrator.recordApproval("b", true, { feedback: "round2-b" });

  assertEqual(orchestrator.state.responses.length, 4, "Should have 4 responses");

  // Verify round tracking
  const round1Responses = orchestrator.state.responses.filter(
    (r) => r.round === 1
  );
  const round2Responses = orchestrator.state.responses.filter(
    (r) => r.round === 2
  );

  assertEqual(round1Responses.length, 2, "Should have 2 round 1 responses");
  assertEqual(round2Responses.length, 2, "Should have 2 round 2 responses");

  console.log("✓ testResponseTrackingMultiRound passed");
}

/**
 * Test: Reviewer states mapping
 */
export function testGetReviewerStates() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["a", "b", "c"]);

  orchestrator.recordApproval("a", true);
  orchestrator.recordApproval("b", false);

  const states = orchestrator.getReviewerStates();

  assertEqual(states.get("a"), "approved", "Should be approved");
  assertEqual(states.get("b"), "rejected", "Should be rejected");
  assertEqual(states.get("c"), "pending", "Should be pending");
  assertEqual(states.size, 3, "Should have 3 entries");

  console.log("✓ testGetReviewerStates passed");
}

/**
 * Test: Approval tracking with metadata
 */
export function testApprovalWithTimestamp() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["a"]);

  const beforeTime = Date.now();
  orchestrator.recordApproval("a", true, { feedback: "test" });
  const afterTime = Date.now();

  const response = orchestrator.state.responses[0];

  assert(
    response.timestamp >= beforeTime && response.timestamp <= afterTime,
    "Timestamp should be in correct range"
  );
  assertEqual(response.feedback, "test", "Metadata should be included");

  console.log("✓ testApprovalWithTimestamp passed");
}

/**
 * Test: Single reviewer orchestration
 */
export function testSingleReviewer() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["solo"]);

  assert(
    orchestrator.getPendingCount() === 1,
    "Should have 1 pending reviewer"
  );

  orchestrator.recordApproval("solo", true);

  let completion = orchestrator.isComplete();
  assert(completion.complete, "Should be complete with single approval");

  orchestrator.clear();

  orchestrator.initialize(["solo"]);
  orchestrator.recordApproval("solo", false);

  completion = orchestrator.isComplete();
  assert(!completion.complete, "Should not complete with single rejection");

  console.log("✓ testSingleReviewer passed");
}

/**
 * Test: Large reviewer group
 */
export function testLargeReviewerGroup() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 2 });
  const reviewers = Array.from({ length: 10 }, (_, i) => `reviewer${i}`);
  orchestrator.initialize(reviewers);

  assertEqual(orchestrator.getPendingCount(), 10, "Should have 10 pending");

  // Approve 9 of 10
  for (let i = 0; i < 9; i++) {
    orchestrator.recordApproval(`reviewer${i}`, true);
  }

  let completion = orchestrator.isComplete();
  assert(!completion.complete, "Should not be complete with 1 pending");

  // Approve last one
  orchestrator.recordApproval("reviewer9", true);

  completion = orchestrator.isComplete();
  assert(completion.complete, "Should be complete with all approved");

  console.log("✓ testLargeReviewerGroup passed");
}

/**
 * Test: Complete workflow with plan hash updates
 */
export function testWorkflowWithPlanHashUpdate() {
  const orchestrator = new PlanOrchestrator({ maxRounds: 3 });
  orchestrator.initialize(["a", "b"]);

  orchestrator.setPlanHash("hash1");
  assertEqual(orchestrator.state.planHash, "hash1", "Hash should be set");

  orchestrator.recordApproval("a", false, { feedback: "needs revision" });
  orchestrator.recordApproval("b", false, { feedback: "needs revision" });

  orchestrator.nextRound();

  // Update hash after revision
  orchestrator.setPlanHash("hash2");
  assertEqual(orchestrator.state.planHash, "hash2", "Hash should be updated");

  orchestrator.recordApproval("a", true);
  orchestrator.recordApproval("b", true);

  let completion = orchestrator.isComplete();
  assert(completion.complete, "Should be complete after hash update");

  const snapshot = orchestrator.getStateSnapshot();
  assertEqual(snapshot.planHash, "hash2", "Snapshot should have new hash");

  console.log("✓ testWorkflowWithPlanHashUpdate passed");
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log("Running orchestrator tests...\n");

  const tests = [
    testInitialize,
    testRecordSingleApproval,
    testAllApproved,
    testAnyRejected,
    testNextRound,
    testMaxRoundsTermination,
    testPendingCount,
    testPlanHashTracking,
    testResponseTracking,
    testStateSnapshot,
    testClearState,
    testErrorInvalidReviewers,
    testErrorUnknownReviewer,
    testErrorNotInitialized,
    testErrorNextRoundNotInitialized,
    testErrorNextRoundAtMax,
    testErrorSetPlanHashNotInitialized,
    testMultiRoundWorkflow,
    testResponseTrackingMultiRound,
    testGetReviewerStates,
    testApprovalWithTimestamp,
    testSingleReviewer,
    testLargeReviewerGroup,
    testWorkflowWithPlanHashUpdate,
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
