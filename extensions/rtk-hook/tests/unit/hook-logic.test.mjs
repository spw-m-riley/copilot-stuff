import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildModifiedArgs,
  buildRtkPayload,
  commandFromToolArgs,
  createMissingRtkLogger,
  createOnPreToolUseHandler,
  parseRtkOutput,
  shouldHandlePreToolUse,
  toPreToolUseOutput,
} from "../../lib/hook-logic.mjs";

describe("hook logic", () => {
  test("buildRtkPayload double serializes toolArgs for rtk", () => {
    const payload = JSON.parse(
      buildRtkPayload({
        toolName: "bash",
        toolArgs: { command: "echo hi", nested: { value: 1 } },
        cwd: "/tmp/worktree",
        timestamp: "2026-05-13T10:40:55.367+01:00",
      }),
    );

    assert.equal(payload.toolName, "bash");
    assert.equal(typeof payload.toolArgs, "string");
    assert.deepStrictEqual(JSON.parse(payload.toolArgs), {
      command: "echo hi",
      nested: { value: 1 },
    });
    assert.equal(payload.cwd, "/tmp/worktree");
  });

  test("parseRtkOutput trims and rejects malformed output", () => {
    assert.deepStrictEqual(
      parseRtkOutput("\n  {\"permissionDecision\":\"allow\"}\n"),
      { permissionDecision: "allow" },
    );
    assert.equal(parseRtkOutput(""), null);
    assert.equal(parseRtkOutput("not json"), null);
  });

  test("commandFromToolArgs and shouldHandlePreToolUse gate bash commands", () => {
    assert.equal(commandFromToolArgs({ command: "  echo hi  " }), "  echo hi  ");
    assert.equal(commandFromToolArgs({}), null);
    assert.equal(shouldHandlePreToolUse({ toolName: "git", toolArgs: { command: "status" } }), false);
    assert.equal(shouldHandlePreToolUse({ toolName: "bash", toolArgs: { command: "  " } }), false);
    assert.equal(shouldHandlePreToolUse({ toolName: "bash", toolArgs: { command: "echo hi" } }), true);
  });

  test("toPreToolUseOutput keeps permission fields and modified args", () => {
    assert.deepStrictEqual(
      toPreToolUseOutput(
        { toolArgs: { command: "echo hi", flag: true } },
        {
          permissionDecision: "allow",
          permissionDecisionReason: "approved",
          hookSpecificOutput: { updatedInput: { command: "printf hi" } },
        },
      ),
      {
        permissionDecision: "allow",
        permissionDecisionReason: "approved",
        modifiedArgs: { command: "printf hi", flag: true },
      },
    );
    assert.deepStrictEqual(
      buildModifiedArgs({ toolArgs: { command: "echo hi" } }, { command: "printf hi" }),
      { command: "printf hi" },
    );
  });

  test("createMissingRtkLogger logs once", async () => {
    const calls = [];
    const logger = createMissingRtkLogger(async (message, options) => {
      calls.push({ message, options });
    });

    await logger({ stderr: "" });
    await logger({ stderr: "second call" });

    assert.equal(calls.length, 1);
    assert.match(calls[0].message, /rtk-hook unavailable/);
    assert.deepStrictEqual(calls[0].options, { ephemeral: true, level: "warning" });
  });

  test("createOnPreToolUseHandler fails open when rtk is unavailable", async () => {
    const runCalls = [];
    const logCalls = [];
    const handler = createOnPreToolUseHandler({
      runWithInput: async (...args) => {
        runCalls.push(args);
        return { ok: false, stdout: "", stderr: "missing rtk" };
      },
      logMissingRtkOnce: async (result) => {
        logCalls.push(result);
      },
    });

    const result = await handler({
      toolName: "bash",
      toolArgs: { command: "echo hi" },
      cwd: "/work/tree",
      timestamp: "2026-05-13T10:40:55.367+01:00",
    });

    assert.equal(result, undefined);
    assert.equal(runCalls.length, 1);
    assert.deepStrictEqual(runCalls[0][0], "rtk");
    assert.deepStrictEqual(runCalls[0][1], ["hook", "copilot"]);
    assert.equal(typeof runCalls[0][2], "string");
    assert.deepStrictEqual(runCalls[0][3], { cwd: "/work/tree" });
    assert.equal(logCalls.length, 1);
    assert.deepStrictEqual(logCalls[0], { ok: false, stdout: "", stderr: "missing rtk" });
  });

  test("createOnPreToolUseHandler still parses output when rtk exits non-zero", async () => {
    const handler = createOnPreToolUseHandler({
      runWithInput: async () => ({
        ok: false,
        stdout:
          '{"permissionDecision":"allow","hookSpecificOutput":{"updatedInput":{"command":"printf hi"}}}',
        stderr: "warning",
      }),
      logMissingRtkOnce: async () => {
        throw new Error("should not log missing rtk");
      },
    });

    const result = await handler({
      toolName: "bash",
      toolArgs: { command: "echo hi" },
      timestamp: "2026-05-13T10:40:55.367+01:00",
    });

    assert.deepStrictEqual(result, {
      permissionDecision: "allow",
      modifiedArgs: { command: "printf hi" },
    });
  });
});
