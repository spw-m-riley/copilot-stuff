import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import {
  normalizePrompt,
  normalizeSessionId,
  readChildMetadata,
  setBoundedContext,
} from "../_shared/context-policy.mjs";

const ACTIONS_RUN_RE =
  /https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/actions\/runs\/(\d+)(?:\/job\/(\d+))?/gi;

const MAX_ACTIVE_SESSIONS = 128;
const activeContextBySession = new Map();
const CHILD_CONTEXT_SKIP_KEYWORDS = [
  "config",
  "configure",
  "configuration",
  "healthcheck",
  "copilot-healthcheck",
];

function parseActionsTargets(prompt) {
  const matches = Array.from(prompt.matchAll(new RegExp(ACTIONS_RUN_RE.source, "gi")));
  if (matches.length === 0) {
    return null;
  }

  return matches.map(([, owner, repo, runId, jobId]) => ({
    owner,
    repo,
    runId,
    jobId: jobId ?? null,
  }));
}

function buildContext(targets, heading) {
  const lines = [heading];
  for (const target of targets) {
    const { owner, repo, runId, jobId } = target;
    lines.push(`- owner: ${owner}, repo: ${repo}, run_id: ${runId}${jobId ? `, job_id: ${jobId}` : ""}`);
  }
  lines.push("- For a run URL, inspect the workflow run, jobs, artifacts, and failed job logs.");
  lines.push("- For a job URL, inspect the specific job first, then fetch logs if needed.");
  lines.push("- Summarize the root cause before proposing changes.");
  return lines.join("\n");
}

function buildParentContext(targets) {
  return buildContext(
    targets,
    "GitHub Actions URL detected. Prefer the GitHub Actions tools over manual log scraping.",
  );
}

function buildChildContext(targets) {
  return buildContext(
    targets,
    "Parent prompt already parsed GitHub Actions run/job URLs. Start from this routing data.",
  );
}

function setActiveContext(sessionId, targets) {
  setBoundedContext(activeContextBySession, sessionId, { targets }, MAX_ACTIVE_SESSIONS);
}

function isClearlyUnrelatedSubagent(input) {
  const metadata = readChildMetadata(input);
  if (!metadata) {
    return false;
  }
  return CHILD_CONTEXT_SKIP_KEYWORDS.some((keyword) => metadata.includes(keyword));
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onUserPromptSubmitted: async (input) => {
      const sessionId = normalizeSessionId(input?.sessionId);
      const prompt = normalizePrompt(input?.prompt);
      const targets = parseActionsTargets(prompt);
      if (!targets) {
        if (sessionId) {
          activeContextBySession.delete(sessionId);
        }
        return;
      }

      if (sessionId) {
        setActiveContext(sessionId, targets);
      }

      await session.log("GitHub Actions URL detected", { ephemeral: true });
      return { additionalContext: buildParentContext(targets) };
    },
    onSubagentStart: async (input) => {
      const sessionId = normalizeSessionId(input?.sessionId);
      if (!sessionId) {
        return;
      }

      const activeContext = activeContextBySession.get(sessionId);
      if (!activeContext) {
        return;
      }
      if (isClearlyUnrelatedSubagent(input)) {
        return;
      }

      await session.log("gha-url-router: injected child context", { ephemeral: true });
      return { additionalContext: buildChildContext(activeContext.targets) };
    },
    onSessionEnd: async (input) => {
      const sessionId = normalizeSessionId(input?.sessionId);
      if (!sessionId) {
        return;
      }
      activeContextBySession.delete(sessionId);
    },
  },
  tools: [],
});
