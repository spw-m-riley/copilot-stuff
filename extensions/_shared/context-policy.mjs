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
  const values = [input?.agentName, input?.agentDisplayName, input?.agentDescription, ...extraFields]
    .filter((value) => typeof value === "string" && value.trim().length > 0);

  const pieces = trimValues ? values.map((value) => value.trim()) : values;
  return pieces.join(" ").toLowerCase();
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
