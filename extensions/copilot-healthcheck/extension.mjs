import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import { access } from "node:fs/promises";
import path from "node:path";

let lastKnownCwd = process.cwd();

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    import("node:child_process").then(({ execFile }) => {
      execFile(
        command,
        args,
        { maxBuffer: 1024 * 1024, ...options },
        (error, stdout, stderr) => {
          resolve({
            ok: !error,
            stdout: stdout ?? "",
            stderr: stderr ?? "",
          });
        },
      );
    });
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

async function commandStatus(command) {
  const shell = process.platform === "win32" ? "where" : "which";
  const result = await run(shell, [command]);
  return result.ok ? result.stdout.trim().split("\n")[0] : null;
}

async function repoStatus(cwd) {
  const result = await run("git", ["rev-parse", "--show-toplevel"], { cwd });
  if (!result.ok) {
    return null;
  }
  return result.stdout.trim();
}

async function collectCommandChecks() {
  const labels = ["git", "gh", "node", "jq"];
  const values = await Promise.all(labels.map((label) => commandStatus(label)));
  return labels.map((label, index) => [label, values[index] || "missing"]);
}

async function collectHomeChecks(home) {
  const checks = [
    ["copilot-instructions.md", "copilot-instructions.md"],
    ["lsp-config.json", "lsp-config.json"],
    ["extensions/", "extensions"],
  ];

  const existsResults = await Promise.all(
    checks.map(([, relativePath]) => pathExists(path.join(home, relativePath))),
  );

  return checks.map(([label], index) => [label, existsResults[index] ? "present" : "missing"]);
}

async function runHealthcheck() {
  const cwd = lastKnownCwd || process.cwd();
  const repoRoot = await repoStatus(cwd);
  const home = path.join(process.env.HOME || "", ".copilot");
  const commandChecks = await collectCommandChecks();
  const homeChecks = await collectHomeChecks(home);

  const checks = [
    ["cwd", cwd],
    ...commandChecks,
    ["repo", repoRoot || "not inside a git repository"],
    ...homeChecks,
  ];

  return checks.map(([label, value]) => `${label}: ${value}`).join("\n");
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onSessionStart: async (input) => {
      lastKnownCwd = input.cwd || lastKnownCwd;
      await session.log("copilot-healthcheck loaded", { ephemeral: true });
    },
    onUserPromptSubmitted: async (input) => {
      lastKnownCwd = input.cwd || lastKnownCwd;
    },
    onPreToolUse: async (input) => {
      lastKnownCwd = input.cwd || lastKnownCwd;
    },
  },
  tools: [
    {
      name: "mr_healthcheck_run",
      description:
        "Run a lightweight Copilot CLI environment healthcheck for the current working directory.",
      parameters: {
        type: "object",
        properties: {},
      },
      handler: runHealthcheck,
    },
  ],
});
