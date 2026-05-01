import { execFile } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import { normalizePrompt, normalizeSessionId, setBoundedContext } from "../_shared/context-policy.mjs";
import {
    buildMaChildContext,
    buildMaParentContext,
    buildMaSoftParentContext,
    getMaRecommendationStrength,
    hasLargeReferencedFile,
    shouldInjectMaChildContext,
} from "./lib/routing.mjs";

// Sensitive path components and basenames mirroring internal/detect
const SENSITIVE_BASENAMES = new Set([
    ".env", ".env.local", "id_rsa", "id_ed25519",
    "credentials", "known_hosts", "authorized_keys",
]);
const SENSITIVE_COMPONENTS = new Set([".ssh", ".aws", ".gnupg", ".kube"]);
const EVENT_KIND_STARTED = "started";
const EVENT_KIND_FINISHED = "finished";
const EVENT_KIND_FAILED = "failed";
const MAX_ACTIVE_CONTEXTS = 64;
const sessionStateFileName = "session.json";
const dashboardSessionState = {
    runId: null,
    startedAt: null,
};
const activeContextBySession = new Map();

function isSensitivePath(filePath) {
    const parts = filePath.split(/[\\/]/);
    const base = parts[parts.length - 1];
    if (SENSITIVE_BASENAMES.has(base)) return true;
    return parts.some((p) => SENSITIVE_COMPONENTS.has(p));
}

function findMaBinary() {
    const repoRoot = process.cwd();
    const candidates = [`${repoRoot}/ma`, `${repoRoot}/cmd/ma/ma`];
    for (const candidate of candidates) {
        try {
            statSync(candidate);
            return candidate;
        } catch {
            // continue
        }
    }
    return "ma";
}

function runMaCommand(args, env) {
    return new Promise((resolve, reject) => {
        const binary = findMaBinary();
        const childEnv = { ...process.env, ...env };
        execFile(binary, args, { env: childEnv, timeout: 30000 }, (err, stdout, stderr) => {
            if (err) {
                reject(new Error(stderr || err.message));
            } else {
                resolve(stdout);
            }
        });
    });
}

function rawFallback(filePath) {
    try {
        return readFileSync(filePath, "utf-8");
    } catch (err) {
        return `Error reading file: ${err.message}`;
    }
}

function dashboardRoot() {
    if (process.env.MA_DASHBOARD_STATE_DIR) return process.env.MA_DASHBOARD_STATE_DIR;
    if (process.platform === "darwin") return join(homedir(), "Library", "Caches", "ma", "dashboard");
    if (process.platform === "win32") {
        if (!process.env.LOCALAPPDATA) return null;
        return join(process.env.LOCALAPPDATA, "ma", "dashboard");
    }
    if (process.env.XDG_CACHE_HOME) return join(process.env.XDG_CACHE_HOME, "ma", "dashboard");
    return join(homedir(), ".cache", "ma", "dashboard");
}

function readDashboardSession() {
    const root = dashboardRoot();
    if (!root) return null;

    try {
        const payload = JSON.parse(readFileSync(join(root, sessionStateFileName), "utf-8"));
        if (!payload || typeof payload.address !== "string" || payload.address === "") return null;
        return payload;
    } catch {
        return null;
    }
}

async function publishDashboardEvent(event) {
    const dashboardSession = readDashboardSession();
    if (!dashboardSession) return false;

    try {
        const response = await fetch(`http://${dashboardSession.address}/api/events`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(event),
        });
        return response.ok;
    } catch {
        return false;
    }
}

function buildSessionEvent({ kind, runId, startedAt, finishedAt, reason }) {
    const summaryPrefix = kind === EVENT_KIND_STARTED ? "session started" : "session ended";
    const summarySuffix = reason ? ` (${reason})` : "";

    return {
        kind,
        id: runId,
        command: "extension-session",
        source: "extension",
        startedAt,
        finishedAt,
        success: kind !== EVENT_KIND_FAILED,
        changed: false,
        payloadStatus: "none",
        resultSummary: `${summaryPrefix}${summarySuffix}`,
        error: kind === EVENT_KIND_FAILED ? `session ended (${reason || "error"})` : "",
    };
}

