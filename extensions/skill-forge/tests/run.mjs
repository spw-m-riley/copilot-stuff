import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

process.env.SKILL_FORGE_NO_AUTOSTART = "1";

const modulePath = new URL("../extension.mjs", import.meta.url);
const {
  buildSkillMarkdown,
  createSkillFromAnswers,
  joinSession,
  sanitizeSkillName,
  validateSkillAnswers,
} = await import(modulePath.href);

const FIXTURE_ROOT = path.resolve(new URL(".fixtures", import.meta.url).pathname);
let fixtureCounter = 0;

async function withRepo(fn) {
  fixtureCounter += 1;
  const root = path.join(FIXTURE_ROOT, `repo-${fixtureCounter}`);
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, "copilot-instructions.md"), "# test instructions\n", "utf8");
  try {
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const validAnswers = {
  skillName: "demo-skill",
  description: "Use when creating a demo skill for tests.",
  applyTo: "**/*.md",
  useCases: "Create a new skill\nRefresh an existing workflow",
  referenceFiles: "copilot-instructions.md",
};

await withRepo(async (root) => {
  await createSkillFromAnswers(validAnswers, { repoRoot: root });
  const createdPath = path.join(root, "skills", "demo-skill", "SKILL.md");
  const text = await readFile(createdPath, "utf8");
  assert.match(text, /^---\nname: demo-skill\n/m);
  assert.match(text, /description: "Use when creating a demo skill for tests\."/);
  assert.match(text, /applyTo: "\*\*\/\*\.md"/);
  assert.match(text, /# Demo Skill/);
  assert.match(text, /## Learned Rules\n\n<!-- New Rules appended below this line\. Do not edit above this section -->\n$/);
});

for (const badName of ["../escape", "bad/name", ".hidden", "MixedCase", ""]) {
  assert.throws(
    () => sanitizeSkillName(badName),
    /Skill name must match/,
    `expected ${JSON.stringify(badName)} to be rejected`,
  );
}

await withRepo(async (root) => {
  await createSkillFromAnswers(validAnswers, { repoRoot: root });
  await assert.rejects(
    () => createSkillFromAnswers(validAnswers, { repoRoot: root }),
    /already exists/,
  );
});

const frontmatter = buildSkillMarkdown(validAnswers, {
  sanitizedName: "demo-skill",
  references: ["../../copilot-instructions.md"],
});
assert.match(frontmatter, /^---\nname: demo-skill\ndescription: "Use when creating a demo skill for tests\."\nmetadata:\n  category: custom\n  audience: general-coding-agent\n  maturity: draft\n  kind: task\n  applyTo: "\*\*\/\*\.md"\n---/);

assert.deepEqual(validateSkillAnswers(validAnswers).errors, []);

let registeredCommands = [];
await joinSession(async (config) => {
  registeredCommands = config.commands;
  return { ok: true };
});
assert.equal(registeredCommands.length, 1);
assert.equal(registeredCommands[0].name, "skill-forge");
assert.match(registeredCommands[0].description, /SKILL\.md/);

await rm(FIXTURE_ROOT, { recursive: true, force: true });

console.log("skill-forge tests passed");
