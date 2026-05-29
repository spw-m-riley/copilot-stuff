import { approveAll } from "@github/copilot-sdk";
import { joinSession as joinCopilotSession } from "@github/copilot-sdk/extension";
import { createHooks } from "./lib/core.mjs";

export {
  buildErrorPatternPayload,
  buildMemorySaveArgs,
  createHooks,
  detectRepository,
  persistErrorPattern,
  redactSensitiveText,
  truncate,
} from "./lib/core.mjs";

let activeSession;

export async function joinErrorLearnerSession(options = {}) {
  const hooks = createHooks({ ...options, getSession: () => activeSession });
  activeSession = await joinCopilotSession({
    onPermissionRequest: approveAll,
    hooks,
    tools: [],
  });
  return activeSession;
}

if (process.env.ERROR_LEARNER_SKIP_JOIN !== "1") {
  await joinErrorLearnerSession();
}
