import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildMaParentContext,
  buildMaSoftParentContext,
  extractFileReferences,
  getMaRecommendationStrength,
  shouldInjectMaChildContext,
  shouldRecommendMaForPrompt,
} from "../lib/routing.mjs";

describe("ma routing", () => {
  describe("getMaRecommendationStrength", () => {
    test("returns 'strong' for reduction-first file understanding prompts", () => {
      assert.equal(
        getMaRecommendationStrength(
          "Read @README.md with reduction first; I only need the architecture structure before deeper inspection.",
        ),
        "strong",
      );
    });

    test("returns 'strong' for explicit reduction cues even with deny keywords", () => {
      assert.equal(
        getMaRecommendationStrength(
          "Before I edit, compress the large instruction file to see its structure.",
        ),
        "strong",
      );
    });

    test("returns 'soft' for understanding + file ref with edit-heavy action", () => {
      assert.equal(
        getMaRecommendationStrength(
          "Read auth.ts and fix the login bug.",
        ),
        "soft",
      );
    });

    test("returns 'soft' for understanding + file ref with narrow deny keywords", () => {
      assert.equal(
        getMaRecommendationStrength(
          "Read auth.ts and patch the login handler.",
        ),
        "soft",
      );
    });

    test("returns 'strong' for file ref + large file", () => {
      assert.equal(
        getMaRecommendationStrength(
          "What does utils.ts do?",
          { hasLargeFile: true },
        ),
        "strong",
      );
    });

    test("returns null for edit-heavy prompts with file references", () => {
      assert.equal(
        getMaRecommendationStrength(
          "Fix the bug in auth.ts",
        ),
        null,
      );
    });

    test("returns null for implementation prompts referencing files", () => {
      assert.equal(
        getMaRecommendationStrength(
          "Implement the new handler in server.ts",
        ),
        null,
      );
    });

    test("returns null for deny keywords without file ref", () => {
      assert.equal(
        getMaRecommendationStrength(
          "Implement the new feature for user authentication.",
        ),
        null,
      );
    });

    test("returns null for repo discovery prompts without file refs", () => {
      assert.equal(
        getMaRecommendationStrength(
          "Map the codebase and find the modules involved.",
        ),
        null,
      );
    });

    test("returns null for non-string input", () => {
      assert.equal(getMaRecommendationStrength(null), null);
      assert.equal(getMaRecommendationStrength(undefined), null);
      assert.equal(getMaRecommendationStrength(42), null);
    });

    test("returns null for empty prompt", () => {
      assert.equal(getMaRecommendationStrength(""), null);
      assert.equal(getMaRecommendationStrength("   "), null);
    });
  });

  describe("shouldRecommendMaForPrompt (boolean wrapper)", () => {
    test("returns true when strength is non-null", () => {
      assert.equal(
        shouldRecommendMaForPrompt(
          "Read @README.md with reduction first; I only need the architecture structure.",
        ),
        true,
      );
    });

    test("returns false when strength is null", () => {
      assert.equal(
        shouldRecommendMaForPrompt(
          "Implement the new user auth module.",
        ),
        false,
      );
    });
  });

  describe("extractFileReferences", () => {
    test("extracts path-like references from prompts", () => {
      const refs = extractFileReferences("Look at ./src/auth.ts and ../lib/utils.mjs");
      assert.ok(refs.includes("./src/auth.ts"));
      assert.ok(refs.includes("../lib/utils.mjs"));
    });

    test("extracts bare extension-bearing filenames", () => {
      const refs = extractFileReferences("Check README.md and config.json");
      assert.ok(refs.includes("README.md"));
      assert.ok(refs.includes("config.json"));
    });

    test("deduplicates file references", () => {
      const refs = extractFileReferences("Read auth.ts then read auth.ts again");
      assert.equal(refs.filter((r) => r === "auth.ts").length, 1);
    });

    test("returns empty for non-string input", () => {
      assert.deepEqual(extractFileReferences(null), []);
      assert.deepEqual(extractFileReferences(undefined), []);
    });

    test("caps extraction at limit", () => {
      const prompt = "a.ts b.ts c.ts d.ts e.ts f.ts g.ts h.ts";
      const refs = extractFileReferences(prompt);
      assert.ok(refs.length <= 5);
    });
  });

  describe("context builders", () => {
    test("builds strong parent guidance that points at ma tools", () => {
      const context = buildMaParentContext();
      assert.match(context, /ma_smart_read/u);
      assert.match(context, /ma_skeleton/u);
      assert.match(context, /view/u);
    });

    test("builds soft parent guidance with read-first suggestion", () => {
      const context = buildMaSoftParentContext();
      assert.match(context, /ma_smart_read/u);
      assert.match(context, /view/u);
      assert.match(context, /hint/u);
    });
  });

  describe("shouldInjectMaChildContext", () => {
    test("injects child guidance for understanding-oriented delegates", () => {
      assert.equal(
        shouldInjectMaChildContext({
          agentName: "repo-reader",
          agentDescription: "Read a few files and summarize the structure",
        }),
        true,
      );
    });

    test("does not inject child guidance for implementation delegates", () => {
      assert.equal(
        shouldInjectMaChildContext({
          agentName: "implementation-lane",
          agentDescription: "Patch the extension and update tests",
        }),
        false,
      );
    });
  });
});
