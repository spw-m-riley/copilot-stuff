import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import { execFile } from "node:child_process";
import {
  buildSessionStartContext,
  createMissingRtkLogger,
  createOnPreToolUseHandler,
} from "./lib/hook-logic.mjs";

function runWithInput(command, args, input, options = {}) {
  return new Promise((resolve) => {
    // fallow-ignore-next-line complexity
    const child = execFile(command, args, { maxBuffer: 1024 * 1024, ...options }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout: stdout ?? "",
        stderr: stderr ?? "",
        code: error?.code ?? 0,
      });
    });

    if (typeof input === "string") {
      child.stdin?.end(input);
    } else {
      child.stdin?.end();
    }
  });
}

let session;
const logMissingRtkOnce = createMissingRtkLogger((message, options) => session.log(message, options));
const logRtkViolation = (message) => session.log(message, {
  ephemeral: true,
  level: "warning",
});
const onPreToolUse = createOnPreToolUseHandler({
  runWithInput,
  logMissingRtkOnce,
  logRtkViolation,
});

session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onSessionStart: () => ({ additionalContext: buildSessionStartContext() }),
    onPreToolUse,
  },
  tools: [],
});
