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

function extractHookSpecificOutput(parsed) {
  if (!parsed || typeof parsed.hookSpecificOutput !== "object" || !parsed.hookSpecificOutput) {
    return null;
  }
  return parsed.hookSpecificOutput;
}

function extractUpdatedInput(hookSpecificOutput) {
  if (!hookSpecificOutput || typeof hookSpecificOutput.updatedInput !== "object") {
    return null;
  }
  return hookSpecificOutput.updatedInput;
}

function normalizedToolArgs(toolArgs) {
  if (toolArgs && typeof toolArgs === "object" && !Array.isArray(toolArgs)) {
    return toolArgs;
  }
  return {};
}

function assignStringField(target, field, value) {
  if (typeof value === "string") {
    target[field] = value;
  }
}

function buildModifiedArgs(input, updatedInput) {
  if (typeof updatedInput?.command !== "string") {
    return null;
  }

  return {
    ...normalizedToolArgs(input.toolArgs),
    command: updatedInput.command,
  };
}

function toPreToolUseOutput(input, parsed) {
  const hookSpecificOutput = extractHookSpecificOutput(parsed);
  const updatedInput = extractUpdatedInput(hookSpecificOutput);
  const output = {};
  assignStringField(output, "permissionDecision", parsed?.permissionDecision);
  assignStringField(output, "permissionDecisionReason", parsed?.permissionDecisionReason);
  const modifiedArgs = buildModifiedArgs(input, updatedInput);
  if (modifiedArgs) {
    output.modifiedArgs = modifiedArgs;
  }

  return Object.keys(output).length > 0 ? output : null;
}

function shouldHandlePreToolUse(input) {
  if (input.toolName !== "bash") {
    return false;
  }

  const command = commandFromToolArgs(input.toolArgs);
  return Boolean(command && command.trim());
}

async function logMissingRtkOnce(session, result) {
  if (missingRtkLogged) {
    return;
  }
  missingRtkLogged = true;
  await session.log(`rtk-hook unavailable; failing open: ${result.stderr || "rtk not found"}`, {
    ephemeral: true,
    level: "warning",
  });
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onPreToolUse: async (input) => {
      if (!shouldHandlePreToolUse(input)) {
        return;
      }

      const result = await runWithInput("rtk", ["hook", "copilot"], buildRtkPayload(input), {
        cwd: input.cwd || process.cwd(),
      });

      if (!result.ok && !result.stdout.trim()) {
        await logMissingRtkOnce(session, result);
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
