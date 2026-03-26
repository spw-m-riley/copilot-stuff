export const MEMORY_SCOPE = Object.freeze({
  GLOBAL: "global",
  TRANSFERABLE: "transferable",
  REPO: "repo",
});

const VALID_SCOPES = new Set(Object.values(MEMORY_SCOPE));

const REPO_SPECIFIC_PATTERNS = [
  /\bthis repo\b/i,
  /\bthis repository\b/i,
  /\bcurrent repo\b/i,
  /\bcurrent repository\b/i,
  /\bin this repo\b/i,
  /\bin this repository\b/i,
  /\bfor this repo\b/i,
  /\bfor this repository\b/i,
  /\bon this branch\b/i,
  /\bpackage\.json\b/i,
  /\btsconfig\b/i,
  /\bworkflow file\b/i,
  /\bworktree\b/i,
];

const TRANSFERABLE_PATTERNS = [
  /\bci\b/i,
  /\bcircleci\b/i,
  /\bgithub actions\b/i,
  /\bworkflow migration\b/i,
  /\bmigration\b/i,
  /\brollout\b/i,
  /\bplaybook\b/i,
  /\bpattern\b/i,
  /\bexample\b/i,
  /\bexamples\b/i,
  /\breuse\b/i,
  /\btesting\b/i,
  /\bauth\b/i,
  /\bdeployment\b/i,
  /\brelease\b/i,
];

const GLOBAL_PREFERENCE_PATTERNS = [
  /\bstyle\b/i,
  /\btone\b/i,
  /\brespond\b/i,
  /\breply\b/i,
  /\bhow you\b/i,
  /\bwhen i call you\b/i,
  /\bassistant\b/i,
  /\byour name\b/i,
  /\bcall you\b/i,
  /\bcoda\b/i,
];

const ASSISTANT_IDENTITY_PATTERNS = [
  /^(?:hi|hello|hey)\s+coda\b/i,
  /^coda[,:!?]?\s/i,
  /\bcall you coda\b/i,
  /\byour name is coda\b/i,
  /\buse the name coda\b/i,
  /\bused the name coda\b/i,
  /\bwhy i used the name coda\b/i,
];

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeRepository(repository) {
  return typeof repository === "string" && repository.trim().length > 0
    ? repository.trim()
    : null;
}

function textFromParts(parts) {
  return parts
    .flatMap((part) => Array.isArray(part) ? part : [part])
    .map((part) => normalizeText(part))
    .filter(Boolean)
    .join(" ");
}

function hasPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function normalizeMetadata(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? { ...value }
    : {};
}

function finalizeScope({ scope, repository, metadata }) {
  const normalizedRepository = normalizeRepository(repository);
  const normalizedMetadata = normalizeMetadata(metadata);
  if (scope === MEMORY_SCOPE.GLOBAL) {
    if (normalizedRepository && !normalizedMetadata.originRepository) {
      normalizedMetadata.originRepository = normalizedRepository;
    }
    return {
      scope,
      repository: null,
      metadata: normalizedMetadata,
    };
  }
  return {
    scope,
    repository: normalizedRepository,
    metadata: normalizedMetadata,
  };
}

export function normalizeScope(scope, fallback = MEMORY_SCOPE.REPO) {
  if (typeof scope !== "string") {
    return fallback;
  }
  const normalized = scope.trim().toLowerCase();
  return VALID_SCOPES.has(normalized) ? normalized : fallback;
}

export function detectAssistantIdentityName(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return null;
  }
  return hasPattern(normalized, ASSISTANT_IDENTITY_PATTERNS) ? "Coda" : null;
}

export function classifySemanticMemory(memory) {
  const explicitScope = normalizeScope(memory.scope, null);
  const repository = normalizeRepository(memory.repository);
  const metadata = normalizeMetadata(memory.metadata);
  if (explicitScope) {
    return finalizeScope({
      scope: explicitScope,
      repository,
      metadata,
    });
  }

  const text = textFromParts([
    memory.type,
    memory.content,
    memory.tags,
    metadata.reason,
    metadata.note,
  ]);
  const type = normalizeText(memory.type).toLowerCase();

  if (type === "assistant_identity" || detectAssistantIdentityName(text)) {
    return finalizeScope({
      scope: MEMORY_SCOPE.GLOBAL,
      repository,
      metadata,
    });
  }

  if (["open_loop", "blocker", "commitment"].includes(type)) {
    return finalizeScope({
      scope: MEMORY_SCOPE.REPO,
      repository,
      metadata,
    });
  }

  const repoSpecific = hasPattern(text, REPO_SPECIFIC_PATTERNS);
  const transferable = hasPattern(text, TRANSFERABLE_PATTERNS);
  const globalPreference = hasPattern(text, GLOBAL_PREFERENCE_PATTERNS);

  if (["user_preference", "rejected_approach"].includes(type)) {
    if (repoSpecific) {
      return finalizeScope({
        scope: MEMORY_SCOPE.REPO,
        repository,
        metadata,
      });
    }
    if (transferable && !globalPreference) {
      return finalizeScope({
        scope: MEMORY_SCOPE.TRANSFERABLE,
        repository,
        metadata,
      });
    }
    return finalizeScope({
      scope: MEMORY_SCOPE.GLOBAL,
      repository,
      metadata,
    });
  }

  if (transferable) {
    return finalizeScope({
      scope: MEMORY_SCOPE.TRANSFERABLE,
      repository,
      metadata,
    });
  }

  if (!repository) {
    return finalizeScope({
      scope: MEMORY_SCOPE.GLOBAL,
      repository,
      metadata,
    });
  }

  return finalizeScope({
    scope: MEMORY_SCOPE.REPO,
    repository,
    metadata,
  });
}

export function classifyEpisodeDigest(digest) {
  const explicitScope = normalizeScope(digest.scope, null);
  const repository = normalizeRepository(digest.repository);
  if (explicitScope) {
    return {
      scope: explicitScope,
      repository: explicitScope === MEMORY_SCOPE.GLOBAL ? null : repository,
    };
  }

  const openItems = Array.isArray(digest.openItems) ? digest.openItems : [];
  if (openItems.length > 0) {
    return {
      scope: MEMORY_SCOPE.REPO,
      repository,
    };
  }

  const text = textFromParts([
    digest.summary,
    digest.actions,
    digest.decisions,
    digest.learnings,
    digest.themes,
    digest.refs,
  ]);

  if (hasPattern(text, TRANSFERABLE_PATTERNS)) {
    return {
      scope: MEMORY_SCOPE.TRANSFERABLE,
      repository,
    };
  }

  return {
    scope: MEMORY_SCOPE.REPO,
    repository,
  };
}
