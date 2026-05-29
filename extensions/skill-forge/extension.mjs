import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SKILL_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
const SAFE_TEXT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 .,:;!?()[\]'"/_*-]*$/;
const SAFE_GLOB_PATTERN = /^[A-Za-z0-9*?{}[\],._!\-\/]+$/;
const SAFE_REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._\/-]*$/;
const MAX_SKILL_NAME_LENGTH = 64;
const MIN_SKILL_NAME_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 90;
const DEFAULT_REFERENCE = "copilot-instructions.md";

function pathExists(filePath) {
  return access(filePath)
    .then(() => true)
    .catch(() => false);
}

function markdownEscape(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("`", "\\`");
}

function yamlQuote(value) {
  return `"${String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function titleFromName(name) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function splitList(value) {
  return String(value ?? "")
    .split(/[\n;,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isUnsafePathLike(value) {
  return (
    value.includes("..") ||
    value.includes("//") ||
    value.includes("\\") ||
    path.isAbsolute(value) ||
    value.split("/").some((segment) => segment === "" || segment === "." || segment.startsWith("."))
  );
}

export function sanitizeSkillName(rawName) {
  const name = String(rawName ?? "").trim();
  if (
    !SKILL_NAME_PATTERN.test(name) ||
    name.length < MIN_SKILL_NAME_LENGTH ||
    name.length > MAX_SKILL_NAME_LENGTH ||
    isUnsafePathLike(name)
  ) {
    throw new Error(
      "Skill name must match /^[a-z][a-z0-9-]*$/ and be 3-64 characters with no path segments.",
    );
  }
  return name;
}

function validateSafeText(value, fieldName, { maxLength = 160, minLength = 1 } = {}) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  if (text.length < minLength) {
    throw new Error(`${fieldName} is required.`);
  }
  if (text.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  if (!SAFE_TEXT_PATTERN.test(text)) {
    throw new Error(`${fieldName} contains unsupported characters.`);
  }
  return text;
}

function validateDescription(rawDescription) {
  const description = validateSafeText(rawDescription, "Description", {
    minLength: 20,
    maxLength: MAX_DESCRIPTION_LENGTH,
  });
  const lower = description.toLowerCase();
  if (!lower.includes("when ") && !lower.includes("use when") && !lower.includes("use this")) {
    throw new Error('Description must include a trigger phrase such as "Use when".');
  }
  return description;
}

function sanitizeApplyTo(rawApplyTo) {
  const applyTo = String(rawApplyTo ?? "").trim();
  if (!applyTo) {
    return "";
  }
  if (applyTo.length > 120 || !SAFE_GLOB_PATTERN.test(applyTo) || isUnsafePathLike(applyTo)) {
    throw new Error("applyTo must be a safe relative glob without dot segments or path traversal.");
  }
  return applyTo;
}

function sanitizeUseCases(rawUseCases) {
  const useCases = splitList(rawUseCases).map((entry) =>
    validateSafeText(entry, "Use case", { minLength: 8, maxLength: 120 }),
  );
  if (useCases.length < 2 || useCases.length > 3) {
    throw new Error("Provide 2-3 use-cases.");
  }
  return useCases;
}

async function sanitizeReferenceFiles(rawReferenceFiles, { repoRoot, targetDir }) {
  const entries = splitList(rawReferenceFiles || DEFAULT_REFERENCE);
  const references = [];
  for (const entry of entries) {
    if (
      entry.length > 160 ||
      !SAFE_REFERENCE_PATTERN.test(entry) ||
      isUnsafePathLike(entry) ||
      entry.includes(":")
    ) {
      throw new Error(`Reference file is not a safe repo-relative path: ${entry}`);
    }

    const absolutePath = path.resolve(repoRoot, entry);
    const repoRootWithSep = `${path.resolve(repoRoot)}${path.sep}`;
    if (absolutePath !== path.resolve(repoRoot) && !absolutePath.startsWith(repoRootWithSep)) {
      throw new Error(`Reference file resolves outside the repository: ${entry}`);
    }
    if (!(await pathExists(absolutePath))) {
      throw new Error(`Reference file does not exist: ${entry}`);
    }

    references.push(path.relative(targetDir, absolutePath).replaceAll(path.sep, "/"));
  }

  if (references.length === 0) {
    throw new Error("At least one reference file is required.");
  }
  return [...new Set(references)];
}

export function validateSkillAnswers(answers) {
  const errors = [];
  const sanitized = {};

  for (const [key, fn] of [
    ["skillName", () => sanitizeSkillName(answers.skillName)],
    ["description", () => validateDescription(answers.description)],
    ["applyTo", () => sanitizeApplyTo(answers.applyTo)],
    ["useCases", () => sanitizeUseCases(answers.useCases)],
  ]) {
    try {
      sanitized[key] = fn();
    } catch (error) {
      errors.push(error.message);
    }
  }

  return { errors, sanitized };
}

export function buildSkillMarkdown(answers, { sanitizedName, references }) {
  const title = titleFromName(sanitizedName);
  const description = validateDescription(answers.description);
  const applyTo = sanitizeApplyTo(answers.applyTo);
  const useCases = sanitizeUseCases(answers.useCases);
  const referenceLines = references.map(
    (referencePath) => `- [\`${referencePath}\`](${referencePath}) - Local reference material for this skill.`,
  );

  return `---
name: ${sanitizedName}
description: ${yamlQuote(description)}
metadata:
  category: custom
  audience: general-coding-agent
  maturity: draft
  kind: task${applyTo ? `
  applyTo: ${yamlQuote(applyTo)}` : ""}
---

# ${title}

## Use this skill when

${useCases.map((entry) => `- ${markdownEscape(entry)}.`).join("\n")}

## Do not use this skill when

- The request is outside this skill's focused workflow.
- A more specific existing skill already covers the task.

## Routing boundary

| Situation | Use this skill? | Route instead |
| --- | --- | --- |
| The request matches the use-cases above | Yes | - |
| Another skill has a narrower trigger | No | Use the narrower skill |

## Inputs to gather

- The user's goal and expected output.
- Relevant repository paths, constraints, and validation commands.
- Any existing conventions that should shape the implementation.

## First move

1. Confirm the request matches this skill's routing boundary.
2. Inspect the relevant local files before proposing changes.
3. Choose the smallest safe validation loop for the work.

## Workflow

1. Map the current state and note relevant constraints.
2. Make the smallest coherent change that satisfies the request.
3. Validate with the repository's existing commands.
4. Report the changed files, validation, and any remaining risks.

## Outputs

- A focused implementation or handoff that matches the user's request.
- Validation evidence from existing tests, linters, builds, or targeted checks.
- Clear next steps when work is intentionally deferred or blocked.

## Guardrails

- Keep changes scoped to the requested workflow.
- Prefer existing project conventions and tools over new machinery.
- Do not write secrets, local-only paths, or session artifacts into shared files.

## Validation

- Run the smallest relevant existing validation command.
- If this skill changes, run \`node skills/skill-authoring/scripts/validate-skill-library.mjs skills/${sanitizedName}/SKILL.md\`.

## Examples

- "Use ${sanitizedName} to handle ${markdownEscape(useCases[0]).toLowerCase()}."
- "Apply ${sanitizedName} when ${markdownEscape(useCases[1]).toLowerCase()}."

## Reference files

${referenceLines.join("\n")}

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
`;
}

