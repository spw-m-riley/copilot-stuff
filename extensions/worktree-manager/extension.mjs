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

function parseWtWorktrees(stdout) {
  try {
    const parsed = JSON.parse(stdout);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function findWorktreePathByBranch(worktrees, branchName) {
  const entry = worktrees.find((worktree) => worktree?.branch === branchName);
  return entry?.path ?? null;
}

async function resolveWorktreePath(repoRoot, branchName, fallbackPath) {
  if (!(await checkWtAvailable())) {
    return fallbackPath;
  }

  const listResult = await run("wt", ["-C", repoRoot, "list", "--format=json"]);
  if (!listResult.ok) {
    return fallbackPath;
  }

  const listedPath = findWorktreePathByBranch(parseWtWorktrees(listResult.stdout), branchName);
  return listedPath || fallbackPath;
}

function formatCreatedMessage(worktreePath, branchName) {
  return `Created ${worktreePath} on branch ${branchName}`;
}

function parseWtCreatedPath(stdout) {
  try {
    const parsed = JSON.parse(stdout);
    return typeof parsed?.path === "string" ? parsed.path : null;
  } catch {
    return null;
  }
}

async function createWorktreeWithWt(root, branchName, baseRef) {
  const wtResult = await run("wt", [
    "-C",
    root,
    "switch",
    "--create",
    branchName,
    "--base",
    baseRef,
    "--format=json",
    "--no-cd",
  ]);
  if (!wtResult.ok) {
    return null;
  }

  return parseWtCreatedPath(wtResult.stdout);
}

async function createWorktreeWithGit(root, safeId, branchName, baseRef) {
  const worktreePath = path.join(root, ".worktrees", safeId);
  const result = await run("git", ["worktree", "add", worktreePath, "-b", branchName, baseRef], {
    cwd: root,
  });
  if (!result.ok) {
    return {
      error: result.stderr || result.stdout || `Failed to create worktree ${worktreePath}`,
    };
  }

  return { createdPath: worktreePath };
}

// fallow-ignore-next-line complexity
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
    const createdPath = await createWorktreeWithWt(repo.root, branchName, baseRef);
    if (createdPath) {
      return formatCreatedMessage(createdPath, branchName);
    }
  }

  const gitCreate = await createWorktreeWithGit(repo.root, safeId, branchName, baseRef);
  if (gitCreate.error) {
    return gitCreate.error;
  }
  return formatCreatedMessage(gitCreate.createdPath, branchName);
}

// fallow-ignore-next-line complexity
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
  const worktreePath = await resolveStatusWorktreePath(repo.root, agentId);
  const result = await run("git", ["status", "--short", "--branch"], { cwd: worktreePath });
  return result.ok ? result.stdout.trim() : result.stderr || "Failed to read worktree status.";
}

async function resolveStatusWorktreePath(repoRoot, agentId) {
  if (!agentId) {
    return repoRoot;
  }

  const safeAgentId = sanitizeAgentId(agentId);
  const branchName = `agent/${safeAgentId}`;
  const fallbackPath = path.join(repoRoot, ".worktrees", safeAgentId);
  return resolveWorktreePath(repoRoot, branchName, fallbackPath);
}

async function ensureCleanWorktree(worktreePath) {
  const status = await run("git", ["status", "--short"], { cwd: worktreePath });
  if (!status.ok) {
    return status.stderr || `Unable to inspect ${worktreePath}`;
  }
  if (status.stdout.trim()) {
    return `Refusing to remove dirty worktree ${worktreePath}`;
  }
  return null;
}

async function deleteBranchIfRequested(root, branchName, deleteBranch) {
  if (!deleteBranch) {
    return null;
  }
  const deleteResult = await run("git", ["branch", "-D", branchName], { cwd: root });
  if (deleteResult.ok) {
    return null;
  }
  return deleteResult.stderr || deleteResult.stdout;
}

function formatRemovedMessage(worktreePath, branchName, deleteBranch) {
  return `Removed ${worktreePath}${deleteBranch ? ` and deleted ${branchName}` : ""}`;
}

async function removeWithWt(root, branchName, worktreePath, deleteBranch) {
  const removeResult = await run("wt", ["-C", root, "remove", branchName, "--yes"]);
  if (!removeResult.ok) {
    return removeResult.stderr || `Failed to remove ${worktreePath}`;
  }

  await deleteBranchIfRequested(root, branchName, deleteBranch);
  return formatRemovedMessage(worktreePath, branchName, deleteBranch);
}

async function removeWithGit(root, branchName, worktreePath, deleteBranch) {
  const removeResult = await run("git", ["worktree", "remove", worktreePath], { cwd: root });
  if (!removeResult.ok) {
    return removeResult.stderr || `Failed to remove ${worktreePath}`;
  }

  const deleteError = await deleteBranchIfRequested(root, branchName, deleteBranch);
  if (deleteError) {
    return `Removed worktree ${worktreePath}, but failed to delete ${branchName}: ${deleteError}`;
  }

  return formatRemovedMessage(worktreePath, branchName, deleteBranch);
}

async function toolRemove({ agentId, deleteBranch = false }) {
  const repo = await ensureRepo();
  if (repo.error) {
    return repo.error;
  }
  const safeId = sanitizeAgentId(agentId);
  const branchName = `agent/${safeId}`;
  const fallbackPath = path.join(repo.root, ".worktrees", safeId);
  const wtOk = await checkWtAvailable();
  const worktreePath = await resolveWorktreePath(repo.root, branchName, fallbackPath);

  const dirtyError = await ensureCleanWorktree(worktreePath);
  if (dirtyError) {
    return dirtyError;
  }

  if (wtOk) {
    return removeWithWt(repo.root, branchName, worktreePath, deleteBranch);
  }

  return removeWithGit(repo.root, branchName, worktreePath, deleteBranch);
}

// fallow-ignore-next-line complexity
async function toolMerge({ agentId, target, noSquash = true, noRemove = false }) {
  const repo = await ensureRepo();
  if (repo.error) return repo.error;
  if (!(await checkWtAvailable())) return "wt is not installed; cannot use mr_worktree_merge.";
  const safeId = sanitizeAgentId(agentId);
  const branchName = `agent/${safeId}`;
  const fallbackPath = path.join(repo.root, ".worktrees", safeId);
  const worktreePath = await resolveWorktreePath(repo.root, branchName, fallbackPath);
  const args = buildMergeArgs(target, noSquash, noRemove);
  const result = await run("wt", args, { cwd: worktreePath });
  return result.ok ? result.stdout.trim() : result.stderr || "Merge failed.";
}

function buildMergeArgs(target, noSquash, noRemove) {
  const args = ["merge", "--format=json", "--yes"];
  if (target) {
    args.push(target);
  }
  if (noSquash) {
    args.push("--no-squash");
  }
  if (noRemove) {
    args.push("--no-remove");
  }
  return args;
}

async function maybeSetWtMarker(root) {
  if (!(await checkWtAvailable())) {
    return;
  }

  // Set activity marker (fire-and-forget, never block)
  run("wt", ["-C", root, "config", "state", "marker", "set", "🤖"]).catch(() => {});
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
    // fallow-ignore-next-line complexity
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
      await maybeSetWtMarker(root);
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
