#!/usr/bin/env node

import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

export const REQUIRED_TOOLS = [
  {
    id: "git",
    command: "git",
    args: ["--version"],
    guidance: "Install Git and ensure `git` is on PATH.",
  },
  {
    id: "gh",
    command: "gh",
    args: ["--version"],
    guidance: "Install GitHub CLI and ensure `gh` is on PATH.",
  },
  {
    id: "node",
    command: "node",
    args: ["--version"],
    guidance: "Install Node.js and ensure `node` is on PATH.",
  },
  {
    id: "rtk",
    command: "rtk",
    args: ["--version"],
    guidance: "Install RTK and ensure `rtk` is on PATH in this workspace.",
  },
];

const HEALTH_CHECKS = [
  {
    id: "skill-library",
    label: "skill library validator",
    command: "node",
    args: ["skills/skill-authoring/scripts/validate-skill-library.mjs"],
    required: true,
    requiredPaths: ["skills/skill-authoring/scripts/validate-skill-library.mjs"],
    guidance:
      "Run `node skills/skill-authoring/scripts/validate-skill-library.mjs` and fix the reported skill issues.",
  },
  {
    id: "workflow-contracts",
    label: "workflow contracts validator",
    command: "node",
    args: [
      "skills/workflow-contracts/scripts/validate-contracts.mjs",
      "skills/workflow-contracts/assets/planner-handoff-v1.md",
      "skills/workflow-contracts/assets/review-outcome-v1.md",
      "skills/workflow-contracts/assets/execution-record-v1.md",
    ],
    required: true,
    requiredPaths: [
      "skills/workflow-contracts/scripts/validate-contracts.mjs",
      "skills/workflow-contracts/assets/planner-handoff-v1.md",
      "skills/workflow-contracts/assets/review-outcome-v1.md",
      "skills/workflow-contracts/assets/execution-record-v1.md",
    ],
    guidance:
      "Run `node skills/workflow-contracts/scripts/validate-contracts.mjs skills/workflow-contracts/assets/planner-handoff-v1.md skills/workflow-contracts/assets/review-outcome-v1.md skills/workflow-contracts/assets/execution-record-v1.md` and fix the reported contract issues.",
  },
  {
    id: "frontmatter",
    label: "frontmatter validator",
    command: "node",
    args: ["scripts/validate-frontmatter.mjs"],
    required: true,
    allowMissing: true,
    requiredPaths: ["scripts/validate-frontmatter.mjs"],
    guidance:
      "Run `node scripts/validate-frontmatter.mjs` and fix the reported frontmatter issues.",
    unavailableGuidance:
      "Optional validator is not available yet at `scripts/validate-frontmatter.mjs`.",
  },
];

function normalizeText(text) {
  return text.replace(/\r\n?/g, "\n").trim();
}

function summarizeOutput(stdout, stderr) {
  const combined = [stdout, stderr]
    .map((value) => normalizeText(value || ""))
    .filter(Boolean)
    .join("\n");

  if (!combined) {
    return "no output";
  }

  const [firstLine] = combined.split("\n");
  return firstLine.length > 160 ? `${firstLine.slice(0, 157)}...` : firstLine;
}

export async function defaultPathExists(targetPath) {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function defaultRunCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      resolve({
        ok: false,
        code: null,
        stdout,
        stderr: error.message,
      });
    });
    child.on("close", (code) => {
      resolve({
        ok: code === 0,
        code,
        stdout,
        stderr,
      });
    });
  });
}

async function checkTool(tool, repoRoot, runCommand) {
  const result = await runCommand(tool.command, tool.args, { cwd: repoRoot });
  if (result.ok) {
    return {
      id: tool.id,
      status: "ok",
      message: summarizeOutput(result.stdout, result.stderr),
    };
  }

  const detail =
    result.code === null ? "command not found or failed to start" : summarizeOutput(result.stdout, result.stderr);
  return {
    id: tool.id,
    status: "fail",
    message: detail,
    guidance: tool.guidance,
  };
}

async function checkRequiredPaths(check, repoRoot, pathExists) {
  const missingPaths = [];
  for (const relativePath of check.requiredPaths) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!(await pathExists(absolutePath))) {
      missingPaths.push(relativePath);
    }
  }
  return missingPaths;
}

async function checkValidator(check, context) {
  const { repoRoot, dependencyStatus, pathExists, runCommand } = context;
  const missingPaths = await checkRequiredPaths(check, repoRoot, pathExists);
  if (missingPaths.length > 0) {
    if (check.allowMissing) {
      return {
        id: check.id,
        status: "skipped",
        message: `optional validator unavailable (${missingPaths.join(", ")})`,
        guidance: check.unavailableGuidance,
      };
    }

    return {
      id: check.id,
      status: "fail",
      message: `required files missing (${missingPaths.join(", ")})`,
      guidance: check.guidance,
    };
  }

  if (dependencyStatus.get(check.command) !== "ok") {
    return {
      id: check.id,
      status: "skipped",
      message: `skipped because required tool \`${check.command}\` is unavailable`,
    };
  }

  const result = await runCommand(check.command, check.args, { cwd: repoRoot });
  if (result.ok) {
    return {
      id: check.id,
      status: "ok",
      message: summarizeOutput(result.stdout, result.stderr),
    };
  }

  return {
    id: check.id,
    status: "fail",
    message: summarizeOutput(result.stdout, result.stderr),
    guidance: check.guidance,
  };
}

function formatStatus(status) {
  switch (status) {
    case "ok":
      return "OK";
    case "fail":
      return "FAIL";
    case "skipped":
      return "SKIP";
    default:
      return status.toUpperCase();
  }
}

function formatSection(title, items) {
  const lines = [title];
  for (const item of items) {
    lines.push(`- [${formatStatus(item.status)}] ${item.id}: ${item.message}`);
    if (item.guidance) {
      lines.push(`  fix: ${item.guidance}`);
    }
  }
  return lines.join("\n");
}

export function formatHealthReport(result) {
  const sections = [
    `Repo health: ${result.repoRoot}`,
    formatSection("Dependencies", result.dependencies),
    formatSection("Checks", result.checks),
    `Summary\n- overall: ${result.ok ? "OK" : "FAIL"}\n- required failures: ${result.requiredFailureCount}`,
  ];

  const fixes = [...result.dependencies, ...result.checks]
    .filter((item) => item.status === "fail" && item.guidance)
    .map((item) => `- ${item.id}: ${item.guidance}`);
  if (fixes.length > 0) {
    sections.push(["Actionable fixes", ...fixes].join("\n"));
  }

  return `${sections.join("\n\n")}\n`;
}

export async function runHealthCheck({
  repoRoot = REPO_ROOT,
  runCommand = defaultRunCommand,
  pathExists = defaultPathExists,
} = {}) {
  const dependencies = [];
  const dependencyStatus = new Map();
  for (const tool of REQUIRED_TOOLS) {
    const result = await checkTool(tool, repoRoot, runCommand);
    dependencies.push(result);
    dependencyStatus.set(tool.id, result.status);
  }

  const checks = [];
  for (const check of HEALTH_CHECKS) {
    checks.push(
      await checkValidator(check, {
        repoRoot,
        dependencyStatus,
        pathExists,
        runCommand,
      }),
    );
  }

  const requiredFailureCount = dependencies.filter((item) => item.status === "fail").length +
    checks.filter((item) => item.status === "fail").length;

  return {
    ok: requiredFailureCount === 0,
    repoRoot,
    dependencies,
    checks,
    requiredFailureCount,
  };
}

export async function main() {
  const result = await runHealthCheck();
  process.stdout.write(formatHealthReport(result));
  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
