import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
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
            code: error?.code ?? 0,
            stdout: stdout ?? "",
            stderr: stderr ?? "",
          });
        },
      );
    });
  });
}

function sanitizeAgentId(agentId) {
  if (!/^[a-z0-9._-]+$/i.test(agentId)) {
    throw new Error("agentId must be filesystem-safe");
  }
  return agentId;
}

async function repoRoot(cwd) {
  const result = await run("git", ["rev-parse", "--show-toplevel"], { cwd });
  return result.ok ? result.stdout.trim() : null;
}

async function ensureRepo() {
  const cwd = lastKnownCwd || process.cwd();
  const root = await repoRoot(cwd);
  if (!root) {
    return { error: "Not inside a git repository." };
  }
  return { root };
}

async function branchExists(root, branchName) {
  const result = await run("git", ["show-ref", "--verify", "--quiet", `refs/heads/${branchName}`], {
    cwd: root,
  });
  return result.ok;
}

async function toolCreate({ agentId, baseRef = "origin/main" }) {
  const repo = await ensureRepo();
  if (repo.error) {
    return repo.error;
  }
  const safeId = sanitizeAgentId(agentId);
  const branchName = `agent/${safeId}`;
  const worktreePath = path.join(repo.root, ".worktrees", safeId);

  const exists = await branchExists(repo.root, branchName);
  if (exists) {
    return `Branch ${branchName} already exists.`;
  }

  const result = await run(
    "git",
    ["worktree", "add", worktreePath, "-b", branchName, baseRef],
    { cwd: repo.root },
  );
  if (!result.ok) {
    return result.stderr || result.stdout || `Failed to create worktree ${worktreePath}`;
  }
  return `Created ${worktreePath} on branch ${branchName}`;
}

async function toolList() {
  const repo = await ensureRepo();
  if (repo.error) {
    return repo.error;
  }
  const result = await run("git", ["worktree", "list", "--porcelain"], { cwd: repo.root });
  return result.ok ? result.stdout.trim() : result.stderr || "Failed to list worktrees.";
}

async function toolStatus({ agentId }) {
  const repo = await ensureRepo();
  if (repo.error) {
    return repo.error;
  }
  const worktreePath = agentId
    ? path.join(repo.root, ".worktrees", sanitizeAgentId(agentId))
    : repo.root;
  const result = await run("git", ["status", "--short", "--branch"], { cwd: worktreePath });
  return result.ok ? result.stdout.trim() : result.stderr || "Failed to read worktree status.";
}

async function toolRemove({ agentId, deleteBranch = false }) {
  const repo = await ensureRepo();
  if (repo.error) {
    return repo.error;
  }
  const safeId = sanitizeAgentId(agentId);
  const branchName = `agent/${safeId}`;
  const worktreePath = path.join(repo.root, ".worktrees", safeId);
  const status = await run("git", ["status", "--short"], { cwd: worktreePath });
  if (!status.ok) {
    return status.stderr || `Unable to inspect ${worktreePath}`;
  }
  if (status.stdout.trim()) {
    return `Refusing to remove dirty worktree ${worktreePath}`;
  }
  const removeResult = await run("git", ["worktree", "remove", worktreePath], { cwd: repo.root });
  if (!removeResult.ok) {
    return removeResult.stderr || `Failed to remove ${worktreePath}`;
  }
  if (deleteBranch) {
    const deleteResult = await run("git", ["branch", "-D", branchName], { cwd: repo.root });
    if (!deleteResult.ok) {
      return `Removed worktree ${worktreePath}, but failed to delete ${branchName}: ${deleteResult.stderr || deleteResult.stdout}`;
    }
  }
  return `Removed ${worktreePath}${deleteBranch ? ` and deleted ${branchName}` : ""}`;
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onSessionStart: async (input) => {
      lastKnownCwd = input.cwd || lastKnownCwd;
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
      name: "mr_worktree_create",
      description: "Create a git worktree at .worktrees/<agentId> using branch agent/<agentId>.",
      parameters: {
        type: "object",
        properties: {
          agentId: { type: "string", description: "Filesystem-safe worktree identifier." },
          baseRef: { type: "string", description: "Base ref to branch from." },
        },
        required: ["agentId"],
      },
      handler: toolCreate,
    },
    {
      name: "mr_worktree_list",
      description: "List git worktrees for the current repository.",
      parameters: {
        type: "object",
        properties: {},
      },
      handler: toolList,
    },
    {
      name: "mr_worktree_status",
      description: "Show git worktree status, optionally for one agent/<agentId> worktree.",
      parameters: {
        type: "object",
        properties: {
          agentId: { type: "string", description: "Optional agent id to inspect." },
        },
      },
      handler: toolStatus,
    },
    {
      name: "mr_worktree_remove",
      description:
        "Remove a clean agent/<agentId> worktree under .worktrees/ and optionally delete its branch.",
      parameters: {
        type: "object",
        properties: {
          agentId: { type: "string", description: "Agent id of the worktree to remove." },
          deleteBranch: {
            type: "boolean",
            description: "Delete the local branch after removing the worktree.",
          },
        },
        required: ["agentId"],
      },
      handler: toolRemove,
    },
  ],
});
