import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createValidatorRegistry } from "./lib/validator-registry.mjs";

const EDIT_TOOLS = new Set(["apply_patch", "edit", "create"]);
const JS_TS_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
]);

const TEXT_EXTENSIONS = new Set([
  ".json",
  ".yaml",
  ".yml",
  ".tf",
  ".sh",
  ".bash",
  ".zsh",
]);

const MARKDOWN_EXTENSION = ".md";
const WORKFLOW_CONTRACT_ASSETS_SEGMENT = `${path.sep}skills${path.sep}workflow-contracts${path.sep}assets${path.sep}`;
const SESSION_STATE_SEGMENT = `${path.sep}session-state${path.sep}`;
const validatorRegistry = createValidatorRegistry();

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    // fallow-ignore-next-line complexity
    execFile(
      command,
      args,
      { maxBuffer: 1024 * 1024, ...options },
      // fallow-ignore-next-line complexity
      (error, stdout, stderr) => {
        resolve({
          ok: !error,
          code: error?.code ?? 0,
          stdout: stdout ?? "",
          stderr: stderr ?? "",
        });
      },
    );
  });
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findUp(startPath, matcher) {
  let current = path.resolve(startPath);
  while (true) {
    const candidate = matcher(current);
    if (await pathExists(candidate)) {
      return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

async function findPackageContext(filePath) {
  const packageJsonPath = await findUp(path.dirname(filePath), (dir) =>
    path.join(dir, "package.json"),
  );
  if (!packageJsonPath) {
    return null;
  }
  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    return {
      root: path.dirname(packageJsonPath),
      packageJson,
    };
  } catch {
    return null;
  }
}

// fallow-ignore-next-line complexity
async function findExecutable(names, startDir) {
  const candidates = Array.isArray(names) ? names : [names];
  const searchDirs = await buildExecutableSearchDirs(startDir);
  for (const dir of searchDirs) {
    for (const name of candidates) {
      const candidate = path.join(dir, name);
      if (await pathExists(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

async function buildExecutableSearchDirs(startDir) {
  const localBin = await findUp(startDir, (dir) => path.join(dir, "node_modules", ".bin"));
  const pathDirs = String(process.env.PATH || "")
    .split(path.delimiter)
    .filter(Boolean);
  return localBin ? [localBin, ...pathDirs] : pathDirs;
}

function uniquePaths(paths) {
  return Array.from(new Set(paths.map((filePath) => path.resolve(filePath))));
}

function parsePathsFromPatch(patchText, cwd) {
  const matches = patchText.matchAll(/^\*\*\* (?:Add|Update) File: (.+)$/gm);
  return Array.from(matches, (match) => path.resolve(cwd, match[1]));
}

// fallow-ignore-next-line complexity
function extractChangedPaths(input) {
  const args = input.toolArgs ?? {};
  const paths = [];
  if (typeof args.path === "string") {
    paths.push(path.resolve(input.cwd, args.path));
  }
  if (typeof args.patch === "string") {
    paths.push(...parsePathsFromPatch(args.patch, input.cwd));
  }
  if (typeof args.diff === "string") {
    paths.push(...parsePathsFromPatch(args.diff, input.cwd));
  }
  if (typeof args.contents === "string") {
    paths.push(...parsePathsFromPatch(args.contents, input.cwd));
  }
  return uniquePaths(paths);
}

function formatSummary(label, result) {
  const output = (result.stderr || result.stdout || "").trim().split("\n").slice(0, 8).join("\n");
  if (result.ok) {
    return `- ${label}: ok`;
  }
  return `- ${label}: failed\n${output}`;
}

function managerArgs(manager, script, files, extraArgs = []) {
  if (manager === "yarn") {
    return [script, ...files, ...extraArgs];
  }
  return ["run", "--silent", script, "--", ...files, ...extraArgs];
}

async function runPackageScript(managerBin, manager, scriptName, relativeFile, cwd) {
  return run(managerBin, managerArgs(manager, scriptName, [relativeFile]), { cwd });
}

async function runLintWithFix(managerBin, manager, scripts, relativeFile, cwd, results) {
  let lintResult = await runPackageScript(managerBin, manager, "lint", relativeFile, cwd);
  if (lintResult.ok) {
    return lintResult;
  }

  if (typeof scripts["lint:fix"] === "string") {
    const fixResult = await runPackageScript(managerBin, manager, "lint:fix", relativeFile, cwd);
    results.push(formatSummary(`lint:fix (${relativeFile})`, fixResult));
  } else {
    const fixResult = await run(
      managerBin,
      managerArgs(manager, "lint", [relativeFile], ["--fix"]),
      { cwd },
    );
    results.push(formatSummary(`lint --fix (${relativeFile})`, fixResult));
  }

  lintResult = await runPackageScript(managerBin, manager, "lint", relativeFile, cwd);
  return lintResult;
}

// fallow-ignore-next-line complexity
async function runPackageScripts(filePath) {
  const context = await findPackageContext(filePath);
  if (!context) {
    return [];
  }
  const scripts = context.packageJson?.scripts ?? {};
  const relativeFile = path.relative(context.root, filePath);
  const results = [];
  const manager = (await pathExists(path.join(context.root, "yarn.lock"))) ? "yarn" : "npm";
  const managerBin = await findExecutable(manager, context.root);
  if (!managerBin) {
    return results;
  }

  await runFormatScriptIfPresent(scripts, managerBin, manager, relativeFile, context.root, results);
  await runLintScriptIfPresent(scripts, managerBin, manager, relativeFile, context.root, results);

  return results;
}

async function runFormatScriptIfPresent(
  scripts,
  managerBin,
  manager,
  relativeFile,
  cwd,
  results,
) {
  if (typeof scripts.format !== "string") {
    return;
  }

  const result = await runPackageScript(managerBin, manager, "format", relativeFile, cwd);
  results.push(formatSummary(`format (${relativeFile})`, result));
}

async function runLintScriptIfPresent(
  scripts,
  managerBin,
  manager,
  relativeFile,
  cwd,
  results,
) {
  if (typeof scripts.lint !== "string") {
    return;
  }

  const lintResult = await runLintWithFix(
    managerBin,
    manager,
    scripts,
    relativeFile,
    cwd,
    results,
  );
  results.push(formatSummary(`lint (${relativeFile})`, lintResult));
}

async function formatJson(filePath) {
  const jq = await findExecutable("jq", path.dirname(filePath));
  if (!jq) {
    return [];
  }
  const result = await run(jq, [".", filePath]);
  if (result.ok) {
    await writeFile(filePath, `${result.stdout.trimEnd()}\n`);
  }
  return [formatSummary(`jq (${path.basename(filePath)})`, result)];
}

async function formatYaml(filePath) {
  const summaries = [];
  const yq = await findExecutable("yq", path.dirname(filePath));
  if (yq) {
    const result = await run(yq, ["-P", "-i", ".", filePath]);
    summaries.push(formatSummary(`yq (${path.basename(filePath)})`, result));
  }
  const yamllint = await findExecutable("yamllint", path.dirname(filePath));
  if (yamllint) {
    const result = await run(yamllint, [filePath]);
    summaries.push(formatSummary(`yamllint (${path.basename(filePath)})`, result));
  }
  return summaries;
}

async function formatTerraform(filePath) {
  const summaries = [];
  const terraform = await findExecutable("terraform", path.dirname(filePath));
  if (terraform) {
    const result = await run(terraform, ["fmt", filePath], {
      cwd: path.dirname(filePath),
    });
    summaries.push(formatSummary(`terraform fmt (${path.basename(filePath)})`, result));
  }
  const tflint = await findExecutable("tflint", path.dirname(filePath));
  if (tflint) {
    const result = await run(tflint, ["--chdir", path.dirname(filePath)], {
      cwd: path.dirname(filePath),
    });
    summaries.push(formatSummary(`tflint (${path.basename(filePath)})`, result));
  }
  return summaries;
}

async function formatShell(filePath) {
  const summaries = [];
  const shfmt = await findExecutable("shfmt", path.dirname(filePath));
  if (shfmt) {
    const result = await run(shfmt, ["-w", filePath]);
    summaries.push(formatSummary(`shfmt (${path.basename(filePath)})`, result));
  }
  const shellcheck = await findExecutable("shellcheck", path.dirname(filePath));
  if (shellcheck) {
    const result = await run(shellcheck, [filePath]);
    summaries.push(formatSummary(`shellcheck (${path.basename(filePath)})`, result));
  } else {
    const result = await run("bash", ["-n", filePath]);
    summaries.push(formatSummary(`bash -n (${path.basename(filePath)})`, result));
  }
  return summaries;
}

async function formatJsTs(filePath) {
  const summaries = [];
  const packageResults = await runPackageScripts(filePath);
  summaries.push(...packageResults);

  if (packageResults.length === 0) {
    summaries.push(...(await runFallbackJsTools(filePath)));
  }

  return summaries;
}

async function runFallbackJsTools(filePath) {
  const summaries = [];
  const fileName = path.basename(filePath);
  const directory = path.dirname(filePath);

  const prettier = await findExecutable("prettier", directory);
  if (prettier) {
    const result = await run(prettier, ["--write", filePath]);
    summaries.push(formatSummary(`prettier (${fileName})`, result));
  }

  const oxlint = await findExecutable("oxlint", directory);
  if (oxlint) {
    const result = await run(oxlint, [filePath]);
    summaries.push(formatSummary(`oxlint (${fileName})`, result));
  }

  summaries.push(...(await runEslintFallback(filePath, directory, fileName)));

  const biome = await findExecutable("biome", directory);
  if (biome) {
    const result = await run(biome, ["check", "--write", filePath]);
    summaries.push(formatSummary(`biome (${fileName})`, result));
  }

  return summaries;
}

async function runEslintFallback(filePath, directory, fileName) {
  const eslint = await findExecutable("eslint", directory);
  if (!eslint) {
    return [];
  }

  let result = await run(eslint, [filePath]);
  const summaries = [];
  if (!result.ok) {
    const fixResult = await run(eslint, ["--fix", filePath]);
    summaries.push(formatSummary(`eslint --fix (${fileName})`, fixResult));
    result = await run(eslint, [filePath]);
  }
  summaries.push(formatSummary(`eslint (${fileName})`, result));
  return summaries;
}

async function findWorkflowContractValidator(filePath) {
  return findUp(path.dirname(filePath), (dir) =>
    path.join(dir, "skills", "workflow-contracts", "scripts", "validate-contracts.mjs"),
  );
}

async function shouldValidateWorkflowContract(filePath) {
  const normalizedPath = path.resolve(filePath);
  if (normalizedPath.includes(WORKFLOW_CONTRACT_ASSETS_SEGMENT)) {
    return true;
  }
  if (!normalizedPath.includes(SESSION_STATE_SEGMENT)) {
    return false;
  }

  const text = await readFile(filePath, "utf8");
  const normalizedText = text.replace(/\r\n?/g, "\n");
  return normalizedText.startsWith("---\n") && normalizedText.includes("\ncontract_type:");
}

async function validateWorkflowContract(filePath) {
  if (!(await shouldValidateWorkflowContract(filePath))) {
    return [];
  }

  const validatorPath = await findWorkflowContractValidator(filePath);
  if (!validatorPath) {
    return [];
  }

  const result = await run(process.execPath, [validatorPath, filePath], {
    cwd: path.dirname(validatorPath),
  });
  return [formatSummary(`workflow-contract (${path.basename(filePath)})`, result)];
}

const FILE_PROCESSORS = {
  ".json": formatJson,
  ".yaml": formatYaml,
  ".yml": formatYaml,
  ".tf": formatTerraform,
  ".sh": formatShell,
  ".bash": formatShell,
  ".zsh": formatShell,
  [MARKDOWN_EXTENSION]: validateWorkflowContract,
};

async function processFile(filePath) {
  if (!(await pathExists(filePath))) {
    return [];
  }

  const extension = path.extname(filePath).toLowerCase();
  if (JS_TS_EXTENSIONS.has(extension)) {
    return formatJsTs(filePath);
  }

  const processor = FILE_PROCESSORS[extension];
  if (processor) {
    return processor(filePath);
  }

  return [];
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    // fallow-ignore-next-line complexity
    onPostToolUse: async (input) => {
      if (!EDIT_TOOLS.has(input.toolName)) {
        return;
      }

      const changedFiles = extractChangedPaths(input).filter((filePath) => {
        const extension = path.extname(filePath).toLowerCase();
        return (
          JS_TS_EXTENSIONS.has(extension) ||
          TEXT_EXTENSIONS.has(extension) ||
          extension === MARKDOWN_EXTENSION
        );
      });

      if (changedFiles.length === 0) {
        return;
      }

      const summaries = [];
      for (const filePath of changedFiles) {
        summaries.push(...(await processFile(filePath)));
      }

      summaries.push(...(await validatorRegistry.validate(changedFiles, { findUp, formatSummary, run })));

      if (summaries.length === 0) {
        return;
      }

      await session.log(`post-edit-lint checked ${changedFiles.length} file(s)`, {
        ephemeral: true,
      });

      return {
        additionalContext: `post-edit-lint results:\n${summaries.join("\n")}\nIf any lint or validation step still failed, fix the remaining issues before finishing.`,
      };
    },
  },
  tools: [],
});
