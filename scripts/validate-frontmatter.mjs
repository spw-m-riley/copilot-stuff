#!/usr/bin/env node

import { access, readFile, readdir, stat } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractFrontmatter, normalize } from "./markdown-structure.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_SKILLS_ROOT = path.join(REPO_ROOT, "skills");
const DEFAULT_AGENTS_ROOT = path.join(REPO_ROOT, "agents");
const DEFAULT_INSTRUCTIONS_ROOT = path.join(REPO_ROOT, "instructions");

function hasBom(text) {
  return text.charCodeAt(0) === 0xfeff;
}

function stripBom(text) {
  return hasBom(text) ? text.slice(1) : text;
}

async function pathExists(targetPath) {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function listSkillFiles() {
  const entries = await readdir(DEFAULT_SKILLS_ROOT, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }

    const skillFile = path.join(DEFAULT_SKILLS_ROOT, entry.name, "SKILL.md");
    if (await pathExists(skillFile)) {
      files.push(skillFile);
    }
  }

  return files.sort();
}

async function listFilesInDir(rootDir, predicate) {
  const entries = await readdir(rootDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && predicate(entry.name))
    .map((entry) => path.join(rootDir, entry.name))
    .sort();
}

async function resolveTargets(args) {
  if (args.length > 0) {
    return args.map((targetPath) => path.resolve(REPO_ROOT, targetPath));
  }

  const [skillFiles, agentFiles, instructionFiles] = await Promise.all([
    listSkillFiles(),
    listFilesInDir(DEFAULT_AGENTS_ROOT, (name) => name.endsWith(".agent.md")),
    listFilesInDir(DEFAULT_INSTRUCTIONS_ROOT, (name) =>
      name.endsWith(".instructions.md"),
    ),
  ]);

  return [...skillFiles, ...agentFiles, ...instructionFiles];
}

function extractYamlText(filePath, text) {
  if (!filePath.endsWith(".md")) {
    return { yamlText: text, mode: "yaml" };
  }

  const { frontmatterText } = extractFrontmatter(stripBom(text));
  return {
    yamlText: frontmatterText,
    mode: "frontmatter",
  };
}

function findInlineCommentIndex(value) {
  let quote = null;

  for (let index = 0; index < value.length; index += 1) {
    const current = value[index];
    const previous = index > 0 ? value[index - 1] : "";

    if ((current === "'" || current === '"') && previous !== "\\") {
      if (quote === current) {
        quote = null;
      } else if (quote === null) {
        quote = current;
      }
      continue;
    }

    if (quote === null && current === "#" && index > 0 && value[index - 1] === " ") {
      return index;
    }
  }

  return -1;
}

function splitKeyValue(text) {
  let quote = null;

  for (let index = 0; index < text.length; index += 1) {
    const current = text[index];
    const previous = index > 0 ? text[index - 1] : "";

    if ((current === "'" || current === '"') && previous !== "\\") {
      if (quote === current) {
        quote = null;
      } else if (quote === null) {
        quote = current;
      }
      continue;
    }

    if (quote === null && current === ":") {
      return {
        key: text.slice(0, index),
        rawValue: text.slice(index + 1),
      };
    }
  }

  return null;
}

function validateScalarValue(rawValue, lineNumber, errors) {
  if (/^\s+$/.test(rawValue)) {
    errors.push(`line ${lineNumber}: trailing ": " with no value`);
    return;
  }

  const commentIndex = findInlineCommentIndex(rawValue);
  if (commentIndex !== -1) {
    errors.push(`line ${lineNumber}: stray inline comment marker " #"`);
  }
}

