import { describe, test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isInstructionTrigger, validateInstructionFile } from "../lib/instruction-validator.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "fixtures");

function summaryFailed(summaries) {
  return summaries.some((summary) => summary.includes(": failed"));
}

async function validateFixture(...segments) {
  return validateInstructionFile(path.join(fixturesDir, ...segments), { formatSummary });
}

function formatSummary(label, result) {
  const output = (result.stderr || result.stdout || "").trim();
  return result.ok ? `- ${label}: ok` : `- ${label}: failed\n${output}`;
}

describe("instruction-validator", () => {
  test("matches instruction files and SKILL.md files only", () => {
    assert.equal(isInstructionTrigger(path.join(fixturesDir, "instructions", "valid.instructions.md")), true);
    assert.equal(isInstructionTrigger(path.join(fixturesDir, "skills", "SKILL.md")), true);
    assert.equal(isInstructionTrigger(path.join(fixturesDir, "skills", "README.md")), false);
  });

  test("accepts a valid instruction file and a valid SKILL.md", async () => {
    assert.equal(summaryFailed(await validateFixture("instructions", "valid.instructions.md")), false);
    assert.equal(summaryFailed(await validateFixture("skills", "valid", "SKILL.md")), false);
  });

  test("rejects missing frontmatter description", async () => {
    const summaries = await validateFixture("instructions", "missing-description.instructions.md");
    assert.equal(summaryFailed(summaries), true);
    assert.match(summaries.join("\n"), /description/);
  });

  test("rejects missing applyTo on instruction files", async () => {
    const summaries = await validateFixture("instructions", "missing-apply-to.instructions.md");
    assert.equal(summaryFailed(summaries), true);
    assert.match(summaries.join("\n"), /applyTo/);
  });

  test("rejects Learned Rules when it is not the last H2", async () => {
    const summaries = await validateFixture("instructions", "learned-rules-not-last.instructions.md");
    assert.equal(summaryFailed(summaries), true);
    assert.match(summaries.join("\n"), /Learned Rules.*last H2/);
  });

  test("rejects SKILL.md without resolvable Reference files entries", async () => {
    const summaries = await validateFixture("skills", "missing-reference", "SKILL.md");
    assert.equal(summaryFailed(summaries), true);
    assert.match(summaries.join("\n"), /Reference files/);
  });

  test("rejects unresolvable backticked paths in Reference files", async () => {
    const summaries = await validateFixture("skills", "bad-reference", "SKILL.md");
    assert.equal(summaryFailed(summaries), true);
    assert.match(summaries.join("\n"), /missing\.md/);
  });
});

describe("instruction-validator edge cases", () => {
  test("accepts resolvable sibling Reference files paths", async () => {
    assert.equal(summaryFailed(await validateFixture("skills", "sibling-reference", "SKILL.md")), false);
  });

  test("ignores H2 headings inside longer fenced code blocks", async () => {
    assert.equal(summaryFailed(await validateFixture("instructions", "fenced-heading.instructions.md")), false);
  });
});
