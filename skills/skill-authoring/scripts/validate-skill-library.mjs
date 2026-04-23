#!/usr/bin/env node

import { access, readFile, readdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../../..");
const SKILLS_ROOT = path.join(REPO_ROOT, "skills");

const REQUIRED_HEADINGS = [
  "## Use this skill when",
  "## Do not use this skill when",
  "## Inputs to gather",
  "## First move",
  "## Workflow",
  "## Validation",
  "## Examples",
  "## Reference files",
];

// Headings required only for task skills (omitted in reference skills per the import-rewrite-contract).
const TASK_ONLY_HEADINGS = new Set([
  "## Inputs to gather",
  "## First move",
  "## Workflow",
]);

const VALID_KINDS = new Set(["task", "reference"]);

function normalize(text) {
  return text.replace(/\r\n?/g, "\n");
}

function parseScalar(value) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === "null") {
    return null;
  }
  const quoted = value.match(/^(['"])(.*)\1$/);
  if (quoted) {
    return quoted[2];
  }
  return value;
}

function parseFrontmatter(text) {
  const normalized = normalize(text);
  if (!normalized.startsWith("---\n")) {
    throw new Error("missing frontmatter block");
  }

  const endIndex = normalized.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    throw new Error("unterminated frontmatter block");
  }

  const frontmatterText = normalized.slice(4, endIndex);
  const body = normalized.slice(endIndex + 5);
  const frontmatter = {};
  let currentObject = null;

  for (const line of frontmatterText.split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const indent = line.length - line.trimStart().length;
    if (indent === 0) {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        throw new Error(`invalid frontmatter line: ${line}`);
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!value) {
        currentObject = {};
        frontmatter[key] = currentObject;
      } else {
        frontmatter[key] = parseScalar(value);
        currentObject = null;
      }
      continue;
    }

    if (!currentObject || indent < 2) {
      throw new Error(`unexpected frontmatter indentation: ${line}`);
    }

    const trimmed = line.trim();
    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) {
      throw new Error(`invalid nested frontmatter line: ${line}`);
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    currentObject[key] = parseScalar(value);
  }

  return { frontmatter, body };
}

function parseOpeningFence(line) {
  const trimmed = line.trimStart();
  const match = trimmed.match(/^(?:[-+*]|\d+\.)?\s*(`{3,}|~{3,})/);
  if (!match) {
    return null;
  }

  return {
    marker: match[1][0],
    length: match[1].length,
  };
}

function isClosingFence(line, openingFence) {
  const trimmed = line.trimStart();
  const match = trimmed.match(/^(?:[-+*]|\d+\.)?\s*(`{3,}|~{3,})\s*$/);
  if (!match) {
    return false;
  }

  return (
    match[1][0] === openingFence.marker &&
    match[1].length >= openingFence.length
  );
}

function stripFencedCodeBlocks(body) {
  const lines = body.split("\n");
  const strippedLines = [];
  const errors = [];
  let openingFence = null;
  let openingFenceLine = -1;

  for (const [index, line] of lines.entries()) {
    if (!openingFence) {
      const fence = parseOpeningFence(line);
      if (fence) {
        openingFence = fence;
        openingFenceLine = index + 1;
        strippedLines.push("");
        continue;
      }

      strippedLines.push(line);
      continue;
    }

    if (isClosingFence(line, openingFence)) {
      openingFence = null;
      openingFenceLine = -1;
      strippedLines.push("");
      continue;
    }

    strippedLines.push("");
  }

  if (openingFence) {
    errors.push(
      `unterminated fenced code block starting on line ${openingFenceLine}`,
    );
  }

  return {
    searchableBody: strippedLines.join("\n"),
    errors,
  };
}

function findHeadingLineIndex(lines, heading) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const leadingSpaces = line.length - line.trimStart().length;
    const normalizedHeadingLine = line.trim().replace(/\s+#+\s*$/, "");
    if (leadingSpaces < 4 && normalizedHeadingLine === heading) {
      return index;
    }
  }

  return -1;
}

function getSectionText(body, heading) {
  const { searchableBody } = stripFencedCodeBlocks(body);
  const lines = searchableBody.split("\n");
  const startIndex = findHeadingLineIndex(lines, heading);
  if (startIndex === -1) {
    return null;
  }

  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^#{1,6}\s+/.test(line.trim())) {
      endIndex = index;
      break;
    }
  }

  return lines.slice(startIndex + 1, endIndex).join("\n");
}

function sectionHasConcreteContent(sectionText) {
  if (sectionText === null) {
    return false;
  }

  return sectionText.split("\n").some((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return false;
    }
    if (trimmed === "..." || trimmed === "…") {
      return false;
    }
    if (/^(\*|-|\d+\.)\s*(\.\.\.|…)?\s*$/.test(trimmed)) {
      return false;
    }
    return true;
  });
}

