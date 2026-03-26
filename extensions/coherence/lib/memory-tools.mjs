import {
  applySessionExtraction,
  previewControlledBackfill,
  processControlledBackfillRun,
  processDeferredExtractions,
  restoreControlledBackfillRun,
  startControlledBackfillRun,
} from "./backfill.mjs";
import {
  explainMemoryRetrieval,
  renderExplanationReport,
  renderReplayReport,
  renderValidationReport,
  runReplayCorpus,
  runValidationSet,
} from "./diagnostics.mjs";

function formatRows(rows, render) {
  if (!rows || rows.length === 0) {
    return "No results.";
  }
  return rows.map(render).join("\n");
}

function ensureString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
  return value.trim();
}

function ensureLimit(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.min(20, Math.floor(value));
  }
  return fallback;
}

function ensureIds(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("ids must be a non-empty array");
  }
  const ids = [...new Set(
    value
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean),
  )];
  if (ids.length === 0) {
    throw new Error("ids must contain at least one non-empty string");
  }
  return ids;
}

function formatAuditRows(rows) {
  return formatRows(rows, (row) => [
    `- [${row.action}] ${row.target_type}:${row.target_id}`,
    `prev=${row.previous_scope ?? "none"}(${row.previous_repository ?? "global"})`,
    `next=${row.next_scope ?? "none"}(${row.next_repository ?? "global"})`,
    `actor=${row.actor}`,
    `source=${row.source}`,
    `reason=${row.reason}`,
    `at=${row.created_at}`,
  ].join(" "));
}

function formatScopePreview(preview) {
  const lines = [
    `action: ${preview.action}`,
    `targetType: ${preview.targetType}`,
    `requestedCount: ${preview.requestedCount}`,
    `matchedCount: ${preview.matchedCount}`,
    `missingIds: ${preview.missingIds.length > 0 ? preview.missingIds.join(", ") : "none"}`,
    "",
    "## Rows",
    "",
  ];
  lines.push(formatRows(preview.rows, (row) => [
    `- ${row.id}`,
    `current=${row.current.scope}/${row.current.scopeSource}`,
    `(${row.current.repository ?? "global"})`,
    `-> next=${row.next.scope}/${row.next.scopeSource}`,
    `(${row.next.repository ?? "global"})`,
    `changed=${row.changed}`,
  ].join(" ")));
  return lines.join("\n");
}

function formatBackfillRunRows(rows) {
  return formatRows(rows, (row) => [
    `- ${row.id}`,
    `status=${row.status}`,
    `processed=${row.processed_count}/${row.total_candidates}`,
    `created=${row.created_episode_count}`,
    `refreshed=${row.refreshed_episode_count}`,
    `failed=${row.failed_count}`,
    `snapshot=${row.snapshot_path ?? "none"}`,
  ].join(" "));
}

function formatBackfillItems(rows) {
  return formatRows(rows, (row) => [
    `- ${row.session_id}`,
    `planned=${row.planned_action}`,
    `status=${row.status}`,
    row.episode_before_scope || row.episode_after_scope
      ? `episode=${row.episode_before_scope ?? "none"}->${row.episode_after_scope ?? "none"}`
      : null,
    Number.isInteger(row.semantic_delta) ? `semanticDelta=${row.semantic_delta}` : null,
    row.error ? `error=${row.error}` : null,
  ].filter(Boolean).join(" "));
}

function formatControlledBackfillPreview(preview) {
  return [
    `dryRun: ${preview.dryRun === true}`,
    `repository: ${preview.repository ?? "all"}`,
    `inspected: ${preview.inspected}`,
    `skippedExisting: ${preview.skippedExisting}`,
    `candidateCount: ${preview.candidates.length}`,
    "",
    "## Candidates",
    "",
    formatRows(preview.candidates, (candidate) => [
      `- ${candidate.sessionId}`,
      `planned=${candidate.plannedAction}`,
      `repository=${candidate.repository ?? "unknown"}`,
      candidate.updatedAt ? `updated=${candidate.updatedAt}` : null,
      candidate.summary ? `summary=${candidate.summary}` : null,
    ].filter(Boolean).join(" ")),
  ].join("\n");
}