function analyzeListItem(content, lineNumber, errors) {
  if (content === "-" || /^-\s+$/.test(content)) {
    errors.push(`line ${lineNumber}: malformed list item`);
    return { opensBlock: false };
  }

  const afterDash = content.slice(1).trimStart();
  const pair = splitKeyValue(afterDash);
  if (!pair) {
    validateScalarValue(` ${afterDash}`, lineNumber, errors);
    return { opensBlock: false };
  }

  if (!pair.key.trim()) {
    errors.push(`line ${lineNumber}: malformed mapping key`);
    return { opensBlock: false };
  }

  if (pair.rawValue.length === 0) {
    return { opensBlock: true };
  }

  validateScalarValue(pair.rawValue, lineNumber, errors);
  return { opensBlock: false };
}

function analyzeYamlLine(content, lineNumber, errors) {
  if (content.startsWith("-")) {
    return analyzeListItem(content, lineNumber, errors);
  }

  const pair = splitKeyValue(content);
  if (!pair) {
    errors.push(`line ${lineNumber}: malformed YAML-ish line`);
    return { opensBlock: false };
  }

  if (!pair.key.trim()) {
    errors.push(`line ${lineNumber}: malformed mapping key`);
    return { opensBlock: false };
  }

  if (pair.rawValue.length === 0) {
    return { opensBlock: true };
  }

  validateScalarValue(pair.rawValue, lineNumber, errors);
  return { opensBlock: false };
}

function scanYamlText(yamlText) {
  const errors = [];
  const lines = normalize(stripBom(yamlText)).split("\n");
  const indentStack = [0];
  let previousMeaningful = null;

  for (const [index, rawLine] of lines.entries()) {
    const lineNumber = index + 1;
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed === "---" || trimmed === "...") {
      continue;
    }
    if (rawLine.trimStart().startsWith("#")) {
      continue;
    }

    if (rawLine.includes("\t")) {
      errors.push(`line ${lineNumber}: tab indentation is not allowed`);
    }

    const indent = rawLine.length - rawLine.trimStart().length;
    const content = rawLine.trimStart();

    if (indent > indentStack.at(-1)) {
      if (!previousMeaningful?.opensBlock) {
        errors.push(`line ${lineNumber}: unexpected indentation`);
      } else {
        indentStack.push(indent);
      }
    } else {
      while (indent < indentStack.at(-1)) {
        indentStack.pop();
      }
      if (indent !== indentStack.at(-1)) {
        errors.push(`line ${lineNumber}: inconsistent indentation`);
      }
    }

    previousMeaningful = analyzeYamlLine(content, lineNumber, errors);
  }

  return errors;
}

async function validateTarget(filePath) {
  const issues = [];
  let stats;

  try {
    stats = await stat(filePath);
  } catch {
    return [`file not found: ${filePath}`];
  }

  if (!stats.isFile()) {
    return [`not a file: ${filePath}`];
  }

  const rawText = await readFile(filePath, "utf8");
  if (hasBom(rawText)) {
    issues.push("file starts with a UTF-8 BOM");
  }
  if (/\r\n?/.test(rawText)) {
    issues.push("file uses CRLF or CR line endings");
  }

  let yamlText;
  try {
    ({ yamlText } = extractYamlText(filePath, rawText));
  } catch (error) {
    issues.push(error.message);
    return issues;
  }

  issues.push(...scanYamlText(yamlText));
  return issues;
}

async function main() {
  const args = process.argv.slice(2);
  const targets = await resolveTargets(args);
  let errorCount = 0;

  for (const filePath of targets) {
    const issues = await validateTarget(filePath);
    if (issues.length === 0) {
      console.log(`OK ${path.relative(REPO_ROOT, filePath) || filePath}`);
      continue;
    }

    errorCount += issues.length;
    console.error(`ERROR ${path.relative(REPO_ROOT, filePath) || filePath}`);
    for (const issue of issues) {
      console.error(`  - ${issue}`);
    }
  }

  const summary = `${errorCount} error${errorCount === 1 ? "" : "s"} across ${targets.length} file${targets.length === 1 ? "" : "s"}`;
  if (errorCount > 0) {
    console.error(summary);
    process.exitCode = 1;
    return;
  }

  console.log(summary);
}

await main();
