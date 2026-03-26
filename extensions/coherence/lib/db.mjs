import crypto from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  classifyEpisodeDigest,
  classifySemanticMemory,
  detectAssistantIdentityName,
  MEMORY_SCOPE,
  normalizeScope,
} from "./memory-scope.mjs";
import { SCHEMA_STATEMENTS, SCHEMA_VERSION } from "./schema.mjs";

const SCOPE_SOURCE = Object.freeze({
  AUTO: "auto",
  MANUAL: "manual",
});

function nowIso() {
  return new Date().toISOString();
}

function escapeSqlString(value) {
  return String(value || "").replace(/'/g, "''");
}

function estimateTokens(text) {
  return Math.ceil(String(text || "").length / 4);
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

const GENERIC_QUERY_TERMS = new Set([
  "again",
  "apply",
  "consistent",
  "conversation",
  "conversations",
  "continue",
  "decision",
  "decisions",
  "history",
  "keep",
  "prior",
  "problem",
  "session",
  "sessions",
  "task",
  "tasks",
  "thing",
  "things",
  "work",
  "worked",
  "working",
]);

const QUERY_ALIASES = {
  audit: ["auditable", "override", "scope"],
  auditable: ["audit", "override", "scope"],
  backfill: ["restore", "rollback", "snapshot"],
  chat: ["conversation", "session"],
  coherence: ["memory", "history", "session"],
  conversation: ["chat", "session", "history"],
  conversations: ["chat", "session", "history"],
  memory: ["remember", "history", "coherence"],
  override: ["scope", "audit", "manual"],
  past: ["history", "prior"],
  previous: ["history", "prior"],
  prompt: ["shaping", "context", "classification"],
  recall: ["memory", "history", "remember"],
  remember: ["memory", "history", "coherence"],
  remembering: ["memory", "history", "coherence"],
  restore: ["rollback", "snapshot", "backfill"],
  retrieval: ["memory", "history", "coherence"],
  rollback: ["restore", "snapshot", "backfill"],
  scope: ["override", "audit", "transferable", "global", "repo"],
  session: ["conversation", "history"],
  shaping: ["prompt", "context", "classification"],
  snapshot: ["restore", "rollback", "backfill"],
};

function normalizeMatchTerm(term) {
  let value = String(term || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (value.endsWith("ies") && value.length > 4) {
    value = `${value.slice(0, -3)}y`;
  } else if (value.endsWith("ing") && value.length > 5) {
    value = value.slice(0, -3);
  } else if (value.endsWith("ed") && value.length > 4) {
    value = value.slice(0, -2);
  } else if (value.endsWith("s") && value.length > 4) {
    value = value.slice(0, -1);
  }
  return value;
}

function extractFtsTerms(query) {
  const directTerms = extractDirectTerms(query);

  const expandedTerms = [];
  for (const term of directTerms) {
    expandedTerms.push(term);
    for (const alias of QUERY_ALIASES[term] ?? []) {
      const normalizedAlias = normalizeMatchTerm(alias);
      if (normalizedAlias.length > 2 && !GENERIC_QUERY_TERMS.has(normalizedAlias)) {
        expandedTerms.push(normalizedAlias);
      }
    }
  }

  return [...new Set(expandedTerms)];
}

function extractDirectTerms(query) {
  return String(query || "")
    .replace(/\b(AND|OR|NOT|NEAR)\b/gi, " ")
    .replace(/[^a-z0-9\s]/gi, " ")
    .toLowerCase()
    .split(/\s+/)
    .map(normalizeMatchTerm)
    .filter((term) => term.length > 2)
    .filter((term) => !GENERIC_QUERY_TERMS.has(term));
}

function sanitizeFtsQuery(query) {
  const terms = extractFtsTerms(query);
  if (terms.length === 0) {
    return "";
  }
  return terms.join(" ");
}

function jsonText(value) {
  return JSON.stringify(value ?? []);
}

function parseJsonArray(value) {
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

function parseJsonObject(value) {
  if (typeof value !== "string" || value.length === 0) {
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

function normalizeRepository(repository) {
  return typeof repository === "string" && repository.trim().length > 0
    ? repository.trim()
    : null;
}

function normalizeDaySummaryRepository(repository) {
  return normalizeRepository(repository) ?? "";
}

function normalizeScopeSource(value, fallback = SCOPE_SOURCE.AUTO) {
  return value === SCOPE_SOURCE.MANUAL ? SCOPE_SOURCE.MANUAL : fallback;
}

function isPlaceholderSummary(summary) {
  return /^Session [0-9a-f-]{8,}$/i.test(normalizeText(summary));
}

function isGenericWorkSummary(summary) {
  return /^Worked in .+ \([0-9a-f-]{8,}\)$/i.test(normalizeText(summary));
}

function isToolInvocationSummary(summary) {
  const text = normalizeText(summary);
  return /^Call the tool\b/i.test(text)
    || /\breturn only the tool output\b/i.test(text)
    || /^Using only local repo files\b/i.test(text);
}

function tokenizeText(value) {
  return new Set(
    normalizeText(value)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map(normalizeMatchTerm)
      .filter((term) => term.length > 2),
  );
}

function dedupeSemanticRows(rows) {
  const seen = new Set();
  const deduped = [];
  for (const row of rows) {
    const key = `${row.type}::${normalizeText(row.content).toLowerCase()}::${row.scope ?? MEMORY_SCOPE.REPO}::${row.repository ?? ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

function mergeTagText(existingTags, incomingTags) {
  const tags = new Set(
    `${existingTags || ""} ${incomingTags || ""}`
      .trim()
      .split(/\s+/)
      .filter(Boolean),
  );
  return [...tags].join(" ");
}

function summarizeArray(items, label, limit) {
  const values = parseJsonArray(items).map(normalizeText).filter(Boolean).slice(0, limit);
  if (values.length === 0) {
    return "";
  }
  return `${label}: ${values.join(", ")}`;
}

function isLowSignalContextItem(value) {
  const text = normalizeText(value).replace(/:\s*$/, "");
  return /^(files created|files modified|remaining work|immediate next steps|diagnostics\/validation|phase \d+ implementation so far intentionally stayed within the approved boundary|the user asked to start implementing|the conversation covered)/i.test(text);
}

function rankContextItems(items, terms = []) {
  return parseJsonArray(items)
    .map(normalizeText)
    .filter(Boolean)
    .map((value, index) => {
      const tokens = tokenizeText(value);
      let matched = 0;
      let score = 0;
      for (const term of terms) {
        if (tokens.has(term)) {
          matched += 1;
          score += 2;
        }
      }
      if (/[`_/]/.test(value)) {
        score += 1.5;
      }
      if (/\b(prompt|shaping|scope|override|audit|backfill|restore|rollback|snapshot|deferred|identity|cross-repo|memory|trace|schema|replay)\b/i.test(value)) {
        score += 1.5;
      }
      if (value.length >= 20 && value.length <= 220) {
        score += 0.5;
      }
      if (isLowSignalContextItem(value)) {
        score -= 3;
      }
      if (/:\s*$/.test(value)) {
        score -= 1;
      }
      return { value, index, matched, score };
    })
    .sort((left, right) => {
      if (right.matched !== left.matched) {
        return right.matched - left.matched;
      }
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.index - right.index;
    });
}

function summarizeRelevantArray(items, label, terms, limit) {
  const ranked = rankContextItems(items, terms);
  const matches = terms.length > 0
    ? ranked.filter((item) => item.matched > 0)
    : ranked;
  const selected = (matches.length > 0 ? matches : ranked)
    .slice(0, limit)
    .map((item) => item.value);
  if (selected.length === 0) {
    return "";
  }
  return `${label}: ${selected.join(", ")}`;
}

function formatEpisodeContextLine(episode, { terms = [], index = 0 } = {}) {
  const summary = normalizeText(episode.summary);
  if (!summary || isPlaceholderSummary(summary)) {
    return "";
  }

  const details = [
    summarizeRelevantArray(episode.decisions_json, "decision", terms, 1),
    summarizeRelevantArray(episode.open_items_json, "open", terms, 1),
    summarizeRelevantArray(episode.actions_json, "actions", terms, 2),
    summarizeArray(episode.themes_json, "themes", 3),
  ].filter(Boolean);

  const prefix = episode.date_key ? `${episode.date_key}: ` : "";
  const repositoryLabel = episode.currentRepository
    && episode.repository
    && episode.repository !== episode.currentRepository
    ? ` [example from ${episode.repository}]`
    : "";
  if (details.length === 0) {
    return `- ${prefix}${summary}${repositoryLabel}`;
  }
  return `- ${prefix}${summary}${repositoryLabel} — ${details.slice(0, 2).join(" | ")}`;
}

function formatSemanticContextLine(memory) {
  const scopeLabel = memory.scope === MEMORY_SCOPE.GLOBAL
    ? "/global"
    : memory.scope === MEMORY_SCOPE.TRANSFERABLE
      ? "/transferable"
      : "";
  const repositoryLabel = memory.currentRepository
    && memory.repository
    && memory.repository !== memory.currentRepository
    ? `, from ${memory.repository}`
    : "";
  return `- [${memory.type}${scopeLabel}${repositoryLabel}] ${memory.content}`;
}

function formatSessionHintLine(session) {
  const excerpt = normalizeText(session.excerpt);
  if (!excerpt) {
    return "";
  }
  const prefix = session.updated_at ? `${String(session.updated_at).slice(0, 10)}: ` : "";
  const sourceLabel = session.source_type ? `[${session.source_type}] ` : "";
  const repositoryLabel = session.currentRepository
    && session.repository
    && session.repository !== session.currentRepository
    ? ` [example from ${session.repository}]`
    : "";
  return `- ${prefix}${sourceLabel}${excerpt}${repositoryLabel}`;
}

function serializeSemanticTraceRow(memory, currentRepository = null) {
  return {
    id: memory.id ?? null,
    type: memory.type ?? null,
    scope: memory.scope ?? null,
    scopeSource: memory.scope_source ?? null,
    repository: memory.repository ?? null,
    updatedAt: memory.updated_at ?? null,
    crossRepo: isCrossRepoRow(memory, currentRepository),
    content: normalizeText(memory.content),
  };
}

function serializeEpisodeTraceRow(episode, currentRepository = null) {
  return {
    id: episode.id ?? null,
    sessionId: episode.session_id ?? null,
    scope: episode.scope ?? null,
    scopeSource: episode.scope_source ?? null,
    repository: episode.repository ?? null,
    updatedAt: episode.updated_at ?? null,
    dateKey: episode.date_key ?? null,
    significance: episode.significance ?? 0,
    crossRepo: isCrossRepoRow(episode, currentRepository),
    summary: normalizeText(episode.summary),
    decisions: parseJsonArray(episode.decisions_json).map(normalizeText).filter(Boolean).slice(0, 6),
    actions: parseJsonArray(episode.actions_json).map(normalizeText).filter(Boolean).slice(0, 6),
    openItems: parseJsonArray(episode.open_items_json).map(normalizeText).filter(Boolean).slice(0, 6),
    themes: parseJsonArray(episode.themes_json).map(normalizeText).filter(Boolean).slice(0, 6),
  };
}

function serializeSessionTraceRow(session, currentRepository = null) {
  return {
    sessionId: session.session_id ?? null,
    sourceType: session.source_type ?? null,
    repository: session.repository ?? null,
    updatedAt: session.updated_at ?? null,
    crossRepo: isCrossRepoRow(session, currentRepository),
    excerpt: normalizeText(session.excerpt),
  };
}

function buildLocalEligibility(repository) {
  if (repository) {
    return [MEMORY_SCOPE.GLOBAL, `${MEMORY_SCOPE.REPO}:${repository}`];
  }
  return [MEMORY_SCOPE.GLOBAL];
}

function explainEpisodeExclusionReason(episode) {
  if (isPlaceholderSummary(episode.summary)) {
    return "placeholder_summary";
  }
  if (isToolInvocationSummary(episode.summary)) {
    return "tool_invocation_summary";
  }
  return null;
}

function effectiveRepositoryForScope(scope, rowRepository, metadata = {}, fallbackRepository = null) {
  if (scope === MEMORY_SCOPE.GLOBAL) {
    return null;
  }
  return normalizeRepository(rowRepository)
    ?? normalizeRepository(metadata?.originRepository)
    ?? normalizeRepository(fallbackRepository);
}

function classifySemanticRow(row, { fallbackRepository = null, ignoreManualOverride = false } = {}) {
  const metadata = parseJsonObject(row.metadata_json);
  const scopeSource = normalizeScopeSource(row.scope_source);
  if (!ignoreManualOverride && scopeSource === SCOPE_SOURCE.MANUAL) {
    const scope = normalizeScope(row.scope, MEMORY_SCOPE.REPO);
    return {
      scope,
      repository: effectiveRepositoryForScope(scope, row.repository, metadata, fallbackRepository),
      metadata,
      scopeSource,
    };
  }
  const classification = classifySemanticMemory({
    type: row.type,
    content: row.content,
    scope: null,
    repository: row.repository ?? fallbackRepository ?? metadata.originRepository ?? null,
    tags: row.tags ? row.tags.split(/\s+/).filter(Boolean) : [],
    metadata,
  });
  return {
    ...classification,
    scopeSource: SCOPE_SOURCE.AUTO,
  };
}

function classifyEpisodeRow(row, { fallbackRepository = null, ignoreManualOverride = false } = {}) {
  const scopeSource = normalizeScopeSource(row.scope_source);
  if (!ignoreManualOverride && scopeSource === SCOPE_SOURCE.MANUAL) {
    const scope = normalizeScope(row.scope, MEMORY_SCOPE.REPO);
    return {
      scope,
      repository: effectiveRepositoryForScope(scope, row.repository, {}, fallbackRepository),
      scopeSource,
    };
  }
  const classification = classifyEpisodeDigest({
    scope: null,
    repository: row.repository ?? fallbackRepository ?? null,
    summary: row.summary,
    actions: parseJsonArray(row.actions_json),
    decisions: parseJsonArray(row.decisions_json),
    learnings: parseJsonArray(row.learnings_json),
    refs: parseJsonArray(row.refs_json),
    themes: parseJsonArray(row.themes_json),
    openItems: parseJsonArray(row.open_items_json),
  });
  return {
    ...classification,
    scopeSource: SCOPE_SOURCE.AUTO,
  };
}

function dedupeSemanticContextRows(rows) {
  const seen = new Set();
  const deduped = [];
  for (const row of rows) {
    const key = `${row.type}::${normalizeText(row.content).toLowerCase()}::${row.scope ?? ""}::${row.repository ?? ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

function isCrossRepoRow(row, repository) {
  return !!(
    row
    && row.repository
    && repository
    && row.repository !== repository
  );
}

function scoreEpisodeAgainstTerms(episode, terms) {
  if (terms.length === 0) {
    return 0;
  }

  const tokens = tokenizeText([
    episode.summary,
    episode.actions_json,
    episode.decisions_json,
    episode.files_changed_json,
    episode.themes_json,
    episode.open_items_json,
  ].join(" "));

  let score = 0;
  let matchedTerms = 0;
  for (const term of terms) {
    if (tokens.has(term)) {
      score += 1;
      matchedTerms += 1;
    }
  }

  if (matchedTerms === 0) {
    return 0;
  }

  if (!isGenericWorkSummary(episode.summary)) {
    score += 0.4;
  }
  if (!isToolInvocationSummary(episode.summary)) {
    score += 0.3;
  }
  score += Math.min((episode.significance ?? 0) / 10, 1);
  return score;
}

function buildTermWeights(episodes, terms) {
  const weights = new Map();
  if (terms.length === 0 || episodes.length === 0) {
    return weights;
  }

  const documentFrequency = new Map();
  for (const episode of episodes) {
    const tokens = tokenizeText([
      episode.summary,
      episode.actions_json,
      episode.decisions_json,
      episode.files_changed_json,
      episode.themes_json,
      episode.open_items_json,
    ].join(" "));
    for (const term of terms) {
      if (tokens.has(term)) {
        documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
      }
    }
  }

  for (const term of terms) {
    const frequency = documentFrequency.get(term) ?? 0;
    weights.set(term, frequency === 0 ? 1.5 : 1 + ((episodes.length - frequency) / episodes.length));
  }

  return weights;
}

function scoreEpisodeAgainstWeightedTerms(episode, terms, primaryTerms, termWeights, exactMatchIds) {
  if (terms.length === 0) {
    return 0;
  }

  const tokens = tokenizeText([
    episode.summary,
    episode.actions_json,
    episode.decisions_json,
    episode.files_changed_json,
    episode.themes_json,
    episode.open_items_json,
  ].join(" "));

  let score = 0;
  let matchedTerms = 0;
  let matchedPrimaryTerms = 0;
  for (const term of terms) {
    if (tokens.has(term)) {
      score += termWeights.get(term) ?? 1;
      matchedTerms += 1;
      if (primaryTerms.includes(term)) {
        matchedPrimaryTerms += 1;
      }
    }
  }

  if (matchedTerms === 0 || (matchedPrimaryTerms === 0 && matchedTerms < 2)) {
    return 0;
  }

  score += matchedTerms * 0.35;
  score += matchedPrimaryTerms * 1.25;
  if (exactMatchIds.has(episode.session_id)) {
    score += 2;
  }
  if (!isGenericWorkSummary(episode.summary)) {
    score += 0.5;
  }
  score += Math.min((episode.significance ?? 0) / 10, 1);
  return score;
}

function dedupeEpisodes(episodes) {
  const seenSummaries = new Set();
  const seenSessions = new Set();
  const deduped = [];

  for (const episode of episodes) {
    if (seenSessions.has(episode.session_id)) {
      continue;
    }
    const summaryKey = normalizeText(episode.summary).toLowerCase();
    if (summaryKey && seenSummaries.has(summaryKey)) {
      continue;
    }
    seenSessions.add(episode.session_id);
    if (summaryKey) {
      seenSummaries.add(summaryKey);
    }
    deduped.push(episode);
  }

  return deduped;
}

function dedupeEpisodesWithTrace(episodes, currentRepository = null) {
  const seenSummaries = new Set();
  const seenSessions = new Set();
  const deduped = [];
  const filtered = [];

  for (const episode of episodes) {
    if (seenSessions.has(episode.session_id)) {
      filtered.push({
        stage: "dedupe",
        reason: "duplicate_session",
        row: serializeEpisodeTraceRow(episode, currentRepository),
      });
      continue;
    }
    const summaryKey = normalizeText(episode.summary).toLowerCase();
    if (summaryKey && seenSummaries.has(summaryKey)) {
      filtered.push({
        stage: "dedupe",
        reason: "duplicate_summary",
        row: serializeEpisodeTraceRow(episode, currentRepository),
      });
      continue;
    }
    seenSessions.add(episode.session_id);
    if (summaryKey) {
      seenSummaries.add(summaryKey);
    }
    deduped.push(episode);
  }

  return {
    rows: deduped,
    filtered,
  };
}

export class CoherenceDb {
  constructor(config) {
    this.config = config;
    this.db = null;
    this.lastBackupPath = null;
  }

  openDatabase() {
    const dbPath = this.config.paths.derivedStorePath;
    mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
    `);
  }

  close() {
    if (!this.db) {
      return;
    }
    try {
      this.db.exec(`PRAGMA wal_checkpoint(TRUNCATE);`);
    } catch {
      // best-effort checkpoint before close
    }
    this.db.close();
    this.db = null;
  }

  initialize() {
    if (this.db) {
      return { backupPath: this.lastBackupPath };
    }

    const dbPath = this.config.paths.derivedStorePath;
    this.openDatabase();

    const currentVersion = this.getCurrentVersion();
    if (currentVersion < SCHEMA_VERSION && existsSync(dbPath) && currentVersion > 0) {
      this.lastBackupPath = this.backupDatabase();
    }

    this.runMigrations(currentVersion);
    return { backupPath: this.lastBackupPath };
  }

  backupDatabase() {
    const dbPath = this.config.paths.derivedStorePath;
    const backupDir = this.config.paths.backupDir;
    mkdirSync(backupDir, { recursive: true });

    const timestamp = nowIso().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `coherence-${timestamp}.db`);
    rmSync(backupPath, { force: true });
    this.ensureOpen();
    this.db.exec(`VACUUM INTO '${escapeSqlString(backupPath)}'`);
    return backupPath;
  }

  restoreFromBackup(backupPath) {
    const normalizedPath = path.resolve(String(backupPath || ""));
    if (!existsSync(normalizedPath)) {
      throw new Error(`backup path does not exist: ${normalizedPath}`);
    }
    const dbPath = this.config.paths.derivedStorePath;
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;
    this.close();
    rmSync(walPath, { force: true });
    rmSync(shmPath, { force: true });
    copyFileSync(normalizedPath, dbPath);
    this.openDatabase();
    const currentVersion = this.getCurrentVersion();
    if (currentVersion < SCHEMA_VERSION) {
      this.runMigrations(currentVersion);
    }
    return {
      restoredFrom: normalizedPath,
      schemaVersion: this.getCurrentVersion(),
    };
  }

  getCurrentVersion() {
    const hasVersionTable = this.db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'coherence_schema_version'`,
      )
      .get();
    if (!hasVersionTable) {
      return 0;
    }
    const row = this.db.prepare(`SELECT MAX(version) AS version FROM coherence_schema_version`).get();
    return typeof row?.version === "number" ? row.version : 0;
  }

  runMigrations(currentVersion) {
    if (currentVersion >= SCHEMA_VERSION) {
      return;
    }

    this.db.exec("BEGIN IMMEDIATE TRANSACTION");
    try {
      if (currentVersion > 0 && currentVersion < 3) {
        this.ensureColumn("semantic_memory", "scope", `TEXT NOT NULL DEFAULT 'repo'`);
        this.ensureColumn("episode_digest", "scope", `TEXT NOT NULL DEFAULT 'repo'`);
      }
      if (currentVersion > 0 && currentVersion < 5) {
        this.ensureColumn("semantic_memory", "scope_source", `TEXT NOT NULL DEFAULT 'auto'`);
        this.ensureColumn("semantic_memory", "scope_override_actor", `TEXT`);
        this.ensureColumn("semantic_memory", "scope_override_reason", `TEXT`);
        this.ensureColumn("semantic_memory", "scope_override_source", `TEXT`);
        this.ensureColumn("semantic_memory", "scope_override_at", `TEXT`);
        this.ensureColumn("episode_digest", "scope_source", `TEXT NOT NULL DEFAULT 'auto'`);
        this.ensureColumn("episode_digest", "scope_override_actor", `TEXT`);
        this.ensureColumn("episode_digest", "scope_override_reason", `TEXT`);
        this.ensureColumn("episode_digest", "scope_override_source", `TEXT`);
        this.ensureColumn("episode_digest", "scope_override_at", `TEXT`);
      }
      for (const statement of SCHEMA_STATEMENTS) {
        this.db.exec(statement);
      }
      if (currentVersion < 4) {
        this.applyScopeMigration();
      }
      if (currentVersion < 5) {
        this.applyScopeGovernanceMigration();
      }
      this.db.exec(`DELETE FROM coherence_schema_version;`);
      this.db.prepare(`INSERT INTO coherence_schema_version (version) VALUES (?)`).run(SCHEMA_VERSION);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  tableHasColumn(tableName, columnName) {
    const rows = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
    return rows.some((row) => row.name === columnName);
  }

  ensureColumn(tableName, columnName, definitionSql) {
    if (this.tableHasColumn(tableName, columnName)) {
      return;
    }
    this.db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definitionSql}`);
  }

  applyScopeMigration() {
    this.ensureColumn("semantic_memory", "scope", `TEXT NOT NULL DEFAULT 'repo'`);
    this.ensureColumn("episode_digest", "scope", `TEXT NOT NULL DEFAULT 'repo'`);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_semantic_memory_scope
        ON semantic_memory(scope);
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_episode_digest_scope
        ON episode_digest(scope);
    `);

    const updateSemantic = this.db.prepare(`
      UPDATE semantic_memory
      SET scope = ?, repository = ?, metadata_json = ?
      WHERE id = ?
    `);
    const semanticRows = this.db.prepare(`
      SELECT id, type, content, scope, repository, tags, metadata_json
      FROM semantic_memory
    `).all();
    for (const row of semanticRows) {
      const classification = classifySemanticMemory({
        type: row.type,
        content: row.content,
        scope: null,
        repository: row.repository,
        tags: row.tags ? row.tags.split(/\s+/).filter(Boolean) : [],
        metadata: parseJsonObject(row.metadata_json),
      });
      updateSemantic.run(
        classification.scope,
        classification.repository,
        JSON.stringify(classification.metadata),
        row.id,
      );
    }

    const updateEpisode = this.db.prepare(`
      UPDATE episode_digest
      SET scope = ?, repository = ?
      WHERE id = ?
    `);
    const episodeRows = this.db.prepare(`
      SELECT
        id,
        scope,
        repository,
        summary,
        actions_json,
        decisions_json,
        learnings_json,
        refs_json,
        themes_json,
        open_items_json
      FROM episode_digest
    `).all();
    for (const row of episodeRows) {
      const classification = classifyEpisodeDigest({
        scope: null,
        repository: row.repository,
        summary: row.summary,
        actions: parseJsonArray(row.actions_json),
        decisions: parseJsonArray(row.decisions_json),
        learnings: parseJsonArray(row.learnings_json),
        refs: parseJsonArray(row.refs_json),
        themes: parseJsonArray(row.themes_json),
        openItems: parseJsonArray(row.open_items_json),
      });
      updateEpisode.run(
        classification.scope,
        classification.repository,
        row.id,
      );
    }
  }

  applyScopeGovernanceMigration() {
    this.ensureColumn("semantic_memory", "scope_source", `TEXT NOT NULL DEFAULT 'auto'`);
    this.ensureColumn("semantic_memory", "scope_override_actor", `TEXT`);
    this.ensureColumn("semantic_memory", "scope_override_reason", `TEXT`);
    this.ensureColumn("semantic_memory", "scope_override_source", `TEXT`);
    this.ensureColumn("semantic_memory", "scope_override_at", `TEXT`);
    this.ensureColumn("episode_digest", "scope_source", `TEXT NOT NULL DEFAULT 'auto'`);
    this.ensureColumn("episode_digest", "scope_override_actor", `TEXT`);
    this.ensureColumn("episode_digest", "scope_override_reason", `TEXT`);
    this.ensureColumn("episode_digest", "scope_override_source", `TEXT`);
    this.ensureColumn("episode_digest", "scope_override_at", `TEXT`);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_semantic_memory_scope_source
        ON semantic_memory(scope_source);
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_episode_digest_scope_source
        ON episode_digest(scope_source);
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scope_override_audit (
        id TEXT PRIMARY KEY,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        action TEXT NOT NULL,
        previous_scope TEXT,
        next_scope TEXT,
        previous_repository TEXT,
        next_repository TEXT,
        actor TEXT NOT NULL,
        reason TEXT NOT NULL,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_scope_override_audit_target
        ON scope_override_audit(target_type, target_id, created_at DESC);
    `);

    this.db.prepare(`
      UPDATE semantic_memory
      SET scope_source = COALESCE(scope_source, 'auto')
    `).run();
    this.db.prepare(`
      UPDATE episode_digest
      SET scope_source = COALESCE(scope_source, 'auto')
    `).run();
  }

  ensureOpen() {
    if (!this.db) {
      throw new Error("coherence database is not initialized");
    }
  }

  getStats() {
    this.ensureOpen();
    const semanticCount = this.db.prepare(`SELECT COUNT(*) AS count FROM semantic_memory`).get().count;
    const episodeCount = this.db.prepare(`SELECT COUNT(*) AS count FROM episode_digest`).get().count;
    const semanticScopes = this.db.prepare(`
      SELECT
        SUM(CASE WHEN scope = 'global' THEN 1 ELSE 0 END) AS global_count,
        SUM(CASE WHEN scope = 'transferable' THEN 1 ELSE 0 END) AS transferable_count,
        SUM(CASE WHEN scope = 'repo' THEN 1 ELSE 0 END) AS repo_count,
        SUM(CASE WHEN scope_source = 'manual' THEN 1 ELSE 0 END) AS manual_count
      FROM semantic_memory
    `).get();
    const episodeScopes = this.db.prepare(`
      SELECT
        SUM(CASE WHEN scope = 'global' THEN 1 ELSE 0 END) AS global_count,
        SUM(CASE WHEN scope = 'transferable' THEN 1 ELSE 0 END) AS transferable_count,
        SUM(CASE WHEN scope = 'repo' THEN 1 ELSE 0 END) AS repo_count,
        SUM(CASE WHEN scope_source = 'manual' THEN 1 ELSE 0 END) AS manual_count
      FROM episode_digest
    `).get();
    const daySummaryCount = this.db.prepare(`SELECT COUNT(*) AS count FROM day_summary`).get().count;
    const deferredCounts = this.db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) AS running_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count
      FROM deferred_extraction
    `).get();
    const backfillCounts = this.db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) AS running_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
        SUM(CASE WHEN dry_run = 1 THEN 1 ELSE 0 END) AS dry_run_count
      FROM backfill_run
    `).get();
    const row = this.db.prepare(`SELECT MAX(version) AS version FROM coherence_schema_version`).get();
    const overrideAuditCount = this.db.prepare(`SELECT COUNT(*) AS count FROM scope_override_audit`).get().count;

    return {
      semanticCount,
      episodeCount,
      semanticGlobalCount: semanticScopes?.global_count ?? 0,
      semanticTransferableCount: semanticScopes?.transferable_count ?? 0,
      semanticRepoCount: semanticScopes?.repo_count ?? 0,
      semanticManualCount: semanticScopes?.manual_count ?? 0,
      episodeGlobalCount: episodeScopes?.global_count ?? 0,
      episodeTransferableCount: episodeScopes?.transferable_count ?? 0,
      episodeRepoCount: episodeScopes?.repo_count ?? 0,
      episodeManualCount: episodeScopes?.manual_count ?? 0,
      daySummaryCount,
      schemaVersion: row?.version ?? 0,
      dbPath: this.config.paths.derivedStorePath,
      backupDir: this.config.paths.backupDir,
      lastBackupPath: this.lastBackupPath,
      overrideAuditCount,
      backfillRunningCount: backfillCounts?.running_count ?? 0,
      backfillCompletedCount: backfillCounts?.completed_count ?? 0,
      backfillFailedCount: backfillCounts?.failed_count ?? 0,
      backfillDryRunCount: backfillCounts?.dry_run_count ?? 0,
      deferredPendingCount: deferredCounts?.pending_count ?? 0,
      deferredRunningCount: deferredCounts?.running_count ?? 0,
      deferredFailedCount: deferredCounts?.failed_count ?? 0,
      deferredCompletedCount: deferredCounts?.completed_count ?? 0,
    };
  }

  getSemanticMemoryByIds(ids) {
    this.ensureOpen();
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }
    const placeholders = ids.map(() => "?").join(", ");
    return this.db.prepare(`
      SELECT
        id, type, content, confidence, source_session_id, source_turn_index,
        scope, scope_source, scope_override_actor, scope_override_reason, scope_override_source, scope_override_at,
        repository, tags, created_at, updated_at, superseded_by, expires_at, metadata_json
      FROM semantic_memory
      WHERE id IN (${placeholders})
      ORDER BY updated_at DESC
    `).all(...ids);
  }

  getEpisodeDigestsByIds(ids) {
    this.ensureOpen();
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }
    const placeholders = ids.map(() => "?").join(", ");
    return this.db.prepare(`
      SELECT
        id, session_id, scope, scope_source, scope_override_actor, scope_override_reason, scope_override_source, scope_override_at,
        repository, branch, summary, actions_json, decisions_json, learnings_json, files_changed_json,
        refs_json, significance, themes_json, open_items_json, source, date_key, created_at, updated_at
      FROM episode_digest
      WHERE id IN (${placeholders})
      ORDER BY updated_at DESC
    `).all(...ids);
  }

  previewScopeChanges({
    targetType,
    ids,
    action = "set",
    scope,
    repository,
  }) {
    this.ensureOpen();
    const targetIds = Array.isArray(ids) ? [...new Set(ids.filter((value) => typeof value === "string" && value.trim().length > 0))] : [];
    if (targetIds.length === 0) {
      throw new Error("ids must include at least one target id");
    }
    const normalizedAction = action === "clear" ? "clear" : "set";
    const nextScope = normalizedAction === "set" ? normalizeScope(scope, null) : null;
    if (normalizedAction === "set" && !nextScope) {
      throw new Error("scope must be one of: global, transferable, repo");
    }
    const fallbackRepository = normalizeRepository(repository);
    const rows = targetType === "episode"
      ? this.getEpisodeDigestsByIds(targetIds)
      : this.getSemanticMemoryByIds(targetIds);

    const foundIds = new Set(rows.map((row) => row.id));
    const missingIds = targetIds.filter((id) => !foundIds.has(id));
    const previews = rows.map((row) => {
      const currentMetadata = targetType === "semantic" ? parseJsonObject(row.metadata_json) : {};
      const current = {
        scope: row.scope,
        repository: row.repository,
        scopeSource: normalizeScopeSource(row.scope_source),
      };
      const next = normalizedAction === "clear"
        ? (targetType === "episode"
            ? classifyEpisodeRow(row, { fallbackRepository, ignoreManualOverride: true })
            : classifySemanticRow(row, { fallbackRepository, ignoreManualOverride: true }))
        : {
            scope: nextScope,
            repository: effectiveRepositoryForScope(nextScope, row.repository, currentMetadata, fallbackRepository),
            scopeSource: SCOPE_SOURCE.MANUAL,
          };
      return {
        id: row.id,
        targetType,
        current,
        next,
        changed: current.scope !== next.scope
          || (current.repository ?? null) !== (next.repository ?? null)
          || current.scopeSource !== next.scopeSource,
      };
    });

    return {
      action: normalizedAction,
      targetType,
      requestedCount: targetIds.length,
      matchedCount: previews.length,
      missingIds,
      rows: previews,
    };
  }

  insertScopeOverrideAudit({
    targetType,
    targetId,
    action,
    previousScope,
    nextScope,
    previousRepository,
    nextRepository,
    actor,
    reason,
    source,
  }) {
    this.db.prepare(`
      INSERT INTO scope_override_audit (
        id, target_type, target_id, action, previous_scope, next_scope,
        previous_repository, next_repository, actor, reason, source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      targetType,
      targetId,
      action,
      previousScope ?? null,
      nextScope ?? null,
      normalizeRepository(previousRepository),
      normalizeRepository(nextRepository),
      actor,
      reason,
      source,
      nowIso(),
    );
  }

  applyScopeChanges({
    targetType,
    ids,
    action = "set",
    scope,
    repository,
    actor,
    reason,
    source,
  }) {
    this.ensureOpen();
    const preview = this.previewScopeChanges({
      targetType,
      ids,
      action,
      scope,
      repository,
    });
    const timestamp = nowIso();
    const normalizedAction = preview.action;
    const updateSemantic = this.db.prepare(`
      UPDATE semantic_memory
      SET scope = ?,
          repository = ?,
          scope_source = ?,
          scope_override_actor = ?,
          scope_override_reason = ?,
          scope_override_source = ?,
          scope_override_at = ?,
          updated_at = ?
      WHERE id = ?
    `);
    const updateEpisode = this.db.prepare(`
      UPDATE episode_digest
      SET scope = ?,
          repository = ?,
          scope_source = ?,
          scope_override_actor = ?,
          scope_override_reason = ?,
          scope_override_source = ?,
          scope_override_at = ?,
          updated_at = ?
      WHERE id = ?
    `);

    for (const row of preview.rows) {
      const nextScopeSource = normalizedAction === "clear" ? SCOPE_SOURCE.AUTO : SCOPE_SOURCE.MANUAL;
      const overrideActor = normalizedAction === "clear" ? null : actor;
      const overrideReason = normalizedAction === "clear" ? null : reason;
      const overrideSource = normalizedAction === "clear" ? null : source;
      const overrideAt = normalizedAction === "clear" ? null : timestamp;
      if (targetType === "episode") {
        updateEpisode.run(
          row.next.scope,
          row.next.repository,
          nextScopeSource,
          overrideActor,
          overrideReason,
          overrideSource,
          overrideAt,
          timestamp,
          row.id,
        );
      } else {
        updateSemantic.run(
          row.next.scope,
          row.next.repository,
          nextScopeSource,
          overrideActor,
          overrideReason,
          overrideSource,
          overrideAt,
          timestamp,
          row.id,
        );
      }
      this.insertScopeOverrideAudit({
        targetType,
        targetId: row.id,
        action: normalizedAction,
        previousScope: row.current.scope,
        nextScope: row.next.scope,
        previousRepository: row.current.repository,
        nextRepository: row.next.repository,
        actor,
        reason,
        source,
      });
    }

    return preview;
  }

  listScopeOverrideAudit({ targetType, targetId, limit = 10 }) {
    this.ensureOpen();
    const params = [];
    const where = [];
    if (typeof targetType === "string" && targetType.trim().length > 0) {
      where.push("target_type = ?");
      params.push(targetType.trim());
    }
    if (typeof targetId === "string" && targetId.trim().length > 0) {
      where.push("target_id = ?");
      params.push(targetId.trim());
    }
    params.push(limit);
    return this.db.prepare(`
      SELECT
        id, target_type, target_id, action, previous_scope, next_scope,
        previous_repository, next_repository, actor, reason, source, created_at
      FROM scope_override_audit
      ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY created_at DESC
      LIMIT ?
    `).all(...params);
  }

  countGeneratedSemanticMemoriesBySession(sessionId) {
    this.ensureOpen();
    return this.db.prepare(`
      SELECT COUNT(*) AS count
      FROM semantic_memory
      WHERE source_session_id = ?
        AND superseded_by IS NULL
        AND COALESCE(json_extract(metadata_json, '$.source'), '') != 'memory_save'
    `).get(sessionId).count;
  }

  getEpisodeDigestBySession(sessionId) {
    this.ensureOpen();
    return this.db.prepare(`
      SELECT id, session_id, scope, scope_source, repository, updated_at
      FROM episode_digest
      WHERE session_id = ?
    `).get(sessionId);
  }

  createBackfillRun({
    strategy = "session_refresh",
    dryRun = false,
    repository = null,
    includeOtherRepositories = false,
    refreshExisting = true,
    batchSize = 10,
    totalCandidates = 0,
    snapshotPath = null,
    metadata = {},
  }) {
    this.ensureOpen();
    const id = crypto.randomUUID();
    const timestamp = nowIso();
    this.db.prepare(`
      INSERT INTO backfill_run (
        id, strategy, status, dry_run, repository, include_other_repositories, refresh_existing,
        batch_size, total_candidates, snapshot_path, metadata_json, started_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      strategy,
      dryRun ? "preview" : "running",
      dryRun ? 1 : 0,
      normalizeRepository(repository),
      includeOtherRepositories ? 1 : 0,
      refreshExisting ? 1 : 0,
      batchSize,
      totalCandidates,
      snapshotPath,
      JSON.stringify(metadata),
      timestamp,
      timestamp,
    );
    return id;
  }

  insertBackfillRunItems(runId, items) {
    this.ensureOpen();
    const insert = this.db.prepare(`
      INSERT INTO backfill_run_item (
        run_id, session_id, repository, ordinal, planned_action, status
      ) VALUES (?, ?, ?, ?, ?, 'pending')
    `);
    for (const item of items) {
      insert.run(
        runId,
        item.sessionId,
        normalizeRepository(item.repository),
        item.ordinal,
        item.plannedAction,
      );
    }
  }

  getBackfillRun(runId) {
    this.ensureOpen();
    return this.db.prepare(`
      SELECT
        id, strategy, status, dry_run, repository, include_other_repositories,
        refresh_existing, batch_size, total_candidates, processed_count,
        created_episode_count, refreshed_episode_count, skipped_count,
        failed_count, snapshot_path, metadata_json, started_at, updated_at,
        completed_at, last_error
      FROM backfill_run
      WHERE id = ?
    `).get(runId);
  }

  listBackfillRunItems({ runId, statuses = [], limit = 10 }) {
    this.ensureOpen();
    const params = [runId];
    let sql = `
      SELECT
        run_id, session_id, repository, ordinal, planned_action, status,
        semantic_before_count, semantic_after_count, semantic_delta,
        episode_before_scope, episode_after_scope, processed_at, error
      FROM backfill_run_item
      WHERE run_id = ?
    `;
    if (Array.isArray(statuses) && statuses.length > 0) {
      sql += ` AND status IN (${statuses.map(() => "?").join(", ")}) `;
      params.push(...statuses);
    }
    sql += ` ORDER BY ordinal ASC LIMIT ? `;
    params.push(limit);
    return this.db.prepare(sql).all(...params);
  }

  updateBackfillRunItem({
    runId,
    sessionId,
    status,
    semanticBeforeCount = null,
    semanticAfterCount = null,
    semanticDelta = null,
    episodeBeforeScope = null,
    episodeAfterScope = null,
    error = null,
  }) {
    this.ensureOpen();
    this.db.prepare(`
      UPDATE backfill_run_item
      SET status = ?,
          semantic_before_count = ?,
          semantic_after_count = ?,
          semantic_delta = ?,
          episode_before_scope = ?,
          episode_after_scope = ?,
          processed_at = ?,
          error = ?
      WHERE run_id = ? AND session_id = ?
    `).run(
      status,
      semanticBeforeCount,
      semanticAfterCount,
      semanticDelta,
      episodeBeforeScope,
      episodeAfterScope,
      nowIso(),
      error,
      runId,
      sessionId,
    );
  }

  refreshBackfillRunSummary(runId, { lastError = null } = {}) {
    this.ensureOpen();
    const counts = this.db.prepare(`
      SELECT
        SUM(CASE WHEN status IN ('completed', 'skipped', 'failed') THEN 1 ELSE 0 END) AS processed_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
        SUM(CASE WHEN planned_action = 'create' AND status = 'completed' THEN 1 ELSE 0 END) AS created_episode_count,
        SUM(CASE WHEN planned_action = 'refresh' AND status = 'completed' THEN 1 ELSE 0 END) AS refreshed_episode_count,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count
      FROM backfill_run_item
      WHERE run_id = ?
    `).get(runId);
    const status = (counts?.pending_count ?? 0) > 0
      ? "running"
      : (counts?.failed_count ?? 0) > 0
        ? "failed"
        : "completed";
    const completedAt = status === "running" ? null : nowIso();
    this.db.prepare(`
      UPDATE backfill_run
      SET status = ?,
          processed_count = ?,
          created_episode_count = ?,
          refreshed_episode_count = ?,
          skipped_count = ?,
          failed_count = ?,
          completed_at = COALESCE(?, completed_at),
          updated_at = ?,
          last_error = COALESCE(?, last_error)
      WHERE id = ?
    `).run(
      status,
      counts?.processed_count ?? 0,
      counts?.created_episode_count ?? 0,
      counts?.refreshed_episode_count ?? 0,
      counts?.skipped_count ?? 0,
      counts?.failed_count ?? 0,
      completedAt,
      nowIso(),
      lastError,
      runId,
    );
    return this.getBackfillRun(runId);
  }

  listBackfillRuns({ limit = 10 }) {
    this.ensureOpen();
    return this.db.prepare(`
      SELECT
        id, strategy, status, dry_run, repository, include_other_repositories,
        refresh_existing, batch_size, total_candidates, processed_count,
        created_episode_count, refreshed_episode_count, skipped_count,
        failed_count, snapshot_path, started_at, updated_at, completed_at, last_error
      FROM backfill_run
      ORDER BY updated_at DESC
      LIMIT ?
    `).all(limit);
  }

  insertSemanticMemory(memory) {
    this.ensureOpen();
    const timestamp = nowIso();
    const id = memory.id ?? crypto.randomUUID();
    const classification = classifySemanticMemory(memory);
    const repository = normalizeRepository(classification.repository);
    const scope = classification.scope;
    const tagsText = Array.isArray(memory.tags) ? memory.tags.join(" ") : "";
    const sourceText = typeof classification.metadata?.source === "string" ? classification.metadata.source : "";
    const manualScopeMatch = this.db.prepare(`
      SELECT id, tags, metadata_json, scope, repository, scope_source
      FROM semantic_memory
      WHERE superseded_by IS NULL
        AND type = ?
        AND content = ?
        AND scope_source = 'manual'
      ORDER BY updated_at DESC
      LIMIT 1
    `).get(memory.type, memory.content);
    if (manualScopeMatch?.id) {
      const existingMetadata = parseJsonObject(manualScopeMatch.metadata_json);
      this.db.prepare(`
        UPDATE semantic_memory
        SET confidence = MAX(confidence, ?),
            updated_at = ?,
            source_session_id = COALESCE(?, source_session_id),
            source_turn_index = COALESCE(?, source_turn_index),
            tags = ?,
            metadata_json = ?
        WHERE id = ?
      `).run(
        typeof memory.confidence === "number" ? memory.confidence : 1.0,
        timestamp,
        memory.sourceSessionId ?? null,
        Number.isInteger(memory.sourceTurnIndex) ? memory.sourceTurnIndex : null,
        mergeTagText(manualScopeMatch.tags, tagsText),
        JSON.stringify({
          ...existingMetadata,
          ...classification.metadata,
        }),
        manualScopeMatch.id,
      );
      return manualScopeMatch.id;
    }
    const existing = this.db.prepare(`
      SELECT id, tags, metadata_json, scope_source
      FROM semantic_memory
      WHERE superseded_by IS NULL
        AND type = ?
        AND content = ?
        AND scope = ?
        AND IFNULL(repository, '') = IFNULL(?, '')
      ORDER BY updated_at DESC
      LIMIT 1
    `).get(
      memory.type,
      memory.content,
      scope,
      repository,
    );

    if (existing?.id) {
      let existingMetadata = {};
      try {
        existingMetadata = JSON.parse(existing.metadata_json ?? "{}");
      } catch {
        existingMetadata = {};
      }

      const manualExisting = existingMetadata.source === "memory_save";
      const manualIncoming = sourceText === "memory_save";
      const lockedScope = normalizeScopeSource(existing.scope_source) === SCOPE_SOURCE.MANUAL;
      if ((manualExisting || lockedScope) && !manualIncoming) {
        this.db.prepare(`
          UPDATE semantic_memory
          SET updated_at = ?, confidence = MAX(confidence, ?), tags = ?
          WHERE id = ?
        `).run(
          timestamp,
          typeof memory.confidence === "number" ? memory.confidence : 1.0,
          mergeTagText(existing.tags, tagsText),
          existing.id,
        );
        return existing.id;
      }

      this.db.prepare(`
        UPDATE semantic_memory
        SET confidence = ?,
            updated_at = ?,
            source_session_id = COALESCE(?, source_session_id),
            source_turn_index = COALESCE(?, source_turn_index),
            tags = ?,
            metadata_json = ?
        WHERE id = ?
      `).run(
        typeof memory.confidence === "number" ? memory.confidence : 1.0,
        timestamp,
        memory.sourceSessionId ?? null,
        Number.isInteger(memory.sourceTurnIndex) ? memory.sourceTurnIndex : null,
        mergeTagText(existing.tags, tagsText),
        JSON.stringify({
          ...existingMetadata,
          ...classification.metadata,
        }),
        existing.id,
      );
      return existing.id;
    }

    this.db.prepare(`
      INSERT INTO semantic_memory (
        id, type, content, confidence, source_session_id, source_turn_index,
        scope, repository, tags, created_at, updated_at, superseded_by, expires_at, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      memory.type,
      memory.content,
      typeof memory.confidence === "number" ? memory.confidence : 1.0,
      memory.sourceSessionId ?? null,
      Number.isInteger(memory.sourceTurnIndex) ? memory.sourceTurnIndex : null,
      scope,
      repository,
      tagsText,
      memory.createdAt ?? timestamp,
      timestamp,
      memory.supersededBy ?? null,
      memory.expiresAt ?? null,
      JSON.stringify(classification.metadata),
    );

    return id;
  }

  deleteGeneratedSemanticMemories(sessionId) {
    this.ensureOpen();
    this.db.prepare(`
      DELETE FROM semantic_memory
      WHERE source_session_id = ?
        AND COALESCE(json_extract(metadata_json, '$.source'), '') != 'memory_save'
        AND COALESCE(scope_source, 'auto') != 'manual'
    `).run(sessionId);
  }

  enqueueDeferredExtraction({
    sessionId,
    repository,
    reason = "manual",
    priority = 0,
    delayMinutes = 0,
    metadata = {},
  }) {
    this.ensureOpen();
    const queuedAt = nowIso();
    const availableAt = new Date(Date.now() + (delayMinutes * 60 * 1000)).toISOString();
    this.db.prepare(`
      INSERT INTO deferred_extraction (
        session_id, repository, status, priority, reason, queued_at, available_at, metadata_json
      ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        repository = excluded.repository,
        status = CASE
          WHEN deferred_extraction.status = 'running' THEN deferred_extraction.status
          ELSE 'pending'
        END,
        priority = CASE
          WHEN excluded.priority > deferred_extraction.priority THEN excluded.priority
          ELSE deferred_extraction.priority
        END,
        reason = excluded.reason,
        queued_at = excluded.queued_at,
        available_at = CASE
          WHEN deferred_extraction.status = 'running' THEN deferred_extraction.available_at
          ELSE excluded.available_at
        END,
        last_error = NULL,
        metadata_json = excluded.metadata_json
    `).run(
      sessionId,
      normalizeRepository(repository),
      priority,
      reason,
      queuedAt,
      availableAt,
      JSON.stringify(metadata),
    );
  }

  listDeferredExtractions({ repository, limit = 2 }) {
    this.ensureOpen();
    const repo = normalizeRepository(repository);
    const now = nowIso();
    if (repo) {
      return this.db.prepare(`
        SELECT session_id, repository, status, priority, reason, queued_at, available_at, attempts, last_error, metadata_json
        FROM deferred_extraction
        WHERE repository = ?
          AND status IN ('pending', 'failed')
          AND available_at <= ?
        ORDER BY priority DESC, available_at ASC, queued_at ASC
        LIMIT ?
      `).all(repo, now, limit);
    }
    return this.db.prepare(`
      SELECT session_id, repository, status, priority, reason, queued_at, available_at, attempts, last_error, metadata_json
      FROM deferred_extraction
      WHERE status IN ('pending', 'failed')
        AND available_at <= ?
      ORDER BY priority DESC, available_at ASC, queued_at ASC
      LIMIT ?
    `).all(now, limit);
  }

  markDeferredExtractionRunning(sessionId) {
    this.ensureOpen();
    this.db.prepare(`
      UPDATE deferred_extraction
      SET status = 'running',
          attempts = attempts + 1,
          started_at = ?,
          last_error = NULL
      WHERE session_id = ?
    `).run(nowIso(), sessionId);
  }

  completeDeferredExtraction(sessionId) {
    this.ensureOpen();
    this.db.prepare(`
      UPDATE deferred_extraction
      SET status = 'completed',
          completed_at = ?,
          last_error = NULL
      WHERE session_id = ?
    `).run(nowIso(), sessionId);
  }

  failDeferredExtraction(sessionId, { errorMessage, retryDelayMinutes = 15 }) {
    this.ensureOpen();
    const availableAt = new Date(Date.now() + (retryDelayMinutes * 60 * 1000)).toISOString();
    this.db.prepare(`
      UPDATE deferred_extraction
      SET status = 'failed',
          available_at = ?,
          last_error = ?
      WHERE session_id = ?
    `).run(availableAt, errorMessage, sessionId);
  }

  forgetMemory({ id, supersededBy }) {
    this.ensureOpen();
    this.db.prepare(`
      UPDATE semantic_memory
      SET superseded_by = ?, updated_at = ?
      WHERE id = ?
    `).run(supersededBy ?? `manual:${nowIso()}`, nowIso(), id);
  }

  hasEpisodeDigest(sessionId) {
    this.ensureOpen();
    const row = this.db.prepare(`
      SELECT id FROM episode_digest WHERE session_id = ?
    `).get(sessionId);
    return !!row;
  }

  upsertEpisodeDigest(digest) {
    this.ensureOpen();
    const timestamp = nowIso();
    const classification = classifyEpisodeDigest(digest);
    this.db.prepare(`
      INSERT INTO episode_digest (
        id, session_id, scope, scope_source, repository, branch, summary, actions_json, decisions_json,
        learnings_json, files_changed_json, refs_json, significance, themes_json,
        open_items_json, source, date_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        scope = CASE
          WHEN episode_digest.scope_source = 'manual' THEN episode_digest.scope
          ELSE excluded.scope
        END,
        repository = CASE
          WHEN episode_digest.scope_source = 'manual' THEN episode_digest.repository
          ELSE excluded.repository
        END,
        branch = excluded.branch,
        summary = excluded.summary,
        actions_json = excluded.actions_json,
        decisions_json = excluded.decisions_json,
        learnings_json = excluded.learnings_json,
        files_changed_json = excluded.files_changed_json,
        refs_json = excluded.refs_json,
        significance = excluded.significance,
        themes_json = excluded.themes_json,
        open_items_json = excluded.open_items_json,
        source = excluded.source,
        date_key = excluded.date_key,
        updated_at = excluded.updated_at
    `).run(
      digest.id ?? digest.sessionId,
      digest.sessionId,
      classification.scope,
      SCOPE_SOURCE.AUTO,
      classification.repository,
      digest.branch ?? null,
      digest.summary,
      jsonText(digest.actions),
      jsonText(digest.decisions),
      jsonText(digest.learnings),
      jsonText(digest.filesChanged),
      jsonText(digest.refs),
      digest.significance ?? 5,
      jsonText(digest.themes),
      jsonText(digest.openItems),
      digest.source ?? "rule",
      digest.dateKey,
      digest.createdAt ?? timestamp,
      timestamp,
    );
  }

  refreshDaySummary({ date, repository }) {
    this.ensureOpen();
    const repo = normalizeDaySummaryRepository(repository);
    const rows = this.db.prepare(`
      SELECT session_id, summary
      FROM episode_digest
      WHERE date_key = ? AND (
        (? = '' AND (repository IS NULL OR repository = '')) OR repository = ?
      )
      ORDER BY updated_at DESC
      LIMIT 8
    `).all(date, repo, repo);

    const summaries = rows
      .map((row) => ({
        session_id: row.session_id,
        summary: normalizeText(row.summary),
      }))
      .filter((row) => row.summary.length > 0);

    const preferred = summaries.some((row) => !isGenericWorkSummary(row.summary) && !isPlaceholderSummary(row.summary) && !isToolInvocationSummary(row.summary))
      ? summaries.filter((row) => !isGenericWorkSummary(row.summary) && !isPlaceholderSummary(row.summary) && !isToolInvocationSummary(row.summary))
      : summaries;

    const summary = preferred.length === 0
      ? "No remembered activity."
      : preferred.map((row) => `- ${row.summary}`).join("\n");

    this.db.prepare(`
      INSERT INTO day_summary (date_key, repository, summary, episode_ids_json, computed_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(date_key, repository) DO UPDATE SET
        summary = excluded.summary,
        episode_ids_json = excluded.episode_ids_json,
        computed_at = excluded.computed_at
    `).run(
      date,
      repo,
      summary,
      JSON.stringify(preferred.map((row) => row.session_id)),
      nowIso(),
    );
  }

  searchSemantic({ query, repository, includeOtherRepositories = false, types = [], scopes = [], limit = 8 }) {
    this.ensureOpen();
    const sanitized = sanitizeFtsQuery(query);
    const repo = normalizeRepository(repository);

    const params = [];
    let sql = `
      SELECT
        sm.id,
        sm.type,
        sm.content,
        sm.scope,
        sm.scope_source,
        sm.confidence,
        sm.repository,
        sm.updated_at,
        sm.source_session_id
      FROM semantic_memory sm
    `;

    if (sanitized) {
      sql += ` JOIN semantic_fts ON semantic_fts.rowid = sm.rowid `;
    }

    sql += ` WHERE sm.superseded_by IS NULL `;

    if (!includeOtherRepositories) {
      if (repo) {
        sql += ` AND (sm.scope = ? OR sm.repository = ?) `;
        params.push(MEMORY_SCOPE.GLOBAL, repo);
      } else {
        sql += ` AND sm.scope = ? `;
        params.push(MEMORY_SCOPE.GLOBAL);
      }
    }

    if (types.length > 0) {
      sql += ` AND sm.type IN (${types.map(() => "?").join(", ")}) `;
      params.push(...types);
    }

    if (scopes.length > 0) {
      sql += ` AND sm.scope IN (${scopes.map(() => "?").join(", ")}) `;
      params.push(...scopes);
    }

    if (sanitized) {
      sql += ` AND semantic_fts MATCH ? `;
      params.push(sanitized);
      sql += ` ORDER BY bm25(semantic_fts), sm.confidence DESC, sm.updated_at DESC `;
    } else {
      sql += ` ORDER BY sm.confidence DESC, sm.updated_at DESC `;
    }

    sql += ` LIMIT ? `;
    params.push(limit);

    return dedupeSemanticRows(this.db.prepare(sql).all(...params));
  }

  searchEpisodes({ query, repository, includeOtherRepositories = false, scopes = [], limit = 5 }) {
    this.ensureOpen();
    const sanitized = sanitizeFtsQuery(query);
    const repo = normalizeRepository(repository);
    const params = [];
    let sql = `
      SELECT
        ed.id,
        ed.session_id,
        ed.scope,
        ed.scope_source,
        ed.repository,
        ed.summary,
        ed.actions_json,
        ed.decisions_json,
        ed.files_changed_json,
        ed.themes_json,
        ed.open_items_json,
        ed.significance,
        ed.date_key,
        ed.updated_at
      FROM episode_digest ed
    `;

    if (sanitized) {
      sql += ` JOIN episode_fts ON episode_fts.rowid = ed.rowid `;
    }

    sql += ` WHERE 1 = 1 `;

    if (!includeOtherRepositories) {
      if (repo) {
        sql += ` AND (ed.scope = ? OR ed.repository = ?) `;
        params.push(MEMORY_SCOPE.GLOBAL, repo);
      } else {
        sql += ` AND ed.scope = ? `;
        params.push(MEMORY_SCOPE.GLOBAL);
      }
    }

    if (scopes.length > 0) {
      sql += ` AND ed.scope IN (${scopes.map(() => "?").join(", ")}) `;
      params.push(...scopes);
    }

    if (sanitized) {
      sql += ` AND episode_fts MATCH ? `;
      params.push(sanitized);
      sql += ` ORDER BY bm25(episode_fts), ed.significance DESC, ed.updated_at DESC `;
    } else {
      sql += ` ORDER BY ed.updated_at DESC, ed.significance DESC `;
    }

    sql += ` LIMIT ? `;
    params.push(limit);
    return this.db.prepare(sql).all(...params);
  }

  findRelevantEpisodesDetailed({ prompt, repository, includeOtherRepositories = false, scopes = [], limit = 5 }) {
    const primaryTerms = extractDirectTerms(prompt);
    const terms = extractFtsTerms(prompt);
    const lexicalQuery = (primaryTerms.length > 0 ? primaryTerms : terms).join(" ");
    const rawExactMatches = this.searchEpisodes({
      query: lexicalQuery,
      repository,
      includeOtherRepositories,
      scopes,
      limit: Math.max(limit * 2, 8),
    });
    const exactFiltered = [];
    const exactMatches = rawExactMatches.filter((episode) => {
      const reason = explainEpisodeExclusionReason(episode);
      if (!reason) {
        return true;
      }
      exactFiltered.push({
        stage: "exact_matches",
        reason,
        row: serializeEpisodeTraceRow(episode, repository),
      });
      return false;
    });

    const seen = new Set(exactMatches.map((episode) => episode.session_id));
    const rawFallbackPool = this.searchEpisodes({
      query: "",
      repository,
      includeOtherRepositories,
      scopes,
      limit: Math.max(limit * 8, 24),
    });
    const fallbackFiltered = [];
    const fallbackPool = rawFallbackPool.filter((episode) => {
      const reason = explainEpisodeExclusionReason(episode);
      if (!reason) {
        return true;
      }
      fallbackFiltered.push({
        stage: "fallback_pool",
        reason,
        row: serializeEpisodeTraceRow(episode, repository),
      });
      return false;
    });

    const deduped = dedupeEpisodesWithTrace([...exactMatches, ...fallbackPool], repository);
    const candidatePool = deduped.rows;
    const exactMatchIds = new Set(exactMatches.map((episode) => episode.session_id));
    const termWeights = buildTermWeights(candidatePool, terms);

    const ranked = candidatePool
      .filter((episode) => !seen.has(episode.session_id) || exactMatchIds.has(episode.session_id))
      .map((episode) => ({
        episode,
        score: scoreEpisodeAgainstWeightedTerms(episode, terms, primaryTerms, termWeights, exactMatchIds),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        if ((right.significance ?? right.episode.significance) !== (left.significance ?? left.episode.significance)) {
          return (right.episode.significance ?? 0) - (left.episode.significance ?? 0);
        }
        return String(right.episode.updated_at).localeCompare(String(left.episode.updated_at));
      });

    const ordered = ranked.map((entry) => entry.episode);
    const genericFiltered = ordered.some((episode) => !isGenericWorkSummary(episode.summary))
      ? ordered
        .filter((episode) => isGenericWorkSummary(episode.summary))
        .map((episode) => ({
          stage: "preference",
          reason: "generic_work_summary",
          row: serializeEpisodeTraceRow(episode, repository),
        }))
      : [];
    const preferred = ordered.some((episode) => !isGenericWorkSummary(episode.summary))
      ? ordered.filter((episode) => !isGenericWorkSummary(episode.summary))
      : ordered;

    const includedRows = preferred.slice(0, limit);
    return {
      episodes: includedRows,
      trace: {
        prompt,
        repository,
        includeOtherRepositories,
        eligibleScopes: scopes.length > 0 ? [...scopes] : buildLocalEligibility(repository),
        primaryTerms,
        terms,
        lexicalQuery,
        rankedRows: ranked
          .slice(0, Math.max(limit * 3, 12))
          .map((entry) => ({
            ...serializeEpisodeTraceRow(entry.episode, repository),
            score: Number(entry.score.toFixed(2)),
          })),
        includedRows: includedRows.map((episode) => serializeEpisodeTraceRow(episode, repository)),
        filtered: [
          ...exactFiltered,
          ...fallbackFiltered,
          ...deduped.filtered,
          ...genericFiltered,
        ],
      },
    };
  }

  findRelevantEpisodes({ prompt, repository, includeOtherRepositories = false, scopes = [], limit = 5 }) {
    return this.findRelevantEpisodesDetailed({
      prompt,
      repository,
      includeOtherRepositories,
      scopes,
      limit,
    }).episodes;
  }

  getDaySummary({ date, repository }) {
    this.ensureOpen();
    const repo = normalizeDaySummaryRepository(repository);
    return this.db.prepare(`
      SELECT date_key, repository, summary, episode_ids_json, computed_at
      FROM day_summary
      WHERE date_key = ? AND (
        (? = '' AND repository = '') OR repository = ?
      )
    `).get(date, repo, repo);
  }

  explainPromptContext({
    prompt,
    repository,
    includeOtherRepositories = false,
    limit = 6,
    sessionStore = null,
    promptNeed = null,
  }) {
    this.ensureOpen();
    const promptTerms = extractFtsTerms(prompt);
    const identityName = detectAssistantIdentityName(prompt);
    const need = promptNeed ?? {
      identityOnly: false,
      wantsRepoLocalTaskContext: true,
      allowCrossRepoFallback: includeOtherRepositories,
      hasTemporalSignal: Boolean(promptTerms.length > 0),
    };
    const allowRepoLocalTaskContext = need.wantsRepoLocalTaskContext === true;
    const allowCrossRepoFallback = need.allowCrossRepoFallback === true;
    const identityOnly = need.identityOnly === true;
    const memories = !identityOnly
      ? this.searchSemantic({
          query: prompt,
          repository,
          includeOtherRepositories: false,
          types: ["commitment", "open_loop", "rejected_approach", "blocker", "user_preference", "assistant_identity"],
          limit,
        }).map((memory) => ({
          ...memory,
          currentRepository: repository,
        }))
      : [];
    const identityMemories = identityName
      ? this.searchSemantic({
          query: identityName,
          repository,
          includeOtherRepositories: false,
          types: ["assistant_identity"],
          scopes: [MEMORY_SCOPE.GLOBAL],
          limit: 2,
        }).map((memory) => ({
          ...memory,
          currentRepository: repository,
        }))
      : [];
    const localMemories = dedupeSemanticContextRows([...identityMemories, ...memories]);

    const temporalDate = need.hasTemporalSignal ? inferDateFromPrompt(prompt) : null;
    const daySummary = temporalDate
      ? this.getDaySummary({ date: temporalDate, repository })
      : null;
    const episodeDetails = allowRepoLocalTaskContext
      ? this.findRelevantEpisodesDetailed({
          prompt,
          repository,
          includeOtherRepositories: false,
          limit: Math.max(2, Math.floor(limit / 2)),
        })
      : {
          episodes: [],
          trace: {
            prompt,
            repository,
            includeOtherRepositories: false,
            eligibleScopes: buildLocalEligibility(repository),
            primaryTerms: [],
            terms: [],
            lexicalQuery: "",
            rankedRows: [],
            includedRows: [],
            filtered: [],
            reason: "identity_only_prompt",
          },
        };
    const episodes = episodeDetails.episodes
      .map((episode) => ({
        ...episode,
        currentRepository: repository,
      }));
    const crossRepoPreferenceLimit = Math.max(1, Math.min(2, Math.floor(limit / 2) || 1));
    const crossRepoPreferenceRows = allowCrossRepoFallback
      ? this.searchSemantic({
          query: prompt,
          repository,
          includeOtherRepositories: true,
          types: ["user_preference", "rejected_approach"],
          scopes: [MEMORY_SCOPE.TRANSFERABLE],
          limit: Math.max(limit * 4, 8),
        })
      : [];
    const crossRepoPreferences = allowCrossRepoFallback
      ? crossRepoPreferenceRows
          .filter((memory) => isCrossRepoRow(memory, repository))
          .slice(0, crossRepoPreferenceLimit)
          .map((memory) => ({
            ...memory,
            currentRepository: repository,
          }))
      : [];
    const crossRepoEpisodeDetails = allowCrossRepoFallback
      ? this.findRelevantEpisodesDetailed({
          prompt,
          repository,
          includeOtherRepositories: true,
          scopes: [MEMORY_SCOPE.TRANSFERABLE],
          limit: Math.max(limit * 4, 8),
        })
      : null;
    const crossRepoEpisodes = allowCrossRepoFallback
      ? crossRepoEpisodeDetails.episodes
          .filter((episode) => isCrossRepoRow(episode, repository))
          .slice(0, Math.max(1, Math.min(2, Math.floor(limit / 2) || 1)))
          .map((episode) => ({
            ...episode,
            currentRepository: repository,
          }))
      : [];
    const crossRepoHints = allowCrossRepoFallback && sessionStore
      ? sessionStore.findRelevantSessions({
          prompt,
          repository: null,
          limit: Math.max(limit * 4, 8),
        })
          .filter((session) => isCrossRepoRow(session, repository))
          .slice(0, Math.max(1, Math.min(2, Math.floor(limit / 2) || 1)))
          .map((session) => ({
            ...session,
            currentRepository: repository,
          }))
      : [];

    const lines = [];
    const trace = {
      mode: "prompt_context",
      repository,
        includeOtherRepositories: allowCrossRepoFallback,
      promptTerms,
      identityName: identityName ?? null,
      temporalDate,
      eligibility: {
        localSemantic: buildLocalEligibility(repository),
        localEpisodes: buildLocalEligibility(repository),
        crossRepoFallback: includeOtherRepositories ? [MEMORY_SCOPE.TRANSFERABLE] : [],
      },
      lookups: {
        localMemories: {
          query: prompt,
          types: ["commitment", "open_loop", "rejected_approach", "blocker", "user_preference", "assistant_identity"],
          rows: memories.map((memory) => serializeSemanticTraceRow(memory, repository)),
          includedRows: localMemories.map((memory) => serializeSemanticTraceRow(memory, repository)),
        },
        identityMemories: {
          query: identityName ?? "",
          scopes: [MEMORY_SCOPE.GLOBAL],
          rows: identityMemories.map((memory) => serializeSemanticTraceRow(memory, repository)),
          includedRows: identityMemories.map((memory) => serializeSemanticTraceRow(memory, repository)),
        },
        daySummary: {
          date: temporalDate,
          included: false,
          reason: null,
        },
        localEpisodes: episodeDetails.trace,
        crossRepoPreferences: {
          enabled: allowCrossRepoFallback,
          scopes: [MEMORY_SCOPE.TRANSFERABLE],
          rows: crossRepoPreferenceRows.map((memory) => serializeSemanticTraceRow(memory, repository)),
          includedRows: crossRepoPreferences.map((memory) => serializeSemanticTraceRow(memory, repository)),
          filtered: crossRepoPreferenceRows
            .filter((memory) => !isCrossRepoRow(memory, repository))
            .map((memory) => ({
              stage: "cross_repo_filter",
              reason: "same_repository",
              row: serializeSemanticTraceRow(memory, repository),
            })),
          reason: null,
        },
        crossRepoEpisodes: {
          enabled: allowCrossRepoFallback,
          scopes: [MEMORY_SCOPE.TRANSFERABLE],
          rankedRows: crossRepoEpisodeDetails?.trace?.rankedRows ?? [],
          includedRows: crossRepoEpisodes.map((episode) => serializeEpisodeTraceRow(episode, repository)),
          filtered: [
            ...(crossRepoEpisodeDetails?.trace?.filtered ?? []),
            ...((crossRepoEpisodeDetails?.episodes ?? [])
              .filter((episode) => !isCrossRepoRow(episode, repository))
              .map((episode) => ({
                stage: "cross_repo_filter",
                reason: "same_repository",
                row: serializeEpisodeTraceRow(episode, repository),
              }))),
          ],
          reason: null,
        },
        crossRepoHints: {
          enabled: allowCrossRepoFallback && !!sessionStore,
          rows: crossRepoHints.map((session) => serializeSessionTraceRow(session, repository)),
          includedRows: [],
          reason: null,
        },
      },
      omissions: [],
      output: {
        sectionTitles: [],
        estimatedTokens: 0,
      },
    };
    const daySummaryTokens = daySummary?.summary ? tokenizeText(daySummary.summary) : new Set();
    const daySummaryMatches = promptTerms.length === 0
      || promptTerms.some((term) => daySummaryTokens.has(term));
    if (daySummary?.summary && daySummaryMatches) {
      trace.lookups.daySummary.included = true;
      lines.push(
        "## Relevant Day Summary",
        "",
        `[MEMORY: day summary for ${daySummary.date_key}]`,
        daySummary.summary,
      );
      trace.output.sectionTitles.push("Relevant Day Summary");
    } else if (!need.hasTemporalSignal || !temporalDate) {
      trace.lookups.daySummary.reason = "no_temporal_signal";
      trace.omissions.push({ stage: "day_summary", reason: "no_temporal_signal" });
    } else if (!daySummary?.summary) {
      trace.lookups.daySummary.reason = "missing_day_summary";
      trace.omissions.push({ stage: "day_summary", reason: "missing_day_summary", date: temporalDate });
    } else {
      trace.lookups.daySummary.reason = "summary_did_not_match_prompt_terms";
      trace.omissions.push({ stage: "day_summary", reason: "summary_did_not_match_prompt_terms", date: temporalDate });
    }

    if (episodes.length > 0) {
      if (lines.length > 0) {
        lines.push("");
      }
      lines.push("## Relevant Prior Work", "");
      for (const [index, episode] of episodes.entries()) {
        const line = formatEpisodeContextLine(episode, { terms: promptTerms, index });
        if (line) {
          lines.push(line);
        }
      }
      trace.output.sectionTitles.push("Relevant Prior Work");
    } else {
      trace.omissions.push({
        stage: "local_episodes",
        reason: allowRepoLocalTaskContext ? "no_relevant_episode_matches" : "identity_only_prompt",
      });
    }

    if (localMemories.length > 0) {
      if (lines.length > 0) {
        lines.push("");
      }
      lines.push("## Relevant Commitments, Preferences, And Identity", "");
      for (const memory of localMemories) {
        lines.push(formatSemanticContextLine(memory));
      }
      trace.output.sectionTitles.push("Relevant Commitments, Preferences, And Identity");
    } else {
      trace.omissions.push({ stage: "local_memories", reason: identityOnly ? "identity_only_prompt" : "no_matching_memories" });
    }

    if (crossRepoEpisodes.length > 0) {
      if (lines.length > 0) {
        lines.push("");
      }
      lines.push("## Cross-Repo Examples", "");
      for (const [index, episode] of crossRepoEpisodes.entries()) {
        const line = formatEpisodeContextLine(episode, { terms: promptTerms, index });
        if (line) {
          lines.push(line);
        }
      }
      trace.output.sectionTitles.push("Cross-Repo Examples");
    }

    if (crossRepoEpisodes.length === 0 && crossRepoHints.length > 0) {
      if (lines.length > 0) {
        lines.push("");
      }
      lines.push("## Cross-Repo Hints", "");
      for (const session of crossRepoHints) {
        const line = formatSessionHintLine(session);
        if (line) {
          lines.push(line);
        }
      }
      trace.lookups.crossRepoHints.includedRows = crossRepoHints.map((session) => serializeSessionTraceRow(session, repository));
      trace.output.sectionTitles.push("Cross-Repo Hints");
    } else if (!allowCrossRepoFallback) {
      trace.lookups.crossRepoHints.reason = "cross_repo_lookup_disabled";
      trace.omissions.push({ stage: "cross_repo_hints", reason: "cross_repo_lookup_disabled" });
    } else if (!sessionStore) {
      trace.lookups.crossRepoHints.reason = "session_store_unavailable";
      trace.omissions.push({ stage: "cross_repo_hints", reason: "session_store_unavailable" });
    } else if (crossRepoEpisodes.length > 0) {
      trace.lookups.crossRepoHints.reason = "suppressed_by_cross_repo_examples";
      trace.omissions.push({ stage: "cross_repo_hints", reason: "suppressed_by_cross_repo_examples" });
    } else {
      trace.lookups.crossRepoHints.reason = "no_cross_repo_hints";
      trace.omissions.push({ stage: "cross_repo_hints", reason: "no_cross_repo_hints" });
    }

    if (crossRepoPreferences.length > 0) {
      if (lines.length > 0) {
        lines.push("");
      }
      lines.push("## Transferable Cross-Repo Preferences", "");
      for (const memory of crossRepoPreferences) {
        lines.push(formatSemanticContextLine(memory));
      }
      trace.output.sectionTitles.push("Transferable Cross-Repo Preferences");
    } else if (!allowCrossRepoFallback) {
      trace.lookups.crossRepoPreferences.reason = "cross_repo_lookup_disabled";
    } else {
      trace.lookups.crossRepoPreferences.reason = "no_transferable_preferences";
    }

    if (crossRepoEpisodes.length === 0) {
      trace.lookups.crossRepoEpisodes.reason = allowCrossRepoFallback
        ? "no_cross_repo_examples"
        : "cross_repo_lookup_disabled";
    }

    const text = lines.join("\n");
    trace.output.estimatedTokens = estimateTokens(text);
    return {
      text,
      trace,
    };
  }

  buildPromptContext({
    prompt,
    repository,
    includeOtherRepositories = false,
    limit = 6,
    sessionStore = null,
    promptNeed = null,
  }) {
    return this.explainPromptContext({
      prompt,
      repository,
      includeOtherRepositories,
      limit,
      sessionStore,
      promptNeed,
    }).text;
  }
}

function inferDateFromPrompt(prompt) {
  const text = String(prompt || "").toLowerCase();
  const now = new Date();

  if (text.includes("today")) {
    return now.toISOString().slice(0, 10);
  }
  if (text.includes("yesterday")) {
    const value = new Date(now);
    value.setDate(value.getDate() - 1);
    return value.toISOString().slice(0, 10);
  }

  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const namedDay = weekdays.find((weekday) => text.includes(weekday));
  if (!namedDay) {
    return null;
  }

  const targetIndex = weekdays.indexOf(namedDay);
  const currentIndex = now.getDay();
  const diff = (currentIndex - targetIndex + 7) % 7 || 7;
  const value = new Date(now);
  value.setDate(value.getDate() - diff);
  return value.toISOString().slice(0, 10);
}
