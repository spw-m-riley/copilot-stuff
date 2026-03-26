import { detectAssistantIdentityName, MEMORY_SCOPE } from "./memory-scope.mjs";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripListMarkers(value) {
  return String(value || "").replace(/^(?:[-*]\s*|\d+[.)]\s*)+/, "").trim();
}

function truncateText(value, limit = 220) {
  const text = normalizeText(value);
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

function uniqueStrings(values, limit = 8) {
  return [...new Set(values.map(normalizeText).filter(Boolean))].slice(0, limit);
}

function cleanPromptPrefix(value) {
  return normalizeText(value)
    .replace(/^(researching|planning|implementing)\s*:\s*/i, "")
    .replace(/^(please|ok(?:ay)?|hey)\s+/i, "");
}

function isPlaceholderSummary(value) {
  return /^Session [0-9a-f-]{8,}$/i.test(normalizeText(value));
}

function meaningfulSummary(value) {
  const text = cleanPromptPrefix(value);
  if (
    !text
    || isPlaceholderSummary(text)
    || /^call the tool\b/i.test(text)
    || /\breturn only the tool output\b/i.test(text)
    || /^using only local repo files\b/i.test(text)
  ) {
    return "";
  }
  return text;
}

function scoreStructuredLine(value) {
  const text = normalizeText(value).replace(/:\s*$/, "");
  if (!text) {
    return Number.NEGATIVE_INFINITY;
  }
  let score = 0;
  if (/[`_/]/.test(text)) {
    score += 2;
  }
  if (text.length >= 24 && text.length <= 220) {
    score += 1;
  }
  if (/\b(added|updated|extended|refined|implemented|captured|validated|scope|override|audit|backfill|restore|rollback|snapshot|prompt|identity|cross-repo|schema|trace|replay|deferred|memory|coherence)\b/i.test(text)) {
    score += 3;
  }
  if (/\b(the user|the conversation)\b/i.test(text)) {
    score -= 2;
  }
  if (/^(files created|files modified|remaining work|immediate next steps|diagnostics\/validation|files in scope|implementation order)$/i.test(text)) {
    score -= 3;
  }
  return score;
}

function extractOutlineItems(value, { limit = 12 } = {}) {
  const items = [];
  const headings = [];

  for (const rawLine of String(value || "").split("\n")) {
    if (!rawLine.trim()) {
      continue;
    }

    const indent = rawLine.match(/^\s*/)?.[0].length ?? 0;
    const level = Math.floor(indent / 2);
    const text = normalizeText(stripListMarkers(rawLine));
    if (!text) {
      continue;
    }

    while (headings.length > 0 && headings.at(-1).level >= level) {
      headings.pop();
    }

    if (/:\s*$/.test(text)) {
      headings.push({
        level,
        text: text.replace(/:\s*$/, ""),
      });
      continue;
    }

    const contextual = headings.length > 0
      ? `${headings.map((entry) => entry.text).join(": ")}: ${text}`
      : text;
    items.push({
      text: contextual,
      score: scoreStructuredLine(contextual),
      order: items.length,
    });
  }

  const seen = new Set();
  const results = [];
  for (const item of items.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return left.order - right.order;
  })) {
    const key = normalizeText(item.text).toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    results.push(item.text);
    if (results.length >= limit) {
      break;
    }
  }
  return results;
}

function summarizePaths(files, limit = 3) {
  return uniqueStrings(
    files
      .map((file) => file.file_path)
      .filter(Boolean)
      .map((filePath) => filePath.split("/").slice(-2).join("/")),
    limit,
  );
}

function summarizeRefs(refs, limit = 2) {
  return uniqueStrings(
    refs.map((ref) => `${ref.ref_type}:${ref.ref_value}`),
    limit,
  );
}

function buildEpisodeSummary({
  sessionId,
  repository,
  session,
  latestCheckpoint,
  turns,
  files,
  refs,
  actions,
  decisions,
  openItems,
}) {
  const seed = [
    meaningfulSummary(latestCheckpoint?.title),
    meaningfulSummary(session.summary),
    meaningfulSummary(turns[0]?.user_message),
    meaningfulSummary(latestCheckpoint?.overview),
    meaningfulSummary(latestCheckpoint?.work_done),
    meaningfulSummary(turns.at(-1)?.assistant_response),
  ].find(Boolean);

  const highlights = uniqueStrings([
    ...decisions.slice(0, 2),
    ...actions.slice(0, 2),
    ...openItems.slice(0, 1),
  ], 2);
  const details = [
    ...highlights,
    summarizePaths(files).length > 0 ? `files: ${summarizePaths(files).join(", ")}` : "",
    summarizeRefs(refs).length > 0 ? `refs: ${summarizeRefs(refs).join(", ")}` : "",
  ].filter(Boolean);

  if (seed) {
    return truncateText(
      `${seed}${details.length > 0 ? ` — ${details.join(" | ")}` : ""}`,
    );
  }

  const location = repository || session.cwd || "local workspace";
  const branch = session.branch ? ` on ${session.branch}` : "";
  if (details.length > 0) {
    return truncateText(`Worked in ${location}${branch} — ${details.join(" | ")}`);
  }
  return `Worked in ${location}${branch || ""} (${sessionId})`;
}

function extractSemanticMemoriesFromTurns(turns, repository, sessionId) {
  const memories = [];
  const recentTurns = turns.slice(-12);

  for (const turn of recentTurns) {
    const message = normalizeText(turn.user_message);
    if (!message || message.length > 240) {
      continue;
    }

    if (/\b(?:always|prefer)\b/i.test(message)) {
      memories.push({
        type: "user_preference",
        content: message,
        repository,
        sourceSessionId: sessionId,
        sourceTurnIndex: turn.turn_index,
        confidence: 0.95,
        tags: ["preference", "user"],
      });
      continue;
    }

    if (/\b(?:never|do not|don't)\b/i.test(message)) {
      memories.push({
        type: "rejected_approach",
        content: message,
        repository,
        sourceSessionId: sessionId,
        sourceTurnIndex: turn.turn_index,
        confidence: 0.95,
        tags: ["rejected", "user"],
      });
    }
  }

  return memories;
}

function extractAssistantIdentityMemories(turns, sessionId) {
  const memories = [];
  const recentTurns = turns.slice(-12);
  for (const turn of recentTurns) {
    const message = normalizeText(turn.user_message);
    const assistantName = detectAssistantIdentityName(message);
    if (!assistantName) {
      continue;
    }
    memories.push({
      type: "assistant_identity",
      content: `The user calls the assistant ${assistantName}.`,
      repository: null,
      scope: MEMORY_SCOPE.GLOBAL,
      sourceSessionId: sessionId,
      sourceTurnIndex: turn.turn_index,
      confidence: 0.99,
      tags: ["assistant-identity", "user", assistantName.toLowerCase()],
      metadata: {
        source: "rule_extractor",
        assistantName,
      },
    });
  }
  return memories;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function extractThemes(summary, repository) {
  const words = normalizeText(summary)
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 5);
  const repoBits = repository ? repository.split(/[/:_-]/).filter(Boolean).slice(-2) : [];
  return [...new Set([...repoBits, ...words])].slice(0, 8);
}

function extractActions({ latestCheckpoint, files }) {
  return uniqueStrings([
    ...extractOutlineItems(latestCheckpoint?.work_done, { limit: 10 }),
    ...extractOutlineItems(latestCheckpoint?.history, { limit: 6 }),
    ...files.map((file) => file.file_path).filter(Boolean),
  ], 12);
}

function extractDecisions(latestCheckpoint) {
  return uniqueStrings([
    ...extractOutlineItems(latestCheckpoint?.technical_details, { limit: 12 }),
    ...extractOutlineItems(latestCheckpoint?.work_done, { limit: 8 }),
    ...extractOutlineItems(latestCheckpoint?.overview, { limit: 6 }),
  ], 14);
}

function extractOpenItems(latestCheckpoint) {
  return uniqueStrings(extractOutlineItems(latestCheckpoint?.next_steps, { limit: 10 }), 10);
}

export function extractSessionMemories({ sessionId, repository, sessionArtifacts, workspace }) {
  const { session, checkpoints, files, refs, turns } = sessionArtifacts;
  const latestCheckpoint = checkpoints[0] ?? null;
  const effectiveRepository = repository
    ?? session.repository
    ?? workspace.workspace?.repository
    ?? null;
  const actions = extractActions({ latestCheckpoint, files });
  const decisions = extractDecisions(latestCheckpoint);
  const openItems = extractOpenItems(latestCheckpoint);
  const summary = buildEpisodeSummary({
    sessionId,
    repository: effectiveRepository,
    session,
    latestCheckpoint,
    turns,
    files,
    refs,
    actions,
    decisions,
    openItems,
  });
  const learnings = extractSemanticMemoriesFromTurns(turns, effectiveRepository, sessionId).map((item) => item.content);
  const themes = extractThemes(
    [summary, ...actions.slice(0, 3), ...decisions.slice(0, 2), ...openItems.slice(0, 2)].join(" "),
    effectiveRepository,
  );

  const significance = clamp(
    3
      + Math.min(files.length, 3)
      + Math.min(refs.length, 2)
      + (latestCheckpoint ? 1 : 0)
      + (session.summary ? 1 : 0),
    1,
    10,
  );

  const createdAt = session.updated_at || workspace.workspace?.updated_at || new Date().toISOString();
  const dateKey = createdAt.slice(0, 10);

  return {
    episodeDigest: {
      id: sessionId,
      sessionId,
      repository: effectiveRepository,
      branch: session.branch ?? workspace.workspace?.branch ?? null,
      summary,
      actions,
      decisions,
      learnings,
      filesChanged: files.map((file) => file.file_path),
      refs: refs.map((ref) => `${ref.ref_type}:${ref.ref_value}`),
      significance,
      themes,
      openItems,
      source: "rule",
      dateKey,
      createdAt,
    },
    semanticMemories: [
      ...extractAssistantIdentityMemories(turns, sessionId),
      ...extractSemanticMemoriesFromTurns(turns, effectiveRepository, sessionId),
      ...openItems.map((item) => ({
        type: "open_loop",
        content: item,
        repository: effectiveRepository,
        sourceSessionId: sessionId,
        confidence: 0.8,
        tags: ["open-loop", "checkpoint"],
      })),
    ],
  };
}
