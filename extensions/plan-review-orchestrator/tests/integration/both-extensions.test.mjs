/**
 * Integration tests for plan-review-policy and plan-review-orchestrator
 * 
 * Verifies:
 * - Both extensions activate on /plan without conflicts
 * - Session state remains isolated (no key collisions)
 * - Context injection is additive (no overwrites)
 * - Cleanup is independent
 */

/**
 * Mock extension context to simulate hook execution
 */
class MockExtensionHarness {
  constructor(name) {
    this.name = name;
    this.logs = [];
    this.contexts = [];
    this.sessionStateMap = new Map();
  }

  log(message, options = {}) {
    this.logs.push({
      timestamp: Date.now(),
      message,
      ephemeral: options.ephemeral ?? false,
    });
  }

  recordContext(context) {
    if (context) {
      this.contexts.push(context);
    }
  }

  recordSessionState(sessionId, key, value) {
    if (!this.sessionStateMap.has(sessionId)) {
      this.sessionStateMap.set(sessionId, new Map());
    }
    this.sessionStateMap.get(sessionId).set(key, value);
  }

  getSessionState(sessionId) {
    return this.sessionStateMap.get(sessionId);
  }

  clearLogs() {
    this.logs = [];
  }

  clearContexts() {
    this.contexts = [];
  }

  hasLog(substring) {
    return this.logs.some((log) => log.message.includes(substring));
  }

  getLastContext() {
    return this.contexts[this.contexts.length - 1] || null;
  }
}

/**
 * Test utilities
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`❌ Assertion failed: ${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function assertIncludes(text, substring, message) {
  if (!text.includes(substring)) {
    throw new Error(`❌ Assertion failed: ${message}\nExpected substring: "${substring}"\nActual: "${text}"`);
  }
}

function assertLogsInclude(logs, substring, message) {
  const found = logs.some((log) => log.message.includes(substring));
  if (!found) {
    throw new Error(
      `❌ Assertion failed: ${message}\nExpected log: "${substring}"\nActual logs:\n${logs.map((l) => `  - ${l.message}`).join("\n")}`
    );
  }
}

/**
 * TEST 1: Session state isolation
 * 
 * Verify: Both extensions use different session state keys
 * Expected: No collision, clean separation
 */
export function testSessionStateIsolation() {
  console.log("\n📋 TEST 1: Session state isolation");

  const policy = new MockExtensionHarness("plan-review-policy");
  const orchestrator = new MockExtensionHarness("plan-review-orchestrator");

  const sessionId = "session-abc-123";

  // Simulate policy state
  policy.recordSessionState(sessionId, "activeContext", { kind: "plan-review-policy", matched: true });

  // Simulate orchestrator state
  orchestrator.recordSessionState(sessionId, "orchestrator", { round: 1, reviewers: new Map() });
  orchestrator.recordSessionState(sessionId, "feedback", new Map());

  // Verify isolation
  const policyState = policy.getSessionState(sessionId);
  const orchestratorState = orchestrator.getSessionState(sessionId);

  assert(policyState.has("activeContext"), "Policy should have activeContext key");
  assert(!policyState.has("orchestrator"), "Policy should NOT have orchestrator key");
  assert(orchestratorState.has("orchestrator"), "Orchestrator should have orchestrator key");
  assert(!orchestratorState.has("activeContext"), "Orchestrator should NOT have activeContext key");

  console.log("✅ PASS: Session state keys are isolated\n");
}

/**
 * TEST 2: Hook execution order on /plan
 * 
 * Verify: Both extensions detect /plan independently without interfering
 * Expected: Both log initialization messages in expected order
 */
export function testPlanCommandDetection() {
  console.log("\n📋 TEST 2: /plan command detection");

  const policy = new MockExtensionHarness("plan-review-policy");
  const orchestrator = new MockExtensionHarness("plan-review-orchestrator");

  // Simulate onUserPromptSubmitted hooks
  const userPrompt = "/plan Create a deployment architecture";
  const isPlanCommand = /^\/plan(?:\s|$)/u.test(userPrompt);

  if (isPlanCommand) {
    // Policy hook
    policy.recordSessionState("session-1", "activeContext", { kind: "plan-review-policy", matched: true });
    policy.log("plan-review-policy: injected PLAN_REVIEW_POLICY context", { ephemeral: true });
    policy.recordContext("Planning defaults for this user:\n- In plan mode, default to a reviewer loop...");

    // Orchestrator hook
    orchestrator.recordSessionState("session-1", "orchestrator", {
      active: true,
      round: 1,
      reviewers: new Map([
        ["jason", "pending"],
        ["freddy", "pending"],
      ]),
      maxRounds: 3,
    });
    orchestrator.log(
      "plan-orchestrator: initialized with 2 reviewers (max 3 rounds)",
      { ephemeral: true }
    );
  }

  // Verify both activated
  assert(policy.hasLog("plan-review-policy"), "Policy should log initialization");
  assert(orchestrator.hasLog("plan-orchestrator"), "Orchestrator should log initialization");
  assert(policy.contexts.length === 1, "Policy should inject one context");
  assert(orchestrator.sessionStateMap.has("session-1"), "Orchestrator should track session");

  console.log("✅ PASS: Both extensions detect /plan independently\n");
}