const session = await joinSession({
    onPermissionRequest: approveAll,
    tools: [
        {
            name: "ma_smart_read",
            description:
                "Read a file with automatic classification and context reduction. " +
                "Classifies the file (prose/code/config) and applies the matching reduction " +
                "(compress/skeleton/minify-schema). Files under ~200 lines pass through unchanged. " +
                "Use this for reading files for understanding; use standard file tools for files you intend to edit.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Absolute or relative path to the file to read",
                    },
                },
                required: ["path"],
            },
            handler: async (args) => {
                if (isSensitivePath(args.path)) {
                    return {
                        textResultForLlm: `Refused: sensitive path ${args.path}`,
                        resultType: "denied",
                    };
                }
                try {
                    const output = await runMaCommand(
                        ["smart-read", args.path, "--json"],
                        { MA_SOURCE: "extension" },
                    );
                    const result = JSON.parse(output);
                    return result.output || rawFallback(args.path);
                } catch {
                    return rawFallback(args.path);
                }
            },
        },
        {
            name: "ma_compress",
            description:
                "Apply deterministic prose compression to a natural language file. " +
                "Returns compressed text with stats. Does not modify the file.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Path to the file to compress",
                    },
                },
                required: ["path"],
            },
            handler: async (args) => {
                if (isSensitivePath(args.path)) {
                    return {
                        textResultForLlm: `Refused: sensitive path ${args.path}`,
                        resultType: "denied",
                    };
                }
                try {
                    const output = await runMaCommand(
                        ["compress", args.path, "--json"],
                        { MA_SOURCE: "extension" },
                    );
                    const result = JSON.parse(output);
                    return result.output || output;
                } catch (err) {
                    return { textResultForLlm: err.message, resultType: "failure" };
                }
            },
        },
        {
            name: "ma_skeleton",
            description:
                "Extract declarations and signatures from a source code file, " +
                "stripping implementation details. Returns the structural skeleton.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Path to the source file",
                    },
                },
                required: ["path"],
            },
            handler: async (args) => {
                if (isSensitivePath(args.path)) {
                    return {
                        textResultForLlm: `Refused: sensitive path ${args.path}`,
                        resultType: "denied",
                    };
                }
                try {
                    const output = await runMaCommand(
                        ["skeleton", args.path, "--json"],
                        { MA_SOURCE: "extension" },
                    );
                    const result = JSON.parse(output);
                    return result.output || output;
                } catch (err) {
                    return { textResultForLlm: err.message, resultType: "failure" };
                }
            },
        },
        {
            name: "ma_minify_schema",
            description:
                "Minify a JSON or YAML schema file by removing descriptions, defaults, " +
                "and examples. Returns the minified schema.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "Path to the JSON or YAML schema file",
                    },
                },
                required: ["path"],
            },
            handler: async (args) => {
                if (isSensitivePath(args.path)) {
                    return {
                        textResultForLlm: `Refused: sensitive path ${args.path}`,
                        resultType: "denied",
                    };
                }
                try {
                    const output = await runMaCommand(
                        ["minify-schema", args.path, "--json"],
                        { MA_SOURCE: "extension" },
                    );
                    const result = JSON.parse(output);
                    return result.output || output;
                } catch (err) {
                    return { textResultForLlm: err.message, resultType: "failure" };
                }
            },
        },
        {
            name: "ma_dedup",
            description:
                "Detect exact and near-duplicate sentences across one or more instruction files. " +
                "Returns a report of duplicates found. Does not modify files.",
            parameters: {
                type: "object",
                properties: {
                    paths: {
                        type: "array",
                        items: { type: "string" },
                        description: "Paths to instruction files to analyze for duplicates",
                    },
                },
                required: ["paths"],
            },
            handler: async (args) => {
                const paths = args.paths || [];
                for (const p of paths) {
                    if (isSensitivePath(p)) {
                        return {
                            textResultForLlm: `Refused: sensitive path ${p}`,
                            resultType: "denied",
                        };
                    }
                }
                try {
                    const output = await runMaCommand(
                        ["dedup", ...paths, "--json"],
                        { MA_SOURCE: "extension" },
                    );
                    const result = JSON.parse(output);
                    return result.output || output;
                } catch (err) {
                    return { textResultForLlm: err.message, resultType: "failure" };
                }
            },
        },
    ],
    hooks: {
        onUserPromptSubmitted: async (input) => {
            const prompt = normalizePrompt(input?.prompt);
            const sessionId = normalizeSessionId(input?.sessionId);
            const cwd = input?.cwd || process.cwd();

            const strength = getMaRecommendationStrength(prompt, {
                hasLargeFile: hasLargeReferencedFile(prompt, cwd),
            });

            if (!strength) {
                // No recommendation — clear matched state
                if (sessionId && activeContextBySession.has(sessionId)) {
                    setBoundedContext(
                        activeContextBySession,
                        sessionId,
                        { matched: false },
                        MAX_ACTIVE_CONTEXTS,
                        { refreshExisting: true },
                    );
                }
                return;
            }

            if (sessionId) {
                setBoundedContext(
                    activeContextBySession,
                    sessionId,
                    { matched: true },
                    MAX_ACTIVE_CONTEXTS,
                    { refreshExisting: true },
                );
            }

            const guidance = strength === "strong"
                ? buildMaParentContext()
                : buildMaSoftParentContext();

            const label = strength === "strong" ? "reduction guidance" : "reduction hint";
            await session.log(`ma: injected ${label}`, { ephemeral: true });
            return {
                modifiedPrompt: `${guidance}\n\n${prompt}`,
            };
        },
        onSubagentStart: async (input) => {
            const sessionId = normalizeSessionId(input?.sessionId);
            if (!sessionId) {
                return;
            }

            if (!activeContextBySession.get(sessionId)?.matched) {
                return;
            }

            if (!shouldInjectMaChildContext(input)) {
                return;
            }

            await session.log("ma: injected child guidance", { ephemeral: true });
            return { additionalContext: buildMaChildContext() };
        },
        onSessionStart: async (input, invocation) => {
            dashboardSessionState.runId = `extension-session-${invocation?.sessionId || `${Date.now()}-${process.pid}`}`;
            dashboardSessionState.startedAt = new Date().toISOString();
            await publishDashboardEvent(buildSessionEvent({
                kind: EVENT_KIND_STARTED,
                runId: dashboardSessionState.runId,
                startedAt: dashboardSessionState.startedAt,
                reason: input?.source,
            }));
            await session.log("ma extension loaded — smart-read and reduction tools available");
        },
        onSessionEnd: async (input) => {
            activeContextBySession.delete(normalizeSessionId(input?.sessionId));
            if (!dashboardSessionState.runId) return;

            const kind = new Set(["error", "abort", "timeout"]).has(input?.reason)
                ? EVENT_KIND_FAILED
                : EVENT_KIND_FINISHED;

            await publishDashboardEvent(buildSessionEvent({
                kind,
                runId: dashboardSessionState.runId,
                startedAt: dashboardSessionState.startedAt || new Date().toISOString(),
                finishedAt: new Date().toISOString(),
                reason: input?.reason,
            }));

            dashboardSessionState.runId = null;
            dashboardSessionState.startedAt = null;
        },
    },
});
