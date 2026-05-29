import assert from "node:assert/strict";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

const extension = await import("../lib/core.mjs");

const testRoot = path.resolve("extensions/error-learner/.test-output");
const queuePath = path.join(testRoot, "queue.jsonl");

async function resetQueue() {
  await rm(testRoot, { recursive: true, force: true });
  await mkdir(testRoot, { recursive: true });
}

async function readQueueLines() {
  const text = await readFile(queuePath, "utf8");
  return text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

async function testRecoverableToolFailureQueuesMemorySaveEnvelope() {
  await resetQueue();
  const hooks = extension.createHooks({
    queuePath,
    repository: "spw-m-riley/copilot-stuff",
    observedAt: "2026-05-29T00:00:00.000Z",
  });

  await hooks.onErrorOccurred(
    {
      sessionId: "runtime-session",
      workingDirectory: process.cwd(),
      toolName: "bash",
      errorContext: "tool_execution",
      error: "command failed with token=super-secret-value but can retry",
      recoverable: true,
    },
    { sessionId: "invocation-session" },
  );

  const [line] = await readQueueLines();
  assert.equal(line.destination, "memory_save");
  assert.equal(line.args.type, "error_pattern");
  assert.equal(line.args.scope, "repo");
  assert.equal(line.args.repository, "spw-m-riley/copilot-stuff");
  assert.equal(line.args.confidence, 0.75);
  assert.equal(line.payload.toolName, "bash");
  assert.equal(line.payload.recoverable, true);
  assert.equal(line.payload.errorContext, "tool_execution");
  assert.match(line.payload.errorMessage, /\[REDACTED_SECRET\]/);
}

async function testNonRecoverableFailureUsesHigherConfidence() {
  await resetQueue();
  const hooks = extension.createHooks({
    queuePath,
    repository: "spw-m-riley/copilot-stuff",
    observedAt: "2026-05-29T00:01:00.000Z",
  });

  await hooks.onErrorOccurred(
    {
      sessionId: "runtime-session",
      workingDirectory: process.cwd(),
      toolName: "read_agent",
      errorContext: "system",
      error: new Error("agent stream closed permanently"),
      recoverable: false,
    },
    { sessionId: "invocation-session" },
  );

  const [line] = await readQueueLines();
  assert.equal(line.args.confidence, 0.85);
  assert.equal(line.payload.recoverable, false);
  assert.equal(line.payload.errorMessage, "agent stream closed permanently");
  assert.equal(line.payload.observedAt, "2026-05-29T00:01:00.000Z");
}

async function testPermissionDenialPayloadFallsBackToUnknownToolWhenAbsent() {
  await resetQueue();
  const hooks = extension.createHooks({
    queuePath,
    repository: "spw-m-riley/copilot-stuff",
    observedAt: "2026-05-29T00:02:00.000Z",
  });

  await hooks.onErrorOccurred(
    {
      sessionId: "runtime-session",
      workingDirectory: process.cwd(),
      errorContext: "user_input",
      error: "permission denied: user rejected filesystem access",
      recoverable: false,
    },
    { sessionId: "invocation-session" },
  );

  const [line] = await readQueueLines();
  assert.equal(line.payload.toolName, "unknown");
  assert.equal(line.payload.errorContext, "user_input");
  assert.match(line.payload.errorMessage, /permission denied/);
}

async function testMemorySaveCallablePathSkipsQueue() {
  await resetQueue();
  const calls = [];
  const payload = extension.buildErrorPatternPayload(
    {
      sessionId: "runtime-session",
      workingDirectory: process.cwd(),
      toolName: "bash",
      errorContext: "tool_execution",
      error: "failed once",
      recoverable: true,
    },
    { sessionId: "invocation-session" },
    { repository: "spw-m-riley/copilot-stuff", observedAt: "2026-05-29T00:03:00.000Z" },
  );

  const result = await extension.persistErrorPattern(payload, {
    queuePath,
    memorySave: async (args) => {
      calls.push(args);
      return "Saved semantic memory test-id";
    },
  });

  assert.equal(result.strategy, "memory_save");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, "error_pattern");
  await assert.rejects(readFile(queuePath, "utf8"), /ENOENT/);
}

const tests = [
  testRecoverableToolFailureQueuesMemorySaveEnvelope,
  testNonRecoverableFailureUsesHigherConfidence,
  testPermissionDenialPayloadFallsBackToUnknownToolWhenAbsent,
  testMemorySaveCallablePathSkipsQueue,
];

for (const test of tests) {
  await test();
  console.log(`ok - ${test.name}`);
}

await rm(testRoot, { recursive: true, force: true });
