import { access, readFile } from "node:fs/promises";
import path from "node:path";

const FRONTMATTER_DELIMITER = "---";
const LEARNED_RULES_HEADING = "Learned Rules";
const REFERENCE_FILES_HEADING = "Reference files";

export function isInstructionTrigger(filePath) {
  return path.basename(filePath) === "SKILL.md" || filePath.endsWith(".instructions.md");
}

export async function validateInstructionFile(filePath, { formatSummary } = {}) {
  const text = await readFile(filePath, "utf8");
  const normalized = text.replace(/\r\n?/g, "\n");
  const errors = validateInstructionText(filePath, normalized);
  if (path.basename(filePath) === "SKILL.md") {
    errors.push(...(await validateSkillReferenceFiles(filePath, normalized)));
  }
  const formatter = formatSummary ?? defaultFormatSummary;
  return [
    formatter(`instruction-file (${path.basename(filePath)})`, {
      ok: errors.length === 0,
      stdout: "",
      stderr: errors.join("\n"),
    }),
  ];
}

// fallow-ignore-next-line complexity
export function validateInstructionText(filePath, text) {
  const normalized = text.replace(/\r\n?/g, "\n");
  const errors = [];
  const frontmatter = parseFrontmatter(normalized);
  const isInstructionFile = filePath.endsWith(".instructions.md");

  if (!frontmatter) {
    errors.push("frontmatter is required");
  } else {
    if (!hasFrontmatterKey(frontmatter, "description")) {
      errors.push("frontmatter must include description");
    }
    if (isInstructionFile && !hasFrontmatterKey(frontmatter, "applyTo")) {
      errors.push("frontmatter must include applyTo for *.instructions.md files");
    }
  }

  validateLearnedRules(filePath, normalized, isInstructionFile, errors);

  return errors;
}

export async function validateSkillReferenceFiles(filePath, text) {
  const normalized = text.replace(/\r\n?/g, "\n");
  const section = findH2Section(normalized, REFERENCE_FILES_HEADING);
  const errors = [];
  if (!section) {
    return ["SKILL.md must include a ## Reference files section with at least one resolvable local path"];
  }

  const candidates = extractReferenceCandidates(section.body);
  const backtickedPaths = extractBacktickedPathLikeStrings(section.body);
  for (const referencePath of backtickedPaths) {
    if (!(await resolvesLocalPath(filePath, referencePath))) {
      errors.push(`backticked Reference files path does not resolve: ${referencePath}`);
    }
  }

  let hasResolvablePath = false;
  for (const referencePath of candidates) {
    if (await resolvesLocalPath(filePath, referencePath)) {
      hasResolvablePath = true;
      break;
    }
  }

  if (!hasResolvablePath) {
    errors.push("SKILL.md Reference files section must include at least one resolvable local path");
  }

  return errors;
}

function parseFrontmatter(text) {
  const lines = text.split("\n");
  if (lines[0] !== FRONTMATTER_DELIMITER) {
    return null;
  }
  const endIndex = lines.findIndex((line, index) => index > 0 && line === FRONTMATTER_DELIMITER);
  if (endIndex === -1) {
    return null;
  }
  return lines.slice(1, endIndex).join("\n");
}

function hasFrontmatterKey(frontmatter, key) {
  const pattern = new RegExp(`^${escapeRegExp(key)}\\s*:\\s*\\S`, "m");
  return pattern.test(frontmatter);
}

function validateLearnedRules(filePath, text, isInstructionFile, errors) {
  const h2Headings = extractH2Headings(text);
  const learnedRulesIndex = h2Headings.findIndex((heading) => heading.title === LEARNED_RULES_HEADING);
  if (learnedRulesIndex !== -1 && learnedRulesIndex !== h2Headings.length - 1) {
    errors.push("## Learned Rules must be the last H2 heading when present");
  }
  if (isInstructionFile && isInInstructionsTree(filePath) && learnedRulesIndex === -1) {
    errors.push("instructions tree *.instructions.md files must include ## Learned Rules");
  }
}

function extractH2Headings(text) {
  const headings = [];
  let fence = null;
  for (const line of text.split("\n")) {
    const fenceMatch = parseFence(line);
    if (fenceMatch) {
      if (!fence) {
        fence = fenceMatch;
      } else if (fenceMatch.char === fence.char && fenceMatch.length >= fence.length) {
        fence = null;
      }
      continue;
    }
    if (fence || /^ {4,}/.test(line)) {
      continue;
    }
    const headingMatch = line.match(/^ {0,3}##(?!#)\s+(.+?)\s*#*\s*$/);
    if (headingMatch) {
      headings.push({ title: headingMatch[1].trim() });
    }
  }
  return headings;
}

function parseFence(line) {
  const match = line.match(/^ {0,3}(`{3,}|~{3,})/);
  if (!match) {
    return null;
  }
  return { char: match[1][0], length: match[1].length };
}

function findH2Section(text, title) {
  const lines = text.split("\n");
  let fence = null;
  let startIndex = -1;
  let endIndex = lines.length;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = parseFence(line);
    if (fenceMatch) {
      if (!fence) {
        fence = fenceMatch;
      } else if (fenceMatch.char === fence.char && fenceMatch.length >= fence.length) {
        fence = null;
      }
      continue;
    }
    if (fence || /^ {4,}/.test(line)) {
      continue;
    }
    const headingMatch = line.match(/^ {0,3}##(?!#)\s+(.+?)\s*#*\s*$/);
    if (!headingMatch) {
      continue;
    }
    const headingTitle = headingMatch[1].trim();
    if (startIndex === -1 && headingTitle === title) {
      startIndex = index + 1;
      continue;
    }
    if (startIndex !== -1) {
      endIndex = index;
      break;
    }
  }

  if (startIndex === -1) {
    return null;
  }
  return { body: lines.slice(startIndex, endIndex).join("\n") };
}

function extractReferenceCandidates(sectionBody) {
  return Array.from(
    new Set([
      ...extractMarkdownLinks(sectionBody),
      ...extractBacktickedPathLikeStrings(sectionBody),
    ]),
  );
}

function extractMarkdownLinks(text) {
  const matches = text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g);
  return Array.from(matches, (match) => stripLinkDecoration(match[1])).filter(isLocalReferencePath);
}

function extractBacktickedPathLikeStrings(text) {
  const matches = text.matchAll(/`([^`]+)`/g);
  return Array.from(matches, (match) => match[1].trim()).filter(isLocalReferencePath);
}

function stripLinkDecoration(target) {
  return target.trim().split(/\s+/)[0].split("#")[0];
}

function isLocalReferencePath(candidate) {
  if (!candidate || candidate.startsWith("http://") || candidate.startsWith("https://")) {
    return false;
  }
  if (candidate.startsWith("#") || path.isAbsolute(candidate)) {
    return false;
  }
  return candidate.includes("/") || /\.[A-Za-z0-9]+$/.test(candidate);
}

async function resolvesLocalPath(filePath, referencePath) {
  const target = path.resolve(path.dirname(filePath), stripLinkDecoration(referencePath));
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function isInInstructionsTree(filePath) {
  return path.resolve(filePath).split(path.sep).includes("instructions");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function defaultFormatSummary(label, result) {
  const output = (result.stderr || result.stdout || "").trim();
  return result.ok ? `- ${label}: ok` : `- ${label}: failed\n${output}`;
}
