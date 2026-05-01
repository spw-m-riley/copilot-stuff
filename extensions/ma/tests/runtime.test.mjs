import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { createMaHooks, createMaToolHandlers } from "../lib/runtime.mjs";

describe("ma runtime hooks", () => {
  test("tracks matched prompts by invocation session id", async () => {
    const activeContextBySession = new Map();
    const hooks = createMaHooks({
      activeContextBySession,
      log: async () => {},
      runMaCommand: async () => {
        throw new Error("should not run");
      },
    });

    const result = await hooks.onUserPromptSubmitted(
      { prompt: "Read README.md with reduction first", cwd: "/repo" },
      { sessionId: "session-2" },
    );

    assert.equal(activeContextBySession.get("session-2")?.matched, true);
    assert.match(result.modifiedPrompt, /ma reduction guidance/u);
  });

  test("rewrites full-file view results for sessions that matched ma guidance", async () => {
    const activeContextBySession = new Map([["session-1", { matched: true }]]);
    const logEntries = [];
    const maCalls = [];
    const hooks = createMaHooks({
      activeContextBySession,
      log: async (message, options) => {
        logEntries.push({ message, options });
      },
      runMaCommand: async (args) => {
        maCalls.push(args);
        return JSON.stringify({ output: "reduced file summary" });
      },
    });

    const result = await hooks.onPostToolUse(
      {
        toolName: "view",
        toolArgs: { path: "/repo/README.md" },
        toolResult: {
          textResultForLlm: "full file contents",
          resultType: "success",
        },
      },
      { sessionId: "session-1" },
    );

    assert.deepEqual(maCalls, [["smart-read", "/repo/README.md", "--json"]]);
    assert.equal(result.modifiedResult.textResultForLlm, "reduced file summary");
    assert.equal(logEntries[0]?.message, "ma: rewrote view output");
  });

  test("does not rewrite ranged view output", async () => {
    const maCalls = [];
    const hooks = createMaHooks({
      activeContextBySession: new Map([["session-3", { matched: true }]]),
      log: async () => {},
      runMaCommand: async (args) => {
        maCalls.push(args);
        return JSON.stringify({ output: "reduced file summary" });
      },
    });

    const result = await hooks.onPostToolUse(
      {
        toolName: "view",
        toolArgs: { path: "/repo/README.md", view_range: [1, 20] },
        toolResult: {
          textResultForLlm: "selected file contents",
          resultType: "success",
        },
      },
      { sessionId: "session-3" },
    );

    assert.equal(result, undefined);
    assert.deepEqual(maCalls, []);
  });
});

describe("ma tool handlers", () => {
  test("returns a failure result when smart-read execution fails", async () => {
    const handlers = createMaToolHandlers({
      runMaCommand: async () => {
        throw new Error("ma failed");
      },
      isSensitivePathResolved: () => false,
    });

    const result = await handlers.smartRead({ path: "/repo/README.md" });

    assert.equal(result.resultType, "failure");
    assert.match(result.textResultForLlm, /ma failed/u);
  });
});
