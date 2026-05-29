import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const testFiles = readdirSync(testDir)
  .filter((name) => name.endsWith(".test.mjs"))
  .map((name) => path.join(testDir, name));
const result = spawnSync(process.execPath, ["--test", ...testFiles], {
  cwd: path.resolve(testDir, "../../.."),
  stdio: "inherit",
});

process.exit(result.status ?? 1);
