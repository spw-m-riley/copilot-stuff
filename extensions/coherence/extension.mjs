import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";

import { loadConfig } from "./lib/config.mjs";
import { applySessionExtraction, processDeferredExtractions } from "./lib/backfill.mjs";
import { CoherenceDb } from "./lib/db.mjs";
import { createMemoryTools } from "./lib/memory-tools.mjs";
import {
  buildProceduralProfile,
  detectRelevantInstructionFiles,
} from "./lib/procedural-memory.mjs";
import { SessionStoreReader } from "./lib/session-store-reader.mjs";
import {
  readWorkspaceContext,
  resolveWorkspacePath,
} from "./lib/workspace-reader.mjs";
import { assembleMemoryCapsule, detectPromptContextNeed } from "./lib/capsule-assembler.mjs";

let lastKnownCwd = process.cwd();

const metrics = {
  sessionStartMs: [],
  userPromptSubmittedMs: [],
};

const logOnceKeys = new Set();

const runtime = {
  initialized: false,
  config: null,
  db: null,
  sessionStore: null,
  lastError: null,
  lastBackupPath: null,
  processingDeferred: false,
};

function recordMetric(values, value, windowSize) {
  values.push(value);
  if (values.length > windowSize) {
    values.splice(0, values.length - windowSize);
  }
}

function percentile(values, p) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * p)),
  );
  return sorted[index];
}

async function logOnce(session, key, message, level = "warning") {
  if (logOnceKeys.has(key)) {
    return;
  }
  logOnceKeys.add(key);
  await session.log(message, { ephemeral: true, level });
}

async function ensureRuntime(session) {
  if (runtime.initialized) {
    return runtime;
  }

  try {
    runtime.config = await loadConfig();
    runtime.db = new CoherenceDb(runtime.config);
    const initResult = runtime.db.initialize();
    runtime.lastBackupPath = initResult.backupPath ?? null;

    runtime.sessionStore = new SessionStoreReader(runtime.config);
    runtime.sessionStore.initialize();

    runtime.initialized = true;
    runtime.lastError = null;

    await session.log("coherence initialized", { ephemeral: true });
    return runtime;
  } catch (error) {
    runtime.lastError = error instanceof Error ? error : new Error(String(error));
    await logOnce(
      session,
      "coherence-init-failed",
      `coherence unavailable; hooks will fail open: ${runtime.lastError.message}`,
    );
    return runtime;
  }
}

async function getContext(session, sessionId, cwd) {
  const activeRuntime = await ensureRuntime(session);
  const workspacePath = resolveWorkspacePath(session.workspacePath, sessionId);
  const workspace = await readWorkspaceContext(workspacePath);
  const repository = workspace.workspace?.repository ?? null;

  return {
    runtime: activeRuntime,
    workspacePath,
    workspace,
    repository,
    cwd: cwd || lastKnownCwd,
  };
}

function hooksEnabled(config) {
  return config?.enabled === true;
}

function buildLatencyWarning(hookName, measuredMs, targetMs) {
  if (measuredMs <= targetMs) {
    return null;
  }
  return `${hookName} exceeded latency target (${Math.round(measuredMs)}ms > ${targetMs}ms)`;
}

