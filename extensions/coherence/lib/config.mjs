import os from "node:os";
import path from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const COPILOT_HOME = path.join(os.homedir(), ".copilot");
const CONFIG_PATH = path.join(COPILOT_HOME, "coherence.json");

const DEFAULT_CONFIG = Object.freeze({
  enabled: false,
  configPath: CONFIG_PATH,
  paths: {
    copilotHome: COPILOT_HOME,
    rawStorePath: path.join(COPILOT_HOME, "session-store.db"),
    derivedStorePath: path.join(COPILOT_HOME, "coherence.db"),
    backupDir: path.join(COPILOT_HOME, "backups", "coherence"),
    instructionsPath: path.join(COPILOT_HOME, "copilot-instructions.md"),
    scopedInstructionsDir: path.join(COPILOT_HOME, "instructions"),
  },
  budgets: {
    procedural: 220,
    semantic: 420,
    episodes: 320,
    commitments: 180,
    total: 1200,
  },
  limits: {
    semanticSearchLimit: 8,
    episodeSearchLimit: 5,
    promptContextLimit: 6,
    crossRepoPreferenceLimit: 2,
    crossRepoEpisodeLimit: 2,
    metricWindowSize: 200,
    recentSessionsFallbackLimit: 3,
  },
  latencyTargetsMs: {
    sessionStartP95: 100,
    userPromptSubmittedP95: 150,
  },
  deferredExtraction: {
    enabled: true,
    autoEnqueueOnSessionEnd: true,
    autoProcessOnSessionStart: true,
    processCurrentRepositoryOnly: true,
    maxJobsPerRun: 2,
    retryDelayMinutes: 15,
  },
});

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeDeep(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override;
  }

  const merged = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(base[key])) {
      merged[key] = mergeDeep(base[key], value);
      continue;
    }
    merged[key] = value;
  }

  return merged;
}

function normalizeBoolean(value, fallback) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(lowered)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(lowered)) {
      return false;
    }
  }
  return fallback;
}

function normalizeConfigShape(value) {
  if (!isPlainObject(value)) {
    return {};
  }
  return value;
}

export async function loadConfig() {
  let fileConfig = {};
  if (existsSync(CONFIG_PATH)) {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    fileConfig = normalizeConfigShape(parsed);
  }

  const merged = mergeDeep(DEFAULT_CONFIG, fileConfig);
  const envEnabled = process.env.COHERENCE_ENABLED;

  return {
    ...merged,
    enabled: normalizeBoolean(envEnabled, merged.enabled),
    configPath: CONFIG_PATH,
  };
}
