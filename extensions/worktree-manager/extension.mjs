import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import path from "node:path";

let lastKnownCwd = process.cwd();

const WORKTREE_CHILD_GUIDANCE = [
  "Worktree guidance for delegated implementation tasks:",
  "- When editing or implementing in a Git repository, prefer an isolated worktree per agent/task.",
  "- Create one with mr_worktree_create before making edits when needed, and keep changes inside that worktree.",
  "- Use mr_worktree_status/mr_worktree_list to confirm the right worktree before writing files.",
].join("\n");

const IMPLEMENTATION_CHILD_ALLOW_LIST = [
  "implement",
  "implementation",
  "code",
  "coding",
  "edit",
  "fix",
  "patch",
  "task",
  "execute",
  "execution",
  "build",
  "test",
  "debug",
];

const NON_IMPLEMENTATION_CHILD_DENY_LIST = [
  "research",
  "review",
  "reviewer",
  "plan",
  "planning",
  "explore",
  "config",
  "configure",
];

function childAgentMetadata(input) {
  return [input.agentName, input.agentDisplayName, input.agentDescription]
    .filter((value) => typeof value === "string" && value.trim())
    .join(" ")
    .toLowerCase();
}

function shouldInjectChildWorktreeGuidance(input) {
  const metadata = childAgentMetadata(input);
  if (!metadata) {
    return false;
  }

  const matchesDenyList = NON_IMPLEMENTATION_CHILD_DENY_LIST.some((keyword) =>
    metadata.includes(keyword),
  );
  if (matchesDenyList) {
    return false;
  }

  return IMPLEMENTATION_CHILD_ALLOW_LIST.some((keyword) => metadata.includes(keyword));
}

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

let _wtAvailable = null;
async function checkWtAvailable() {
  if (_wtAvailable !== null) return _wtAvailable;
  const result = await run("wt", ["--version"]);
  _wtAvailable = result.ok;
  return _wtAvailable;
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

  const exists = await branchExists(repo.root, branchName);
  if (exists) {
    return `Branch ${branchName} already exists.`;
  }

  if (await checkWtAvailable()) {
    const wtResult = await run("wt", ["-C", repo.root, "switch", "--create", branchName, "--base", baseRef, "--format=json", "--no-cd"]);
    if (wtResult.ok) {
      try {
        const parsed = JSON.parse(wtResult.stdout);
        if (parsed.path) {
          return `Created ${parsed.path} on branch ${branchName}`;
        }
      } catch {}
    }
  }

  // Fallback: raw git
  const worktreePath = path.join(repo.root, ".worktrees", safeId);
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
  if (await checkWtAvailable()) {
    const result = await run("wt", ["-C", repo.root, "list", "--format=json"]);
    if (result.ok) return result.stdout.trim();
  }
  const result = await run("git", ["worktree", "list", "--porcelain"], { cwd: repo.root });
  return result.ok ? result.stdout.trim() : result.stderr || "Failed to list worktrees.";
}

