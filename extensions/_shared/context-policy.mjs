export function normalizePrompt(prompt) {
  return typeof prompt === "string" ? prompt.trim() : "";
}

export function normalizeSessionId(sessionId) {
  if (typeof sessionId !== "string") {
    return null;
  }

  const normalized = sessionId.trim();
  return normalized.length > 0 ? normalized : null;
}

export function readChildMetadata(
  input,
  { extraFields = [], trimValues = false } = {},
) {
  const values = collectChildMetadataFields(input, extraFields).filter(hasText);
  const pieces = trimValues ? values.map(trimText) : values;
  return pieces.join(" ").toLowerCase();
}

function collectChildMetadataFields(input, extraFields) {
  const source = input && typeof input === "object" ? input : {};
  const subagent =
    source.subagent && typeof source.subagent === "object" ? source.subagent : {};

  return [
    source.agentName,
    source.agentDisplayName,
    source.agentDescription,
    subagent.agentName,
    subagent.agentDisplayName,
    subagent.agentDescription,
    ...extraFields,
  ];
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function trimText(value) {
  return value.trim();
}

export function setBoundedContext(
  map,
  key,
  value,
  maxEntries,
  { refreshExisting = false } = {},
) {
  if (!key) {
    return;
  }

  if (refreshExisting && map.has(key)) {
    map.delete(key);
  }

  map.set(key, value);

  while (map.size > maxEntries) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    map.delete(oldestKey);
  }
}
