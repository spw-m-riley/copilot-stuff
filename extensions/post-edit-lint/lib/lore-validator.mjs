import path from "node:path";

const LORE_JSON_SEGMENT = `${path.sep}lore.json`;
const LORE_SCHEMA_JSON_SEGMENT = `${path.sep}schemas${path.sep}lore.schema.json`;
const LORE_CONFIG_MJS_SEGMENT = `${path.sep}extensions${path.sep}lore${path.sep}lib${path.sep}config.mjs`;

export function isLoreSchemaTrigger(filePath) {
  const normalized = path.resolve(filePath);
  return (
    normalized.endsWith(LORE_JSON_SEGMENT) ||
    normalized.endsWith(LORE_SCHEMA_JSON_SEGMENT) ||
    normalized.endsWith(LORE_CONFIG_MJS_SEGMENT)
  );
}

async function findLoreSchemaValidator(filePath, findUp) {
  return findUp(path.dirname(filePath), (dir) =>
    path.join(dir, "extensions", "lore", "scripts", "validate-config-schema.mjs"),
  );
}

export async function validateLoreSchema(filePath, { findUp, run, formatSummary }) {
  const validatorPath = await findLoreSchemaValidator(filePath, findUp);
  if (!validatorPath) {
    return [];
  }

  const result = await run(process.execPath, [validatorPath], {
    cwd: path.dirname(validatorPath),
  });
  return [formatSummary("lore-schema-parity", result)];
}
