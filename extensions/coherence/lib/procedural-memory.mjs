import path from "node:path";
import { readdir, readFile } from "node:fs/promises";

function cleanLine(line) {
  return line.replace(/^\s+|\s+$/g, "");
}

function extractLearnedRules(markdown) {
  const lines = String(markdown || "").split("\n");
  const startIndex = lines.findIndex((line) => line.trim() === "## Learned Rules");
  if (startIndex < 0) {
    return [];
  }

  const rules = [];
  for (const line of lines.slice(startIndex + 1)) {
    const trimmed = cleanLine(line);
    if (trimmed.startsWith("## ") && trimmed !== "## Learned Rules") {
      break;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      rules.push(trimmed);
    }
  }

  return rules;
}

function instructionSignalMap() {
  return [
    { file: "javascript.instructions.md", patterns: [/\.m?js\b/i, /javascript/i] },
    { file: "typescript.instructions.md", patterns: [/\.tsx?\b/i, /typescript/i] },
    { file: "json.instructions.md", patterns: [/\.jsonc?\b/i, /json/i] },
    { file: "yaml.instructions.md", patterns: [/\.ya?ml\b/i, /yaml/i] },
    { file: "github-workflows.instructions.md", patterns: [/\.github\/workflows\//i, /workflow/i] },
    { file: "lua.instructions.md", patterns: [/\.lua\b/i, /lua/i, /neovim/i] },
    { file: "terraform.instructions.md", patterns: [/\.tf(vars)?\b/i, /terraform/i, /\bhcl\b/i] },
  ];
}

export function detectRelevantInstructionFiles(prompt) {
  const matches = new Set();
  const text = String(prompt || "");
  for (const entry of instructionSignalMap()) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      matches.add(entry.file);
    }
  }
  return [...matches];
}

async function readInstructionFile(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

export async function buildProceduralProfile({ prompt, relevantInstructionFiles, config }) {
  const globalText = await readInstructionFile(config.paths.instructionsPath);
  const globalRules = extractLearnedRules(globalText).slice(-8);

  const instructionDirEntries = await readdir(config.paths.scopedInstructionsDir);
  const selectedFiles = new Set(relevantInstructionFiles);
  for (const entry of instructionDirEntries) {
    if (entry.endsWith(".instructions.md") && selectedFiles.has(entry)) {
      selectedFiles.add(entry);
    }
  }

  const scopedRules = [];
  for (const fileName of selectedFiles) {
    const filePath = path.join(config.paths.scopedInstructionsDir, fileName);
    const text = await readInstructionFile(filePath);
    const rules = extractLearnedRules(text).slice(-4);
    if (rules.length > 0) {
      scopedRules.push(`### ${fileName}`);
      scopedRules.push(...rules);
    }
  }

  const lines = [];
  if (globalRules.length > 0) {
    lines.push("## Procedural Memory", "");
    for (const rule of globalRules) {
      lines.push(`- ${rule.replace(/^\d+\.\s*/, "")}`);
    }
  }

  if (scopedRules.length > 0) {
    if (lines.length > 0) {
      lines.push("");
    }
    lines.push("## Relevant File-Scoped Rules", "");
    for (const line of scopedRules) {
      lines.push(line.startsWith("###") ? line : `- ${line.replace(/^\d+\.\s*/, "")}`);
    }
  }

  if (!prompt && lines.length === 0) {
    return "";
  }

  return lines.join("\n");
}
