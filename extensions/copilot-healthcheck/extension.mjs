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
      handler: async () => {
        const cwd = lastKnownCwd || process.cwd();
        const repoRoot = await repoStatus(cwd);
        const home = path.join(process.env.HOME || "", ".copilot");
        const checks = [
          ["cwd", cwd],
          ["git", (await commandStatus("git")) || "missing"],
          ["gh", (await commandStatus("gh")) || "missing"],
          ["node", (await commandStatus("node")) || "missing"],
          ["jq", (await commandStatus("jq")) || "missing"],
          ["repo", repoRoot || "not inside a git repository"],
          [
            "copilot-instructions.md",
            (await pathExists(path.join(home, "copilot-instructions.md"))) ? "present" : "missing",
          ],
          ["lsp-config.json", (await pathExists(path.join(home, "lsp-config.json"))) ? "present" : "missing"],
          ["extensions/", (await pathExists(path.join(home, "extensions"))) ? "present" : "missing"],
        ];

        return checks.map(([label, value]) => `${label}: ${value}`).join("\n");
      },
    },
  ],
});
