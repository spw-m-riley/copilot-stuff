import {
  normalizePrompt,
  normalizeSessionId,
  setBoundedContext,
} from "../../_shared/context-policy.mjs";
import {
  buildMaChildContext,
  buildMaParentContext,
  buildMaSoftParentContext,
  getMaRecommendationStrength,
  hasLargeReferencedFile,
  shouldInjectMaChildContext,
} from "./routing.mjs";

export const DEFAULT_MAX_ACTIVE_CONTEXTS = 64;

function parseMaOutput(output) {
  if (typeof output !== "string") return null;

  try {
    const parsed = JSON.parse(output);
    return typeof parsed?.output === "string" ? parsed.output : null;
  } catch {
    return null;
  }
}

function getSessionId(input, invocation) {
  return normalizeSessionId(invocation?.sessionId ?? input?.sessionId);
}

function deniedResult(path) {
  return {
    textResultForLlm: `Refused: sensitive path ${path}`,
    resultType: "denied",
  };
}

function failureResult(error) {
  return {
    textResultForLlm: error instanceof Error ? error.message : String(error),
    resultType: "failure",
  };
}

function shouldRewriteViewResult(input, sessionId, activeContextBySession) {
  if (!sessionId || !activeContextBySession.get(sessionId)?.matched) {
    return false;
  }

  if (input?.toolName !== "view") {
    return false;
  }

  if (typeof input?.toolArgs?.path !== "string" || input.toolArgs.path.trim() === "") {
    return false;
  }

  if (Array.isArray(input?.toolArgs?.view_range)) {
    return false;
  }

  if (input?.toolResult?.resultType !== "success") {
    return false;
  }

  return true;
}

export function createMaHooks({
  activeContextBySession = new Map(),
  log = async () => {},
  runMaCommand = async () => {
    throw new Error("runMaCommand is required");
  },
  cwdProvider = () => process.cwd(),
  maxActiveContexts = DEFAULT_MAX_ACTIVE_CONTEXTS,
  publishDashboardEvent = async () => false,
  buildSessionEvent = () => null,
  dashboardSessionState = { runId: null, startedAt: null },
} = {}) {
  return {
    onUserPromptSubmitted: async (input, invocation) => {
      const prompt = normalizePrompt(input?.prompt);
      const sessionId = getSessionId(input, invocation);
      const cwd = input?.cwd || cwdProvider();

      const strength = getMaRecommendationStrength(prompt, {
        hasLargeFile: hasLargeReferencedFile(prompt, cwd),
      });

      if (!strength) {
        if (sessionId && activeContextBySession.has(sessionId)) {
          setBoundedContext(
            activeContextBySession,
            sessionId,
            { matched: false },
            maxActiveContexts,
            { refreshExisting: true },
          );
        }
        return undefined;
      }

      if (sessionId) {
        setBoundedContext(
          activeContextBySession,
          sessionId,
          { matched: true },
          maxActiveContexts,
          { refreshExisting: true },
        );
      }

      const guidance = strength === "strong"
        ? buildMaParentContext()
        : buildMaSoftParentContext();

      const label = strength === "strong" ? "reduction guidance" : "reduction hint";
      await log(`ma: injected ${label}`, { ephemeral: true });
      return {
        modifiedPrompt: `${guidance}\n\n${prompt}`,
      };
    },

    onSubagentStart: async (input, invocation) => {
      const sessionId = getSessionId(input, invocation);
      if (!sessionId || !activeContextBySession.get(sessionId)?.matched) {
        return undefined;
      }

      if (!shouldInjectMaChildContext(input)) {
        return undefined;
      }

      await log("ma: injected child guidance", { ephemeral: true });
      return { additionalContext: buildMaChildContext() };
    },

    onPostToolUse: async (input, invocation) => {
      const sessionId = getSessionId(input, invocation);
      if (!shouldRewriteViewResult(input, sessionId, activeContextBySession)) {
        return undefined;
      }

      const path = input.toolArgs.path;

      try {
        const output = await runMaCommand(["smart-read", path, "--json"], { MA_SOURCE: "extension" });
        const reduced = parseMaOutput(output);
        if (!reduced) {
          return undefined;
        }

        await log("ma: rewrote view output", { ephemeral: true });
        return {
          modifiedResult: {
            ...input.toolResult,
            textResultForLlm: reduced,
          },
        };
      } catch {
        return undefined;
      }
    },

    onSessionStart: async (input, invocation) => {
      dashboardSessionState.runId = `extension-session-${invocation?.sessionId || `${Date.now()}-${process.pid}`}`;
      dashboardSessionState.startedAt = new Date().toISOString();

      const event = buildSessionEvent({
        kind: "started",
        runId: dashboardSessionState.runId,
        startedAt: dashboardSessionState.startedAt,
        reason: input?.source,
      });
      if (event) {
        await publishDashboardEvent(event);
      }

      await log("ma extension loaded — smart-read and reduction tools available");
      return undefined;
    },

    onSessionEnd: async (input, invocation) => {
      activeContextBySession.delete(getSessionId(input, invocation));
      if (!dashboardSessionState.runId) {
        return undefined;
      }

      const event = buildSessionEvent({
        kind: new Set(["error", "abort", "timeout"]).has(input?.reason) ? "failed" : "finished",
        runId: dashboardSessionState.runId,
        startedAt: dashboardSessionState.startedAt || new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        reason: input?.reason,
      });
      if (event) {
        await publishDashboardEvent(event);
      }

      dashboardSessionState.runId = null;
      dashboardSessionState.startedAt = null;
      return undefined;
    },
  };
}

export function createMaToolHandlers({
  runMaCommand = async () => {
    throw new Error("runMaCommand is required");
  },
  isSensitivePathResolved = () => false,
} = {}) {
  return {
    smartRead: async ({ path }) => {
      if (isSensitivePathResolved(path)) {
        return deniedResult(path);
      }

      try {
        const output = await runMaCommand(["smart-read", path, "--json"], { MA_SOURCE: "extension" });
        const reduced = parseMaOutput(output);
        return typeof reduced === "string"
          ? reduced
          : failureResult(new Error("ma smart-read returned no output"));
      } catch (error) {
        return failureResult(error);
      }
    },
  };
}
