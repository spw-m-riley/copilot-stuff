import { assembleMemoryCapsule, detectPromptContextNeed } from "./capsule-assembler.mjs";
import { buildProceduralProfile, detectRelevantInstructionFiles } from "./procedural-memory.mjs";

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function getByPath(object, path) {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((current, segment) => (current == null ? undefined : current[segment]), object);
}

function extractSectionTitles(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.match(/^##\s+(.+)$/))
    .filter(Boolean)
    .map((match) => match[1].trim());
}

function summarizeTraceRow(row) {
  if (!row || typeof row !== "object") {
    return "";
  }
  const repositoryLabel = row.repository ? ` (${row.repository})` : "";
  if (typeof row.content === "string" && row.content.length > 0) {
    return `[${row.type ?? row.sourceType ?? "row"}] ${row.content}${repositoryLabel}`;
  }
  if (typeof row.summary === "string" && row.summary.length > 0) {
    return `${row.summary}${repositoryLabel}`;
  }
  if (typeof row.excerpt === "string" && row.excerpt.length > 0) {
    return `${row.excerpt}${repositoryLabel}`;
  }
  return JSON.stringify(row);
}

function formatLookupLabel(name) {
  return String(name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function aggregateFilteredReasons(filtered) {
  const counts = new Map();
  for (const item of ensureArray(filtered)) {
    const key = String(item.reason || "filtered");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([reason, count]) => `${reason} x${count}`)
    .join(", ");
}

function renderLookup(name, lookup) {
  if (!lookup || typeof lookup !== "object") {
    return "";
  }
  const rows = ensureArray(lookup.rows);
  const rankedRows = ensureArray(lookup.rankedRows);
  const includedRows = ensureArray(lookup.includedRows);
  const filtered = ensureArray(lookup.filtered);
  const lines = [`### ${formatLookupLabel(name)}`];

  if ("enabled" in lookup) {
    lines.push(`- enabled: ${lookup.enabled === true}`);
  }
  if (typeof lookup.query === "string" && lookup.query.length > 0) {
    lines.push(`- query: ${lookup.query}`);
  }
  if (Array.isArray(lookup.scopes) && lookup.scopes.length > 0) {
    lines.push(`- scopes: ${lookup.scopes.join(", ")}`);
  }
  if (Array.isArray(lookup.eligibleScopes) && lookup.eligibleScopes.length > 0) {
    lines.push(`- eligibleScopes: ${lookup.eligibleScopes.join(", ")}`);
  }
  if (rows.length > 0) {
    lines.push(`- matched: ${rows.length}`);
  } else if (rankedRows.length > 0) {
    lines.push(`- ranked: ${rankedRows.length}`);
  }
  lines.push(`- included: ${includedRows.length}`);
  if (lookup.reason) {
    lines.push(`- reason: ${lookup.reason}`);
  }
  const filteredSummary = aggregateFilteredReasons(filtered);
  if (filteredSummary) {
    lines.push(`- filtered: ${filteredSummary}`);
  }
  if (includedRows.length > 0) {
    lines.push("- sample:");
    for (const row of includedRows.slice(0, 3)) {
      lines.push(`  - ${summarizeTraceRow(row)}`);
    }
  }
  return lines.join("\n");
}

function normalizeComparisonText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function buildTraceRowText(row) {
  if (!row || typeof row !== "object") {
    return "";
  }
  return normalizeComparisonText([
    row.type,
    row.sourceType,
    row.content,
    row.summary,
    row.excerpt,
    ...ensureArray(row.decisions),
    ...ensureArray(row.actions),
    ...ensureArray(row.openItems),
    ...ensureArray(row.themes),
    row.repository,
    row.date_key,
    row.dateKey,
  ].filter(Boolean).join(" "));
}

function flattenTraceRows(trace) {
  const ranked = [];
  const included = [];
  const lookups = trace?.lookups && typeof trace.lookups === "object"
    ? Object.entries(trace.lookups)
    : [];

  for (const [lookupName, lookup] of lookups) {
    ensureArray(lookup?.rankedRows).forEach((row, index) => {
      ranked.push({
        lookupName,
        position: index + 1,
        summary: summarizeTraceRow(row),
        text: buildTraceRowText(row),
        row,
      });
    });
    ensureArray(lookup?.includedRows).forEach((row, index) => {
      included.push({
        lookupName,
        position: index + 1,
        summary: summarizeTraceRow(row),
        text: buildTraceRowText(row),
        row,
      });
    });
  }

  return { ranked, included };
}

function matchesEvidenceItem(traceRow, definition) {
  const includesAny = ensureArray(definition.includesAny).map((value) => normalizeComparisonText(value));
  const types = ensureArray(definition.types).map((value) => String(value).trim()).filter(Boolean);
  const rowType = String(traceRow?.row?.type ?? traceRow?.row?.sourceType ?? "").trim();
  const textMatches = includesAny.length === 0 || includesAny.some((snippet) => traceRow.text.includes(snippet));
  const typeMatches = types.length === 0 || types.includes(rowType);
  return textMatches && typeMatches;
}

function evaluateExpectedEvidence(definition, explanation) {
  const expectedItems = ensureArray(definition.expectedEvidence).map((item) => (
    typeof item === "string"
      ? { label: item, includesAny: [item] }
      : item
  ));
  const traceRows = flattenTraceRows(explanation.trace);

  const items = expectedItems.map((item) => {
    const rankedMatches = traceRows.ranked.filter((traceRow) => matchesEvidenceItem(traceRow, item));
    const includedMatches = traceRows.included.filter((traceRow) => matchesEvidenceItem(traceRow, item));
    const bestRankedPosition = rankedMatches.length > 0
      ? Math.min(...rankedMatches.map((match) => match.position))
      : null;
    const bestIncludedPosition = includedMatches.length > 0
      ? Math.min(...includedMatches.map((match) => match.position))
      : null;
    const outcome = bestIncludedPosition != null
      ? "included"
      : bestRankedPosition != null
        ? "ranked_only"
        : "missing";
    return {
      label: item.label ?? item.includesAny?.[0] ?? item.types?.[0] ?? "expected-evidence",
      includesAny: ensureArray(item.includesAny),
      types: ensureArray(item.types),
      outcome,
      bestRankedPosition,
      bestIncludedPosition,
      rankedMatchCount: rankedMatches.length,
      includedMatchCount: includedMatches.length,
      sample: includedMatches[0]?.summary ?? rankedMatches[0]?.summary ?? null,
      matchedLookups: [...new Set([...includedMatches, ...rankedMatches].map((match) => match.lookupName))],
    };
  });

  return {
    expectedCount: items.length,
    includedCount: items.filter((item) => item.outcome === "included").length,
    rankedOnlyCount: items.filter((item) => item.outcome === "ranked_only").length,
    missingCount: items.filter((item) => item.outcome === "missing").length,
    items,
  };
}

function classifyReplayMiss(definition, explanation, evidence) {
  if ((definition.caseType ?? "must_pass") !== "ranking_target") {
    return null;
  }
  if (evidence.missingCount === 0) {
    return null;
  }

  const sectionTitles = explanation.trace?.output?.sectionTitles ?? extractSectionTitles(explanation.text);
  const localEpisodes = explanation.trace?.lookups?.localEpisodes;
  const localMemories = explanation.trace?.lookups?.localMemories;
  const hasCrossRepoLeak = sectionTitles.includes("Cross-Repo Examples") || sectionTitles.includes("Cross-Repo Hints");
  const includedEpisodeRows = ensureArray(localEpisodes?.includedRows);
  const rankedEpisodeRows = ensureArray(localEpisodes?.rankedRows);
  const includedMemoryRows = ensureArray(localMemories?.includedRows);
  const rankedTexts = flattenTraceRows(explanation.trace).ranked.map((row) => row.text).join(" ");

  if (hasCrossRepoLeak && explanation.promptNeed?.wantsCrossRepoExamples !== true) {
    return "scope_classification";
  }
  if (includedEpisodeRows.length > 0 || rankedEpisodeRows.length > 0 || includedMemoryRows.length > 0) {
    if (/\b(files created|files modified|remaining work|immediate next steps|diagnostics\/validation|the user|the conversation)\b/i.test(rankedTexts)) {
      return "extraction_shape";
    }
    return "lexical_ranking";
  }
  return "lexical_ranking";
}

function evaluateCase(definition, explanation) {
  const assertions = [];
  const sectionTitles = explanation.trace?.output?.sectionTitles ?? extractSectionTitles(explanation.text);
  const text = String(explanation.text || "");
  const expect = definition.expect ?? {};

  const record = (label, passed, details) => {
    assertions.push({ label, passed, details });
  };

  for (const [field, expected] of Object.entries(expect.promptNeed ?? {})) {
    record(
      `promptNeed.${field} === ${expected}`,
      explanation.promptNeed?.[field] === expected,
      `actual=${explanation.promptNeed?.[field]}`,
    );
  }

  for (const path of ensureArray(expect.traceTruthyPaths)) {
    record(
      `trace ${path} is present`,
      Boolean(getByPath(explanation.trace, path)),
      `actual=${JSON.stringify(getByPath(explanation.trace, path))}`,
    );
  }

  for (const [path, minimum] of Object.entries(expect.traceMinCounts ?? {})) {
    const value = getByPath(explanation.trace, path);
    const count = Array.isArray(value) ? value.length : Number(value ?? 0);
    record(`${path} >= ${minimum}`, count >= minimum, `actual=${count}`);
  }

  for (const title of ensureArray(expect.mustIncludeSections)) {
    record(
      `section includes "${title}"`,
      sectionTitles.includes(title),
      `actual=[${sectionTitles.join(", ")}]`,
    );
  }

  for (const title of ensureArray(expect.mustNotIncludeSections)) {
    record(
      `section excludes "${title}"`,
      !sectionTitles.includes(title),
      `actual=[${sectionTitles.join(", ")}]`,
    );
  }

  const includeOneOf = ensureArray(expect.mustIncludeOneOfSections);
  if (includeOneOf.length > 0) {
    record(
      `section includes one of ${includeOneOf.join(", ")}`,
      includeOneOf.some((title) => sectionTitles.includes(title)),
      `actual=[${sectionTitles.join(", ")}]`,
    );
  }

  const textMustIncludeAny = ensureArray(expect.textMustIncludeAny);
  if (textMustIncludeAny.length > 0) {
    record(
      `text includes one of ${textMustIncludeAny.join(", ")}`,
      textMustIncludeAny.some((snippet) => text.includes(snippet)),
      text,
    );
  }

  for (const snippet of ensureArray(expect.textMustNotInclude)) {
    record(
      `text excludes "${snippet}"`,
      !text.includes(snippet),
      text,
    );
  }

  return {
    passed: assertions.every((assertion) => assertion.passed),
    assertions,
    sectionTitles,
  };
}

export const VALIDATION_CASES = Object.freeze([
  {
    id: "identity-greeting",
    caseType: "must_pass",
    title: "Greeting keeps identity and avoids cross-repo noise",
    mode: "prompt",
    prompt: "Hi Coda, how are you?",
    expect: {
      promptNeed: {
        requiresLookup: true,
        directAddressed: true,
        wantsContinuity: true,
        wantsCrossRepoExamples: false,
        identityOnly: true,
      },
      mustIncludeSections: ["Relevant Commitments, Preferences, And Identity"],
      mustNotIncludeSections: ["Relevant Prior Work", "Cross-Repo Examples", "Cross-Repo Hints", "Transferable Cross-Repo Preferences"],
      textMustIncludeAny: ["Coda", "assistant_identity/global"],
      traceMinCounts: {
        "lookups.identityMemories.includedRows": 1,
      },
    },
  },
  {
    id: "temporal-last-thursday",
    caseType: "must_pass",
    title: "Temporal prompts surface prior work",
    mode: "prompt",
    prompt: "What did we do last Thursday?",
    expect: {
      promptNeed: {
        requiresLookup: true,
      },
      traceTruthyPaths: ["temporalDate"],
      mustIncludeOneOfSections: ["Relevant Day Summary", "Relevant Prior Work"],
    },
  },
  {
    id: "repo-local-memory-scopes",
    caseType: "must_pass",
    title: "Repo-local continuity stays local",
    mode: "prompt",
    prompt: "Remember what we did here for coherence memory scopes.",
    expect: {
      promptNeed: {
        requiresLookup: true,
        wantsContinuity: true,
      },
      mustIncludeOneOfSections: ["Relevant Prior Work", "Relevant Commitments, Preferences, And Identity"],
      mustNotIncludeSections: ["Cross-Repo Examples", "Cross-Repo Hints"],
    },
  },
  {
    id: "cross-repo-ci-example",
    caseType: "must_pass",
    title: "Cross-repo example prompts surface labeled prior art",
    mode: "prompt",
    prompt: "Can you use an example from another repo for a CI migration like before?",
    expect: {
      promptNeed: {
        requiresLookup: true,
        wantsCrossRepoExamples: true,
      },
      mustIncludeOneOfSections: ["Cross-Repo Examples", "Cross-Repo Hints", "Transferable Cross-Repo Preferences"],
    },
  },
  {
    id: "session-start-identity",
    caseType: "must_pass",
    title: "Session start capsule keeps identity available",
    mode: "session_start",
    prompt: "Hi Coda, can you help me today?",
    expect: {
      promptNeed: {
        identityOnly: true,
        wantsCrossRepoExamples: false,
      },
      mustIncludeSections: ["Commitments, Preferences, And Identity"],
      mustNotIncludeSections: ["Relevant Knowledge", "Recent Related Work", "Relevant History Hints", "Long-Range Related Hints", "Cross-Repo Examples", "Cross-Repo Hints"],
      textMustIncludeAny: ["Coda", "assistant_identity"],
    },
  },
]);

export const REPLAY_CASES = Object.freeze([
  ...VALIDATION_CASES,
  {
    id: "ranking-phase2-prompt-shaping",
    caseType: "ranking_target",
    title: "Prompt-shaping history surfaces the phase-two changes",
    mode: "prompt",
    prompt: "When we worked on coherence phase two in this repo, what did we change about prompt shaping?",
    expect: {
      mustIncludeSections: ["Relevant Prior Work"],
      mustNotIncludeSections: ["Cross-Repo Examples", "Cross-Repo Hints"],
    },
    expectedEvidence: [
      {
        label: "prompt-shaping detail",
        includesAny: ["prompt shaping", "identity-only", "cross-repo fallback"],
      },
    ],
  },
  {
    id: "ranking-scope-override-audit",
    caseType: "ranking_target",
    title: "Scope-override audit work is discoverable",
    mode: "prompt",
    prompt: "How did we make scope overrides auditable in coherence?",
    expect: {
      mustIncludeOneOfSections: ["Relevant Prior Work", "Relevant Commitments, Preferences, And Identity"],
      mustNotIncludeSections: ["Cross-Repo Examples", "Cross-Repo Hints"],
    },
    expectedEvidence: [
      {
        label: "scope override audit detail",
        includesAny: ["scope override audit", "scope_override_audit", "manual overrides", "scope_source"],
      },
    ],
  },
  {
    id: "ranking-controlled-backfill-rollback",
    caseType: "ranking_target",
    title: "Controlled backfill rollback details are retrievable",
    mode: "prompt",
    prompt: "How does the controlled backfill rollback work in coherence?",
    expect: {
      mustIncludeOneOfSections: ["Relevant Prior Work", "Relevant Commitments, Preferences, And Identity"],
      mustNotIncludeSections: ["Cross-Repo Examples", "Cross-Repo Hints"],
    },
    expectedEvidence: [
      {
        label: "rollback detail",
        includesAny: ["snapshot", "restore", "vacuum into", "controlled backfill"],
      },
    ],
  },
]);

export async function explainMemoryRetrieval({ runtime, prompt, mode = "prompt" }) {
  if (mode === "session_start") {
    const relevantInstructionFiles = detectRelevantInstructionFiles(prompt);
    const proceduralProfile = await buildProceduralProfile({
      prompt,
      relevantInstructionFiles,
      config: runtime.config,
    });
    const result = await assembleMemoryCapsule({
      prompt,
      repository: runtime.repository,
      proceduralProfile,
      db: runtime.db,
      sessionStore: runtime.sessionStore,
      config: runtime.config,
      includeTrace: true,
    });
    return {
      mode,
      prompt,
      repository: runtime.repository,
      promptNeed: detectPromptContextNeed(prompt),
      text: result.text,
      trace: result.trace,
      estimatedTokens: result.estimatedTokens,
    };
  }

    const promptNeed = detectPromptContextNeed(prompt);
    const includeOtherRepositories = promptNeed.allowCrossRepoFallback === true;
    const result = runtime.db.explainPromptContext({
      prompt,
      repository: runtime.repository,
      includeOtherRepositories,
      limit: runtime.config.limits.promptContextLimit,
      sessionStore: runtime.sessionStore,
      promptNeed,
    });
  return {
    mode,
    prompt,
    repository: runtime.repository,
    promptNeed,
    text: result.text,
    trace: result.trace,
    estimatedTokens: result.trace?.output?.estimatedTokens ?? 0,
  };
}

export function renderExplanationReport(explanation) {
  const sectionTitles = explanation.trace?.output?.sectionTitles ?? extractSectionTitles(explanation.text);
  const lines = [
    `mode: ${explanation.mode}`,
    `repository: ${explanation.repository ?? "global-only"}`,
    `prompt: ${explanation.prompt}`,
    `requiresLookup: ${explanation.promptNeed?.requiresLookup === true}`,
    `wantsContinuity: ${explanation.promptNeed?.wantsContinuity === true}`,
    `wantsCrossRepoExamples: ${explanation.promptNeed?.wantsCrossRepoExamples === true}`,
    `wantsRepoLocalTaskContext: ${explanation.promptNeed?.wantsRepoLocalTaskContext === true}`,
    `identityOnly: ${explanation.promptNeed?.identityOnly === true}`,
    `directAddressed: ${explanation.promptNeed?.directAddressed === true}`,
    `estimatedTokens: ${explanation.estimatedTokens ?? 0}`,
    "",
    "## Output Sections",
    "",
    sectionTitles.length > 0
      ? sectionTitles.map((title) => `- ${title}`).join("\n")
      : "- none",
  ];

  if (explanation.trace?.eligibility) {
    lines.push(
      "",
      "## Scope Eligibility",
      "",
      ...Object.entries(explanation.trace.eligibility).map(
        ([key, values]) => `- ${formatLookupLabel(key)}: ${ensureArray(values).join(", ") || "none"}`,
      ),
    );
  }

  if (explanation.trace?.lookups) {
    lines.push("", "## Lookups", "");
    for (const [name, lookup] of Object.entries(explanation.trace.lookups)) {
      const rendered = renderLookup(name, lookup);
      if (rendered) {
        lines.push(rendered, "");
      }
    }
    if (lines.at(-1) === "") {
      lines.pop();
    }
  }

  const omissions = ensureArray(explanation.trace?.omissions);
  if (omissions.length > 0) {
    lines.push("", "## Omitted Or Suppressed", "");
    for (const omission of omissions) {
      lines.push(`- ${omission.stage}: ${omission.reason}`);
    }
  }

  lines.push("", "## Generated Context", "", explanation.text || "No additional context.");
  return lines.join("\n");
}

export async function runValidationSet({ runtime, caseIds = [] }) {
  const selected = caseIds.length > 0
    ? VALIDATION_CASES.filter((testCase) => caseIds.includes(testCase.id))
    : VALIDATION_CASES;

  const cases = [];
  for (const definition of selected) {
    const explanation = await explainMemoryRetrieval({
      runtime,
      prompt: definition.prompt,
      mode: definition.mode,
    });
    const evaluation = evaluateCase(definition, explanation);
    cases.push({
      id: definition.id,
      title: definition.title,
      mode: definition.mode,
      prompt: definition.prompt,
      passed: evaluation.passed,
      sectionTitles: evaluation.sectionTitles,
      assertions: evaluation.assertions,
      estimatedTokens: explanation.estimatedTokens ?? 0,
      trace: explanation.trace,
      text: explanation.text,
      promptNeed: explanation.promptNeed,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    repository: runtime.repository,
    latency: {
      sessionStartP95Ms: Math.round(runtime.metrics?.sessionStartP95 ?? 0),
      userPromptSubmittedP95Ms: Math.round(runtime.metrics?.userPromptSubmittedP95 ?? 0),
      sessionStartSamples: runtime.metrics?.sampleSize?.sessionStart ?? 0,
      userPromptSubmittedSamples: runtime.metrics?.sampleSize?.userPromptSubmitted ?? 0,
    },
    total: cases.length,
    passed: cases.filter((item) => item.passed).length,
    failed: cases.filter((item) => !item.passed).length,
    cases,
  };
}

export async function runReplayCorpus({ runtime, caseIds = [] }) {
  const selected = caseIds.length > 0
    ? REPLAY_CASES.filter((testCase) => caseIds.includes(testCase.id))
    : REPLAY_CASES;

  const cases = [];
  for (const definition of selected) {
    const explanation = await explainMemoryRetrieval({
      runtime,
      prompt: definition.prompt,
      mode: definition.mode,
    });
    const evaluation = evaluateCase(definition, explanation);
    const evidence = evaluateExpectedEvidence(definition, explanation);
    const missCategory = classifyReplayMiss(definition, explanation, evidence);
    const rankingOutcome = definition.caseType === "ranking_target"
      ? evidence.missingCount === 0 && evidence.expectedCount > 0
        ? "included"
        : evidence.includedCount > 0 || evidence.rankedOnlyCount > 0
          ? "partial"
          : "missing"
      : null;

    cases.push({
      id: definition.id,
      caseType: definition.caseType ?? "must_pass",
      title: definition.title,
      mode: definition.mode,
      prompt: definition.prompt,
      passed: evaluation.passed,
      rankingOutcome,
      missCategory,
      sectionTitles: evaluation.sectionTitles,
      assertions: evaluation.assertions,
      evidence,
      estimatedTokens: explanation.estimatedTokens ?? 0,
      trace: explanation.trace,
      text: explanation.text,
      promptNeed: explanation.promptNeed,
    });
  }

  const mustPassCases = cases.filter((item) => item.caseType === "must_pass");
  const rankingTargetCases = cases.filter((item) => item.caseType === "ranking_target");

  return {
    generatedAt: new Date().toISOString(),
    repository: runtime.repository,
    latency: {
      sessionStartP95Ms: Math.round(runtime.metrics?.sessionStartP95 ?? 0),
      userPromptSubmittedP95Ms: Math.round(runtime.metrics?.userPromptSubmittedP95 ?? 0),
      sessionStartSamples: runtime.metrics?.sampleSize?.sessionStart ?? 0,
      userPromptSubmittedSamples: runtime.metrics?.sampleSize?.userPromptSubmitted ?? 0,
    },
    total: cases.length,
    mustPassTotal: mustPassCases.length,
    mustPassPassed: mustPassCases.filter((item) => item.passed).length,
    mustPassFailed: mustPassCases.filter((item) => !item.passed).length,
    rankingTargetTotal: rankingTargetCases.length,
    rankingTargetIncluded: rankingTargetCases.filter((item) => item.rankingOutcome === "included").length,
    rankingTargetPartial: rankingTargetCases.filter((item) => item.rankingOutcome === "partial").length,
    rankingTargetMissing: rankingTargetCases.filter((item) => item.rankingOutcome === "missing").length,
    cases,
  };
}

export function renderValidationReport(result, { verbose = false } = {}) {
  const lines = [
    `validationCases: ${result.total}`,
    `passed: ${result.passed}`,
    `failed: ${result.failed}`,
    `repository: ${result.repository ?? "global-only"}`,
    `sessionStartP95Ms: ${result.latency.sessionStartP95Ms}`,
    `userPromptSubmittedP95Ms: ${result.latency.userPromptSubmittedP95Ms}`,
    `sessionStartSamples: ${result.latency.sessionStartSamples}`,
    `userPromptSubmittedSamples: ${result.latency.userPromptSubmittedSamples}`,
    "",
    "## Cases",
    "",
  ];

  const visibleCases = verbose
    ? result.cases
    : result.cases.filter((item) => !item.passed);

  if (visibleCases.length === 0) {
    lines.push("- All cases passed.");
    return lines.join("\n");
  }

  for (const item of visibleCases) {
    lines.push(`- ${item.passed ? "PASS" : "FAIL"} ${item.id} — ${item.title}`);
    lines.push(`  - mode: ${item.mode}`);
    lines.push(`  - sections: ${item.sectionTitles.join(", ") || "none"}`);
    const failedAssertions = item.assertions.filter((assertion) => !assertion.passed);
    const assertionsToShow = verbose ? item.assertions : failedAssertions;
    for (const assertion of assertionsToShow) {
      lines.push(`  - ${assertion.passed ? "ok" : "fail"}: ${assertion.label}`);
      if (!assertion.passed && assertion.details) {
        lines.push(`    ${assertion.details}`);
      }
    }
  }

  return lines.join("\n");
}

export function renderReplayReport(result, { verbose = false } = {}) {
  const lines = [
    `replayCases: ${result.total}`,
    `mustPassTotal: ${result.mustPassTotal}`,
    `mustPassPassed: ${result.mustPassPassed}`,
    `mustPassFailed: ${result.mustPassFailed}`,
    `rankingTargetTotal: ${result.rankingTargetTotal}`,
    `rankingTargetIncluded: ${result.rankingTargetIncluded}`,
    `rankingTargetPartial: ${result.rankingTargetPartial}`,
    `rankingTargetMissing: ${result.rankingTargetMissing}`,
    `repository: ${result.repository ?? "global-only"}`,
    `sessionStartP95Ms: ${result.latency.sessionStartP95Ms}`,
    `userPromptSubmittedP95Ms: ${result.latency.userPromptSubmittedP95Ms}`,
    `sessionStartSamples: ${result.latency.sessionStartSamples}`,
    `userPromptSubmittedSamples: ${result.latency.userPromptSubmittedSamples}`,
    "",
    "## Cases",
    "",
  ];

  const visibleCases = verbose
    ? result.cases
    : result.cases.filter((item) => item.caseType === "ranking_target" || !item.passed);

  if (visibleCases.length === 0) {
    lines.push("- All must-pass cases passed and no ranking targets are defined.");
    return lines.join("\n");
  }

  for (const item of visibleCases) {
    const prefix = item.caseType === "must_pass"
      ? item.passed ? "PASS" : "FAIL"
      : `TARGET ${String(item.rankingOutcome || "missing").toUpperCase()}`;
    lines.push(`- ${prefix} ${item.id} — ${item.title}`);
    lines.push(`  - type: ${item.caseType}`);
    lines.push(`  - mode: ${item.mode}`);
    lines.push(`  - sections: ${item.sectionTitles.join(", ") || "none"}`);
    if (item.caseType === "must_pass") {
      const failedAssertions = item.assertions.filter((assertion) => !assertion.passed);
      const assertionsToShow = verbose ? item.assertions : failedAssertions;
      for (const assertion of assertionsToShow) {
        lines.push(`  - ${assertion.passed ? "ok" : "fail"}: ${assertion.label}`);
        if (!assertion.passed && assertion.details) {
          lines.push(`    ${assertion.details}`);
        }
      }
    }
    if (item.caseType === "ranking_target" && item.missCategory) {
      lines.push(`  - missCategory: ${item.missCategory}`);
    }
    for (const evidence of ensureArray(item.evidence?.items)) {
      lines.push(
        `  - evidence ${evidence.label}: ${evidence.outcome}`
        + ` ranked=${evidence.bestRankedPosition ?? "none"}`
        + ` included=${evidence.bestIncludedPosition ?? "none"}`,
      );
      if (verbose && evidence.sample) {
        lines.push(`    sample: ${evidence.sample}`);
      }
      if (verbose && evidence.matchedLookups.length > 0) {
        lines.push(`    lookups: ${evidence.matchedLookups.join(", ")}`);
      }
    }
  }

  return lines.join("\n");
}