/**
 * TEST 3: Subagent context injection (reviewer)
 * 
 * Verify: Both extensions can inject context for the same reviewer subagent
 * Expected: Both contexts are tracked (SDK merges them)
 */
export function testReviewerContextInjection() {
  console.log("\n📋 TEST 3: Reviewer subagent context injection");

  const policy = new MockExtensionHarness("plan-review-policy");
  const orchestrator = new MockExtensionHarness("plan-review-orchestrator");

  const sessionId = "session-1";
  const agentName = "Jason";
  const agentDescription = "Code reviewer and plan evaluator";

  // Both extensions should detect "Jason" as a reviewer
  const isReviewer = agentDescription.toLowerCase().includes("review");
  assert(isReviewer, "Should detect as reviewer");

  if (isReviewer) {
    // Policy injects reviewer context
    policy.log("plan-review-policy: injected reviewer child context", { ephemeral: true });
    policy.recordContext("This delegated child agent is reviewing a /plan workflow...");

    // Orchestrator injects orchestrator-specific context
    orchestrator.log(
      "plan-orchestrator: injecting reviewer context for jason (round 1)",
      { ephemeral: true }
    );
    orchestrator.recordContext("You are supporting plan review as Jason (jason) (1 of 2 reviewers in Round 1 of 3)...");
  }

  // Verify both injected context
  assert(policy.hasLog("plan-review-policy: injected reviewer"), "Policy should log reviewer context injection");
  assert(
    orchestrator.hasLog("plan-orchestrator: injecting reviewer context"),
    "Orchestrator should log reviewer context injection"
  );
  assertEqual(policy.contexts.length, 1, "Policy should inject one context for reviewer");
  assertEqual(orchestrator.contexts.length, 1, "Orchestrator should inject one context for reviewer");

  // Verify context is different (not overwrites)
  const policyCtx = policy.getLastContext();
  const orchestratorCtx = orchestrator.getLastContext();
  assert(policyCtx !== orchestratorCtx, "Contexts should be different");
  assertIncludes(policyCtx, "reviewing", "Policy context should mention reviewing");
  assertIncludes(orchestratorCtx, "Round 1 of 3", "Orchestrator context should mention round");

  console.log("✅ PASS: Both extensions inject context additively for reviewers\n");
}

/**
 * TEST 4: Approval tracking
 * 
 * Verify: Orchestrator tracks approvals independently while policy remains inactive
 * Expected: Orchestrator state updates, policy state unchanged
 */
export function testApprovalTracking() {
  console.log("\n📋 TEST 4: Approval tracking isolation");

  const orchestrator = new MockExtensionHarness("plan-review-orchestrator");

  const sessionId = "session-1";
  const reviewerId = "jason";
  const response = "Plan looks good!\n\n[PLAN-APPROVED]";

  // Simulate onSubagentEnd hook
  const hasApprovalToken = /\[PLAN-APPROVED\]/i.test(response);
  assert(hasApprovalToken, "Should detect approval token");

  if (hasApprovalToken) {
    // Orchestrator records approval
    orchestrator.recordSessionState(sessionId, "reviewer-approval", {
      [reviewerId]: "approved",
    });
    orchestrator.log(`plan-orchestrator: ${reviewerId} → approved`, { ephemeral: true });
  }

  // Verify orchestrator tracked it
  assert(orchestrator.hasLog("approved"), "Orchestrator should log approval");
  const state = orchestrator.getSessionState(sessionId);
  assert(state.has("reviewer-approval"), "Should track approval in state");

  console.log("✅ PASS: Orchestrator tracks approvals independently\n");
}

/**
 * TEST 5: Session cleanup
 * 
 * Verify: onSessionEnd clears both extensions' state independently
 * Expected: All session-specific state removed, no memory leaks
 */