function collectReferenceTargets(sectionText) {
  const targets = new Set();
  if (sectionText === null) {
    return targets;
  }

  const markdownLinkPattern = /\[[^\]]*]\(([^)]+)\)/g;
  const backtickPattern = /`([^`\n]+)`/g;

  for (const pattern of [markdownLinkPattern, backtickPattern]) {
    for (const match of sectionText.matchAll(pattern)) {
      const rawTarget = match[1].trim();
      if (!rawTarget) {
        continue;
      }
      if (
        rawTarget.startsWith("http://") ||
        rawTarget.startsWith("https://") ||
        rawTarget.startsWith("mailto:") ||
        rawTarget.startsWith("#")
      ) {
        continue;
      }

      const cleanedTarget = rawTarget.split("#", 1)[0].split("?", 1)[0].trim();
      if (
        cleanedTarget &&
        (cleanedTarget.startsWith("./") ||
          cleanedTarget.startsWith("../") ||
          (cleanedTarget.includes("/") && /\.[A-Za-z0-9]+$/.test(cleanedTarget)))
      ) {
        targets.add(cleanedTarget);
      }
    }
  }

  return targets;
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
  const entries = await readdir(SKILLS_ROOT, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }

    const skillPath = path.join(SKILLS_ROOT, entry.name, "SKILL.md");
    if (await pathExists(skillPath)) {
      files.push(skillPath);
    }
  }

  return files.sort();
}

async function resolveSkillFiles(args) {
  if (args.length === 0) {
    return listSkillFiles();
  }

  return args.map((filePath) => path.resolve(REPO_ROOT, filePath));
}

async function validateSkillContent(filePath, frontmatter, body) {
  const errors = [];
  const skillDir = path.basename(path.dirname(filePath));

  if (!frontmatter.name) {
    errors.push("missing frontmatter key name");
  } else if (frontmatter.name !== skillDir) {
    errors.push(
      `frontmatter name ${frontmatter.name} does not match directory ${skillDir}`,
    );
  }

  if (!frontmatter.description || !String(frontmatter.description).trim()) {
    errors.push("missing frontmatter key description");
  } else {
    const desc = String(frontmatter.description).trim();
    // Floor guard: catch truly empty or near-empty placeholders for all maturity levels.
    if (desc.length < 20) {
      errors.push("description is too short; provide a meaningful description");
    }
    // Trigger-phrase check: descriptions should name concrete trigger situations, not just
    // label the skill's domain. Enforced only for draft skills so the existing stable
    // library is not broken. New skills must comply before promotion to stable.
    // Note: "use when" always contains "when " — it is listed for clarity only.
    const maturity = frontmatter.metadata?.maturity;
    if (maturity === "draft") {
      const descLower = desc.toLowerCase();
      const hasTriggerPhrase =
        descLower.includes("when ") ||
        descLower.includes("use this") ||
        descLower.includes("use when");
      if (!hasTriggerPhrase) {
        errors.push(
          'description does not include a trigger phrase ("when", "use this", or "use when"); describe when an agent should activate this skill',
        );
      }
    }
  }

  const metadata = frontmatter.metadata;
  if (metadata && typeof metadata === "object" && "kind" in metadata) {
    const kind = metadata.kind;
    if (!VALID_KINDS.has(kind)) {
      errors.push(
        `invalid metadata.kind ${kind || "<missing>"}; expected one of task, reference`,
      );
    }
  }

  const { searchableBody, errors: fenceErrors } = stripFencedCodeBlocks(body);
  errors.push(...fenceErrors);

  const isReferenceSkill = metadata?.kind === "reference";
  const lines = searchableBody.split("\n");
  let previousIndex = -1;
  for (const heading of REQUIRED_HEADINGS) {
    if (isReferenceSkill && TASK_ONLY_HEADINGS.has(heading)) {
      continue;
    }
    const index = findHeadingLineIndex(lines, heading);
    if (index === -1) {
      errors.push(`missing heading ${heading}`);
      continue;
    }
    if (index < previousIndex) {
      errors.push(`heading out of order ${heading}`);
      continue;
    }
    previousIndex = index;
  }

  const outputsSection = findHeadingLineIndex(lines, "## Outputs");
  if (metadata?.kind === "task" && outputsSection === -1) {
    errors.push("missing heading ## Outputs for task skill");
  }

  const examplesSection = getSectionText(body, "## Examples");
  if (!sectionHasConcreteContent(examplesSection)) {
    errors.push("examples section is empty or placeholder-only");
  }

  const referenceSection = getSectionText(body, "## Reference files");
  if (!sectionHasConcreteContent(referenceSection)) {
    errors.push("reference files section is empty or placeholder-only");
  }

  const referenceTargets = collectReferenceTargets(referenceSection);
  if (referenceTargets.size === 0) {
    errors.push("reference files section does not list any files");
  } else {
    for (const rawTarget of referenceTargets) {
      const targetPath = path.resolve(path.dirname(filePath), rawTarget);
      if (!(await pathExists(targetPath))) {
        errors.push(`missing referenced file ${rawTarget}`);
      }
    }
  }

  return errors;
}

async function validateFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const text = await readFile(absolutePath, "utf8");
  const { frontmatter, body } = parseFrontmatter(text);
  const errors = await validateSkillContent(absolutePath, frontmatter, body);

  if (errors.length > 0) {
    return {
      ok: false,
      message: `FAIL ${absolutePath}\n${errors.map((error) => `- ${error}`).join("\n")}`,
    };
  }

  return {
    ok: true,
    message: `OK ${absolutePath}`,
  };
}

async function main() {
  const files = await resolveSkillFiles(process.argv.slice(2));
  if (files.length === 0) {
    console.error("no SKILL.md files found");
    process.exitCode = 1;
    return;
  }

  const messages = [];
  let hasFailure = false;

  for (const filePath of files) {
    try {
      const result = await validateFile(filePath);
      messages.push(result.message);
      if (!result.ok) {
        hasFailure = true;
      }
    } catch (error) {
      hasFailure = true;
      const message = error instanceof Error ? error.message : String(error);
      messages.push(`FAIL ${path.resolve(filePath)}\n- ${message}`);
    }
  }

  const output = messages.join("\n");
  if (hasFailure) {
    console.error(output);
    process.exitCode = 1;
    return;
  }

  console.log(output);
}

await main();
