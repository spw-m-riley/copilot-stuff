export const SCHEMA_VERSION = 6;

export const SCHEMA_STATEMENTS = [
  `
    CREATE TABLE IF NOT EXISTS semantic_memory (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 1.0,
      source_session_id TEXT,
      source_turn_index INTEGER,
      scope TEXT NOT NULL DEFAULT 'repo',
      scope_source TEXT NOT NULL DEFAULT 'auto',
      scope_override_actor TEXT,
      scope_override_reason TEXT,
      scope_override_source TEXT,
      scope_override_at TEXT,
      repository TEXT,
      tags TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      superseded_by TEXT,
      expires_at TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}'
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_semantic_memory_repository
      ON semantic_memory(repository);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_semantic_memory_scope
      ON semantic_memory(scope);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_semantic_memory_scope_source
      ON semantic_memory(scope_source);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_semantic_memory_type
      ON semantic_memory(type);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_semantic_memory_superseded
      ON semantic_memory(superseded_by);
  `,
  `
    CREATE VIRTUAL TABLE IF NOT EXISTS semantic_fts USING fts5(
      content,
      tags,
      type,
      content='semantic_memory',
      content_rowid='rowid'
    );
  `,
  `
    CREATE TRIGGER IF NOT EXISTS semantic_memory_ai AFTER INSERT ON semantic_memory BEGIN
      INSERT INTO semantic_fts(rowid, content, tags, type)
      VALUES (new.rowid, new.content, new.tags, new.type);
    END;
  `,
  `
    CREATE TRIGGER IF NOT EXISTS semantic_memory_ad AFTER DELETE ON semantic_memory BEGIN
      INSERT INTO semantic_fts(semantic_fts, rowid, content, tags, type)
      VALUES('delete', old.rowid, old.content, old.tags, old.type);
    END;
  `,
  `
    CREATE TRIGGER IF NOT EXISTS semantic_memory_au AFTER UPDATE ON semantic_memory BEGIN
      INSERT INTO semantic_fts(semantic_fts, rowid, content, tags, type)
      VALUES('delete', old.rowid, old.content, old.tags, old.type);
      INSERT INTO semantic_fts(rowid, content, tags, type)
      VALUES (new.rowid, new.content, new.tags, new.type);
    END;
  `,
  `
    CREATE TABLE IF NOT EXISTS episode_digest (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL UNIQUE,
      scope TEXT NOT NULL DEFAULT 'repo',
      scope_source TEXT NOT NULL DEFAULT 'auto',
      scope_override_actor TEXT,
      scope_override_reason TEXT,
      scope_override_source TEXT,
      scope_override_at TEXT,
      repository TEXT,
      branch TEXT,
      summary TEXT NOT NULL,
      actions_json TEXT NOT NULL DEFAULT '[]',
      decisions_json TEXT NOT NULL DEFAULT '[]',
      learnings_json TEXT NOT NULL DEFAULT '[]',
      files_changed_json TEXT NOT NULL DEFAULT '[]',
      refs_json TEXT NOT NULL DEFAULT '[]',
      significance INTEGER NOT NULL DEFAULT 5,
      themes_json TEXT NOT NULL DEFAULT '[]',
      open_items_json TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL DEFAULT 'rule',
      date_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_episode_digest_repository
      ON episode_digest(repository);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_episode_digest_scope
      ON episode_digest(scope);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_episode_digest_scope_source
      ON episode_digest(scope_source);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_episode_digest_date_key
      ON episode_digest(date_key);
  `,
  `
    CREATE VIRTUAL TABLE IF NOT EXISTS episode_fts USING fts5(
      summary,
      actions_json,
      decisions_json,
      learnings_json,
      themes_json,
      content='episode_digest',
      content_rowid='rowid'
    );
  `,
  `
    CREATE TRIGGER IF NOT EXISTS episode_digest_ai AFTER INSERT ON episode_digest BEGIN
      INSERT INTO episode_fts(rowid, summary, actions_json, decisions_json, learnings_json, themes_json)
      VALUES (new.rowid, new.summary, new.actions_json, new.decisions_json, new.learnings_json, new.themes_json);
    END;
  `,
  `
    CREATE TRIGGER IF NOT EXISTS episode_digest_ad AFTER DELETE ON episode_digest BEGIN
      INSERT INTO episode_fts(episode_fts, rowid, summary, actions_json, decisions_json, learnings_json, themes_json)
      VALUES('delete', old.rowid, old.summary, old.actions_json, old.decisions_json, old.learnings_json, old.themes_json);
    END;
  `,
  `
    CREATE TRIGGER IF NOT EXISTS episode_digest_au AFTER UPDATE ON episode_digest BEGIN
      INSERT INTO episode_fts(episode_fts, rowid, summary, actions_json, decisions_json, learnings_json, themes_json)
      VALUES('delete', old.rowid, old.summary, old.actions_json, old.decisions_json, old.learnings_json, old.themes_json);
      INSERT INTO episode_fts(rowid, summary, actions_json, decisions_json, learnings_json, themes_json)
      VALUES (new.rowid, new.summary, new.actions_json, new.decisions_json, new.learnings_json, new.themes_json);
    END;
  `,
  `
    CREATE TABLE IF NOT EXISTS day_summary (
      date_key TEXT NOT NULL,
      repository TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL,
      episode_ids_json TEXT NOT NULL DEFAULT '[]',
      computed_at TEXT NOT NULL,
      PRIMARY KEY (date_key, repository)
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS deferred_extraction (
      session_id TEXT PRIMARY KEY,
      repository TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      priority INTEGER NOT NULL DEFAULT 0,
      reason TEXT NOT NULL DEFAULT 'manual',
      queued_at TEXT NOT NULL,
      available_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}'
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_deferred_extraction_status_available
      ON deferred_extraction(status, available_at);
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_deferred_extraction_repository_status
      ON deferred_extraction(repository, status);
  `,
  `
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
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_scope_override_audit_target
      ON scope_override_audit(target_type, target_id, created_at DESC);
  `,
  `
    CREATE TABLE IF NOT EXISTS backfill_run (
      id TEXT PRIMARY KEY,
      strategy TEXT NOT NULL DEFAULT 'session_refresh',
      status TEXT NOT NULL DEFAULT 'pending',
      dry_run INTEGER NOT NULL DEFAULT 0,
      repository TEXT,
      include_other_repositories INTEGER NOT NULL DEFAULT 0,
      refresh_existing INTEGER NOT NULL DEFAULT 1,
      batch_size INTEGER NOT NULL DEFAULT 10,
      total_candidates INTEGER NOT NULL DEFAULT 0,
      processed_count INTEGER NOT NULL DEFAULT 0,
      created_episode_count INTEGER NOT NULL DEFAULT 0,
      refreshed_episode_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      snapshot_path TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      started_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      last_error TEXT
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_backfill_run_status_updated
      ON backfill_run(status, updated_at DESC);
  `,
  `
    CREATE TABLE IF NOT EXISTS backfill_run_item (
      run_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      repository TEXT,
      ordinal INTEGER NOT NULL,
      planned_action TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      semantic_before_count INTEGER,
      semantic_after_count INTEGER,
      semantic_delta INTEGER,
      episode_before_scope TEXT,
      episode_after_scope TEXT,
      processed_at TEXT,
      error TEXT,
      PRIMARY KEY (run_id, session_id),
      FOREIGN KEY (run_id) REFERENCES backfill_run(id) ON DELETE CASCADE
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_backfill_run_item_status_ordinal
      ON backfill_run_item(run_id, status, ordinal);
  `,
  `
    CREATE TABLE IF NOT EXISTS coherence_schema_version (
      version INTEGER NOT NULL
    );
  `,
];
