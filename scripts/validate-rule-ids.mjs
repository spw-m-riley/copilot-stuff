#!/usr/bin/env node
// Validates that learned-rule IDs stay unique within the repository's
// "global pool" of instruction files. See the "Numbering convention" note
// below for why most `instructions/*.instructions.md` files are excluded.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

// Numbering convention
// --------------------
// `copilot-instructions.md` is the original, chronologically-numbered
// learned-rule ledger. IDs there are append-only and never reused, even
// after a rule is archived to `copilot-instructions-deprecated.md` (an
// archived ID is retired forever, not freed up for reuse).
//
// A handful of `instructions/*.instructions.md` files were split out of
// that same root ledger over time and kept their *original* global ID
// rather than restarting a local counter at 1 (see the "Rules moved to
// scoped instruction files" section of `copilot-instructions-deprecated.md`
// for the provenance of each). Those files remain part of the single
// global numbering pool and must never collide with root or with each
// other:
export const GLOBAL_POOL_FILES = [
  "copilot-instructions.md",
  "copilot-instructions-deprecated.md",
  "instructions/go.instructions.md",
  "instructions/memory.instructions.md",
  "instructions/shell.instructions.md",
  "instructions/review.instructions.md",
  "instructions/github.instructions.md",
];

// Every other `instructions/*.instructions.md` file (agents, extensions,
// github-workflows, javascript, json, lua, markdown, terraform,
// session-artifacts, skills, typescript, yaml, ...) uses its own
// independent, file-local numbering pool that intentionally starts near 1
// and is allowed to reuse ID numbers already used elsewhere. Duplicate IDs
// across those files (or against the global pool) are expected and are
// NOT validated here. Only a duplicate ID *within the same local file*
// with different content is flagged, since that always indicates a real
// authoring mistake regardless of which pool the file belongs to.

const RULE_LINE_PATTERN = /^(\d+)\.\s\[([A-Z][A-Z-]*)\]\s(.+)$/;

// `copilot-instructions-deprecated.md` archives rules from BOTH the global
// pool and files with their own independent local numbering (for example
// "### Lua Rule 6 (Deprecated: ...)"). A `### `-level header that names a
// specific other file's local rule (anything other than a plain "Rule N" /
// "Rules N, M" heading) marks the fenced block(s) under it as NOT part of
// the global pool, so they must not be compared against it.
const HEADER_PATTERN = /^###\s+(.+)$/;
const GLOBAL_POOL_HEADER_PATTERN = /^Rules?\s+\d/i;

function normalizeRuleText(text) {
  return text.replace(/\r\n?/g, "\n").trim().replace(/\s+/g, " ");
}

function extractRules(fileText) {
  const rules = [];
  const lines = fileText.replace(/\r\n?/g, "\n").split("\n");
  let inGlobalPoolSection = true;

  for (const [index, line] of lines.entries()) {
    const headerMatch = line.match(HEADER_PATTERN);
    if (headerMatch) {
      inGlobalPoolSection = GLOBAL_POOL_HEADER_PATTERN.test(headerMatch[1]);
      continue;
    }

    if (!inGlobalPoolSection) {
      continue;
    }

    const match = line.match(RULE_LINE_PATTERN);
    if (!match) {
      continue;
    }
    const [, idText, category, text] = match;
    rules.push({
      id: Number.parseInt(idText, 10),
      category,
      text: normalizeRuleText(text),
      line: index + 1,
    });
  }
  return rules;
}

async function readRepoFile(relativePath, repoRoot = REPO_ROOT) {
  const absolutePath = path.join(repoRoot, relativePath);
  try {
    return await readFile(absolutePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function findLocalDuplicates(relativePath, rules) {
  const byId = new Map();
  for (const rule of rules) {
    if (!byId.has(rule.id)) {
      byId.set(rule.id, []);
    }
    byId.get(rule.id).push(rule);
  }

  const issues = [];
  for (const [id, entries] of byId) {
    if (entries.length < 2) {
      continue;
    }
    const distinctTexts = new Set(entries.map((entry) => entry.text));
    if (distinctTexts.size > 1) {
      const lines = entries.map((entry) => entry.line).join(", ");
      issues.push(
        `${relativePath}: rule ${id} appears ${entries.length} times with different content (lines ${lines})`,
      );
    }
  }
  return issues;
}

function findGlobalPoolCollisions(fileRules) {
  const byId = new Map();
  for (const [relativePath, rules] of fileRules) {
    for (const rule of rules) {
      if (!byId.has(rule.id)) {
        byId.set(rule.id, []);
      }
      byId.get(rule.id).push({ ...rule, file: relativePath });
    }
  }

  const issues = [];
  for (const [id, entries] of byId) {
    const distinctTexts = new Set(entries.map((entry) => entry.text));
    if (distinctTexts.size <= 1) {
      continue;
    }
    const locations = entries
      .map((entry) => `${entry.file}:${entry.line}`)
      .join(" vs ");
    issues.push(
      `duplicate global-pool rule ID ${id} with different content (${locations})`,
    );
  }
  return issues.sort();
}

export async function validateRuleIds({
  repoRoot = REPO_ROOT,
  globalPoolFiles = GLOBAL_POOL_FILES,
  readFileFn = readRepoFile,
} = {}) {
  const fileRules = [];
  const missingFiles = [];
  const localIssues = [];

  for (const relativePath of globalPoolFiles) {
    const text = await readFileFn(relativePath, repoRoot);
    if (text === null) {
      missingFiles.push(relativePath);
      continue;
    }
    const rules = extractRules(text);
    fileRules.push([relativePath, rules]);
    localIssues.push(...findLocalDuplicates(relativePath, rules));
  }

  const collisionIssues = findGlobalPoolCollisions(fileRules);
  const issues = [...missingFiles.map((file) => `global-pool file not found: ${file}`), ...localIssues, ...collisionIssues];

  return {
    ok: issues.length === 0,
    issues,
    filesChecked: fileRules.map(([relativePath]) => relativePath),
  };
}

async function main() {
  const result = await validateRuleIds();

  if (result.issues.length === 0) {
    console.log(
      `OK: no duplicate learned-rule IDs across ${result.filesChecked.length} global-pool file(s)`,
    );
    return;
  }

  console.error(`Found ${result.issues.length} rule-ID issue(s):`);
  for (const issue of result.issues) {
    console.error(`  - ${issue}`);
  }
  process.exitCode = 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  await main();
}
