import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

function normalizePrompt(prompt) {
  return typeof prompt === "string" ? prompt.trim() : "";
}

function isResearchPrompt(prompt) {
  return (
    prompt.startsWith("<research_task>") ||
    /^\/research(?:\s|$)/u.test(prompt)
  );
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function stripJsonComments(raw) {
  const input = typeof raw === "string" ? raw.replace(/^\uFEFF/u, "") : "";
  let result = "";
  let inString = false;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    const next = input[index + 1];

    if (lineComment) {
      if (char === "\n" || char === "\r") {
        lineComment = false;
        result += char;
      }
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index++;
        continue;
      }
      if (char === "\n" || char === "\r") {
        result += char;
      }
      continue;
    }

    if (inString) {
      result += char;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      result += char;
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      index++;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      index++;
      continue;
    }

    result += char;
  }

  return result;
}

function parseConfigFile(raw, configPath) {
  try {
    return JSON.parse(stripJsonComments(raw));
  } catch (cause) {
    throw new Error(
      `Failed to parse "${configPath}": ${getErrorMessage(cause)}`,
      { cause },
    );
  }
}

function updateSelectionFromParsedConfig(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return;
  }

  if (!selection.modelId && typeof parsed.model === "string") {
    selection.modelId = parsed.model;
  }
  if (
    !selection.reasoningEffort &&
    typeof parsed.effortLevel === "string"
  ) {
    selection.reasoningEffort = parsed.effortLevel;
  } else if (
    !selection.reasoningEffort &&
    typeof parsed.reasoning_effort === "string"
  ) {
    selection.reasoningEffort = parsed.reasoning_effort;
  }
}

function updateSelectionFromEvent(selection, event) {
  if (!event || typeof event !== "object" || typeof event.type !== "string") {
    return;
  }

  if (event.type === "session.start" || event.type === "session.resume") {
    if (typeof event.data?.selectedModel === "string") {
      selection.modelId = event.data.selectedModel;
    }
    if (typeof event.data?.reasoningEffort === "string") {
      selection.reasoningEffort = event.data.reasoningEffort;
    }
    return;
  }

  if (event.type === "session.model_change") {
    if (typeof event.data?.newModel === "string") {
      selection.modelId = event.data.newModel;
    }
    if (typeof event.data?.reasoningEffort === "string") {
      selection.reasoningEffort = event.data.reasoningEffort;
    }
  }
}

function formatSelection(selection) {
  if (!selection.modelId) {
    return "the current foreground session selection";
  }

  return selection.reasoningEffort
    ? `${selection.modelId} (${selection.reasoningEffort})`
    : selection.modelId;
}

function buildResearchPolicy(selection) {
  return [
    "Research model policy:",
    `- For /research turns, use ${formatSelection(selection)} for this turn.`,
    "- Keep /research on the active foreground session selection unless the user explicitly asks for a different model, agent, or reasoning effort.",
    "- Do not switch /research onto a pinned built-in research model just because the bundled research definition names one.",
  ].join("\n");
}

const selection = {
  modelId: undefined,
  reasoningEffort: undefined,
  hydratePromise: undefined,
};

const session = await joinSession({
  onPermissionRequest: approveAll,
  hooks: {
    onUserPromptSubmitted: async (input) => {
      const prompt = normalizePrompt(input.prompt);
      if (!prompt || !isResearchPrompt(prompt)) {
        return;
      }

      try {
        await hydrateSelection();
        if (!selection.modelId) {
          throw new Error(
            "No current foreground model is available to mirror for /research.",
          );
        }

        await session.rpc.model.switchTo({
          modelId: selection.modelId,
          ...(selection.reasoningEffort
            ? { reasoningEffort: selection.reasoningEffort }
            : {}),
        });

        await session.log(
          `Research model mirrored: ${formatSelection(selection)}`,
          { ephemeral: true },
        );
      } catch (error) {
        await session.log(
          `Research model policy could not mirror the current selection: ${getErrorMessage(error)}`,
          { level: "warning", ephemeral: true },
        );
      }

      return { additionalContext: buildResearchPolicy(selection) };
    },
  },
});

session.on((event) => {
  updateSelectionFromEvent(selection, event);
});

async function hydrateSelectionFromHistory() {
  const events = await session.getMessages();
  for (const event of events) {
    updateSelectionFromEvent(selection, event);
  }
}

async function hydrateSelectionFromRuntime() {
  const { modelId } = await session.rpc.model.getCurrent();
  if (typeof modelId === "string" && modelId.length > 0) {
    selection.modelId = modelId;
  }
}

async function hydrateSelectionFromConfig() {
  const configDir = path.join(os.homedir(), ".copilot");
  const candidatePaths = [
    path.join(configDir, "settings.json"),
    path.join(configDir, "config.json"),
  ];
  let lastError;

  for (const configPath of candidatePaths) {
    let raw;
    try {
      raw = await readFile(configPath, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") {
        continue;
      }
      lastError = error;
      continue;
    }

    const parsed = parseConfigFile(raw, configPath);
    updateSelectionFromParsedConfig(parsed);

    if (selection.modelId && selection.reasoningEffort) {
      return;
    }
  }

  if (lastError && !selection.modelId && !selection.reasoningEffort) {
    throw lastError;
  }
}

async function hydrateSelection() {
  if (selection.hydratePromise) {
    await selection.hydratePromise;
    return;
  }

  selection.hydratePromise = (async () => {
    try {
      await hydrateSelectionFromHistory();
    } catch (error) {
      await session.log(
        `Research model policy could not read session history: ${getErrorMessage(error)}`,
        { level: "warning", ephemeral: true },
      );
    }

    try {
      await hydrateSelectionFromRuntime();
    } catch (error) {
      await session.log(
        `Research model policy could not read the current model: ${getErrorMessage(error)}`,
        { level: "warning", ephemeral: true },
      );
    }

    if (selection.modelId && selection.reasoningEffort) {
      return;
    }

    try {
      await hydrateSelectionFromConfig();
    } catch (error) {
      await session.log(
        `Research model policy could not read config fallback: ${getErrorMessage(error)}`,
        { level: "warning", ephemeral: true },
      );
    }
  })();

  try {
    await selection.hydratePromise;
  } finally {
    selection.hydratePromise = undefined;
  }
}