async function maybeProcessDeferredExtractions(session, activeRuntime, repository) {
  const deferredConfig = activeRuntime.config?.deferredExtraction;
  if (!deferredConfig?.enabled || !deferredConfig.autoProcessOnSessionStart) {
    return;
  }
  if (activeRuntime.processingDeferred || !activeRuntime.db || !activeRuntime.sessionStore) {
    return;
  }

  activeRuntime.processingDeferred = true;
  queueMicrotask(async () => {
    try {
      const result = processDeferredExtractions({
        db: activeRuntime.db,
        sessionStore: activeRuntime.sessionStore,
        repository: deferredConfig.processCurrentRepositoryOnly ? repository : null,
        limit: deferredConfig.maxJobsPerRun,
        retryDelayMinutes: deferredConfig.retryDelayMinutes,
      });
      if (result.failed > 0) {
        await session.log(`coherence deferred extraction failed for ${result.failed} job(s)`, {
          ephemeral: true,
          level: "warning",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await session.log(`coherence deferred extraction skipped: ${message}`, {
        ephemeral: true,
        level: "warning",
      });
    } finally {
      activeRuntime.processingDeferred = false;
    }
  });
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onSessionStart: async (input, invocation) => {
      const startedAt = Date.now();
      lastKnownCwd = input.cwd || lastKnownCwd;

      const context = await getContext(session, invocation.sessionId, input.cwd);
      const { runtime: activeRuntime, repository } = context;

      if (!activeRuntime.initialized || activeRuntime.lastError) {
        return;
      }

      if (!hooksEnabled(activeRuntime.config)) {
        await logOnce(
          session,
          "coherence-disabled",
          `coherence hooks are disabled by default; set ${activeRuntime.config.configPath} or COHERENCE_ENABLED=1 to enable`,
          "info",
        );
        return;
      }

      await maybeProcessDeferredExtractions(session, activeRuntime, repository);

      const relevantInstructionFiles = detectRelevantInstructionFiles(input.initialPrompt ?? "");
      const proceduralProfile = await buildProceduralProfile({
        prompt: input.initialPrompt ?? "",
        relevantInstructionFiles,
        config: activeRuntime.config,
      });

      const assembled = activeRuntime.db
        ? await assembleMemoryCapsule({
            prompt: input.initialPrompt ?? "",
            repository,
            proceduralProfile,
            db: activeRuntime.db,
            sessionStore: activeRuntime.sessionStore,
            config: activeRuntime.config,
          })
        : { text: "", sections: [] };

      const durationMs = Date.now() - startedAt;
      recordMetric(
        metrics.sessionStartMs,
        durationMs,
        activeRuntime.config.limits.metricWindowSize,
      );
      const warning = buildLatencyWarning(
        "coherence onSessionStart",
        durationMs,
        activeRuntime.config.latencyTargetsMs.sessionStartP95,
      );
      if (warning) {
        await session.log(warning, { ephemeral: true, level: "warning" });
      }

      if (!assembled.text) {
        return;
      }

      return {
        additionalContext: assembled.text,
      };
    },

    onUserPromptSubmitted: async (input, invocation) => {
      const startedAt = Date.now();
      lastKnownCwd = input.cwd || lastKnownCwd;

      const context = await getContext(session, invocation.sessionId, input.cwd);
      const { runtime: activeRuntime, repository } = context;

      if (!activeRuntime.initialized || activeRuntime.lastError || !hooksEnabled(activeRuntime.config)) {
        return;
      }

      const need = detectPromptContextNeed(input.prompt);
      if (!need.requiresLookup) {
        const durationMs = Date.now() - startedAt;
        recordMetric(
          metrics.userPromptSubmittedMs,
          durationMs,
          activeRuntime.config.limits.metricWindowSize,
        );
        return;
      }

      const additionalContext = activeRuntime.db.buildPromptContext({
        prompt: input.prompt,
        repository,
        includeOtherRepositories: need.allowCrossRepoFallback === true,
        limit: activeRuntime.config.limits.promptContextLimit,
        sessionStore: activeRuntime.sessionStore,
        promptNeed: need,
      });

      const durationMs = Date.now() - startedAt;
      recordMetric(
        metrics.userPromptSubmittedMs,
        durationMs,
        activeRuntime.config.limits.metricWindowSize,
      );
      const warning = buildLatencyWarning(
        "coherence onUserPromptSubmitted",
        durationMs,
        activeRuntime.config.latencyTargetsMs.userPromptSubmittedP95,
      );
      if (warning) {
        await session.log(warning, { ephemeral: true, level: "warning" });
      }

      if (!additionalContext) {
        return;
      }

      return {
        additionalContext,
      };
    },

    onSessionEnd: async (input, invocation) => {
      lastKnownCwd = input.cwd || lastKnownCwd;
      const context = await getContext(session, invocation.sessionId, input.cwd);
      const { runtime: activeRuntime, workspace, repository } = context;

      if (!activeRuntime.initialized || activeRuntime.lastError || !hooksEnabled(activeRuntime.config)) {
        return;
      }

      try {
        const extraction = activeRuntime.sessionStore
          ? activeRuntime.sessionStore.getSessionArtifacts(invocation.sessionId)
          : null;
        if (!extraction) {
          return;
        }

        applySessionExtraction({
          db: activeRuntime.db,
          sessionId: invocation.sessionId,
          repository,
          sessionArtifacts: extraction,
          workspace,
        });

        if (activeRuntime.config?.deferredExtraction?.enabled
          && activeRuntime.config.deferredExtraction.autoEnqueueOnSessionEnd) {
          activeRuntime.db.enqueueDeferredExtraction({
            sessionId: invocation.sessionId,
            repository,
            reason: "session_end",
            priority: 10,
            metadata: {
              mode: "deferred",
            },
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await session.log(`coherence session-end extraction skipped: ${message}`, {
          ephemeral: true,
          level: "warning",
        });
      }

      if (input.reason === "error") {
        await session.log("coherence observed session end with error", {
          ephemeral: true,
          level: "warning",
        });
      }
    },
  },
  tools: createMemoryTools({
    getRuntime: async (sessionId) => {
      const context = await getContext(session, sessionId, lastKnownCwd);
      return {
        ...context.runtime,
        repository: context.repository,
        workspace: context.workspace,
        metrics: {
          sessionStartP95: percentile(metrics.sessionStartMs, 0.95),
          userPromptSubmittedP95: percentile(metrics.userPromptSubmittedMs, 0.95),
          sampleSize: {
            sessionStart: metrics.sessionStartMs.length,
            userPromptSubmitted: metrics.userPromptSubmittedMs.length,
          },
        },
      };
    },
  }),
});

await ensureRuntime(session);
