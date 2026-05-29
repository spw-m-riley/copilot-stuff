import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, unlinkSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

const extensionPath = new URL("../extension.mjs", import.meta.url);
const source = readFileSync(extensionPath, "utf8");

assert.match(source, /name:\s*"mr_worktree_commit_gate"/, "extension registers mr_worktree_commit_gate");
assert.match(source, /function formatActiveWorktreeContext/, "extension formats main-agent worktree context");
assert.match(source, /onSessionStart:[\s\S]*additionalContext/s, "onSessionStart injects additionalContext");
assert.match(source, /No assigned worktree found for agentId/, "commit gate reports missing assignments clearly");

function git(args, options = {}) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options }).trim();
}

function statusOutput(worktreePath) {
  return git(["status", "--short"], { cwd: worktreePath });
}

function commitGateOutput(worktreePath) {
  const status = statusOutput(worktreePath);
  return status ? `DIRTY: ${worktreePath}\n${status}` : `CLEAN: ${worktreePath}`;
}

const repoRoot = git(["rev-parse", "--show-toplevel"]);
const fixtureParent = path.join(repoRoot, ".worktrees");
const fixturePath = path.join(fixtureParent, "commit-gate-fixture-smoke");
const probePath = path.join(fixturePath, ".commit-gate-probe");

function cleanupFixture() {
  try {
    execFileSync("git", ["worktree", "remove", "--force", fixturePath], { stdio: "ignore" });
  } catch {}
  rmSync(fixturePath, { recursive: true, force: true });
  try {
    execFileSync("git", ["worktree", "prune"], { cwd: repoRoot, stdio: "ignore" });
  } catch {}
}

mkdirSync(fixtureParent, { recursive: true });
cleanupFixture();
git(["worktree", "add", "--detach", fixturePath, "HEAD"], { cwd: repoRoot });

try {
  assert.equal(commitGateOutput(fixturePath), `CLEAN: ${fixturePath}`);

  writeFileSync(probePath, "dirty\n", "utf8");
  const dirty = commitGateOutput(fixturePath);
  assert.match(dirty, new RegExp(`^DIRTY: ${fixturePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n`));
  assert.match(dirty, /\.commit-gate-probe/);

  if (existsSync(probePath)) {
    unlinkSync(probePath);
  }
  assert.equal(commitGateOutput(fixturePath), `CLEAN: ${fixturePath}`);
} finally {
  cleanupFixture();
}
