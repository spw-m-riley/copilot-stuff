import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import { execFile } from "node:child_process";

let missingRtkLogged = false;

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    execFile(command, args, { maxBuffer: 1024 * 1024, ...options }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout: stdout ?? "",
        stderr: stderr ?? "",
        code: error?.code ?? 0,
      });
    });
  });
}

function runWithInput(command, args, input, options = {}) {
  return new Promise((resolve) => {
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

function commandFromToolArgs(toolArgs) {
  if (!toolArgs || typeof toolArgs !== "object" || Array.isArray(toolArgs)) {
    return null;
  }

  return typeof toolArgs.command === "string" ? toolArgs.command : null;
}

function buildRtkPayload(input) {
  const toolArgs =
    input.toolArgs && typeof input.toolArgs === "object" && !Array.isArray(input.toolArgs)
      ? input.toolArgs
      : {};

  return JSON.stringify({
    toolName: input.toolName,
    toolArgs: JSON.stringify(toolArgs),
    cwd: input.cwd,
    timestamp: input.timestamp,
  });
}

function parseRtkOutput(stdout) {
  const text = stdout.trim();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toPreToolUseOutput(input, parsed) {
  const hookSpecificOutput =
    parsed && typeof parsed.hookSpecificOutput === "object" && parsed.hookSpecificOutput
      ? parsed.hookSpecificOutput
      : null;

  const updatedInput =
    hookSpecificOutput && typeof hookSpecificOutput.updatedInput === "object"
      ? hookSpecificOutput.updatedInput
      : null;

  const output = {};

  if (typeof parsed?.permissionDecision === "string") {
    output.permissionDecision = parsed.permissionDecision;
  }

  if (typeof parsed?.permissionDecisionReason === "string") {
    output.permissionDecisionReason = parsed.permissionDecisionReason;
  }

  if (typeof updatedInput?.command === "string") {
    output.modifiedArgs = {
      ...(input.toolArgs && typeof input.toolArgs === "object" && !Array.isArray(input.toolArgs)
        ? input.toolArgs
        : {}),
      command: updatedInput.command,
    };
  }

  return Object.keys(output).length > 0 ? output : null;
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onPreToolUse: async (input) => {
      if (input.toolName !== "bash") {
        return;
      }

      const command = commandFromToolArgs(input.toolArgs);
      if (!command || !command.trim()) {
        return;
      }

      const result = await runWithInput("rtk", ["hook", "copilot"], buildRtkPayload(input), {
        cwd: input.cwd || process.cwd(),
      });

      if (!result.ok && !result.stdout.trim()) {
        if (!missingRtkLogged) {
          missingRtkLogged = true;
          await session.log(`rtk-hook unavailable; failing open: ${result.stderr || "rtk not found"}`, {
            ephemeral: true,
            level: "warning",
          });
        }
        return;
      }

      const parsed = parseRtkOutput(result.stdout);
      if (!parsed) {
        return;
      }

      return toPreToolUseOutput(input, parsed);
    },
  },
  tools: [],
});
