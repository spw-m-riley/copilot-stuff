#!/usr/bin/env node

import { access, readFile, readdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  REQUIRED_HEADINGS,
  TASK_HEADINGS,
  TASK_ONLY_HEADINGS,
} from "./skill-contract.mjs";
import {
  findHeadingLineIndex,
  findHeadingLineIndexes,
  parseFrontmatter,
  stripFencedCodeBlocks,
} from "../../../scripts/markdown-structure.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../../..");
const SKILLS_ROOT = path.join(REPO_ROOT, "skills");

const VALID_KINDS = new Set(["task", "reference"]);
const VALID_MATURITIES = new Set(["draft", "stable"]);

// Headings whose "route to X" / "route instead" prose is worth checking for
// dangling references to skills or agents that no longer exist locally.
// Entry-point/router skills (see layering-guide.md "Optional split decisions")
// may use a domain-named canonical routing heading instead of a second
// "## Routing boundary" section underneath their own — list that heading here
// too so its route links get the same dangling-reference check. See
// metadata-contract.md "Entry-point/router skills and the `## Routing
// boundary` heading" for the documented special case.
const ROUTE_SECTION_HEADINGS = [
  "## Do not use this skill when",
  "## Routing boundary",
  // typescript-triage's canonical router table (dispatches by symptom instead
  // of duplicating a separate "## Routing boundary" section).
  "## Symptom routing table",
];

// Explicit allowlist of bare backtick mentions inside route-section prose that
// are intentionally NOT local skills/agents (tool names, built-in capabilities
// that are not tracked under skills/ or agents/, etc). Add an entry here only
// when the mention is deliberate prose, not a stale route.
const ROUTE_MENTION_ALLOWLIST = new Set([
  // Tool name mentioned in a routing-boundary "situation" column, not a route target.
  "pip-compile",
  // Package name mentioned in aws-sdk-v2-to-v3-migration's routing-boundary
  // "situation" column, not a route target.
  "aws-sdk",
  // Built-in review capability (invoke via `/security-review` or the `task` tool's
  // `security-review` agent type) — not a file tracked under skills/ or agents/.
  "security-review",
]);

// Metadata contract: only these top-level keys are permitted in skill frontmatter.
// See skills/skill-authoring/references/metadata-contract.md for rationale.
const ALLOWED_TOP_LEVEL_KEYS = new Set([
  "name",
  "description",
  "metadata",
  "disable-model-invocation",
]);

// Upstream provenance keys that must not appear inside the metadata block.
const FORBIDDEN_METADATA_KEYS = new Set([
  "github-path",
  "github-ref",
  "github-repo",
  "github-tree-sha",
  "author",
  "inspired-by",
  "version",
  "enhancements",
]);

const AUTHORING_TEMPLATE_PATH = path.join(
  REPO_ROOT,
  "skills/skill-authoring/assets/skill-template.md",
);
const IMPORT_CONTRACT_PATH = path.join(
  REPO_ROOT,
  "skills/skill-authoring/references/import-rewrite-contract.md",
);

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

  // fallow-ignore-next-line complexity
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
    addReferenceTargetsFromPattern(sectionText, pattern, targets);
  }

  return targets;
}

// Markdown-link targets only (no bare backtick spans). Bare backticks in
// prose sections like "Do not use this skill when" often illustrate paths
// (`~/.copilot`, `session-state/<id>/handoff.md`) rather than navigate to a
// real file, so treating them as link targets there is too noisy.
function collectMarkdownLinkTargets(sectionText) {
  const targets = new Set();
  if (sectionText === null) {
    return targets;
  }

  addReferenceTargetsFromPattern(sectionText, /\[[^\]]*]\(([^)]+)\)/g, targets);
  return targets;
}

function addReferenceTargetsFromPattern(sectionText, pattern, targets) {
  for (const match of sectionText.matchAll(pattern)) {
    const cleanedTarget = normalizeLocalReferenceTarget(match[1]);
    if (cleanedTarget) {
      targets.add(cleanedTarget);
    }
  }
}

