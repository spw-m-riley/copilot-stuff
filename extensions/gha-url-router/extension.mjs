import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";

const ACTIONS_RUN_RE =
  /https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/actions\/runs\/(\d+)(?:\/job\/(\d+))?/gi;

function buildContext(prompt) {
  const matches = Array.from(prompt.matchAll(ACTIONS_RUN_RE));
  if (matches.length === 0) {
    return null;
  }

  const lines = [
    "GitHub Actions URL detected. Prefer the GitHub Actions tools over manual log scraping.",
  ];
  for (const [, owner, repo, runId, jobId] of matches) {
    lines.push(`- owner: ${owner}, repo: ${repo}, run_id: ${runId}${jobId ? `, job_id: ${jobId}` : ""}`);
  }
  lines.push("- For a run URL, inspect the workflow run, jobs, artifacts, and failed job logs.");
  lines.push("- For a job URL, inspect the specific job first, then fetch logs if needed.");
  lines.push("- Summarize the root cause before proposing changes.");
  return lines.join("\n");
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onUserPromptSubmitted: async (input) => {
      const additionalContext = buildContext(input.prompt);
      if (!additionalContext) {
        return;
      }
      await session.log("GitHub Actions URL detected", { ephemeral: true });
      return { additionalContext };
    },
  },
  tools: [],
});