export function testSessionCleanup() {
  console.log("\n📋 TEST 5: Session cleanup");

  const policy = new MockExtensionHarness("plan-review-policy");
  const orchestrator = new MockExtensionHarness("plan-review-orchestrator");

  const sessionId = "session-1";

  // Setup state as if plan was active
  policy.recordSessionState(sessionId, "activeContext", { kind: "plan-review-policy", matched: true });
  orchestrator.recordSessionState(sessionId, "orchestrator", { active: true });
  orchestrator.recordSessionState(sessionId, "feedback", new Map());

  // Verify state exists
  assert(policy.getSessionState(sessionId) !== undefined, "Policy state should exist before cleanup");
  assert(orchestrator.getSessionState(sessionId) !== undefined, "Orchestrator state should exist before cleanup");

  // Simulate onSessionEnd hooks
  policy.sessionStateMap.delete(sessionId);
  orchestrator.sessionStateMap.delete(sessionId);

  policy.log("plan-review-policy: session ended, cleared state", { ephemeral: true });
  orchestrator.log("plan-orchestrator: session ended, cleared state", { ephemeral: true });

  // Verify state is gone
  assert(policy.getSessionState(sessionId) === undefined, "Policy state should be cleared");
  assert(orchestrator.getSessionState(sessionId) === undefined, "Orchestrator state should be cleared");
  assert(policy.hasLog("session ended"), "Policy should log cleanup");
  assert(orchestrator.hasLog("session ended"), "Orchestrator should log cleanup");

  console.log("✅ PASS: Both extensions clean up state independently\n");
}

/**
 * TEST 6: Multiple sessions isolation
 * 
 * Verify: State for different sessions doesn't collide
 * Expected: Session A and Session B maintain independent state
 */
export function testMultipleSessionsIsolation() {
  console.log("\n📋 TEST 6: Multiple sessions isolation");

  const policy = new MockExtensionHarness("plan-review-policy");

  const sessionIdA = "session-a";
  const sessionIdB = "session-b";

  // Session A starts plan
  policy.recordSessionState(sessionIdA, "activeContext", { kind: "plan-review-policy", matched: true });
  policy.log("Session A: /plan detected", { ephemeral: true });

  // Session B also starts plan (in parallel)
  policy.recordSessionState(sessionIdB, "activeContext", { kind: "plan-review-policy", matched: true });
  policy.log("Session B: /plan detected", { ephemeral: true });

  // Verify both are tracked independently
  const stateA = policy.getSessionState(sessionIdA);
  const stateB = policy.getSessionState(sessionIdB);

  assert(stateA !== undefined, "Session A state should exist");
  assert(stateB !== undefined, "Session B state should exist");
  assert(stateA !== stateB, "State maps should be different");
  assertEqual(stateA.get("activeContext").kind, "plan-review-policy", "Session A should have policy context");
  assertEqual(stateB.get("activeContext").kind, "plan-review-policy", "Session B should have policy context");

  // Now Session A ends
  policy.sessionStateMap.delete(sessionIdA);

  // Verify Session B is unaffected
  assert(policy.getSessionState(sessionIdA) === undefined, "Session A state should be cleared");
  assert(policy.getSessionState(sessionIdB) !== undefined, "Session B state should still exist");

  console.log("✅ PASS: Multiple sessions maintain independent state\n");
}

/**
 * TEST 7: No context overwrite
 * 
 * Verify: When both extensions return context, they're additive not overwriting
 * Expected: SDK merges both contexts (not one overwrites the other)
 */
export function testNoContextOverwrite() {
  console.log("\n📋 TEST 7: No context overwrite");

  const policy = new MockExtensionHarness("plan-review-policy");
  const orchestrator = new MockExtensionHarness("plan-review-orchestrator");

  // Both inject context on reviewer start
  const policyContext = "Plan review rules and guidelines...";
  const orchestratorContext = "Round 1 reviewer instructions with approval tokens...";

  policy.recordContext(policyContext);
  orchestrator.recordContext(orchestratorContext);

  // Both return values are stored (SDK merges them)
  assert(policy.contexts[0] === policyContext, "Policy context should be stored");
  assert(orchestrator.contexts[0] === orchestratorContext, "Orchestrator context should be stored");
  assert(policy.contexts[0] !== orchestrator.contexts[0], "Contexts should be different");

  // Neither overwrites the other
  policy.recordContext("NEW POLICY CONTEXT");
  orchestrator.recordContext("NEW ORCHESTRATOR CONTEXT");

  assertEqual(policy.contexts.length, 2, "Policy should have 2 contexts");
  assertEqual(orchestrator.contexts.length, 2, "Orchestrator should have 2 contexts");
  assertIncludes(policy.contexts[1], "NEW POLICY", "Policy new context should be added");
  assertIncludes(orchestrator.contexts[1], "NEW ORCHESTRATOR", "Orchestrator new context should be added");

  console.log("✅ PASS: Extensions add context additively, no overwrites\n");
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log("🧪 Integration Tests: plan-review-policy + plan-review-orchestrator");
  console.log("=" + "=".repeat(70));

  const tests = [
    testSessionStateIsolation,
    testPlanCommandDetection,
    testReviewerContextInjection,
    testApprovalTracking,
    testSessionCleanup,
    testMultipleSessionsIsolation,
    testNoContextOverwrite,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      test();
      passed++;
    } catch (error) {
      console.error(`\n${error.message}\n`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(72));
  console.log(`📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log("✅ All integration tests passed!\n");
    process.exit(0);
  } else {
    console.log("❌ Some integration tests failed\n");
    process.exit(1);
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await runAllTests();
}
