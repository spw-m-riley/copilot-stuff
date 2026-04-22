import { readChildMetadata } from "../../../_shared/context-policy.mjs";

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `Assertion failed: ${message}\nExpected: ${expected}\nActual: ${actual}`
    );
  }
}

export function testReadChildMetadataFromNestedSubagentFields() {
  const metadata = readChildMetadata(
    {
      subagent: {
        agentName: "Jason",
        agentDisplayName: "Reviewer",
        agentDescription: "Plan evaluator",
      },
    },
    { trimValues: true }
  );

  assertEqual(
    metadata,
    "jason reviewer plan evaluator",
    "Should read nested subagent metadata when top-level fields are absent"
  );

  console.log("✓ testReadChildMetadataFromNestedSubagentFields passed");
}

export async function runAllTests() {
  console.log("Running shared context policy tests...\n");

  const tests = [testReadChildMetadataFromNestedSubagentFields];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      test();
      passed++;
    } catch (error) {
      console.error(`✗ ${test.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n${passed}/${tests.length} tests passed`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runAllTests();
}
