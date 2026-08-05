import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { GLOBAL_POOL_FILES, validateRuleIds } from "./validate-rule-ids.mjs";

function fakeReader(files) {
  return async (relativePath) =>
    Object.prototype.hasOwnProperty.call(files, relativePath) ? files[relativePath] : null;
}

describe("validate-rule-ids", () => {
  test("declares the expected global-pool file set", () => {
    assert.deepStrictEqual(GLOBAL_POOL_FILES, [
      "copilot-instructions.md",
      "copilot-instructions-deprecated.md",
      "instructions/go.instructions.md",
      "instructions/memory.instructions.md",
      "instructions/shell.instructions.md",
      "instructions/review.instructions.md",
      "instructions/github.instructions.md",
    ]);
  });

  test("passes when every ID is unique across the global pool", async () => {
    const result = await validateRuleIds({
      globalPoolFiles: ["a.md", "b.md"],
      readFileFn: fakeReader({
        "a.md": "1. [GIT] Do the thing - reason\n2. [DOCS] Do another thing - reason\n",
        "b.md": "3. [SHELL] Do a third thing - reason\n",
      }),
    });

    assert.equal(result.ok, true);
    assert.deepStrictEqual(result.issues, []);
  });

  test("flags the same ID reused with different content across files", async () => {
    const result = await validateRuleIds({
      globalPoolFiles: ["a.md", "b.md"],
      readFileFn: fakeReader({
        "a.md": "5. [GIT] Original rule text - reason\n",
        "b.md": "5. [SHELL] Unrelated rule text - reason\n",
      }),
    });

    assert.equal(result.ok, false);
    assert.equal(result.issues.length, 1);
    assert.match(result.issues[0], /duplicate global-pool rule ID 5/);
  });

  test("does not flag the same ID reused with identical content", async () => {
    const result = await validateRuleIds({
      globalPoolFiles: ["a.md", "b.md"],
      readFileFn: fakeReader({
        "a.md": "7. [GIT] Same wording preserved verbatim - reason\n",
        "b.md": "7. [GIT] Same wording preserved verbatim - reason\n",
      }),
    });

    assert.equal(result.ok, true);
  });

  test("flags duplicate IDs with different content within a single file", async () => {
    const result = await validateRuleIds({
      globalPoolFiles: ["a.md"],
      readFileFn: fakeReader({
        "a.md": "9. [GIT] First version - reason\n9. [GIT] Second, different version - reason\n",
      }),
    });

    assert.equal(result.ok, false);
    assert.match(result.issues[0], /rule 9 appears 2 times with different content/);
  });

  test("excludes fenced blocks archived under an other-file local-rule heading", async () => {
    const result = await validateRuleIds({
      globalPoolFiles: ["deprecated.md", "go.md"],
      readFileFn: fakeReader({
        "deprecated.md":
          "### Lua Rule 6 (Deprecated: Superseded by Lua Rule 5)\n\n```\n6. [NEOVIM] Lua-local rule text - reason\n```\n",
        "go.md": "6. [GO] Unrelated Go rule text - reason\n",
      }),
    });

    assert.equal(result.ok, true);
  });

  test("still flags collisions under a plain 'Rule N' heading", async () => {
    const result = await validateRuleIds({
      globalPoolFiles: ["deprecated.md", "go.md"],
      readFileFn: fakeReader({
        "deprecated.md":
          "### Rule 6 (Deprecated: Superseded by Rule 5)\n\n```\n6. [WORKTREE] Global rule text - reason\n```\n",
        "go.md": "6. [GO] Unrelated Go rule text - reason\n",
      }),
    });

    assert.equal(result.ok, false);
    assert.match(result.issues[0], /duplicate global-pool rule ID 6/);
  });

  test("reports missing global-pool files instead of throwing", async () => {
    const result = await validateRuleIds({
      globalPoolFiles: ["missing.md"],
      readFileFn: fakeReader({}),
    });

    assert.equal(result.ok, false);
    assert.match(result.issues[0], /global-pool file not found: missing\.md/);
  });
});
