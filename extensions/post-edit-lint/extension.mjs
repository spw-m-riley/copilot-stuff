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
    execFile(
      command,
      args,
      { maxBuffer: 1024 * 1024, ...options },
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

async function findExecutable(names, startDir) {
  const candidates = Array.isArray(names) ? names : [names];
  const localBin = await findUp(startDir, (dir) => path.join(dir, "node_modules", ".bin"));
  const searchDirs = [];
  if (localBin) {
    searchDirs.push(localBin);
  }
  for (const segment of String(process.env.PATH || "").split(path.delimiter)) {
    if (segment) {
      searchDirs.push(segment);
    }
  }
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

function uniquePaths(paths) {
  return Array.from(new Set(paths.map((filePath) => path.resolve(filePath))));
}

function parsePathsFromPatch(patchText, cwd) {
  const matches = patchText.matchAll(/^\*\*\* (?:Add|Update) File: (.+)$/gm);
  return Array.from(matches, (match) => path.resolve(cwd, match[1]));
}

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

  if (typeof scripts.format === "string") {
    const result = await run(managerBin, managerArgs(manager, "format", [relativeFile]), {
      cwd: context.root,
    });
    results.push(formatSummary(`format (${relativeFile})`, result));
  }

  if (typeof scripts.lint === "string") {
    let lintResult = await run(managerBin, managerArgs(manager, "lint", [relativeFile]), {
      cwd: context.root,
    });
    if (!lintResult.ok) {
      if (typeof scripts["lint:fix"] === "string") {
        const fixResult = await run(
          managerBin,
          managerArgs(manager, "lint:fix", [relativeFile]),
          { cwd: context.root },
        );
        results.push(formatSummary(`lint:fix (${relativeFile})`, fixResult));
      } else {
        const fixResult = await run(
          managerBin,
          managerArgs(manager, "lint", [relativeFile], ["--fix"]),
          { cwd: context.root },
        );
        results.push(formatSummary(`lint --fix (${relativeFile})`, fixResult));
      }
      lintResult = await run(managerBin, managerArgs(manager, "lint", [relativeFile]), {
        cwd: context.root,
      });
    }
    results.push(formatSummary(`lint (${relativeFile})`, lintResult));
  }

  return results;
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
    const prettier = await findExecutable("prettier", path.dirname(filePath));
    if (prettier) {
      const result = await run(prettier, ["--write", filePath]);
      summaries.push(formatSummary(`prettier (${path.basename(filePath)})`, result));
    }
    const oxlint = await findExecutable("oxlint", path.dirname(filePath));
    if (oxlint) {
      const result = await run(oxlint, [filePath]);
      summaries.push(formatSummary(`oxlint (${path.basename(filePath)})`, result));
    }
    const eslint = await findExecutable("eslint", path.dirname(filePath));
    if (eslint) {
      let result = await run(eslint, [filePath]);
      if (!result.ok) {
        const fixResult = await run(eslint, ["--fix", filePath]);
        summaries.push(formatSummary(`eslint --fix (${path.basename(filePath)})`, fixResult));
        result = await run(eslint, [filePath]);
      }
      summaries.push(formatSummary(`eslint (${path.basename(filePath)})`, result));
    }
    const biome = await findExecutable("biome", path.dirname(filePath));
    if (biome) {
      const result = await run(biome, ["check", "--write", filePath]);
      summaries.push(formatSummary(`biome (${path.basename(filePath)})`, result));
    }
  }

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

async function processFile(filePath) {
  if (!(await pathExists(filePath))) {
    return [];
  }
  const extension = path.extname(filePath).toLowerCase();
  if (JS_TS_EXTENSIONS.has(extension)) {
    return formatJsTs(filePath);
  }
  if (extension === ".json") {
    return formatJson(filePath);
  }
  if (extension === ".yaml" || extension === ".yml") {
    return formatYaml(filePath);
  }
  if (extension === ".tf") {
    return formatTerraform(filePath);
  }
  if (extension === ".sh" || extension === ".bash" || extension === ".zsh") {
    return formatShell(filePath);
  }
  if (extension === MARKDOWN_EXTENSION) {
    return validateWorkflowContract(filePath);
  }
  return [];
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
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
