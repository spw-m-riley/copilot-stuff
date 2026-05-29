import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createSessionJournalHooks,
  readLatestJournalEntry,
} from "../extension.mjs";

const TEST_ROOT = path.join(import.meta.dirname, ".scratch");

async function resetFixture(name) {
  const dir = path.join(TEST_ROOT, name);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  return dir;
}

async function testWriteJournalThenPrimeNextSession() {
  const copilotHome = await resetFixture("write-read");
  const hooks = createSessionJournalHooks({
    copilotHome,
    now: () => new Date("2025-01-02T03:04:05.678Z"),
  });

  const endResult = await hooks.onSessionEnd(
    {
      sessionId: "session-123",
      timestamp: new Date("2025-01-02T03:04:05.678Z"),
      workingDirectory: "/repo",
      reason: "complete",
      summary: [
        "Decisions:",
        "- Ship the session-journal extension as narrative Markdown.",
        "Discoveries:",
        "- SDK exposes sessionSummary and modifiedConfig.",
        "Open loops:",
        "- Run a 7-day soak before merging to main.",
      ].join("\n"),
    },
    { sessionId: "session-123" },
  );

  assert.equal(
    endResult.sessionSummary,
    "Session journal saved with decisions, discoveries, and open loops.",
  );

  const journalPath = path.join(
    copilotHome,
    "session-state",
    "journal",
    "2025-01-02-03-04.md",
  );
  const content = await readFile(journalPath, "utf8");
  assert.match(content, /^# Session journal — 2025-01-02 03:04 UTC/m);
  assert.match(content, /^## Decisions\n- Ship the session-journal extension/m);
  assert.match(content, /^## Discoveries\n- SDK exposes sessionSummary/m);
  assert.match(content, /^## Open loops\n- Run a 7-day soak/m);

  const latest = await readLatestJournalEntry({ copilotHome });
  assert.equal(latest.path, journalPath);
  assert.equal(latest.content, content);

  const startResult = await hooks.onSessionStart(
    {
      sessionId: "session-456",
      timestamp: new Date("2025-01-03T00:00:00.000Z"),
      workingDirectory: "/repo",
      source: "new",
    },
    { sessionId: "session-456" },
  );

  assert.match(startResult.additionalContext, /Previous session journal/);
  assert.match(startResult.additionalContext, /Ship the session-journal extension/);
  assert.deepEqual(startResult.modifiedConfig, {
    additionalContext: startResult.additionalContext,
  });
}

async function testMissingJournalDirectoryIsNoop() {
  const copilotHome = await resetFixture("missing-dir");
  const hooks = createSessionJournalHooks({ copilotHome });

  const startResult = await hooks.onSessionStart(
    {
      sessionId: "session-no-prior",
      timestamp: new Date("2025-01-02T03:04:05.678Z"),
      workingDirectory: "/repo",
      source: "startup",
    },
    { sessionId: "session-no-prior" },
  );

  assert.equal(startResult, undefined);
}

async function testMalformedPriorJournalStillPrimesSafely() {
  const copilotHome = await resetFixture("malformed-prior");
  const journalDir = path.join(copilotHome, "session-state", "journal");
  await mkdir(journalDir, { recursive: true });
  await writeFile(
    path.join(journalDir, "2025-01-02-03-04.md"),
    "not a structured journal\nwithout required headings\n",
    "utf8",
  );

  const hooks = createSessionJournalHooks({ copilotHome });
  const startResult = await hooks.onSessionStart(
    {
      sessionId: "session-malformed",
      timestamp: new Date("2025-01-03T00:00:00.000Z"),
      workingDirectory: "/repo",
      source: "resume",
    },
    { sessionId: "session-malformed" },
  );

  assert.match(startResult.additionalContext, /Previous session journal/);
  assert.match(startResult.additionalContext, /not a structured journal/);
  assert.match(startResult.additionalContext, /missing expected sections/i);
  assert.deepEqual(startResult.modifiedConfig, {
    additionalContext: startResult.additionalContext,
  });
}

async function runSmoke() {
  const hooks = createSessionJournalHooks();
  await hooks.onSessionEnd(
    {
      sessionId: "smoke-session-journal",
      timestamp: new Date(),
      workingDirectory: process.cwd(),
      reason: "complete",
      summary: [
        "Decisions:",
        "- Verify session-journal writes a real file.",
        "Discoveries:",
        "- Manual smoke can read the latest journal back.",
        "Open loops:",
        "- Remove smoke journals during normal user-controlled rotation if desired.",
      ].join("\n"),
    },
    { sessionId: "smoke-session-journal" },
  );

  const latest = await readLatestJournalEntry();
  assert.ok(latest?.path, "expected smoke journal path");
  assert.match(latest.content, /Verify session-journal writes a real file/);

  const startResult = await hooks.onSessionStart(
    {
      sessionId: "smoke-session-journal-start",
      timestamp: new Date(),
      workingDirectory: process.cwd(),
      source: "new",
    },
    { sessionId: "smoke-session-journal-start" },
  );

  assert.match(startResult.additionalContext, /Verify session-journal writes a real file/);
  assert.equal(
    startResult.modifiedConfig.additionalContext,
    startResult.additionalContext,
  );

  console.log(
    JSON.stringify(
      {
        journalPath: latest.path,
        modifiedConfig: startResult.modifiedConfig,
      },
      null,
      2,
    ),
  );
}

async function runUnitTests() {
  const tests = [
    testWriteJournalThenPrimeNextSession,
    testMissingJournalDirectoryIsNoop,
    testMalformedPriorJournalStillPrimesSafely,
  ];

  await rm(TEST_ROOT, { recursive: true, force: true });

  for (const test of tests) {
    await test();
    console.log(`ok - ${test.name}`);
  }

  await rm(TEST_ROOT, { recursive: true, force: true });
}

if (process.argv.includes("--smoke")) {
  await runSmoke();
} else {
  await runUnitTests();
}
