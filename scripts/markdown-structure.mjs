export function normalize(text) {
  return text.replace(/\r\n?/g, "\n");
}

export function extractFrontmatter(text) {
  const normalized = normalize(text);
  if (!normalized.startsWith("---\n")) {
    throw new Error("missing frontmatter block");
  }

  const endMatch = normalized.slice(4).match(/\n---(?:\n|$)/);
  if (!endMatch) {
    throw new Error("unterminated frontmatter block");
  }

  const endIndex = 4 + endMatch.index;
  const bodyStart = endIndex + endMatch[0].length;
  return {
    frontmatterText: normalized.slice(4, endIndex),
    body: normalized.slice(bodyStart),
  };
}

function parseScalar(value) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === "null") {
    return null;
  }
  const quoted = value.match(/^(['"])(.*)\1$/);
  return quoted ? quoted[2] : value;
}

export function parseFrontmatter(text) {
  const { frontmatterText, body } = extractFrontmatter(text);
  const frontmatter = {};
  let currentObject = null;

  for (const line of frontmatterText.split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const indent = line.length - line.trimStart().length;
    if (indent === 0) {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        throw new Error(`invalid frontmatter line: ${line}`);
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!value) {
        const nestedObject = {};
        frontmatter[key] = nestedObject;
        currentObject = nestedObject;
      } else {
        frontmatter[key] = parseScalar(value);
        currentObject = null;
      }
      continue;
    }

    if (!currentObject || indent < 2) {
      throw new Error(`unexpected frontmatter indentation: ${line}`);
    }

    const trimmed = line.trim();
    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) {
      throw new Error(`invalid nested frontmatter line: ${line}`);
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    currentObject[key] = parseScalar(value);
  }

  return { frontmatter, body };
}

function parseOpeningFence(line) {
  const trimmed = line.trimStart();
  const match = trimmed.match(/^(?:[-+*]|\d+\.)?\s*(`{3,}|~{3,})/);
  if (!match) {
    return null;
  }

  return {
    marker: match[1][0],
    length: match[1].length,
  };
}

function isClosingFence(line, openingFence) {
  const trimmed = line.trimStart();
  const match = trimmed.match(/^(?:[-+*]|\d+\.)?\s*(`{3,}|~{3,})\s*$/);
  return Boolean(
    match &&
      match[1][0] === openingFence.marker &&
      match[1].length >= openingFence.length,
  );
}

export function stripFencedCodeBlocks(body) {
  const lines = body.split("\n");
  const strippedLines = [];
  const errors = [];
  let openingFence = null;
  let openingFenceLine = -1;

  for (const [index, line] of lines.entries()) {
    if (!openingFence) {
      const fence = parseOpeningFence(line);
      if (fence) {
        openingFence = fence;
        openingFenceLine = index + 1;
        strippedLines.push("");
        continue;
      }

      strippedLines.push(line);
      continue;
    }

    if (isClosingFence(line, openingFence)) {
      openingFence = null;
      openingFenceLine = -1;
      strippedLines.push("");
      continue;
    }

    strippedLines.push("");
  }

  if (openingFence) {
    errors.push(
      `unterminated fenced code block starting on line ${openingFenceLine}`,
    );
  }

  return {
    searchableBody: strippedLines.join("\n"),
    errors,
  };
}

export function findHeadingLineIndexes(lines, heading) {
  const indexes = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const leadingSpaces = line.length - line.trimStart().length;
    const normalizedHeadingLine = line.trim().replace(/\s+#+\s*$/, "");
    if (leadingSpaces < 4 && normalizedHeadingLine === heading) {
      indexes.push(index);
    }
  }
  return indexes;
}

export function findHeadingLineIndex(lines, heading) {
  return findHeadingLineIndexes(lines, heading)[0] ?? -1;
}