export async function createSkillFromAnswers(answers, { repoRoot = process.cwd() } = {}) {
  const sanitizedName = sanitizeSkillName(answers.skillName);
  const root = path.resolve(repoRoot);
  const skillsRoot = path.join(root, "skills");
  const targetDir = path.resolve(skillsRoot, sanitizedName);
  const targetRoot = `${path.resolve(skillsRoot)}${path.sep}`;

  if (!targetDir.startsWith(targetRoot)) {
    throw new Error("Refusing to create a skill outside skills/<name>.");
  }
  if (await pathExists(targetDir)) {
    throw new Error(`Skill already exists: ${sanitizedName}`);
  }

  const references = await sanitizeReferenceFiles(answers.referenceFiles, { repoRoot: root, targetDir });
  const markdown = buildSkillMarkdown(answers, { sanitizedName, references });
  await mkdir(skillsRoot, { recursive: true });
  await mkdir(targetDir, { recursive: false });
  const skillPath = path.join(targetDir, "SKILL.md");
  await writeFile(skillPath, markdown, { encoding: "utf8", flag: "wx" });

  return {
    path: skillPath,
    relativePath: path.relative(root, skillPath).replaceAll(path.sep, "/"),
    markdown,
  };
}

function contentFromElicitation(result) {
  if (result?.action !== "accept" || !result.content) {
    return null;
  }
  return result.content;
}

