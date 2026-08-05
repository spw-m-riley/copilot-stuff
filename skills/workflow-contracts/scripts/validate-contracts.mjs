import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  findHeadingLineIndex,
  parseFrontmatter,
  stripFencedCodeBlocks,
} from "../../../scripts/markdown-structure.mjs";

const SHARED_FRONTMATTER = [
  "contract_type",
  "contract_version",
  "created_by",
  "status",
];

const CONTRACT_SPECS = {
  "planner-handoff": {
    requiredFrontmatter: ["task_id", "parallelizable", "worktree_required"],
    statusValues: new Set(["draft", "ready", "blocked"]),
    requiredHeadings: [
      "## goal",
      "## files_in_scope",
      "## constraints",
      "## verification_commands",
      "## acceptance_criteria",
      "## artifact_outputs",
    ],
  },
  "review-outcome": {
    requiredFrontmatter: [],
    statusValues: new Set(["approve", "revise", "blocked"]),
    requiredHeadings: [
      "## critical_issues",
      "## evidence",
      "## next_action",
    ],
  },
  "execution-record": {
    requiredFrontmatter: ["task_id"],
    statusValues: new Set(["in_progress", "blocked", "done"]),
    requiredHeadings: [
      "## goal",
      "## changes_made",
      "## verification_commands",
      "## validation_results",
      "## remaining_blockers",
      "## next_action",
    ],
  },
};

function validateHeadings(body, requiredHeadings) {
  const { searchableBody, errors } = stripFencedCodeBlocks(body);
  const lines = searchableBody.split("\n");
  let previousIndex = -1;

  for (const heading of requiredHeadings) {
    const index = findHeadingLineIndex(lines, heading);
    if (index === -1) {
      errors.push(`missing heading ${heading}`);
      continue;
    }
    if (index < previousIndex) {
      errors.push(`heading out of order ${heading}`);
      continue;
    }
    previousIndex = index;
  }

  return errors;
}

function resolveContractSpec(frontmatter) {
  const contractType = frontmatter.contract_type;
  if (!contractType) {
    return { errors: ["missing frontmatter key contract_type"] };
  }

  const spec = CONTRACT_SPECS[contractType];
  if (!spec) {
    return { errors: [`unsupported contract_type ${contractType}`] };
  }

  return { contractType, spec, errors: [] };
}

function pushMissingKeys(frontmatter, keys, errors) {
  for (const key of keys) {
    if (!(key in frontmatter)) {
      errors.push(`missing frontmatter key ${key}`);
    }
  }
}

// fallow-ignore-next-line complexity
function validateVersionAndStatus(frontmatter, contractType, spec, errors) {
  if (frontmatter.contract_version !== "v1") {
    errors.push(`invalid contract_version ${frontmatter.contract_version || "<missing>"}`);
  }

  if (!spec.statusValues.has(frontmatter.status)) {
    errors.push(
      `invalid status ${frontmatter.status || "<missing>"} for ${contractType}; expected one of ${Array.from(spec.statusValues).join(", ")}`,
    );
  }
}

function validateContract(frontmatter, body) {
  const resolved = resolveContractSpec(frontmatter);
  if (resolved.errors.length > 0) {
    return resolved.errors;
  }

  const { contractType, spec } = resolved;
  const errors = [];
  pushMissingKeys(frontmatter, SHARED_FRONTMATTER, errors);
  pushMissingKeys(frontmatter, spec.requiredFrontmatter, errors);
  validateVersionAndStatus(frontmatter, contractType, spec, errors);
  errors.push(...validateHeadings(body, spec.requiredHeadings));
  return errors;
}

async function validateFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const text = await readFile(absolutePath, "utf8");
  const { frontmatter, body } = parseFrontmatter(text);
  const errors = validateContract(frontmatter, body);

  if (errors.length > 0) {
    return {
      ok: false,
      message: `FAIL ${absolutePath}\n${errors.map((error) => `- ${error}`).join("\n")}`,
    };
  }

  return {
    ok: true,
    message: `OK ${absolutePath}`,
  };
}

// fallow-ignore-next-line complexity
async function collectValidationOutput(files) {
  const messages = [];
  let hasFailure = false;

  for (const filePath of files) {
    try {
      const result = await validateFile(filePath);
      messages.push(result.message);
      if (!result.ok) {
        hasFailure = true;
      }
    } catch (error) {
      hasFailure = true;
      const message = error instanceof Error ? error.message : String(error);
      messages.push(`FAIL ${path.resolve(filePath)}\n- ${message}`);
    }
  }

  return { output: messages.join("\n"), hasFailure };
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("usage: node validate-contracts.mjs <file> [file...]");
    process.exitCode = 1;
    return;
  }

  const { output, hasFailure } = await collectValidationOutput(files);
  if (hasFailure) {
    console.error(output);
    process.exitCode = 1;
    return;
  }

  console.log(output);
}

await main();
