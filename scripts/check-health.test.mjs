import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { REQUIRED_TOOLS, runHealthCheck } from "./check-health.mjs";

describe("check-health", () => {
  test("declares the required tool registry", () => {
    assert.deepStrictEqual(
      REQUIRED_TOOLS.map((tool) => tool.id),
      ["git", "gh", "node", "rtk"],
    );
  });

  test("reports missing required tools, failing validators, and skipped optional checks", async () => {
    const result = await runHealthCheck({
      repoRoot: "/repo",
      runCommand: async (command, args) => {
        const key = `${command} ${args.join(" ")}`.trim();
        if (key === "node skills/skill-authoring/scripts/validate-skill-library.mjs") {
          return { ok: true, code: 0, stdout: "skills ok", stderr: "" };
        }
        if (
          key ===
          "node skills/workflow-contracts/scripts/validate-contracts.mjs skills/workflow-contracts/assets/planner-handoff-v1.md skills/workflow-contracts/assets/review-outcome-v1.md skills/workflow-contracts/assets/execution-record-v1.md"
        ) {
          return { ok: false, code: 1, stdout: "", stderr: "contracts failed" };
        }
        if (command === "git" || command === "gh" || command === "node") {
          return { ok: true, code: 0, stdout: `${command} ok`, stderr: "" };
        }
        if (command === "rtk") {
          return { ok: false, code: null, stdout: "", stderr: "not found" };
        }

        throw new Error(`unexpected command: ${key}`);
      },
      pathExists: async (targetPath) =>
        [
          "/repo/skills/skill-authoring/scripts/validate-skill-library.mjs",
          "/repo/skills/workflow-contracts/scripts/validate-contracts.mjs",
          "/repo/skills/workflow-contracts/assets/planner-handoff-v1.md",
          "/repo/skills/workflow-contracts/assets/review-outcome-v1.md",
          "/repo/skills/workflow-contracts/assets/execution-record-v1.md",
        ].includes(targetPath),
    });

    assert.equal(result.ok, false);
    assert.equal(result.requiredFailureCount, 2);
    assert.equal(
      result.checks.find((check) => check.id === "frontmatter")?.status,
      "skipped",
    );
    assert.equal(
      result.checks.find((check) => check.id === "workflow-contracts")?.status,
      "fail",
    );
    assert.equal(
      result.dependencies.find((check) => check.id === "rtk")?.status,
      "fail",
    );
  });
});