function formatControlledBackfillRun(run, items = []) {
  return [
    `runId: ${run.id}`,
    `status: ${run.status}`,
    `repository: ${run.repository ?? "all"}`,
    `processed: ${run.processed_count}/${run.total_candidates}`,
    `createdEpisodeCount: ${run.created_episode_count}`,
    `refreshedEpisodeCount: ${run.refreshed_episode_count}`,
    `skippedCount: ${run.skipped_count}`,
    `failedCount: ${run.failed_count}`,
    `batchSize: ${run.batch_size}`,
    `snapshotPath: ${run.snapshot_path ?? "none"}`,
    `startedAt: ${run.started_at}`,
    `updatedAt: ${run.updated_at}`,
    `completedAt: ${run.completed_at ?? "not complete"}`,
    "",
    "## Item Summary",
    "",
    formatBackfillItems(items),
  ].join("\n");
}

export function createMemoryTools({ getRuntime }) {
  return [
    {
      name: "memory_status",
      description: "Show coherence extension status, counts, repo scope, and hook latency measurements.",
      parameters: {
        type: "object",
        properties: {},
      },
      handler: async (_args, invocation) => {
        const runtime = await getRuntime(invocation.sessionId);
        if (!runtime.initialized || runtime.lastError) {
          return `coherence unavailable: ${runtime.lastError?.message ?? "not initialized"}`;
        }

        const stats = runtime.db.getStats();
        return [
          `enabled: ${runtime.config.enabled}`,
          `repository: ${runtime.repository ?? "global-only"}`,
          `dbPath: ${stats.dbPath}`,
          `schemaVersion: ${stats.schemaVersion}`,
          `semanticCount: ${stats.semanticCount}`,
          `episodeCount: ${stats.episodeCount}`,
          `semanticGlobalCount: ${stats.semanticGlobalCount}`,
          `semanticTransferableCount: ${stats.semanticTransferableCount}`,
          `semanticRepoCount: ${stats.semanticRepoCount}`,
          `semanticManualCount: ${stats.semanticManualCount}`,
          `episodeTransferableCount: ${stats.episodeTransferableCount}`,
          `episodeRepoCount: ${stats.episodeRepoCount}`,
          `episodeManualCount: ${stats.episodeManualCount}`,
          `daySummaryCount: ${stats.daySummaryCount}`,
          `overrideAuditCount: ${stats.overrideAuditCount}`,
          `backfillRunningCount: ${stats.backfillRunningCount}`,
          `backfillCompletedCount: ${stats.backfillCompletedCount}`,
          `backfillFailedCount: ${stats.backfillFailedCount}`,
          `backfillDryRunCount: ${stats.backfillDryRunCount}`,
          `deferredPendingCount: ${stats.deferredPendingCount}`,
          `deferredRunningCount: ${stats.deferredRunningCount}`,
          `deferredFailedCount: ${stats.deferredFailedCount}`,
          `deferredCompletedCount: ${stats.deferredCompletedCount}`,
          `lastBackupPath: ${stats.lastBackupPath ?? "none"}`,
          `sessionStartP95Ms: ${Math.round(runtime.metrics.sessionStartP95)}`,
          `userPromptSubmittedP95Ms: ${Math.round(runtime.metrics.userPromptSubmittedP95)}`,
          `sessionStartSamples: ${runtime.metrics.sampleSize.sessionStart}`,
          `userPromptSubmittedSamples: ${runtime.metrics.sampleSize.userPromptSubmitted}`,
          `configPath: ${runtime.config.configPath}`,
        ].join("\n");
      },
    },
    {
      name: "memory_search",
      description: "Search semantic and episodic memory. Global memories are always eligible; repository isolation for non-global items is preserved unless includeOtherRepositories is true.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          type: { type: "string", description: "Optional semantic memory type filter" },
          limit: { type: "number", description: "Optional result limit" },
          includeOtherRepositories: {
            type: "boolean",
            description: "When true, search beyond the current repository scope",
          },
        },
        required: ["query"],
      },
      handler: async (args, invocation) => {
        const runtime = await getRuntime(invocation.sessionId);
        if (!runtime.initialized || runtime.lastError) {
          return `coherence unavailable: ${runtime.lastError?.message ?? "not initialized"}`;
        }

        const query = ensureString(args.query, "query");
        const limit = ensureLimit(args.limit, 6);
        const includeOtherRepositories = args.includeOtherRepositories === true;
        const types = typeof args.type === "string" && args.type.trim().length > 0
          ? [args.type.trim()]
          : [];

        const semantic = runtime.db.searchSemantic({
          query,
          repository: runtime.repository,
          includeOtherRepositories,
          types,
          limit,
        });
        const episodes = runtime.db.searchEpisodes({
          query,
          repository: runtime.repository,
          includeOtherRepositories,
          limit: Math.max(1, Math.floor(limit / 2)),
        });

        return [
          "## Semantic Memory",
          "",
          formatRows(
            semantic,
            (row) => `- [${row.id} ${row.type}/${row.scope}/${row.scope_source}] ${row.content} (${row.repository ?? "global"})`,
          ),
          "",
          "## Episodic Memory",
          "",
          formatRows(
            episodes,
            (row) => `- [${row.id} ${row.scope}/${row.scope_source}] ${row.summary} (${row.repository ?? "global"}, ${row.date_key})`,
          ),
        ].join("\n");
      },
    },
    {
      name: "memory_explain",
      description: "Explain why coherence would return specific context for a prompt, including matched rows, eligible scopes, and filtered/suppressed branches.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Prompt to explain" },
          mode: {
            type: "string",
            description: "Explain prompt-time retrieval or the session-start capsule",
            enum: ["prompt", "session_start"],
          },
        },
        required: ["prompt"],
      },
      handler: async (args, invocation) => {
        const runtime = await getRuntime(invocation.sessionId);
        if (!runtime.initialized || runtime.lastError) {
          return `coherence unavailable: ${runtime.lastError?.message ?? "not initialized"}`;
        }

        const prompt = ensureString(args.prompt, "prompt");
        const mode = args.mode === "session_start" ? "session_start" : "prompt";
        const explanation = await explainMemoryRetrieval({
          runtime,
          prompt,
          mode,
        });
        return renderExplanationReport(explanation);
      },
    },
    {
      name: "memory_validate",
      description: "Run the built-in coherence validation set and report pass/fail assertions plus current latency metrics.",
      parameters: {
        type: "object",
        properties: {
          caseIds: {
            type: "array",
            items: { type: "string" },
            description: "Optional subset of validation case IDs to run",
          },
          verbose: {
            type: "boolean",
            description: "When true, show all assertions instead of only failed ones",
          },
        },
      },
      handler: async (args, invocation) => {
        const runtime = await getRuntime(invocation.sessionId);
        if (!runtime.initialized || runtime.lastError) {
          return `coherence unavailable: ${runtime.lastError?.message ?? "not initialized"}`;
        }

        const caseIds = Array.isArray(args.caseIds)
          ? args.caseIds.filter((value) => typeof value === "string" && value.trim().length > 0)
          : [];
        const verbose = args.verbose === true;
        const result = await runValidationSet({
          runtime,
          caseIds,
        });
        return renderValidationReport(result, { verbose });
      },
    },
    {
      name: "memory_replay",
      description: "Run the broader coherence replay corpus, including must-pass invariants and ranking targets, and show which expected evidence ranked in or missed.",
      parameters: {
        type: "object",
        properties: {
          caseIds: {
            type: "array",
            items: { type: "string" },
            description: "Optional subset of replay case IDs to run",
          },
          verbose: {
            type: "boolean",
            description: "When true, show all replay cases with evidence samples and lookup sources",
          },
        },
      },
      handler: async (args, invocation) => {
        const runtime = await getRuntime(invocation.sessionId);
        if (!runtime.initialized || runtime.lastError) {
          return `coherence unavailable: ${runtime.lastError?.message ?? "not initialized"}`;
        }

        const caseIds = Array.isArray(args.caseIds)
          ? args.caseIds.filter((value) => typeof value === "string" && value.trim().length > 0)
          : [];
        const verbose = args.verbose === true;
        const result = await runReplayCorpus({
          runtime,
          caseIds,
        });
        return renderReplayReport(result, { verbose });
      },
    },
    {
      name: "memory_scope_override",
      description: "Preview or apply manual scope overrides for semantic memory or episode digests. Manual overrides win until explicitly cleared.",
      parameters: {
        type: "object",
        properties: {
          targetType: {
            type: "string",
            enum: ["semantic", "episode"],
            description: "Which memory table to modify",
          },
          ids: {
            type: "array",
            items: { type: "string" },
            description: "One or more target row ids from memory_search output",
          },
          action: {
            type: "string",
            enum: ["set", "clear"],
            description: "Set a manual scope override or clear it back to auto classification",
          },
          scope: {
            type: "string",
            enum: ["global", "transferable", "repo"],
            description: "Required when action is set",
          },
          repository: {
            type: "string",
            description: "Optional repository fallback when assigning a non-global scope to a global row",
          },
          dryRun: {
            type: "boolean",
            description: "When true, preview the scope change without writing",
          },
          actor: {
            type: "string",
            description: "Optional actor label for audit history",
          },
          reason: {
            type: "string",
            description: "Reason for the override or clear action",
          },
          source: {
            type: "string",
            description: "Optional audit source label",
          },
        },
        required: ["targetType", "ids"],
      },
      handler: async (args, invocation) => {
        const runtime = await getRuntime(invocation.sessionId);
        if (!runtime.initialized || runtime.lastError) {
          return `coherence unavailable: ${runtime.lastError?.message ?? "not initialized"}`;
        }

        const targetType = args.targetType === "episode" ? "episode" : "semantic";
        const ids = ensureIds(args.ids);
        const action = args.action === "clear" ? "clear" : "set";
        const dryRun = args.dryRun !== false;
        const reason = typeof args.reason === "string" ? args.reason.trim() : "";
        if (!dryRun && reason.length === 0) {
          throw new Error("reason is required when dryRun is false");
        }
        if (action === "set" && (typeof args.scope !== "string" || args.scope.trim().length === 0)) {
          throw new Error("scope is required when action is set");
        }

        const preview = runtime.db.previewScopeChanges({
          targetType,
          ids,
          action,
          scope: args.scope,
          repository: typeof args.repository === "string" ? args.repository : runtime.repository,
        });
        if (dryRun) {
          return formatScopePreview(preview);
        }

        const applied = runtime.db.applyScopeChanges({
          targetType,
          ids,
          action,
          scope: args.scope,
          repository: typeof args.repository === "string" ? args.repository : runtime.repository,
          actor: typeof args.actor === "string" && args.actor.trim().length > 0
            ? args.actor.trim()
            : `session:${invocation.sessionId}`,
          reason,
          source: typeof args.source === "string" && args.source.trim().length > 0
            ? args.source.trim()
            : "memory_scope_override",
        });
        return [
          `Applied ${applied.action} override to ${applied.rows.length} ${targetType} row(s).`,
          "",
          formatScopePreview(applied),
        ].join("\n");
      },
    },
    {
      name: "memory_scope_audit",
      description: "Show scope override audit history for semantic memory or episode digests.",
      parameters: {
        type: "object",
        properties: {
          targetType: {
            type: "string",
            enum: ["semantic", "episode"],
            description: "Optional audit filter by target type",
          },
          targetId: {
            type: "string",
            description: "Optional specific row id to inspect",
          },
          limit: {
            type: "number",
            description: "Maximum audit rows to show",
          },
        },
      },
      handler: async (args, invocation) => {
        const runtime = await getRuntime(invocation.sessionId);
        if (!runtime.initialized || runtime.lastError) {
          return `coherence unavailable: ${runtime.lastError?.message ?? "not initialized"}`;
        }

        const rows = runtime.db.listScopeOverrideAudit({
          targetType: typeof args.targetType === "string" ? args.targetType : undefined,
          targetId: typeof args.targetId === "string" ? args.targetId : undefined,
          limit: ensureLimit(args.limit, 10),
        });
        return [
          "## Scope Override Audit",
          "",
          formatAuditRows(rows),
        ].join("\n");
      },
    },
    {
      name: "memory_save",
      description: "Save a semantic memory item into coherence.db. Omit repository to save globally, or provide an explicit scope override.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "Memory content to persist" },
          type: { type: "string", description: "Semantic memory type" },
          repository: { type: "string", description: "Optional explicit repository scope" },
          scope: { type: "string", description: "Optional memory scope: global, transferable, or repo" },
          confidence: { type: "number", description: "Optional confidence score from 0 to 1" },
        },
        required: ["content", "type"],
      },
      handler: async (args, invocation) => {
        const runtime = await getRuntime(invocation.sessionId);
        if (!runtime.initialized || runtime.lastError) {
          return `coherence unavailable: ${runtime.lastError?.message ?? "not initialized"}`;
        }

        const content = ensureString(args.content, "content");
        const type = ensureString(args.type, "type");
        const confidence = typeof args.confidence === "number" ? args.confidence : 0.9;
        const id = runtime.db.insertSemanticMemory({
          type,
          content,
          confidence,
          repository: typeof args.repository === "string" && args.repository.trim()
            ? args.repository.trim()
            : null,
          scope: typeof args.scope === "string" ? args.scope.trim() : undefined,
          sourceSessionId: invocation.sessionId,
          tags: [type, "manual"],
          metadata: { source: "memory_save" },
        });

        return `Saved semantic memory ${id}`;
      },
    },
    {
      name: "memory_forget",
      description: "Mark a semantic memory item as superseded.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Semantic memory id" },
          supersededBy: { type: "string", description: "Optional replacement id or note" },
        },
        required: ["id"],
      },
      handler: async (args, invocation) => {
        const runtime = await getRuntime(invocation.sessionId);
        if (!runtime.initialized || runtime.lastError) {
          return `coherence unavailable: ${runtime.lastError?.message ?? "not initialized"}`;
        }

        const id = ensureString(args.id, "id");
        runtime.db.forgetMemory({
          id,
          supersededBy: typeof args.supersededBy === "string" ? args.supersededBy : undefined,
        });
        return `Marked memory ${id} as superseded.`;
      },
    },
    {
      name: "memory_deferred_process",
      description: "Process queued deferred extraction jobs now, optionally across repositories.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Maximum queued jobs to process" },
          includeOtherRepositories: {
            type: "boolean",
            description: "When true, process queued jobs across repositories",
          },
        },
      },
      handler: async (args, invocation) => {
        const runtime = await getRuntime(invocation.sessionId);
        if (!runtime.initialized || runtime.lastError) {
          return `coherence unavailable: ${runtime.lastError?.message ?? "not initialized"}`;
        }

        const limit = ensureLimit(args.limit, runtime.config.deferredExtraction?.maxJobsPerRun ?? 2);
        const includeOtherRepositories = args.includeOtherRepositories === true;
        const result = processDeferredExtractions({
          db: runtime.db,
          sessionStore: runtime.sessionStore,
          repository: includeOtherRepositories ? null : runtime.repository,
          limit,
          retryDelayMinutes: runtime.config.deferredExtraction?.retryDelayMinutes ?? 15,
        });
        return `Processed ${result.processed} deferred job(s), failed ${result.failed}, inspected ${result.inspected}.`;
      },
    },
    {
      name: "memory_backfill",
      description: "Backfill recent sessions from the raw session store into episodic memory. Supports legacy one-shot mode and controlled resumable runs with dry-run, snapshot, and restore.",
      parameters: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            enum: ["legacy", "controlled"],
            description: "Legacy one-shot mode or controlled resumable mode",
          },
          action: {
            type: "string",
            enum: ["preview", "start", "resume", "status", "restore"],
            description: "Controlled-mode action",
          },
          limit: { type: "number", description: "Maximum recent sessions to inspect" },
          batchSize: { type: "number", description: "Maximum items to process per controlled batch" },
          includeOtherRepositories: {
            type: "boolean",
            description: "When true, backfill across repositories rather than current repo only",
          },
          refreshExisting: {
            type: "boolean",
            description: "When true, reprocess existing digests so improved extraction logic can refresh older summaries",
          },
          runId: {
            type: "string",
            description: "Controlled backfill run id for resume, status, or restore",
          },
          retryFailed: {
            type: "boolean",
            description: "When true, resume retries failed items as well as pending ones",
          },
        },
      },
      handler: async (args, invocation) => {
        const runtime = await getRuntime(invocation.sessionId);
        if (!runtime.initialized || runtime.lastError) {
          return `coherence unavailable: ${runtime.lastError?.message ?? "not initialized"}`;
        }

        const mode = args.mode === "controlled" ? "controlled" : "legacy";
        const limit = ensureLimit(args.limit, mode === "controlled" ? 25 : runtime.config.limits.recentSessionsFallbackLimit);
        const includeOtherRepositories = args.includeOtherRepositories === true;
        const refreshExisting = mode === "controlled"
          ? args.refreshExisting !== false
          : args.refreshExisting === true;
        const batchSize = ensureLimit(args.batchSize, 5);
        if (mode === "controlled") {
          const action = typeof args.action === "string" ? args.action : "preview";
          if (action === "preview") {
            const preview = previewControlledBackfill({
              db: runtime.db,
              sessionStore: runtime.sessionStore,
              repository: runtime.repository,
              includeOtherRepositories,
              limit,
              refreshExisting,
            });
            return formatControlledBackfillPreview(preview);
          }
          if (action === "start") {
            const result = startControlledBackfillRun({
              db: runtime.db,
              sessionStore: runtime.sessionStore,
              repository: runtime.repository,
              includeOtherRepositories,
              limit,
              refreshExisting,
              batchSize,
            });
            return [
              `Started controlled backfill run ${result.runId}.`,
              "",
              formatControlledBackfillRun(result.run, result.items),
            ].join("\n");
          }
          if (action === "resume") {
            const runId = ensureString(args.runId, "runId");
            const result = processControlledBackfillRun({
              db: runtime.db,
              sessionStore: runtime.sessionStore,
              runId,
              limit: batchSize,
              retryFailed: args.retryFailed === true,
            });
            return [
              `Processed controlled backfill run ${runId}.`,
              "",
              formatControlledBackfillRun(result.run, result.items),
            ].join("\n");
          }
          if (action === "status") {
            if (typeof args.runId === "string" && args.runId.trim().length > 0) {
              const runId = args.runId.trim();
              const run = runtime.db.getBackfillRun(runId);
              if (!run) {
                throw new Error(`backfill run not found: ${runId}`);
              }
              const items = runtime.db.listBackfillRunItems({ runId, limit: Math.max(batchSize, 10) });
              return formatControlledBackfillRun(run, items);
            }
            const runs = runtime.db.listBackfillRuns({ limit: Math.max(batchSize, 10) });
            return [
              "## Backfill Runs",
              "",
              formatBackfillRunRows(runs),
            ].join("\n");
          }
          if (action === "restore") {
            const runId = ensureString(args.runId, "runId");
            const restored = restoreControlledBackfillRun({
              db: runtime.db,
              runId,
            });
            return [
              `Restored coherence.db from snapshot for run ${runId}.`,
              `snapshotPath: ${restored.snapshotPath}`,
              `schemaVersion: ${restored.schemaVersion}`,
            ].join("\n");
          }
          throw new Error(`unsupported controlled backfill action: ${action}`);
        }

        const sessions = runtime.sessionStore.getRecentSessions({
          repository: includeOtherRepositories ? null : runtime.repository,
          limit,
        });

        let created = 0;
        for (const candidate of sessions) {
          if (!refreshExisting && runtime.db.hasEpisodeDigest(candidate.id)) {
            continue;
          }
          const artifacts = runtime.sessionStore.getSessionArtifacts(candidate.id);
          if (!artifacts) {
            continue;
          }
          applySessionExtraction({
            db: runtime.db,
            sessionId: candidate.id,
            repository: candidate.repository ?? runtime.repository,
            sessionArtifacts: artifacts,
            workspace: { workspace: null, events: [] },
          });
          created += 1;
        }

        return refreshExisting
          ? `Backfilled or refreshed ${created} session(s).`
          : `Backfilled ${created} session(s).`;
      },
    },
  ];
}
