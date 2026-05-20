function normalizedToolArgs(toolArgs) {
  if (toolArgs && typeof toolArgs === "object" && !Array.isArray(toolArgs)) {
    return toolArgs;
  }
  return {};
}

function isToolArgsObject(toolArgs) {
  return Boolean(toolArgs) && typeof toolArgs === "object" && !Array.isArray(toolArgs);
}

function hasStringCommand(toolArgs) {
  return typeof toolArgs.command === "string";
}

export function commandFromToolArgs(toolArgs) {
  if (!isToolArgsObject(toolArgs)) {
    return null;
  }

  return hasStringCommand(toolArgs) ? toolArgs.command : null;
}

export function buildRtkPayload(input) {
  return JSON.stringify({
    toolName: input.toolName,
    toolArgs: JSON.stringify(normalizedToolArgs(input.toolArgs)),
    cwd: input.cwd,
    timestamp: input.timestamp,
  });
}

export function parseRtkOutput(stdout) {
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

export function buildModifiedArgs(input, updatedInput) {
  if (typeof updatedInput?.command !== "string") {
    return null;
  }

  return {
    ...normalizedToolArgs(input.toolArgs),
    command: updatedInput.command,
  };
}

function collectStringEntries(parsed) {
  const entries = [];
  const pushStringEntry = (field, value) => {
    if (typeof value === "string") {
      entries.push([field, value]);
    }
  };

  pushStringEntry("permissionDecision", parsed?.permissionDecision);
  pushStringEntry("permissionDecisionReason", parsed?.permissionDecisionReason);
  return entries;
}

export function toPreToolUseOutput(input, parsed) {
  const entries = collectStringEntries(parsed);

  const modifiedArgs = buildModifiedArgs(input, parsed?.hookSpecificOutput?.updatedInput);
  if (modifiedArgs) {
    entries.push(["modifiedArgs", modifiedArgs]);
  }

  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

export function shouldHandlePreToolUse(input) {
  if (input.toolName !== "bash") {
    return false;
  }

  const command = commandFromToolArgs(input.toolArgs);
  return Boolean(command && command.trim());
}

export function createMissingRtkLogger(log) {
  let logged = false;

  return async (result) => {
    if (logged) {
      return;
    }

    logged = true;
    await log(`rtk-hook unavailable; failing open: ${result.stderr || "rtk not found"}`, {
      ephemeral: true,
      level: "warning",
    });
  };
}

export function createOnPreToolUseHandler({ runWithInput, logMissingRtkOnce }) {
  if (typeof runWithInput !== "function") {
    throw new TypeError("runWithInput must be a function");
  }

  if (typeof logMissingRtkOnce !== "function") {
    throw new TypeError("logMissingRtkOnce must be a function");
  }

  return async (input) => {
    if (!shouldHandlePreToolUse(input)) {
      return;
    }

    const result = await runWithInput("rtk", ["hook", "copilot"], buildRtkPayload(input), {
      cwd: input.cwd || process.cwd(),
    });

    return handleRtkResult(input, result, logMissingRtkOnce);
  };
}

async function handleRtkResult(input, result, logMissingRtkOnce) {
  if (!result.ok && !result.stdout.trim()) {
    await logMissingRtkOnce(result);
    return;
  }

  const parsed = parseRtkOutput(result.stdout);
  return parsed ? toPreToolUseOutput(input, parsed) : undefined;
}
