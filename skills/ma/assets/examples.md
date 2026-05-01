# ma examples

## Example 1: large prose understanding

**Prompt**

`Read @README.md with reduction first; I only need the architecture structure before I decide what to inspect in full.`

**Why this should trigger**

- The file is known.
- The goal is understanding, not editing.
- Reduced context is the main need.

## Example 2: code-shape inspection

**Prompt**

`Before I dive deeper, give me just the declarations from @extensions/lore/lib/capability-inventory.mjs.`

**Why this should trigger**

- The file is known.
- The user wants structural code context rather than exact source.
- `ma_skeleton` is the obvious narrow tool.

## Example 3: instruction dedup audit

**Prompt**

`Check @instructions/typescript.instructions.md and @instructions/javascript.instructions.md for near-duplicate guidance before I edit them.`

**Why this should trigger**

- The request is an instruction-file redundancy audit.
- `ma_dedup` is a direct fit.
- The next step is still understanding, not patching.

## Near-miss example 1: exact edit preparation

**Prompt**

`Patch the broken bullet indentation in @skills/ma/SKILL.md.`

**Why this should not trigger**

- The file is about to be edited directly.
- Exact source matters more than reduction.

## Near-miss example 2: repo discovery

**Prompt**

`Map the files and tests involved in adding a new Lore memory tool before we plan it.`

**Why this should not trigger**

- The problem is repo discovery, not file reduction.
- Route to `context-map` or normal search tools first.
