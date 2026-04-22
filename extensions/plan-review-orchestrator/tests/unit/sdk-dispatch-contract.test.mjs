import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(currentDir, "../../extension.mjs");
const fixturePath = path.resolve(currentDir, "../fixtures/sdk-dispatch-contract.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function readExtensionSource() {
  return fs.readFileSync(extensionPath, "utf8");
}

function readContractFixture() {
  return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

function getOnSubagentEndBlock(source) {
  const start = source.indexOf("onSubagentEnd:");
  const end = source.indexOf("onSessionEnd:");
  return start >= 0 && end > start ? source.slice(start, end) : "";
}

export function testNoUnsupportedLaunchApis() {
  const source = readExtensionSource();
  const contract = readContractFixture();

  for (const pattern of contract.bannedLaunchPatterns) {
    assert(
      !source.includes(pattern),
      `Should not use unsupported reviewer launch API ${pattern}`,
    );
  }

  console.log("✓ testNoUnsupportedLaunchApis passed");
}

export function testOnSubagentEndRemainsPassive() {
  const source = readExtensionSource();
  const contract = readContractFixture();
  const onSubagentEndBlock = getOnSubagentEndBlock(source);

  assert(onSubagentEndBlock.length > 0, "Should find onSubagentEnd hook");

  for (const pattern of contract.forbiddenOnSubagentEndPatterns) {
    assert(
      !onSubagentEndBlock.includes(pattern),
      `onSubagentEnd should stay passive and avoid ${pattern}`,
    );
  }

  console.log("✓ testOnSubagentEndRemainsPassive passed");
}

export async function runAllTests() {
  console.log("Running SDK dispatch contract tests...\n");

  const tests = [
    testNoUnsupportedLaunchApis,
    testOnSubagentEndRemainsPassive,
  ];

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
