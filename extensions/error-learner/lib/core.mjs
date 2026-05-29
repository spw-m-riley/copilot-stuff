import { execFile } from "node:child_process";
import { appendFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const DEFAULT_QUEUE_PATH = path.join(
  process.env.LORE_COPILOT_HOME?.trim() || path.join(os.homedir(), ".copilot"),
  "session-state",
  "error-learner",
  "queue.jsonl",
);

const ERROR_MESSAGE_LIMIT = 1_024;
const CONTEXT_LIMIT = 512;
const CWD_LIMIT = 512;
const TOOL_NAME_LIMIT = 160;

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    execFile(command, args, { maxBuffer: 256 * 1024, ...options }, (error, stdout, stderr) => {
      resolve({ ok: !error, stdout: stdout ?? "", stderr: stderr ?? "" });
    });
  });
}

export function truncate(value, limit) {
  const text = String(value ?? "");
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

export function redactSensitiveText(value) {
  return String(value ?? "")
    .replace(/gh[pousr]_[A-Za-z0-9_]{20,}/g, "[REDACTED_GITHUB_TOKEN]")
    .replace(/AKIA[0-9A-Z]{16}/g, "[REDACTED_AWS_ACCESS_KEY]")
    .replace(/(?<label>bearer\s+)[A-Za-z0-9._~+/=-]{16,}/gi, "$<label>[REDACTED_TOKEN]")
    .replace(
      /(?<label>(?:password|passwd|pwd|token|secret|api[_-]?key)\s*[=:]\s*)[^\s'\"]+/gi,
      "$<label>[REDACTED_SECRET]",
    );
}

function safeJson(value) {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeCwd(input = {}) {
  return input.workingDirectory || input.cwd || process.cwd();
}

export async function detectRepository(cwd) {
  const result = await run("git", ["remote", "get-url", "origin"], { cwd });
  if (!result.ok || !result.stdout.trim()) return null;
  const remote = result.stdout.trim();
  const match = remote.match(/[:/]([^/:\s]+\/[^/\s]+?)(?:\.git)?$/);
  return match ? match[1] : null;
}

export function buildErrorPatternPayload(input = {}, invocation = {}, options = {}) {
  const cwd = truncate(redactSensitiveText(normalizeCwd(input)), CWD_LIMIT);
  const repository = input.repository || options.repository || null;
  const toolName = truncate(input.toolName || input.tool?.name || "unknown", TOOL_NAME_LIMIT);
  const errorMessage = truncate(redactSensitiveText(safeJson(input.error)), ERROR_MESSAGE_LIMIT);
  const errorContext = truncate(redactSensitiveText(safeJson(input.errorContext)), CONTEXT_LIMIT);

  return {
    kind: "error_pattern",
    scope: "repo",
    repository,
    cwd,
    sessionId: invocation.sessionId || input.sessionId || null,
    sdkHook: "onErrorOccurred",
    toolName,
    errorContext,
    errorMessage,
    recoverable: input.recoverable === true,
    observedAt: options.observedAt || new Date().toISOString(),
  };
}

export function buildMemorySaveArgs(payload) {
  return {
    content: JSON.stringify(payload),
    type: "error_pattern",
    repository: payload.repository || undefined,
    scope: payload.scope,
    confidence: payload.recoverable ? 0.75 : 0.85,
  };
}

async function callMemorySave(session, args, options = {}) {
  if (typeof options.memorySave === "function") {
    return options.memorySave(args);
  }

  const callable = session?.callTool || session?.invokeTool;
  if (typeof callable !== "function") {
    return null;
  }

  return callable.call(session, "memory_save", args);
}

async function appendQueueLine(queuePath, record) {
  await mkdir(path.dirname(queuePath), { recursive: true });
  await appendFile(queuePath, `${JSON.stringify(record)}\n`, "utf8");
}

export async function persistErrorPattern(payload, options = {}) {
  const memorySaveArgs = buildMemorySaveArgs(payload);
  const session = options.session || options.getSession?.();

  try {
    const result = await callMemorySave(session, memorySaveArgs, options);
    if (result !== null && result !== undefined) {
      return { strategy: "memory_save", result };
    }
  } catch (error) {
    await session?.log?.(`error-learner memory_save failed; queued instead: ${error.message}`, {
      ephemeral: true,
      level: "warning",
    });
  }

  const queuePath = options.queuePath || process.env.ERROR_LEARNER_QUEUE_PATH || DEFAULT_QUEUE_PATH;
  await appendQueueLine(queuePath, {
    destination: "memory_save",
    args: memorySaveArgs,
    payload,
    queuedAt: new Date().toISOString(),
    reason: "session tool API unavailable from extension hook",
  });
  return { strategy: "jsonl_queue", queuePath };
}

export function createHooks(options = {}) {
  return {
    onErrorOccurred: async (input, invocation) => {
      const cwd = normalizeCwd(input);
      const repository = input.repository || options.repository || (await detectRepository(cwd));
      const payload = buildErrorPatternPayload(input, invocation, { ...options, repository });
      const result = await persistErrorPattern(payload, options);

      await options.getSession?.()?.log?.(
        `error-learner captured ${payload.errorContext} error via ${result.strategy}`,
        { ephemeral: true },
      );
    },
  };
}