// fallow-ignore-next-line complexity
function normalizeLocalReferenceTarget(rawTargetValue) {
  const rawTarget = rawTargetValue.trim();
  if (!rawTarget || isExternalReferenceTarget(rawTarget)) {
    return null;
  }

  const cleanedTarget = rawTarget.split("#", 1)[0].split("?", 1)[0].trim();
  if (!cleanedTarget) {
    return null;
  }

  return isLocalReferencePath(cleanedTarget) ? cleanedTarget : null;
}

function isExternalReferenceTarget(rawTarget) {
  return (
    rawTarget.startsWith("http://") ||
    rawTarget.startsWith("https://") ||
    rawTarget.startsWith("mailto:") ||
    rawTarget.startsWith("#")
  );
}

function isLocalReferencePath(cleanedTarget) {
  return (
    cleanedTarget.startsWith("./") ||
    cleanedTarget.startsWith("../") ||
    (cleanedTarget.includes("/") && /\.[A-Za-z0-9]+$/.test(cleanedTarget))
  );
}

async function pathExists(targetPath) {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// fallow-ignore-next-line complexity
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

async function listSupportFilesInDir(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await listSupportFilesInDir(fullPath);
      files.push(...subFiles);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function validateOrphanedSupportFiles(filePath, body, errors) {
  const skillDir = path.dirname(filePath);
  const allFiles = await listSupportFilesInDir(skillDir);
  const supportFiles = allFiles.filter(
    (f) =>
      path.basename(f) !== "SKILL.md" && path.basename(f) !== "PROVENANCE.md",
  );

  if (supportFiles.length === 0) {
    return;
  }

  const allRefs = collectReferenceTargets(body);
  const resolvedRefs = new Set(
    [...allRefs].map((ref) => path.resolve(skillDir, ref)),
  );

  for (const supportFile of supportFiles) {
    if (!resolvedRefs.has(supportFile)) {
      const relPath = path
        .relative(skillDir, supportFile)
        .replace(/\\/g, "/");
      errors.push(
        `orphaned support file not referenced in SKILL.md: ${relPath}`,
      );
    }
  }
}

async function validateSkillContent(filePath, frontmatter, body) {
  const errors = [];
  const skillDir = path.basename(path.dirname(filePath));

  validateSkillName(frontmatter, skillDir, errors);
  validateSkillDescription(frontmatter, errors);
  validateTopLevelFrontmatterKeys(frontmatter, errors);
  validateDisableModelInvocation(frontmatter, errors);
  validateSkillMetadata(frontmatter.metadata, errors);

  const { searchableBody, errors: fenceErrors } = stripFencedCodeBlocks(body);
  errors.push(...fenceErrors);
  validateRequiredHeadings(searchableBody, frontmatter.metadata, errors);
  const examplesSection = getSectionText(body, "## Examples");
  if (!sectionHasConcreteContent(examplesSection)) {
    errors.push("examples section is empty or placeholder-only");
  }

  const referenceSection = getSectionText(body, "## Reference files");
  if (!sectionHasConcreteContent(referenceSection)) {
    errors.push("reference files section is empty or placeholder-only");
  }

  await validateReferenceTargets(filePath, referenceSection, errors);
  await validateOrphanedSupportFiles(filePath, body, errors);
  await validateRouteMentions(filePath, body, errors);

  return errors;
}

function validateSkillName(frontmatter, skillDir, errors) {
  if (!frontmatter.name) {
    errors.push("missing frontmatter key name");
    return;
  }

  if (frontmatter.name !== skillDir) {
    errors.push(
      `frontmatter name ${frontmatter.name} does not match directory ${skillDir}`,
    );
  }
}

// fallow-ignore-next-line complexity
function validateSkillDescription(frontmatter, errors) {
  if (!frontmatter.description || !String(frontmatter.description).trim()) {
    errors.push("missing frontmatter key description");
    return;
  }

  const desc = String(frontmatter.description).trim();
  if (desc.length < 20) {
    errors.push("description is too short; provide a meaningful description");
  }

  validateDescriptionTriggerPhrase(desc, errors);
}

function validateDescriptionTriggerPhrase(desc, errors) {
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

function validateTopLevelFrontmatterKeys(frontmatter, errors) {
  for (const key of Object.keys(frontmatter)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {
      errors.push(
        `forbidden top-level frontmatter key: ${key}; allowed keys are name, description, metadata, disable-model-invocation — see skills/skill-authoring/references/metadata-contract.md`,
      );
    }
  }
}

function validateDisableModelInvocation(frontmatter, errors) {
  if (
    "disable-model-invocation" in frontmatter &&
    typeof frontmatter["disable-model-invocation"] !== "boolean"
  ) {
    errors.push(
      "disable-model-invocation must be a boolean when present; use true for explicit user-invocation skills",
    );
  }
}

function validateSkillMetadata(metadata, errors) {
  if (!metadata || typeof metadata !== "object") {
    errors.push(
      "missing metadata block with category, audience, maturity, and kind — see skills/skill-authoring/references/metadata-contract.md",
    );
    return;
  }

  validateForbiddenMetadataKeys(metadata, errors);
  validateMetadataLifecycleFields(metadata, errors);
  validateMetadataKind(metadata, errors);
}

function validateMetadataLifecycleFields(metadata, errors) {
  for (const field of ["category", "audience", "maturity", "kind"]) {
    if (!(field in metadata) || !String(metadata[field]).trim()) {
      errors.push(
        `missing metadata.${field}; set the required lifecycle field — see skills/skill-authoring/references/metadata-contract.md`,
      );
    }
  }

  if ("maturity" in metadata && !VALID_MATURITIES.has(metadata.maturity)) {
    errors.push(
      `invalid metadata.maturity ${metadata.maturity || "<missing>"}; expected one of draft, stable`,
    );
  }
}

function validateForbiddenMetadataKeys(metadata, errors) {
  for (const key of Object.keys(metadata)) {
    if (!FORBIDDEN_METADATA_KEYS.has(key)) {
      continue;
    }
    errors.push(
      `forbidden provenance key metadata.${key}; remove upstream attribution fields from frontmatter — see skills/skill-authoring/references/metadata-contract.md`,
    );
  }
}

function validateMetadataKind(metadata, errors) {
  if (!("kind" in metadata) || VALID_KINDS.has(metadata.kind)) {
    return;
  }

  errors.push(
    `invalid metadata.kind ${metadata.kind || "<missing>"}; expected one of task, reference`,
  );
}

function validateRequiredHeadings(searchableBody, metadata, errors) {
  const lines = searchableBody.split("\n");
  const requiredHeadings = REQUIRED_HEADINGS.filter((heading) =>
    shouldValidateHeading(heading, metadata),
  );

  validateHeadingOrder(lines, requiredHeadings, errors);
  validateTaskOutputsHeading(lines, metadata, errors);
}

function shouldValidateHeading(heading, metadata) {
  return !(
    metadata?.kind === "reference" && TASK_ONLY_HEADINGS.includes(heading)
  );
}

function validateHeadingOrder(lines, requiredHeadings, errors) {
  let previousIndex = -1;
  for (const heading of requiredHeadings) {
    const index = validateHeadingOccurrence(lines, heading, errors);
    if (index === -1) {
      continue;
    }
    if (index < previousIndex) {
      errors.push(`heading out of order ${heading}`);
      continue;
    }
    previousIndex = index;
  }
}

function validateHeadingOccurrence(lines, heading, errors) {
  const indexes = findHeadingLineIndexes(lines, heading);
  if (indexes.length === 0) {
    errors.push(`missing heading ${heading}`);
    return -1;
  }
  if (indexes.length > 1) {
    errors.push(`duplicate heading ${heading}; expected exactly one occurrence`);
  }
  return indexes[0];
}

function validateTaskOutputsHeading(lines, metadata, errors) {
  if (metadata?.kind !== "task") {
    return;
  }
  if (findHeadingLineIndex(lines, "## Outputs") === -1) {
    errors.push("missing heading ## Outputs for task skill");
  }
}

async function validateReferenceTargets(filePath, referenceSection, errors) {
  const referenceTargets = collectReferenceTargets(referenceSection);
  if (referenceTargets.size === 0) {
    errors.push("reference files section does not list any files");
    return;
  }

  for (const rawTarget of referenceTargets) {
    const targetPath = path.resolve(path.dirname(filePath), rawTarget);
    if (!(await pathExists(targetPath))) {
      errors.push(`missing referenced file ${rawTarget}`);
    }
  }
}

// Bare backtick mentions of a plausible skill/agent name (2+ kebab-case
// segments) that are NOT part of a markdown link. Markdown-linked mentions are
// covered by the local-path check in validateRouteLinkTargets instead.
function collectBareRouteMentions(sectionText) {
  const mentions = new Set();
  if (sectionText === null) {
    return mentions;
  }

  const pattern = /`([a-z][a-z0-9]*(?:-[a-z0-9]+)+)`(?!\])/g;
  for (const match of sectionText.matchAll(pattern)) {
    mentions.add(match[1]);
  }
  return mentions;
}

async function routeMentionResolvesLocally(name) {
  const skillPath = path.join(SKILLS_ROOT, name, "SKILL.md");
  const agentPath = path.join(REPO_ROOT, "agents", `${name}.agent.md`);
  return (await pathExists(skillPath)) || (await pathExists(agentPath));
}

// Route-target validation: within "Do not use this skill when" and "Routing
// boundary" sections, catch (a) markdown links pointing at a local file that
// no longer exists, and (b) bare backtick mentions of a skill/agent-shaped
// name that resolves to neither a local skill nor a local agent, unless the
// name is on the explicit ROUTE_MENTION_ALLOWLIST for intentionally non-local
// prose (built-in capabilities, tool names, etc).
async function validateRouteMentions(filePath, body, errors) {
  const skillDir = path.dirname(filePath);

  for (const heading of ROUTE_SECTION_HEADINGS) {
    const sectionText = getSectionText(body, heading);
    if (sectionText === null) {
      continue;
    }

    for (const rawTarget of collectMarkdownLinkTargets(sectionText)) {
      const targetPath = path.resolve(skillDir, rawTarget);
      if (!(await pathExists(targetPath))) {
        errors.push(
          `dangling route link in "${heading}": ${rawTarget}`,
        );
      }
    }

    for (const name of collectBareRouteMentions(sectionText)) {
      if (ROUTE_MENTION_ALLOWLIST.has(name)) {
        continue;
      }
      if (await routeMentionResolvesLocally(name)) {
        continue;
      }
      errors.push(
        `dangling route-target mention in "${heading}": \`${name}\` does not match a local skills/ or agents/ entry — fix the route or add it to ROUTE_MENTION_ALLOWLIST in scripts/validate-skill-library.mjs if it is intentionally non-local prose`,
      );
    }
  }
}

function extractHeadings(text) {
  return [...text.matchAll(/^## .+$/gm)].map((match) => match[0].trim());
}

async function validateAuthoringContractArtifacts(errors) {
  const template = await readFile(AUTHORING_TEMPLATE_PATH, "utf8");
  const templateHeadings = extractHeadings(template).filter((heading) =>
    TASK_HEADINGS.includes(heading),
  );

  if (templateHeadings.join("\n") !== TASK_HEADINGS.join("\n")) {
    errors.push(
      "skill template headings drift from scripts/skill-contract.mjs; update the canonical contract or template together",
    );
  }

  const importContract = await readFile(IMPORT_CONTRACT_PATH, "utf8");
  if (!importContract.includes("../scripts/skill-contract.mjs")) {
    errors.push(
      "import-rewrite-contract.md must point to scripts/skill-contract.mjs as the canonical section contract",
    );
  }
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

// fallow-ignore-next-line complexity
async function collectValidationOutput(files) {
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

  return { output: messages.join("\n"), hasFailure };
}

async function main() {
  const contractErrors = [];
  try {
    await validateAuthoringContractArtifacts(contractErrors);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    contractErrors.push(`unable to validate authoring contract artifacts: ${message}`);
  }

  if (contractErrors.length > 0) {
    console.error(contractErrors.map((error) => `FAIL ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  const files = await resolveSkillFiles(process.argv.slice(2));
  if (files.length === 0) {
    console.error("no SKILL.md files found");
    process.exitCode = 1;
    return;
  }

  const { output, hasFailure } = await collectValidationOutput(files);
  if (hasFailure) {
    console.error(output);
    process.exitCode = 1;
    return;
  }

  console.log(output);
}

await main();