export function createSkillForgeCommand({ getSession, repoRoot = process.cwd() } = {}) {
  return {
    name: "skill-forge",
    description: "Scaffold a new SKILL.md with safe elicited inputs.",
    handler: async () => {
      const activeSession = getSession?.();
      if (!activeSession?.capabilities?.ui?.elicitation) {
        await activeSession?.log?.("skill-forge requires elicitation support in this CLI host.", {
          level: "error",
        });
        return;
      }

      let message = "Gather details for the new SKILL.md.";
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const result = await activeSession.ui.elicitation({
          message,
          requestedSchema: {
            type: "object",
            required: ["skillName", "description", "useCases", "referenceFiles"],
            properties: {
              skillName: {
                type: "string",
                title: "Skill name",
                description: "kebab-case, 3-64 chars, letters/numbers/hyphen only",
                minLength: MIN_SKILL_NAME_LENGTH,
                maxLength: MAX_SKILL_NAME_LENGTH,
              },
              description: {
                type: "string",
                title: "Short description",
                description: '90 chars max; include a trigger phrase such as "Use when"',
                minLength: 20,
                maxLength: MAX_DESCRIPTION_LENGTH,
              },
              applyTo: {
                type: "string",
                title: "applyTo glob",
                description: "Optional safe relative glob, stored in metadata.applyTo",
                maxLength: 120,
              },
              useCases: {
                type: "string",
                title: "Use-cases",
                description: "2-3 newline-separated use-cases",
                minLength: 16,
                maxLength: 360,
              },
              referenceFiles: {
                type: "string",
                title: "Reference files",
                description: "Newline-separated existing repo-relative paths; no dot segments",
                minLength: 1,
                maxLength: 480,
                default: DEFAULT_REFERENCE,
              },
            },
          },
        });

        const content = contentFromElicitation(result);
        if (!content) {
          await activeSession.log("skill-forge cancelled; no files created.", { level: "warning" });
          return;
        }

        const validation = validateSkillAnswers(content);
        if (validation.errors.length > 0) {
          message = `Please fix these skill-forge validation errors:\n- ${validation.errors.join("\n- ")}`;
          continue;
        }

        try {
          const created = await createSkillFromAnswers(content, { repoRoot });
          await activeSession.log(`skill-forge created ${created.relativePath}`, { level: "info" });
          return;
        } catch (error) {
          message = `Please fix this skill-forge error:\n- ${error.message}`;
        }
      }

      await activeSession.log("skill-forge stopped after 3 invalid attempts; no files created.", {
        level: "error",
      });
    },
  };
}

export async function joinSession(sdkJoinSession, { approveAll, repoRoot = process.cwd() } = {}) {
  let runtimeSession;
  const command = createSkillForgeCommand({
    repoRoot,
    getSession: () => runtimeSession,
  });
  runtimeSession = await sdkJoinSession({
    ...(approveAll ? { onPermissionRequest: approveAll } : {}),
    commands: [command],
  });
  return runtimeSession;
}

async function autoStart() {
  const [{ approveAll }, { joinSession: sdkJoinSession }] = await Promise.all([
    import("@github/copilot-sdk"),
    import("@github/copilot-sdk/extension"),
  ]);
  await joinSession(sdkJoinSession, { approveAll });
}

if (process.env.SKILL_FORGE_NO_AUTOSTART !== "1") {
  await autoStart();
}
