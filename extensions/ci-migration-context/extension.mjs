import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";

const MIGRATION_PATTERN =
  /\b(circleci|circle ci|github actions|gha|workflow migration|ci migration)\b/i;

const MIGRATION_CONTEXT = `
When the user is working on CI migration or workflow debugging:
- inspect \`.circleci/config.yml\`, \`.github/workflows/\`, reusable workflows, and any shared composite actions
- compare triggers, filters, matrices, caches, artifacts, secrets, and permissions explicitly
- check for downstream Terraform, CloudFormation, deployment, or branch-protection follow-up work
- prefer existing workflow patterns and reusable workflows before inventing bespoke jobs
- if migrating from CircleCI to GitHub Actions, preserve behavior first and only then simplify
`.trim();

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onUserPromptSubmitted: async (input) => {
      if (!MIGRATION_PATTERN.test(input.prompt)) {
        return;
      }
      await session.log("Injecting CI migration context", { ephemeral: true });
      return { additionalContext: MIGRATION_CONTEXT };
    },
  },
  tools: [],
});
