import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";

const ACTIONS_RUN_RE =
  /https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/actions\/runs\/(\d+)(?:\/job\/(\d+))?/gi;

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

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    // fallow-ignore-next-line complexity
    onUserPromptSubmitted: async (input) => {
      const prompt = typeof input?.prompt === "string" ? input.prompt.trim() : "";
      const targets = parseActionsTargets(prompt);
      if (!targets) {
        return;
      }

      await session.log("GitHub Actions URL detected", { ephemeral: true });
      return { additionalContext: buildParentContext(targets) };
    },
  },
  tools: [],
});
