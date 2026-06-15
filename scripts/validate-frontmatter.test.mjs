import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { describe, test } from "node:test";

const REPO_ROOT = "/Users/matthew.riley/.copilot";
const SCRIPT_PATH = path.join(REPO_ROOT, "scripts/validate-frontmatter.mjs");
const FIXTURE_ROOT = path.join(REPO_ROOT, ".tmp/validate-frontmatter-tests");

async function withFixtureDir(run) {
  await rm(FIXTURE_ROOT, { recursive: true, force: true });
  await mkdir(FIXTURE_ROOT, { recursive: true });

  try {
    await run(FIXTURE_ROOT);
  } finally {
    await rm(FIXTURE_ROOT, { recursive: true, force: true });
  }
}

function runValidator(args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [SCRIPT_PATH, ...args], { cwd: REPO_ROOT });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

describe("validate-frontmatter script", () => {
  test("accepts a simple standalone YAML file", async () => {
    await withFixtureDir(async (fixtureDir) => {
      const yamlPath = path.join(fixtureDir, "valid.yaml");
      await writeFile(yamlPath, "name: example\ndescription: ok\n");

      const result = await runValidator([yamlPath]);

      assert.equal(result.code, 0);
      assert.match(result.stdout, /0 error/);
    });
  });

  test("accepts standalone YAML document markers", async () => {
    await withFixtureDir(async (fixtureDir) => {
      const yamlPath = path.join(fixtureDir, "document.yaml");
      await writeFile(yamlPath, "---\nname: example\n...\n");

      const result = await runValidator([yamlPath]);

      assert.equal(result.code, 0);
      assert.match(result.stdout, /0 error/);
    });
  });

  test("rejects trailing colon-space and stray inline comments", async () => {
    await withFixtureDir(async (fixtureDir) => {
      const yamlPath = path.join(fixtureDir, "invalid.yaml");
      await writeFile(yamlPath, "name: \ndescription: value # nope\n");

      const result = await runValidator([yamlPath]);

      assert.equal(result.code, 1);
      assert.match(result.stderr, /trailing ": " with no value/);
      assert.match(result.stderr, /stray inline comment marker " #"/);
    });
  });

  test("rejects missing markdown frontmatter", async () => {
    await withFixtureDir(async (fixtureDir) => {
      const markdownPath = path.join(fixtureDir, "missing-frontmatter.md");
      await writeFile(markdownPath, "# No frontmatter\n");

      const result = await runValidator([markdownPath]);

      assert.equal(result.code, 1);
      assert.match(result.stderr, /missing frontmatter block/);
    });
  });

  test("flags BOM and CRLF issues in YAML files", async () => {
    await withFixtureDir(async (fixtureDir) => {
      const yamlPath = path.join(fixtureDir, "crlf.yaml");
      await writeFile(yamlPath, "\ufeffname: example\r\ndescription: ok\r\n");

      const result = await runValidator([yamlPath]);

      assert.equal(result.code, 1);
      assert.match(result.stderr, /UTF-8 BOM/);
      assert.match(result.stderr, /CRLF or CR line endings/);
    });
  });
});
