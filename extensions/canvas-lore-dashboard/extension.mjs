import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";

const EXTENSION_NAME = "canvas-lore-dashboard";
const CANVAS_ID = "lore-dashboard";
const CANVAS_INSTANCE_ID = "lore-dashboard-main";
const SUPPORTED_SCHEMA_VERSION = 15;
const DEFAULT_LORE_DB_PATH = path.join(
  process.env.LORE_COPILOT_HOME?.trim() || path.join(os.homedir(), ".copilot"),
  "lore.db",
);

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "before",
  "being",
  "canvas",
  "could",
  "from",
  "have",
  "into",
  "lore",
  "please",
  "that",
  "their",
  "there",
  "these",
  "this",
  "with",
  "what",
  "when",
  "where",
  "which",
  "would",
  "your",
]);

let lastKnownCwd = process.cwd();

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    execFile(command, args, { maxBuffer: 1024 * 1024, ...options }, (error, stdout, stderr) => {
      resolve({ ok: !error, stdout: stdout ?? "", stderr: stderr ?? "" });
    });
  });
}

async function detectRepository(cwd) {
  const result = await run("git", ["remote", "get-url", "origin"], { cwd });
  if (!result.ok || !result.stdout.trim()) {
    return null;
  }
  const url = result.stdout.trim();
  const match = url.match(/[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
  return match ? match[1] : null;
}

function safeCount(db, tableName) {
  try {
    return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count ?? 0;
  } catch {
    return 0;
  }
}

function safeScalar(db, sql, fallback = null) {
  try {
    const row = db.prepare(sql).get();
    if (!row) {
      return fallback;
    }
    const [value] = Object.values(row);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function safeJsonArray(value) {
  if (typeof value !== "string" || value.length === 0) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readLoreStats({ dbPath = DEFAULT_LORE_DB_PATH } = {}) {
  if (!existsSync(dbPath)) {
    return {
      available: false,
      reason: "lore.db not found",
      dbPath,
      semanticCount: 0,
      episodeCount: 0,
      daySummaryCount: 0,
      schemaVersion: null,
      lastContextInjectionLatencyMs: null,
      lastContextInjectionAt: null,
      lastContextInjectionSections: [],
    };
  }

  let db;
  try {
    db = new DatabaseSync(dbPath, { readOnly: true });
    const schemaVersion = safeScalar(db, "SELECT version FROM lore_schema_version", 0);
    if (schemaVersion > SUPPORTED_SCHEMA_VERSION) {
      return {
        available: false,
        reason: `lore.db schema v${schemaVersion} is newer than supported v${SUPPORTED_SCHEMA_VERSION}`,
        dbPath,
        semanticCount: 0,
        episodeCount: 0,
        daySummaryCount: 0,
        schemaVersion,
        lastContextInjectionLatencyMs: null,
        lastContextInjectionAt: null,
        lastContextInjectionSections: [],
      };
    }

    const activity = (() => {
      try {
        return db.prepare(`
          SELECT last_context_injection_at,
                 last_context_injection_duration_ms,
                 last_context_injection_sections_json
          FROM lore_activity_state
          WHERE scope_key = 'global'
        `).get() ?? null;
      } catch {
        return null;
      }
    })();

    return {
      available: true,
      reason: null,
      dbPath,
      semanticCount: safeCount(db, "semantic_memory"),
      episodeCount: safeCount(db, "episode_digest"),
      daySummaryCount: safeCount(db, "day_summary"),
      schemaVersion,
      lastContextInjectionLatencyMs: activity?.last_context_injection_duration_ms ?? null,
      lastContextInjectionAt: activity?.last_context_injection_at ?? null,
      lastContextInjectionSections: safeJsonArray(activity?.last_context_injection_sections_json),
    };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : String(error),
      dbPath,
      semanticCount: 0,
      episodeCount: 0,
      daySummaryCount: 0,
      schemaVersion: null,
      lastContextInjectionLatencyMs: null,
      lastContextInjectionAt: null,
      lastContextInjectionSections: [],
    };
  } finally {
    try {
      db?.close();
    } catch {
      // best-effort cleanup for read-only dashboard snapshots
    }
  }
}

export function extractTopics(prompt) {
  const counts = new Map();
  for (const token of String(prompt ?? "").toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? []) {
    if (STOP_WORDS.has(token)) {
      continue;
    }
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([topic]) => topic)
    .slice(0, 3);
}

export function createDashboardState({ dbPath = DEFAULT_LORE_DB_PATH } = {}) {
  return {
    dbPath,
    activeRepo: null,
    promptCount: 0,
    lastPromptLatencyMs: null,
    topicCounts: new Map(),
    openInstances: new Set(),
  };
}

export function recordPromptObservation(state, prompt, latencyMs) {
  state.promptCount += 1;
  state.lastPromptLatencyMs = Math.max(0, Math.round(latencyMs));
  for (const topic of extractTopics(prompt)) {
    state.topicCounts.set(topic, (state.topicCounts.get(topic) ?? 0) + 1);
  }
}

export function getTopTopics(state, limit = 3) {
  return [...state.topicCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([topic, count]) => ({ topic, count }));
}

export function buildDashboardSnapshot(state, { readStats = readLoreStats } = {}) {
  const stats = readStats({ dbPath: state.dbPath });
  return {
    activeRepo: state.activeRepo ?? "unknown",
    stats,
    promptCount: state.promptCount,
    lastPromptLatencyMs: state.lastPromptLatencyMs,
    topTopics: getTopTopics(state),
  };
}

export function formatDashboardText(snapshot) {
  const stats = snapshot.stats;
  const lines = [
    "Lore dashboard",
    `Active repo: ${snapshot.activeRepo}`,
    `Lore DB: ${stats.available ? "available" : `unavailable (${stats.reason})`}`,
    `Schema: ${stats.schemaVersion ?? "unknown"}`,
    `Semantic memories: ${stats.semanticCount}`,
    `Episode digests: ${stats.episodeCount}`,
    `Day summaries: ${stats.daySummaryCount}`,
    `Last Lore context latency: ${stats.lastContextInjectionLatencyMs ?? "none"}ms`,
    `Last dashboard prompt latency: ${snapshot.lastPromptLatencyMs ?? "none"}ms`,
    `Prompts observed: ${snapshot.promptCount}`,
    `Top recalled topics: ${snapshot.topTopics.length > 0
      ? snapshot.topTopics.map(({ topic, count }) => `${topic} (${count})`).join(", ")
      : "none"}`,
  ];
  return lines.join("\n");
}

function createDashboardHtml(snapshot) {
  const escape = (value) => String(value).replace(/[&<>"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  })[char]);
  const topics = snapshot.topTopics.length > 0
    ? snapshot.topTopics.map(({ topic, count }) => `<li>${escape(topic)} <strong>${count}</strong></li>`).join("")
    : "<li>none yet</li>";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Lore Dashboard</title>
<style>
body{font-family:system-ui,sans-serif;margin:1rem;line-height:1.4;color:#24292f;background:#ffffff}
section{border:1px solid #d0d7de;border-radius:8px;padding:1rem;margin-block:1rem}
dl{display:grid;grid-template-columns:max-content 1fr;gap:.4rem 1rem}
dt{font-weight:600}
</style>
</head>
<body>
<h1>Lore Dashboard</h1>
<section>
<h2>Workspace</h2>
<dl>
<dt>Active repo</dt><dd>${escape(snapshot.activeRepo)}</dd>
<dt>Prompts observed</dt><dd>${snapshot.promptCount}</dd>
<dt>Dashboard prompt latency</dt><dd>${snapshot.lastPromptLatencyMs ?? "none"}ms</dd>
</dl>
</section>
<section>
<h2>Lore DB</h2>
<dl>
<dt>Status</dt><dd>${snapshot.stats.available ? "available" : escape(snapshot.stats.reason)}</dd>
<dt>Schema</dt><dd>${snapshot.stats.schemaVersion ?? "unknown"}</dd>
<dt>Semantic memories</dt><dd>${snapshot.stats.semanticCount}</dd>
<dt>Episode digests</dt><dd>${snapshot.stats.episodeCount}</dd>
<dt>Day summaries</dt><dd>${snapshot.stats.daySummaryCount}</dd>
<dt>Last context latency</dt><dd>${snapshot.stats.lastContextInjectionLatencyMs ?? "none"}ms</dd>
</dl>
</section>
<section>
<h2>Top recalled topics</h2>
<ol>${topics}</ol>
</section>
</body>
</html>`;
}

export function createLoreDashboardCanvas({ createCanvas, state, readStats = readLoreStats } = {}) {
  return createCanvas({
    id: CANVAS_ID,
    displayName: "Lore Dashboard",
    description: "Shows Lore DB counts, context latency, and prompt recall topics for this session.",
    open: (ctx) => {
      if (ctx.host?.capabilities?.canvases === false) {
        return { title: "Lore Dashboard", status: "Canvas unavailable" };
      }
      state.openInstances.add(ctx.instanceId);
      const snapshot = buildDashboardSnapshot(state, { readStats });
      const html = createDashboardHtml(snapshot);
      return {
        title: "Lore Dashboard",
        status: `Lore stats for ${snapshot.activeRepo}`,
        url: `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      };
    },
    onClose: (ctx) => {
      state.openInstances.delete(ctx.instanceId);
    },
  });
}

export function createLoreStatusCommand({ sessionRef, state, readStats = readLoreStats } = {}) {
  return {
    name: "lore-status",
    description: "Show Lore DB stats and recall counters for this session.",
    handler: async () => {
      const snapshot = buildDashboardSnapshot(state, { readStats });
      await sessionRef.current?.log(formatDashboardText(snapshot), { ephemeral: false });
    },
  };
}

export function buildJoinConfig({ capabilities, commandDefinitionAvailable = true, createCanvas, state, sessionRef, readStats = readLoreStats } = {}) {
  const hooks = {
    onSessionStart: async (input) => {
      lastKnownCwd = input.cwd || lastKnownCwd;
      state.activeRepo = await detectRepository(lastKnownCwd);
      if (capabilities?.ui?.canvases === true) {
        await sessionRef.current?.rpc?.canvas?.open?.({
          canvasId: CANVAS_ID,
          instanceId: CANVAS_INSTANCE_ID,
        });
      }
    },
    onUserPromptSubmitted: async (input) => {
      const startedAt = Date.now();
      lastKnownCwd = input.cwd || lastKnownCwd;
      state.activeRepo = await detectRepository(lastKnownCwd);
      recordPromptObservation(state, input.prompt, Date.now() - startedAt);
    },
  };

  if (capabilities?.ui?.canvases === true) {
    return {
      extensionInfo: { source: "user", name: EXTENSION_NAME },
      requestCanvasRenderer: true,
      canvases: [createLoreDashboardCanvas({ createCanvas, state, readStats })],
      hooks,
      mode: "canvas",
    };
  }

  if (commandDefinitionAvailable) {
    return {
      extensionInfo: { source: "user", name: EXTENSION_NAME },
      commands: [createLoreStatusCommand({ sessionRef, state, readStats })],
      hooks,
      mode: "slash-command",
    };
  }

  return {
    extensionInfo: { source: "user", name: EXTENSION_NAME },
    hooks: {},
    mode: "no-op",
  };
}

export async function runExtension({ joinSession, createCanvas, commandDefinitionAvailable = true, readStats = readLoreStats } = {}) {
  if (!joinSession || !createCanvas) {
    const sdk = await import("@github/copilot-sdk/extension");
    joinSession = sdk.joinSession;
    createCanvas = sdk.createCanvas;
  }

  const state = createDashboardState();
  const sessionRef = { current: null };
  const preflight = await joinSession({
    extensionInfo: { source: "user", name: EXTENSION_NAME },
    suppressResumeEvent: true,
  });
  const capabilities = preflight.capabilities ?? {};
  await preflight.disconnect?.();

  const config = buildJoinConfig({
    capabilities,
    commandDefinitionAvailable,
    createCanvas,
    state,
    sessionRef,
    readStats,
  });

  if (config.mode === "no-op") {
    console.warn("canvas-lore-dashboard: neither canvas rendering nor slash commands are available; extension is idle");
    return { mode: "no-op", state, session: null };
  }

  const { mode, ...joinConfig } = config;
  const session = await joinSession(joinConfig);
  sessionRef.current = session;
  if (mode === "slash-command" && session.capabilities?.ui?.canvases === true) {
    await session.log(
      "canvas-lore-dashboard: canvas support appeared after slash-command registration; use /lore-status for this session",
      { ephemeral: true, level: "warning" },
    );
  }
  return { mode, state, session };
}

if (process.env.CANVAS_LORE_DASHBOARD_TEST !== "1") {
  await runExtension();
}
