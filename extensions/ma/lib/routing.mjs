import { statSync } from "node:fs";
import { resolve } from "node:path";
import { readChildMetadata } from "../../_shared/context-policy.mjs";

const REDUCTION_CUES = [
  "reduction",
  "reduce",
  "reduced context",
  "structure",
  "outline",
  "summary",
  "summarize",
  "compress",
  "skeleton",
  "schema",
  "minify",
  "dedup",
  "duplicate rules",
];

const UNDERSTANDING_CUES = [
  "read",
  "review",
  "inspect",
  "understand",
  "trace",
  "analyze",
  "summarize",
];

const PROMPT_DENY_KEYWORDS = [
  "edit",
  "fix",
  "implement",
  "update",
  "write",
  "create",
  "patch",
  "delete",
  "rename",
  "refactor",
  "map the repo",
  "codebase map",
  "plan it",
];

const CHILD_ALLOW_KEYWORDS = [
  "read",
  "reader",
  "inspect",
  "understand",
  "summary",
  "summarize",
  "research",
  "explore",
  "trace",
  "analyze",
];

const CHILD_DENY_KEYWORDS = [
  "edit",
  "patch",
  "implement",
  "implementation",
  "fix",
  "update",
  "write",
  "create",
  "config",
  "configure",
  "healthcheck",
  "test",
];

const FILE_REFERENCE_RE =
  /(?:@[\w./-]+|\b(?:\.{1,2}\/|\/)?[\w./-]+\.(?:md|txt|adoc|rst|js|mjs|cjs|ts|tsx|json|jsonc|ya?ml|lua|go|tf|tfvars|hcl|sh)\b)/iu;

// Capture version: match path-like refs (with ./ ../ / or explicit extension)
const FILE_REFERENCE_EXTRACT_RE =
  /((?:\.{1,2}\/|\/)?[\w./-]+\.(?:md|txt|adoc|rst|js|mjs|cjs|ts|tsx|json|jsonc|ya?ml|lua|go|tf|tfvars|hcl|sh))\b/giu;

const LARGE_FILE_BYTES = 10240; // 10KB
const MAX_FILE_REFS_TO_STAT = 5;

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

/**
 * Extract resolvable file paths from a prompt.
 * Skips bare @mentions (which are Copilot reference syntax, not filesystem paths).
 */
export function extractFileReferences(prompt) {
  if (typeof prompt !== "string") return [];

  const seen = new Set();
  const refs = [];

  for (const match of prompt.matchAll(FILE_REFERENCE_EXTRACT_RE)) {
    const ref = match[1];
    if (!seen.has(ref)) {
      seen.add(ref);
      refs.push(ref);
    }
    if (refs.length >= MAX_FILE_REFS_TO_STAT) break;
  }

  return refs;
}

/**
 * Check whether any referenced file exceeds the size threshold.
 * Returns on first large file found. Only stats actual files, not directories.
 */
export function hasLargeReferencedFile(prompt, cwd) {
  if (!cwd) return false;

  const refs = extractFileReferences(prompt);
  for (const ref of refs) {
    try {
      const resolved = resolve(cwd, ref);
      const stat = statSync(resolved);
      if (stat.isFile() && stat.size > LARGE_FILE_BYTES) return true;
    } catch {
      // file doesn't exist or can't be read — skip
    }
  }
  return false;
}

/**
 * Determine whether to recommend ma tools for this prompt.
 *
 * Returns:
 *  - 'strong' — explicit reduction request, clear understanding intent, or large file
 *  - 'soft'   — prompt references files that could benefit from a read-first pass
 *  - null     — no recommendation (no file references)
 *
 * The boolean wrapper `shouldRecommendMaForPrompt` preserves backward compatibility.
 */
export function getMaRecommendationStrength(prompt, { hasLargeFile = false } = {}) {
  if (typeof prompt !== "string") return null;

  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return null;

  const hasReductionCue = includesAny(normalized, REDUCTION_CUES);
  const hasUnderstandingCue = includesAny(normalized, UNDERSTANDING_CUES);
  const hasFileReference = FILE_REFERENCE_RE.test(prompt);
  const hasDenyKeyword = includesAny(normalized, PROMPT_DENY_KEYWORDS);

  // Explicit reduction request always wins
  if (hasReductionCue) return "strong";

  // Understanding cue + file reference
  if (hasUnderstandingCue && hasFileReference) {
    return hasDenyKeyword ? "soft" : "strong";
  }

  // Large file referenced — strong recommendation
  if (hasFileReference && hasLargeFile) return "strong";

  // File reference without an explicit edit-heavy action — soft nudge toward read-first
  if (hasFileReference) return hasDenyKeyword ? null : "soft";

  return null;
}

/**
 * Boolean wrapper for backward compatibility.
 * Equivalent to `getMaRecommendationStrength(prompt) !== null`.
 */
export function shouldRecommendMaForPrompt(prompt, options) {
  return getMaRecommendationStrength(prompt, options) !== null;
}

export function buildMaParentContext() {
  return [
    "ma reduction guidance:",
    "- When the task is understanding a known local file rather than editing it, prefer ma reduction tools first.",
    "- Start with ma_smart_read for large local files when you want reduced context before deciding on a full-fidelity read.",
    "- Use ma_skeleton for code shape, ma_compress for prose, ma_minify_schema for schemas, and ma_dedup for instruction-file duplicate audits.",
    "- If exact line-by-line fidelity matters or you are preparing an edit, use view instead of ma.",
    "- Do not use ma for repo discovery or planning; keep that with context-map or normal search tools.",
  ].join("\n");
}

export function buildMaSoftParentContext() {
  return [
    "ma reduction hint:",
    "- This prompt references files that may benefit from reduced context before editing.",
    "- Consider ma_smart_read for large files to understand structure before reading in full.",
    "- When ready to edit, switch to view for exact line-by-line fidelity.",
    "- Files under ~200 lines pass through unchanged, so there is no penalty for trying ma_smart_read first.",
  ].join("\n");
}

export function buildMaChildContext() {
  return [
    "Parent prompt matched ma guidance.",
    "- If you are reading local files for understanding, start with ma_smart_read or a narrower ma tool before falling back to view.",
    "- Use view only when exact source fidelity or edit preparation matters.",
  ].join("\n");
}

export function shouldInjectMaChildContext(input) {
  const metadata = readChildMetadata(input, { trimValues: true }).trim();
  if (!metadata) {
    return false;
  }

  return includesAny(metadata, CHILD_ALLOW_KEYWORDS) && !includesAny(metadata, CHILD_DENY_KEYWORDS);
}