async function toolStatus({ agentId }) {
  const repo = await ensureRepo();
  if (repo.error) {
    return repo.error;
  }
  let worktreePath = agentId
    ? path.join(repo.root, ".worktrees", sanitizeAgentId(agentId))
    : repo.root;
  if (agentId && (await checkWtAvailable())) {
    const branchName = `agent/${sanitizeAgentId(agentId)}`;
    const listResult = await run("wt", ["-C", repo.root, "list", "--format=json"]);
    if (listResult.ok) {
      try {
        const worktrees = JSON.parse(listResult.stdout);
        const entry = worktrees.find(w => w.branch === branchName);
        if (entry?.path) worktreePath = entry.path;
      } catch {}
    }
  }
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
  let worktreePath = path.join(repo.root, ".worktrees", safeId);

  // Look up actual path via wt list before dirty-check so the guard runs against the correct path
  const wtOk = await checkWtAvailable();
  if (wtOk) {
    const listResult = await run("wt", ["-C", repo.root, "list", "--format=json"]);
    if (listResult.ok) {
      try {
        const worktrees = JSON.parse(listResult.stdout);
        const entry = worktrees.find(w => w.branch === branchName);
        if (entry?.path) worktreePath = entry.path;
      } catch {}
    }
  }

  // Dirty-check guard — must run before any removal attempt
  const status = await run("git", ["status", "--short"], { cwd: worktreePath });
  if (!status.ok) {
    return status.stderr || `Unable to inspect ${worktreePath}`;
  }
  if (status.stdout.trim()) {
    return `Refusing to remove dirty worktree ${worktreePath}`;
  }

  if (wtOk) {
    const removeResult = await run("wt", ["-C", repo.root, "remove", branchName, "--yes"]);
    if (!removeResult.ok) {
      return removeResult.stderr || `Failed to remove ${worktreePath}`;
    }
    if (deleteBranch) {
      await run("git", ["branch", "-D", branchName], { cwd: repo.root });
    }
    return `Removed ${worktreePath}${deleteBranch ? ` and deleted ${branchName}` : ""}`;
  }

  // Fallback: raw git
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

async function toolMerge({ agentId, target, noSquash = true, noRemove = false }) {
  const repo = await ensureRepo();
  if (repo.error) return repo.error;
  if (!(await checkWtAvailable())) return "wt is not installed; cannot use mr_worktree_merge.";
  const safeId = sanitizeAgentId(agentId);
  const branchName = `agent/${safeId}`;
  // Look up actual worktree path
  let worktreePath = path.join(repo.root, ".worktrees", safeId);
  const listResult = await run("wt", ["-C", repo.root, "list", "--format=json"]);
  if (listResult.ok) {
    try {
      const worktrees = JSON.parse(listResult.stdout);
      const entry = worktrees.find(w => w.branch === branchName);
      if (entry?.path) worktreePath = entry.path;
    } catch {}
  }
  const args = ["merge", "--format=json", "--yes"];
  if (target) args.push(target);
  if (noSquash) args.push("--no-squash");
  if (noRemove) args.push("--no-remove");
  const result = await run("wt", args, { cwd: worktreePath });
  return result.ok ? result.stdout.trim() : result.stderr || "Merge failed.";
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
    onSubagentStart: async (input) => {
      lastKnownCwd = input.cwd || lastKnownCwd;
      if (!shouldInjectChildWorktreeGuidance(input)) {
        return;
      }

      const cwd = input.cwd || lastKnownCwd || process.cwd();
      const root = await repoRoot(cwd);
      if (!root) {
        return;
      }

      await session.log("worktree-manager: injected child guidance", { ephemeral: true });
      if (await checkWtAvailable()) {
        // Set activity marker (fire-and-forget, never block)
        run("wt", ["-C", root, "config", "state", "marker", "set", "🤖"]).catch(() => {});
      }
      return { additionalContext: WORKTREE_CHILD_GUIDANCE };
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
    {
      name: "mr_worktree_merge",
      description:
        "Merge a worktree branch into the target via wt merge: rebase, run pre-merge hooks (tests/lint), fast-forward merge, then remove the worktree. Requires wt to be installed. Defaults to --no-squash to avoid needing commit.generation config; pass noSquash: false to enable squashing (requires [commit.generation] in ~/.config/worktrunk/config.toml or merge may hang).",
      parameters: {
        type: "object",
        properties: {
          agentId:  { type: "string",  description: "Agent id of the worktree to merge from." },
          target:   { type: "string",  description: "Target branch. Defaults to repository default branch." },
          noSquash: { type: "boolean", description: "Preserve commit history. Defaults to true (safe default when commit.generation is not configured)." },
          noRemove: { type: "boolean", description: "Keep worktree after merge." },
        },
        required: ["agentId"],
      },
      handler: toolMerge,
    },
  ],
});
