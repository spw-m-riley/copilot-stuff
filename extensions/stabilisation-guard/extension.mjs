import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import { execFile } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";

const LORE_DB_PATH = path.join(
  process.env.LORE_COPILOT_HOME?.trim() || path.join(os.homedir(), ".copilot"),
  "lore.db",
);

const SUPPORTED_SCHEMA_VERSION = 17;
const DISPLAY_LIMIT = 5;
const EDIT_TOOLS = new Set(["edit", "create", "apply_patch"]);

// Per-session state: populated on onSessionStart, consulted on onPreToolUse.
let activeItems = null; // null = not yet checked; [] = clean; [...items] = unresolved (capped at DISPLAY_LIMIT)
let activeTotal = 0;   // full count before the display cap
let firedDeny = false; // true after the once-per-session deny has fired

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    execFile(command, args, { maxBuffer: 1024 * 1024, ...options }, (error, stdout, stderr) => {
      resolve({ ok: !error, stdout: stdout ?? "", stderr: stderr ?? "" });
    });
  });
}

async function detectRepository(cwd) {
  const result = await run("git", ["remote", "get-url", "origin"], { cwd });
  if (!result.ok || !result.stdout.trim()) return null;
  const url = result.stdout.trim();
  // Handles: git@github.com:owner/repo.git and https://github.com/owner/repo.git
  const match = url.match(/[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
  return match ? match[1] : null;
}

function queryActiveItems(repository) {
  let db;
  try {
    db = new DatabaseSync(LORE_DB_PATH, { readOnly: true });

    const versionRow = db.prepare("SELECT version FROM lore_schema_version").get();
    const schemaVersion = versionRow?.version ?? 0;
    if (schemaVersion > SUPPORTED_SCHEMA_VERSION) {
      return { schemaWarning: true, items: [], total: 0 };
    }

    const rows = db
      .prepare(
        `SELECT id, type, content, updated_at
         FROM semantic_memory
         WHERE type IN ('open_loop', 'assistant_goal')
           AND superseded_by IS NULL
           AND (
             (scope = 'repo' AND repository = ?)
             OR scope = 'global'
           )
         ORDER BY updated_at DESC`,
      )
      .all(repository);

    return { schemaWarning: false, items: rows.slice(0, DISPLAY_LIMIT), total: rows.length };
  } catch {
    // Fail open: lore.db missing, locked, or otherwise inaccessible
    return { schemaWarning: false, items: [], total: 0 };
  } finally {
    try {
      db?.close();
    } catch {
      // ignore
    }
  }
}

function formatItem(item) {
  const label = item.type === "open_loop" ? "Open loop" : "Stabilisation goal";
  const text =
    item.content.length > 120 ? item.content.slice(0, 120) + "…" : item.content;
  return `- [${label}] ${text}`;
}

function formatItemList(items, total) {
  const lines = items.map(formatItem);
  if (total > DISPLAY_LIMIT) {
    lines.push(`- … and ${total - DISPLAY_LIMIT} more (use \`/resolve-open-loops\` to review all)`);
  }
  return lines.join("\n");
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onSessionStart: async (input) => {
      const cwd = input.cwd || process.cwd();
      const repository = await detectRepository(cwd);
      if (!repository) return;

      const { schemaWarning, items, total } = queryActiveItems(repository);

      if (schemaWarning) {
        await session.log(
          `stabilisation-guard: lore.db schema version exceeds expected v${SUPPORTED_SCHEMA_VERSION}; guard disabled`,
          { ephemeral: true, level: "warning" },
        );
        activeItems = [];
        return;
      }

      activeItems = items;
      activeTotal = total;

      if (items.length === 0) return;

      return {
        additionalContext: [
          `## ⚠️ Stabilisation guard — ${total} unresolved item(s) for ${repository}`,
          "",
          formatItemList(items, total),
          "",
          "Review these before starting new implementation work.",
          "Use `/resolve-open-loops` to work through them, or proceed deliberately if the scope is already clear.",
        ].join("\n"),
      };
    },

    onPreToolUse: async (input) => {
      if (firedDeny) return;
      if (!EDIT_TOOLS.has(input.toolName)) return;
      if (!activeItems || activeItems.length === 0) return;

      firedDeny = true;

      return {
        permissionDecision: "deny",
        permissionDecisionReason: [
          `stabilisation-guard: ${activeTotal} unresolved item(s) exist before this edit.`,
          "",
          formatItemList(activeItems, activeItems.length),
          "",
          "This fires once per session. Proceed on your next attempt if the work is deliberately scoped,",
          "or use `/resolve-open-loops` to clear these items first.",
        ].join("\n"),
      };
    },
  },
  tools: [],
});
