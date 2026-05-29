import assert from "node:assert/strict";

process.env.CANVAS_LORE_DASHBOARD_TEST = "1";

const extension = await import("../extension.mjs");

function createCanvas(options) {
  return {
    declaration: {
      id: options.id,
      displayName: options.displayName,
      description: options.description,
      inputSchema: options.inputSchema,
      actions: options.actions?.map(({ handler, ...action }) => action),
    },
    open: options.open,
    onClose: options.onClose,
  };
}

function readStats() {
  return {
    available: true,
    reason: null,
    dbPath: "fixture/lore.db",
    semanticCount: 11,
    episodeCount: 7,
    daySummaryCount: 3,
    schemaVersion: 15,
    lastContextInjectionLatencyMs: 42,
    lastContextInjectionAt: "2026-01-01T00:00:00.000Z",
    lastContextInjectionSections: ["Relevant Prior Work"],
  };
}

function makeSession(capabilities = {}) {
  const logs = [];
  const opened = [];
  return {
    capabilities,
    logs,
    opened,
    rpc: {
      canvas: {
        open: async (params) => {
          opened.push(params);
          return { instanceId: params.instanceId };
        },
      },
    },
    log: async (message, options) => {
      logs.push({ message, options });
    },
    disconnect: async () => {},
  };
}

async function runWithCapabilities(capabilities, options = {}) {
  const calls = [];
  const sessions = [];
  const joinSession = async (config) => {
    calls.push(config);
    const session = makeSession(capabilities);
    sessions.push(session);
    return session;
  };
  const result = await extension.runExtension({
    joinSession,
    createCanvas,
    commandDefinitionAvailable: options.commandDefinitionAvailable ?? true,
    readStats,
  });
  return { calls, sessions, result };
}

async function testCanvasPath() {
  const { calls, result } = await runWithCapabilities({ ui: { canvases: true } });
  assert.equal(result.mode, "canvas");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].requestCanvasRenderer, true);
  assert.equal(calls[1].commands, undefined);
  assert.equal(calls[1].canvases.length, 1);

  await calls[1].hooks.onSessionStart({ cwd: process.cwd() });
  assert.deepEqual(result.session.opened, [{ canvasId: "lore-dashboard", instanceId: "lore-dashboard-main" }]);

  await calls[1].hooks.onUserPromptSubmitted({ cwd: process.cwd(), prompt: "Please recall memory routing latency" });
  const canvas = calls[1].canvases[0];
  const opened = canvas.open({ instanceId: "panel-1", host: { capabilities: { canvases: true } } });
  assert.equal(opened.title, "Lore Dashboard");
  assert.match(opened.url, /^data:text\/html/);
  assert.equal(result.state.openInstances.has("panel-1"), true);
  await canvas.onClose({ instanceId: "panel-1" });
  assert.equal(result.state.openInstances.has("panel-1"), false);
}

async function testSlashCommandPath() {
  const { calls, result } = await runWithCapabilities({ ui: { canvases: false } });
  assert.equal(result.mode, "slash-command");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].canvases, undefined);
  assert.equal(calls[1].requestCanvasRenderer, undefined);
  assert.equal(calls[1].commands.length, 1);
  assert.equal(calls[1].commands[0].name, "lore-status");

  await calls[1].hooks.onUserPromptSubmitted({ cwd: process.cwd(), prompt: "Lore dashboard slash status" });
  await calls[1].commands[0].handler({ commandName: "lore-status", command: "/lore-status", args: "" });
  assert.equal(result.session.logs.length, 1);
  assert.match(result.session.logs[0].message, /Semantic memories: 11/);
  assert.match(result.session.logs[0].message, /Top recalled topics:/);
}

async function testNoOpPath() {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (message) => warnings.push(message);
  try {
    const { calls, result } = await runWithCapabilities(
      { ui: { canvases: false } },
      { commandDefinitionAvailable: false },
    );
    assert.equal(result.mode, "no-op");
    assert.equal(calls.length, 1);
    assert.equal(result.session, null);
    assert.deepEqual(warnings, [
      "canvas-lore-dashboard: neither canvas rendering nor slash commands are available; extension is idle",
    ]);
  } finally {
    console.warn = originalWarn;
  }
}

await testCanvasPath();
await testSlashCommandPath();
await testNoOpPath();

console.log("canvas-lore-dashboard tests passed");
