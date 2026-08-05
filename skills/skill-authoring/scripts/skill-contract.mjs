// Canonical section contract shared by the validator and authoring artifacts.
export const REQUIRED_HEADINGS = [
  "## Use this skill when",
  "## Do not use this skill when",
  "## Inputs to gather",
  "## First move",
  "## Workflow",
  "## Validation",
  "## Examples",
  "## Reference files",
];

export const TASK_ONLY_HEADINGS = [
  "## Inputs to gather",
  "## First move",
  "## Workflow",
];

export const TASK_HEADINGS = [
  ...REQUIRED_HEADINGS.slice(0, 5),
  "## Outputs",
  ...REQUIRED_HEADINGS.slice(5),
];

export const REFERENCE_HEADINGS = REQUIRED_HEADINGS.filter(
  (heading) => !TASK_ONLY_HEADINGS.includes(heading),
);
