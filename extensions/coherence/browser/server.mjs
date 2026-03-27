import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMaintenancePlan } from "../lib/maintenance-scheduler.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATIC_ROOT = __dirname;

function clampInteger(value, fallback, { min = 1, max = 500 } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function parseJsonObject(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function normalizeRepository(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function computeLatencyTrend(rows) {
  const latencies = rows
    .map((row) => Number(row.latencyMs))
    .filter((value) => Number.isFinite(value));
  if (latencies.length === 0) {
    return {
      sampleCount: 0,
      recentAverageMs: 0,
      previousAverageMs: 0,
      deltaMs: 0,
      trend: "no_samples",
    };
  }

  const windowSize = Math.max(1, Math.min(10, Math.floor(latencies.length / 2) || 1));
  const recent = latencies.slice(-windowSize);
  const previous = latencies.slice(-(windowSize * 2), -windowSize);
  const average = (values) => Math.round(values.reduce((sum, item) => sum + item, 0) / values.length);
  const recentAverageMs = average(recent);
  const previousAverageMs = previous.length > 0 ? average(previous) : 0;
  const deltaMs = previous.length > 0 ? recentAverageMs - previousAverageMs : 0;
  const trend = previous.length === 0
    ? "insufficient_history"
    : Math.abs(deltaMs) <= 5
      ? "flat"
      : deltaMs > 0
        ? "rising"
        : "falling";

  return {
    sampleCount: latencies.length,
    recentAverageMs,
    previousAverageMs,
    deltaMs,
    trend,
  };
}

function jsonResponse(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function notFound(res) {
  jsonResponse(res, 404, {
    ok: false,
    error: "not_found",
  });
}

function methodNotAllowed(res) {
  jsonResponse(res, 405, {
    ok: false,
    error: "method_not_allowed",
  });
}

function getStaticContentType(filePath) {
  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }
  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }
  if (filePath.endsWith(".js")) {
    return "text/javascript; charset=utf-8";
  }
  return "text/plain; charset=utf-8";
}

async function serveStatic(req, res, pathname) {
  const candidate = pathname === "/" ? "/index.html" : pathname;
  const resolved = path.resolve(STATIC_ROOT, `.${candidate}`);
  if (!resolved.startsWith(STATIC_ROOT)) {
    notFound(res);
    return;
  }

  try {
    const content = await readFile(resolved);
    res.writeHead(200, {
      "Content-Type": getStaticContentType(resolved),
      "Cache-Control": "no-store",
      "Content-Length": content.length,
    });
    res.end(content);
  } catch {
    if (candidate !== "/index.html") {
      return serveStatic(req, res, "/index.html");
    }
    notFound(res);
  }
}

function queryOverview({ db, repository, traceLimit = 40, maintenanceLimit = 10 }) {
  const stats = db.getStats();
  const traces = db.listRetrievalTraceSamples({
    repository,
    includeGlobal: true,
    limit: clampInteger(traceLimit, 40, { min: 5, max: 200 }),
  });
  const activity = db.getActivityState({ repository, includeGlobal: true });

  const workstreamRows = db.db.prepare(`
    SELECT id, repository, scope, content, metadata_json, updated_at
    FROM semantic_memory
    WHERE type = 'workstream_overlay'
      AND superseded_by IS NULL
    ORDER BY updated_at DESC
    LIMIT 20
  `).all();
  const workstreams = workstreamRows
    .map((row) => {
      const metadata = parseJsonObject(row.metadata_json);
      return {
        id: row.id,
        repository: row.repository,
        scope: row.scope,
        status: typeof metadata.status === "string" ? metadata.status : "active",
        title: typeof metadata.title === "string" && metadata.title.trim().length > 0
          ? metadata.title.trim()
          : row.content,
        mission: typeof metadata.mission === "string" ? metadata.mission : "",
        objective: typeof metadata.objective === "string" ? metadata.objective : "",
        blockers: Array.isArray(metadata.blockers) ? metadata.blockers : [],
        nextActions: Array.isArray(metadata.nextActions) ? metadata.nextActions : [],
        updatedAt: row.updated_at,
      };
    })
    .filter((row) => row.status !== "done");

  const maintenancePlan = buildMaintenancePlan({
    runtime: {
      config: db.config,
      db,
      traceRecorder: {
        isEnabled: () => Boolean(db.config?.rollout?.traceRecorder),
      },
    },
    repository,
    trigger: "status",
    force: false,
    requestedTasks: [],
  });

  const recentRuns = db.listMaintenanceRuns({
    limit: clampInteger(maintenanceLimit, 10, { min: 1, max: 50 }),
  });

  return {
    stats,
    activeWorkstreams: workstreams,
    activity,
    maintenance: {
      dueTasks: maintenancePlan.dueTasks,
      selectedTasks: maintenancePlan.selectedTasks,
      recentRuns,
      skippedDueToCap: maintenancePlan.skippedDueToCap,
    },
    latencyTrend: computeLatencyTrend(traces),
    recentTraceSamples: traces.slice(0, 10),
  };
}

function queryMemoryFilters({ db }) {
  const types = db.db.prepare(`
    SELECT type, COUNT(*) AS count
    FROM semantic_memory
    GROUP BY type
    ORDER BY count DESC, type ASC
  `).all();
  const scopes = db.db.prepare(`
    SELECT scope, COUNT(*) AS count
    FROM semantic_memory
    GROUP BY scope
    ORDER BY count DESC, scope ASC
  `).all();
  const repositories = db.db.prepare(`
    SELECT repository, COUNT(*) AS count
    FROM semantic_memory
    WHERE repository IS NOT NULL AND repository != ''
    GROUP BY repository
    ORDER BY count DESC, repository ASC
    LIMIT 200
  `).all();
  const canonicalKeys = db.db.prepare(`
    SELECT canonical_key AS canonicalKey, COUNT(*) AS count
    FROM semantic_memory
    WHERE canonical_key IS NOT NULL AND canonical_key != ''
    GROUP BY canonical_key
    ORDER BY count DESC, canonical_key ASC
    LIMIT 200
  `).all();

  return {
    types,
    scopes,
    repositories,
    canonicalKeys,
  };
}

function queryMemories({ db, url }) {
  const type = url.searchParams.get("type")?.trim() || null;
  const scope = url.searchParams.get("scope")?.trim() || null;
  const repository = normalizeRepository(url.searchParams.get("repository"));
  const canonicalKey = url.searchParams.get("canonicalKey")?.trim() || null;
  const state = (url.searchParams.get("state") || "active").trim().toLowerCase();
  const page = clampInteger(url.searchParams.get("page"), 1, { min: 1, max: 2000 });
  const pageSize = clampInteger(url.searchParams.get("pageSize"), 25, { min: 1, max: 100 });
  const offset = (page - 1) * pageSize;

  const clauses = [];
  const params = [];

  if (type) {
    clauses.push("type = ?");
    params.push(type);
  }
  if (scope) {
    clauses.push("scope = ?");
    params.push(scope);
  }
  if (repository) {
    clauses.push("repository = ?");
    params.push(repository);
  }
  if (canonicalKey) {
    clauses.push("canonical_key = ?");
    params.push(canonicalKey);
  }
  if (state === "active") {
    clauses.push("superseded_by IS NULL");
  } else if (state === "superseded") {
    clauses.push("superseded_by IS NOT NULL");
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const countRow = db.db.prepare(`
    SELECT COUNT(*) AS count
    FROM semantic_memory
    ${where}
  `).get(...params);

  const rows = db.db.prepare(`
    SELECT
      id, type, content, confidence, source_session_id, source_turn_index,
      scope, scope_source, repository, tags, created_at, updated_at,
      superseded_by, canonical_key, reinforcement_count, last_seen_at,
      expires_at, metadata_json
    FROM semantic_memory
    ${where}
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  return {
    page,
    pageSize,
    total: countRow?.count ?? 0,
    rows: rows.map((row) => ({
      id: row.id,
      type: row.type,
      content: row.content,
      confidence: row.confidence,
      sourceSessionId: row.source_session_id,
      sourceTurnIndex: row.source_turn_index,
      scope: row.scope,
      scopeSource: row.scope_source,
      repository: row.repository,
      tags: typeof row.tags === "string" ? row.tags.split(/\s+/).filter(Boolean) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      supersededBy: row.superseded_by,
      canonicalKey: row.canonical_key,
      reinforcementCount: row.reinforcement_count,
      lastSeenAt: row.last_seen_at,
      expiresAt: row.expires_at,
      metadata: parseJsonObject(row.metadata_json),
    })),
  };
}

function queryMaintenance({ db, repository }) {
  const runs = db.listMaintenanceRuns({ limit: 20 });
  const taskStates = db.listMaintenanceTaskStates();
  const traces = db.listRetrievalTraceSamples({ repository, includeGlobal: true, limit: 30 });
  const doctorReports = db.listTrajectoryArtifacts({ kind: "doctor_report", repository, limit: 20 });
  const trajectory = db.listTrajectoryArtifacts({ repository, limit: 30 });

  const deferred = db.db.prepare(`
    SELECT
      session_id, repository, status, priority, reason, queued_at,
      available_at, started_at, completed_at, attempts, last_error, metadata_json
    FROM deferred_extraction
    ORDER BY
      CASE status
        WHEN 'running' THEN 0
        WHEN 'pending' THEN 1
        WHEN 'failed' THEN 2
        ELSE 3
      END,
      available_at ASC
    LIMIT 100
  `).all().map((row) => ({
    sessionId: row.session_id,
    repository: row.repository,
    status: row.status,
    priority: row.priority,
    reason: row.reason,
    queuedAt: row.queued_at,
    availableAt: row.available_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    attempts: row.attempts,
    lastError: row.last_error,
    metadata: parseJsonObject(row.metadata_json),
  }));

  const maintenancePlan = buildMaintenancePlan({
    runtime: {
      config: db.config,
      db,
      traceRecorder: {
        isEnabled: () => Boolean(db.config?.rollout?.traceRecorder),
      },
    },
    repository,
    trigger: "status",
    force: false,
    requestedTasks: [],
  });

  return {
    runs,
    taskStates,
    deferred,
    doctorReports,
    trajectory,
    maintenancePlan,
    recentTraceSamples: traces,
  };
}

function queryEpisodes({ db, repository }) {
  const episodes = db.db.prepare(`
    SELECT
      id, session_id, scope, scope_source, repository, branch, summary,
      actions_json, decisions_json, learnings_json, files_changed_json,
      refs_json, significance, themes_json, open_items_json,
      source, date_key, created_at, updated_at
    FROM episode_digest
    WHERE (? IS NULL OR repository = ? OR scope = 'global')
    ORDER BY updated_at DESC
    LIMIT 100
  `).all(repository, repository).map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    scope: row.scope,
    scopeSource: row.scope_source,
    repository: row.repository,
    branch: row.branch,
    summary: row.summary,
    actions: (() => {
      try { return JSON.parse(row.actions_json || "[]"); } catch { return []; }
    })(),
    decisions: (() => {
      try { return JSON.parse(row.decisions_json || "[]"); } catch { return []; }
    })(),
    learnings: (() => {
      try { return JSON.parse(row.learnings_json || "[]"); } catch { return []; }
    })(),
    filesChanged: (() => {
      try { return JSON.parse(row.files_changed_json || "[]"); } catch { return []; }
    })(),
    refs: (() => {
      try { return JSON.parse(row.refs_json || "[]"); } catch { return []; }
    })(),
    significance: row.significance,
    themes: (() => {
      try { return JSON.parse(row.themes_json || "[]"); } catch { return []; }
    })(),
    openItems: (() => {
      try { return JSON.parse(row.open_items_json || "[]"); } catch { return []; }
    })(),
    source: row.source,
    dateKey: row.date_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const daySummaries = db.db.prepare(`
    SELECT date_key, repository, summary, episode_ids_json, computed_at
    FROM day_summary
    WHERE (? IS NULL OR repository = ? OR repository = '')
    ORDER BY date_key DESC, computed_at DESC
    LIMIT 60
  `).all(repository, repository).map((row) => ({
    dateKey: row.date_key,
    repository: row.repository,
    summary: row.summary,
    episodeIds: (() => {
      try { return JSON.parse(row.episode_ids_json || "[]"); } catch { return []; }
    })(),
    computedAt: row.computed_at,
  }));

  return {
    episodes,
    daySummaries,
  };
}

export function startCoherenceBrowserServer({
  db,
  host = "127.0.0.1",
  port = 43111,
  repository = null,
} = {}) {
  if (!db) {
    throw new Error("db is required");
  }

  const normalizedRepository = normalizeRepository(repository);

  const server = createServer(async (req, res) => {
    if (req.method !== "GET") {
      methodNotAllowed(res);
      return;
    }

    const url = new URL(req.url || "/", `http://${host}:${port}`);

    try {
      if (url.pathname === "/api/health") {
        jsonResponse(res, 200, {
          ok: true,
          mode: "read_only",
          host,
          repository: normalizedRepository,
          dbPath: db.config?.paths?.derivedStorePath ?? null,
        });
        return;
      }

      if (url.pathname === "/api/overview") {
        jsonResponse(res, 200, {
          ok: true,
          mode: "read_only",
          data: queryOverview({ db, repository: normalizedRepository }),
        });
        return;
      }

      if (url.pathname === "/api/memories") {
        jsonResponse(res, 200, {
          ok: true,
          mode: "read_only",
          data: queryMemories({ db, url }),
        });
        return;
      }

      if (url.pathname === "/api/memories/filters") {
        jsonResponse(res, 200, {
          ok: true,
          mode: "read_only",
          data: queryMemoryFilters({ db }),
        });
        return;
      }

      if (url.pathname === "/api/maintenance") {
        jsonResponse(res, 200, {
          ok: true,
          mode: "read_only",
          data: queryMaintenance({ db, repository: normalizedRepository }),
        });
        return;
      }

      if (url.pathname === "/api/episodes") {
        jsonResponse(res, 200, {
          ok: true,
          mode: "read_only",
          data: queryEpisodes({ db, repository: normalizedRepository }),
        });
        return;
      }

      await serveStatic(req, res, url.pathname);
    } catch (error) {
      jsonResponse(res, 500, {
        ok: false,
        error: "internal_error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  server.listen(port, host);

  return {
    server,
    host,
    port,
  };
}
