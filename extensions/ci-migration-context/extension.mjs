import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import {
  normalizePrompt,
  normalizeSessionId,
  readChildMetadata,
  setBoundedContext,
} from "../_shared/context-policy.mjs";

const MIGRATION_PATTERN =
  /\b(circleci|circle ci|github actions|gha|workflow migration|ci migration)\b/i;
const CLEARLY_UNRELATED_CHILD_PATTERN =
  /\b(config|configure|configuration|settings|healthcheck|health check|diagnostic|diagnostics|copilot-healthcheck)\b/i;
const MAX_ACTIVE_CONTEXTS = 64;

const MIGRATION_CONTEXT = `
When the user is working on CI migration or workflow debugging:
- inspect \`.circleci/config.yml\`, \`.github/workflows/\`, reusable workflows, and any shared composite actions
- compare triggers, filters, matrices, caches, artifacts, secrets, and permissions explicitly
- check for downstream Terraform, CloudFormation, deployment, or branch-protection follow-up work
- prefer existing workflow patterns and reusable workflows before inventing bespoke jobs
- if migrating from CircleCI to GitHub Actions, preserve behavior first and only then simplify
`.trim();

const activeContextBySession = new Map();

function clearSessionContext(sessionId) {
  if (!sessionId) {
    return;
  }
  activeContextBySession.delete(sessionId);
}

function setSessionContext(sessionId, context) {
  setBoundedContext(activeContextBySession, sessionId, context, MAX_ACTIVE_CONTEXTS, {
    refreshExisting: true,
  });
}

function getChildMetadataText(input) {
  return readChildMetadata(input);
}

function isClearlyUnrelatedChild(input) {
  const metadata = getChildMetadataText(input);
  return metadata.length > 0 && CLEARLY_UNRELATED_CHILD_PATTERN.test(metadata);
}

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onUserPromptSubmitted: async (input) => {
      const sessionId = normalizeSessionId(input.sessionId);
      const prompt = normalizePrompt(input.prompt);
      if (!MIGRATION_PATTERN.test(prompt)) {
        clearSessionContext(sessionId);
        return;
      }

      setSessionContext(sessionId, {
        kind: "ci-migration",
        matched: true,
        payload: MIGRATION_CONTEXT,
      });

      await session.log("Injecting CI migration context", { ephemeral: true });
      return { additionalContext: MIGRATION_CONTEXT };
    },
    onSubagentStart: async (input) => {
      const sessionId = normalizeSessionId(input.sessionId);
      if (!sessionId) {
        return;
      }

      const context = activeContextBySession.get(sessionId);
      if (!context?.matched) {
        return;
      }
      if (isClearlyUnrelatedChild(input)) {
        return;
      }

      await session.log("ci-migration-context: injected child context", {
        ephemeral: true,
      });
      return { additionalContext: context.payload };
    },
    onSessionEnd: async (input) => {
      clearSessionContext(normalizeSessionId(input.sessionId));
    },
  },
  tools: [],
});
