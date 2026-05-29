import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const JOURNAL_RELATIVE_DIR = path.join("session-state", "journal");
const JOURNAL_FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\.md$/;
const PRIME_LINE_LIMIT = 80;
const DEFAULT_SESSION_SUMMARY =
  "Session journal saved with decisions, discoveries, and open loops.";

function defaultCopilotHome() {
  return path.join(os.homedir(), ".copilot");
}

function journalDir(copilotHome = defaultCopilotHome()) {
  return path.join(copilotHome, JOURNAL_RELATIVE_DIR);
}

function timestampForFilename(date = new Date(Date.now())) {
  return date.toISOString().slice(0, 16).replace("T", "-").replace(":", "-");
}

function timestampForTitle(date = new Date(Date.now())) {
  return date.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

function asDate(value, fallbackDate) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed;
    }
  }
  return fallbackDate;
}

function textFields(input = {}) {
  return [input.summary, input.finalMessage, input.error]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
}

const SECTION_KEYS = new Map([
  ["decision", "decisions"],
  ["decisions", "decisions"],
  ["discovery", "discoveries"],
  ["discoveries", "discoveries"],
  ["open loop", "openLoops"],
  ["open loops", "openLoops"],
  ["open-loop", "openLoops"],
  ["open-loops", "openLoops"],
]);

function sectionFromLine(line) {
  const match = line.match(/^\s*(?:#{1,6}\s*)?([A-Za-z -]+?)\s*:\s*(.*)$/);
  if (!match) {
    return null;
  }
  const key = SECTION_KEYS.get(match[1].trim().toLowerCase());
  return key ? { key, rest: match[2].trim() } : null;
}

function normalizeBullet(line) {
  return line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
}

function firstUsefulLines(text, limit = 3) {
  return text
    .split(/\r?\n/)
    .map(normalizeBullet)
    .filter(Boolean)
    .slice(0, limit);
}

function extractJournalSections(input = {}) {
  const sections = {
    decisions: [],
    discoveries: [],
    openLoops: [],
  };
  const sourceText = textFields(input).join("\n");
  let currentKey = null;

  for (const rawLine of sourceText.split(/\r?\n/)) {
    const heading = sectionFromLine(rawLine);
    if (heading) {
      currentKey = heading.key;
      if (heading.rest) {
        sections[currentKey].push(normalizeBullet(heading.rest));
      }
      continue;
    }

    if (!currentKey) {
      continue;
    }

    const bullet = normalizeBullet(rawLine);
    if (bullet) {
      sections[currentKey].push(bullet);
    }
  }

  if (sections.decisions.length === 0) {
    sections.decisions.push("Not captured in session-end metadata.");
  }
  if (sections.discoveries.length === 0) {
    const fallback = firstUsefulLines(sourceText || `Session ended with reason: ${input.reason ?? "unknown"}.`);
    sections.discoveries.push(...fallback);
  }
  if (sections.openLoops.length === 0) {
    if (input.reason && input.reason !== "complete" && typeof input.error === "string" && input.error.trim()) {
      sections.openLoops.push(`Session ended with ${input.reason}: ${input.error.trim()}`);
    } else {
      sections.openLoops.push("None captured in session-end metadata.");
    }
  }

  return sections;
}

function formatBulletList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function formatJournalMarkdown(input = {}, date = new Date(Date.now())) {
  const sections = extractJournalSections(input);
  const sessionId = input.sessionId ? String(input.sessionId) : "unknown";
  const reason = input.reason ? String(input.reason) : "unknown";
  const workingDirectory = input.workingDirectory ? String(input.workingDirectory) : "unknown";

  return [
    `# Session journal — ${timestampForTitle(date)}`,
    "",
    `- Session: ${sessionId}`,
    `- Reason: ${reason}`,
    `- Working directory: ${workingDirectory}`,
    "",
    "## Decisions",
    formatBulletList(sections.decisions),
    "",
    "## Discoveries",
    formatBulletList(sections.discoveries),
    "",
    "## Open loops",
    formatBulletList(sections.openLoops),
    "",
  ].join("\n");
}

export async function writeJournalEntry(input = {}, options = {}) {
  const now = options.now ?? (() => new Date(Date.now()));
  const date = asDate(input.timestamp, now());
  const dir = journalDir(options.copilotHome);
  const filename = `${timestampForFilename(date)}.md`;
  const filePath = path.join(dir, filename);

  await mkdir(dir, { recursive: true });
  await writeFile(filePath, formatJournalMarkdown(input, date), "utf8");
  return filePath;
}

export async function readLatestJournalEntry(options = {}) {
  const dir = journalDir(options.copilotHome);
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }

  const latest = entries
    .filter((entry) => entry.isFile() && JOURNAL_FILENAME_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .at(-1);

  if (!latest) {
    return null;
  }

  const filePath = path.join(dir, latest);
  return {
    path: filePath,
    content: await readFile(filePath, "utf8"),
  };
}

function hasExpectedSections(content) {
  return ["## Decisions", "## Discoveries", "## Open loops"].every((heading) =>
    content.includes(heading),
  );
}

function primingContext(entry) {
  const truncated = entry.content.split(/\r?\n/).slice(0, PRIME_LINE_LIMIT).join("\n");
  const warning = hasExpectedSections(entry.content)
    ? ""
    : "\n\nNote: previous journal is missing expected sections; use it as raw narrative context only.";

  return [
    "## Previous session journal",
    "",
    `Source: ${entry.path}`,
    warning.trim(),
    "",
    truncated,
  ]
    .filter((part) => part !== "")
    .join("\n");
}

export function createSessionJournalHooks(options = {}) {
  return {
    onSessionEnd: async (input = {}) => {
      await writeJournalEntry(input, options);
      return { sessionSummary: DEFAULT_SESSION_SUMMARY };
    },
    onSessionStart: async () => {
      const latest = await readLatestJournalEntry(options);
      if (!latest) {
        return undefined;
      }
      const additionalContext = primingContext(latest);
      return {
        additionalContext,
        modifiedConfig: { additionalContext },
      };
    },
  };
}

export { JOURNAL_RELATIVE_DIR, DEFAULT_SESSION_SUMMARY };

async function startExtension() {
  const { joinSession } = await import("@github/copilot-sdk/extension");
  await joinSession({
    hooks: createSessionJournalHooks(),
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await startExtension();
}
