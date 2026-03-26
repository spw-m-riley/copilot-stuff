import os from "node:os";
import path from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

function parseSimpleYaml(text) {
  const result = {};
  for (const line of String(text || "").split("\n")) {
    if (!line.includes(":")) {
      continue;
    }
    const [key, ...rest] = line.split(":");
    const normalizedKey = key.trim();
    if (!normalizedKey) {
      continue;
    }
    result[normalizedKey] = rest.join(":").trim();
  }
  return result;
}

export function resolveWorkspacePath(workspacePath, sessionId) {
  if (typeof workspacePath === "string" && workspacePath.length > 0) {
    return workspacePath;
  }
  return path.join(os.homedir(), ".copilot", "session-state", sessionId);
}

async function readJsonLines(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }
  const text = await readFile(filePath, "utf8");
  return text
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

export async function readWorkspaceContext(workspacePath) {
  const workspaceFile = path.join(workspacePath, "workspace.yaml");
  const eventsFile = path.join(workspacePath, "events.jsonl");

  const workspaceText = existsSync(workspaceFile) ? await readFile(workspaceFile, "utf8") : "";
  const events = await readJsonLines(eventsFile);

  return {
    workspace: workspaceText ? parseSimpleYaml(workspaceText) : null,
    events,
  };
}
