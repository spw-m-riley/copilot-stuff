# Copilot Config

Your personal Copilot CLI setup — a collection of instructions, agents, skills, and extensions that work together to make AI-assisted development smoother and more powerful.

| What | Where | Purpose |
| --- | --- | --- |
| [User Copilot Instructions](./copilot-instructions.md) | Root | Core principles and learned rules that apply everywhere |
| [File-Type Instructions](./instructions/) | `instructions/` | Language-specific guidance (TypeScript, Go, YAML, etc.) |
| [Custom Agents](./agents/) | `agents/` | Specialized agents for orchestration and complex workflows |
| [Skills](./skills/) | `skills/` | Reusable task-specific workflows you can invoke directly |
| [Extensions](./extensions/) | `extensions/` | Auto-discovered lifecycle hooks and custom tools |          |
| [RTK Awareness](./RTK.md) | Root | RTK usage notes and the Copilot-side hook behavior |


## Capabilities index

| Kind | Name | Use when |
| --- | --- | --- |
| Skill | [`circleci-to-github-actions-migration`](./skills/circleci-to-github-actions-migration/SKILL.md) | You need single-repo CircleCI→GitHub Actions parity migration work. |
| Agent | [`ci-migration-orchestrator`](./agents/ci-migration-orchestrator.agent.md) | Migration needs phased rollout or multi-workflow coordination beyond the reusable skill. |
| Skill | [`typescript-any-eliminator`](./skills/typescript-any-eliminator/SKILL.md) | Remove unsafe `any` and replace with the narrowest truthful types. |
| Skill | [`schema-boundary-typing`](./skills/schema-boundary-typing/SKILL.md) | Validate untrusted inputs at runtime boundaries and align exported types. |
| Skill | [`type-test-authoring`](./skills/type-test-authoring/SKILL.md) | Lock compile-time inference/assignability contracts after type surfaces are truthful. |
| Skill | [`tsc-error-triage`](./skills/tsc-error-triage/SKILL.md) | Fix TypeScript compiler failures in root-cause order before patching leaves. |
| Agent | [`typescript-api-test-generator`](./agents/typescript-api-test-generator.agent.md) | Add or expand runtime tests for TypeScript APIs, handlers, and Lambda flows. |
| Skill | [`context-map`](./skills/context-map/SKILL.md) | Map likely files, dependencies, tests, and reference patterns before multi-file planning or implementation. |
| Skill | [`ma`](./skills/ma/SKILL.md) | Reduce large local files for understanding before deciding whether a full-fidelity read is necessary. |

## Extensions

These live in [`./extensions/`](./extensions/) and are auto-discovered by the Copilot CLI. They're the unsung heroes quietly injecting themselves into your workflow via lifecycle hooks, custom tools, or both.

> **Lore is the active memory system here.** The remaining `coherence` naming in the root repo is legacy compatibility residue, not the primary implementation surface.

### Extension Catalog

| Extension | What It Does |
| --------- | ------------ |
| `lore` | Local-first memory and continuity for Copilot CLI. Handles session recall, learning from your workflow, and keeping context sharp across sessions. Keep Lore-specific setup, rollout, maintenance, and health docs in [`./extensions/lore`](./extensions/lore). |
| `ma` | Adds reduced-context file-reading tools (`ma_smart_read`, `ma_skeleton`, `ma_compress`, `ma_minify_schema`, `ma_dedup`) and injects reduction-first guidance for understanding-oriented file reads. |
| `ci-migration-context` | Detects CI migration requests (e.g., CircleCI→GitHub Actions) and injects extra migration context + checklist into parent turns and delegated child agents. |
| `fleet-model-policy` | Steers implementation-heavy fleet work toward `GPT-5.3-codex`, then propagates that policy preference into delegated implementation-style child agents. |
| `gha-url-router` | Detects GitHub Actions run/job URLs in prompts, injects structured routing context, and passes that context into delegated investigation agents. |
| `post-edit-lint` | Watches `edit`-style tool calls and runs targeted formatting, linting, and validation for JS/TS, JSON, YAML, Terraform, and shell files, feeding results back into the conversation. |
| `worktree-manager` | Adds `mr_worktree_create`, `mr_worktree_list`, `mr_worktree_status`, and `mr_worktree_remove` tools, plus injects worktree guidance into implementation-style child agents so edits stay isolated. |
| `copilot-healthcheck` | Adds the `mr_healthcheck_run` tool — a lightweight environment check that reports repo state and key local Copilot files/tools. |
| `rtk-hook` | Runs `rtk hook copilot` on Bash pre-tool calls so RTK can deny raw commands and steer Copilot CLI toward the token-saving `rtk ...` equivalent. See [`./RTK.md`](./RTK.md). |

### Child-Agent Context Propagation

Several extensions inject policy and guidance into delegated child agents:
- **fleet-model-policy** → implementation-style child agents (model preference)
- **ci-migration-context** → CI migration & workflow-debug child agents (migration checklists)
- **gha-url-router** → GitHub Actions investigation child agents (run/job context)
- **worktree-manager** → implementation/edit/task child agents (worktree guidance)

## Workflow: Research → Plan → Implement

The most reliable path through complex work is structure. Start with research, move to planning, then execute.

### Step 1: Research (Gather signals)
Use `/research` to dig into your problem space. Example:
```
/research @project-d/ needs to migrate from CircleCI to GitHub Actions. 
There are three other projects that have been through this @project-a/ @project-b/ @project-c/
Use those as guides. Get deep: understand the shared workflows, the migration approach, 
terraform changes, and anything else that will make this smooth.
```

### Step 2: Plan (Get buy-in)
Use `/plan` to turn research into actionable work. When the draft is ready, run the explicit `plan-review-loop` skill so Jason and Freddy review it — the plan is ready only when both approve in the same round.

```
/plan Turn the research into a fully actionable plan suitable for fleet execution. 
Include all affected workflows, test requirements, and rollback procedures.
```

Then review the finished plan explicitly:

```
Use the /plan-review-loop skill to review and refine the current plan
```

### Step 3: Implement (Execute)
Once the plan is approved, switch out of plan mode if needed and use that approved plan as the execution contract. Then use `/fleet` or direct agent delegation for implementation. Child agents inherit worktree guidance, model preferences, and fleet policy automatically.

---

## Prompt Tips

- **Be specific**: Goal + constraints + deliverables + approval rule. Example:
  > "There are npm packages in @package.json that need updates. Only update non-major releases. Work is done when all tests and lint/formatting pass."

- **@ mention files**: Point directly at files you're concerned about, especially for audits or refactors.

- **Model preferences matter**: Some models excel at research (GPT-5.4, Claude Sonnet/Opus), others at implementation (GPT-5.3-codex, Claude Opus). Experiment and find what works for your workflow.

### Real-World Examples

**Example 1: CI Migration** (CircleCI → GitHub Actions)
```
/research @existing-service/ is still on CircleCI. We also have @newer-service/ and @another-service/ 
that have already been migrated. Use those as reference implementations. Get deep on the workflow 
structure, the shared actions, the terraform changes, and anything else that makes the migration smooth.
```
Turn that research into a draft plan:
```
/plan Turn this research into a migration timeline with clear phases.
Include all affected workflows, test requirements, and rollback procedures.
```

Then review the finished plan explicitly:
```
Use the /plan-review-loop skill to review and refine the current plan
```
Once Jason and Freddy both approve, switch out of plan mode if needed and implement the approved plan with `/fleet` — child agents inherit `ci-migration-context` guidance automatically.

**Example 2: Type Safety Audit** (Finding and fixing `any` in TypeScript)
```
@src/ contains unsafe `any` types we need to fix. 
Goal: Replace with narrowest truthful types or add proper type guards.
Only change application code (not test files). 
Work is done when tsc passes with strict mode and all tests pass.
```
This naturally recommends the `typescript-any-eliminator` skill.

**Example 3: Documentation Overhaul** (Writing + reviewing docs)
```
@docs/ needs a complete rewrite for clarity and tone. 
Goal: Keep technical accuracy, add examples, make it approachable.
Don't just copy-paste older docs — validate claims against the code.
Done when docs are reviewed by another human and all examples work.
```
This lands in the `doc-coauthoring` skill territory.

## Skills Ecosystem

This setup includes a growing library of reusable agent skills — a production-grade set of workflows that handles everything from TypeScript compile errors and type safety to CI/CD migrations, testing workflows, documentation work, and git orchestration. Each skill activates only when its specific conditions are met, preventing overlap and ensuring the right tool gets used for each task.

The categories below describe the current repo-tracked skills in this worktree. The later [Awesome Copilot Adoption (Wave 1)](#awesome-copilot-adoption-wave-1) section is historical adoption context for the initial Awesome Copilot additions, not a complete live inventory of every currently installed marketplace plugin or skill copy.

**Skills are explicit routing decisions**: when you invoke a skill or the CLI recommends one, you're calling out a solution with clear activation boundaries. No guessing. No "hope this works."

### Skills by Category

**TypeScript (6 skills)** — Compile-time and runtime type safety, configuration, and diagnostics
- `tsc-error-triage` — When `tsc` screams at you, find the first real error (not the cascade)
- `tsconfig-hardening` — Enable stricter TypeScript without your codebase exploding
- `schema-boundary-typing` — Untrusted input? Validate at runtime before treating it as typed
- `typescript-any-eliminator` — Replace that `any` with the narrowest truthful type
- `type-test-authoring` — Write compile-time tests so your generic helpers don't regress
- `project-references-migration` — Layer a monorepo with TypeScript project references safely

**Migrations (3 skills)** — Framework and tool transitions handled in staged batches
- `aws-sdk-v2-to-v3-migration` — Migrate AWS SDK v2 → v3 modular clients without breaking things
- `circleci-to-github-actions-migration` — Move from CircleCI → GitHub Actions with parity checking
- `mocha-to-jest-migration` — Migrate test suites from Mocha/Chai/Sinon → Jest incrementally

**Testing & Development (3 skills)** — Test authoring, debugging, and verification
- `test-driven-development` — Failing test first. Implementation after. Always.
- `systematic-debugging` — Hit a wall? Isolate the root cause before guessing at fixes
- `verification-before-completion` — Don't claim "tests pass" without running them fresh

**Workflow & Planning (12 skills)** — Planning, handoff docs, discovery, and decision support
- `acquire-codebase-knowledge` — Produce traceable codebase knowledge packs for onboarding and repo discovery
- `context-map` — Map likely files, dependencies, tests, and reference patterns before multi-file work
- `plan-review-loop` — Run explicit Jason/Freddy plan review rounds after `/plan`
- `reverse-prompt` — Turn a vague request into an executable task brief (explicit user trigger)
- `workflow-contracts` — Create versioned markdown handoff artifacts for multi-turn work
- `finishing-a-development-branch` — Branch is done. Now what? Merge, PR, stash, or discard?
- `doc-coauthoring` — Write docs collaboratively with context gathering and reader feedback loops
- `code-tour` — Create a `.tour` walkthrough for onboarding, PR review, or architecture explanation
- `grill-me` — Stress-test a plan or design through structured interrogation
- `grill-with-docs` — Stress-test a plan while updating domain docs such as `CONTEXT.md` and ADRs
- `to-prd` — Turn repository and conversation context into a product requirements document
- `to-issues` — Split approved work into dependency-aware issue slices

**Optimization & Evaluation (2 skills)** — Iterative improvement and evaluator loops
- `agentic-eval` — Build evaluator/optimizer loops and rubric-driven refinement pipelines
- `autoresearch` — Run autonomous experiments to improve a measurable metric

**Governance & Supply Chain (2 skills)** — Agent controls, provenance, and integrity
- `agent-governance` — Add policy enforcement, trust scoring, audit trails, and tool-access controls to agents
- `agent-supply-chain` — Generate and verify integrity manifests for agent plugins and tools

**Code Review (1 skill)** — Pull request integration
- `review-comment-resolution` — Resolve PR review comments and push to completion

**CI/CD (1 skill)** — GitHub Actions troubleshooting
- `github-actions-failure-triage` — GitHub Actions broke. Find the root cause and fix it.

**Authoring & Configuration (2 skills)** — Skill creation and setup workflows
- `skill-authoring` — Write reusable agent skills from scratch with activation conditions
- `init` — Create or update copilot-instructions.md and per-file instruction files

**Version Control (2 skills)** — Worktree and branching workflows
- `git-worktrees` — Create and manage isolated Git worktrees for parallel lanes
- `worktrunk` — Advanced worktree lifecycle, LLM-generated commits, and coordination

**Utilities (1 skill)** — Context reduction for large local files
- `ma` — Reduce large local files for understanding before deciding whether a full-fidelity read is necessary

### Using Skills

Skills activate in three ways:

- **You invoke directly** — When you know your task matches a skill's activation condition, just call it by name
- **We recommend it** — The CLI watches context and suggests skills when boundaries match
- **You ask `/skills`** — Inspect the installed skills, then drill into one with `/help <skill-name>`

Think of skills as specialized tools you grab when you recognize the problem. No guessing. Clear activation rules. Explicit boundaries.

### Quarterly Skill Review

The skills catalog is reviewed quarterly for new additions, removals, or routing adjustments. Reviews are baked into quarterly planning cycles. For the current inventory, browse [`./skills/`](./skills/) or use `/skills` in the CLI.

## Awesome Copilot Adoption (Wave 1)

Wave 1 records the initial adoption of the highest-signal additions from [Awesome Copilot](https://github.com/github/awesome-copilot) without duplicating the planning, context-mapping, and agent-authoring surfaces this setup already had. This section is historical adoption context, not a full live inventory of the current local plugin state.

| Kind | Addition | Why it made wave 1 | Initial landing / durability |
| --- | --- | --- | --- |
| Plugin | `awesome-copilot@awesome-copilot` | Adds a lightweight discovery layer for re-checking new Awesome Copilot assets later. | Historical machine-local install recorded in `config.json` and `installed-plugins/awesome-copilot/`; this README remains the durable tracked record for the adoption decision. |
| Skill | `agent-governance` | Adds reusable governance patterns for tool access, approval gates, audit trails, and fail-closed behavior. | Initially installed as a user-scope skill in the live main checkout; it is now also tracked in this repository under [`./skills/agent-governance/`](./skills/agent-governance/). |
| Skill | `agent-supply-chain` | Adds integrity-manifest and verification patterns for reviewing third-party agent/plugin content. | Initially installed as a user-scope skill in the live main checkout; it is now also tracked in this repository under [`./skills/agent-supply-chain/`](./skills/agent-supply-chain/). |
| Skill | `acquire-codebase-knowledge` | Adds a durable repo-onboarding / reconnaissance workflow for producing traceable codebase knowledge packs. | Initially installed as a user-scope skill in the live main checkout; it is now also tracked in this repository under [`./skills/acquire-codebase-knowledge/`](./skills/acquire-codebase-knowledge/). |

### Install notes

These commands are preserved as the reproducible install path for the original Wave 1 adoption decision.

```bash
copilot plugin install awesome-copilot@awesome-copilot
gh skill install github/awesome-copilot agent-governance --scope user
gh skill install github/awesome-copilot agent-supply-chain --scope user
gh skill install github/awesome-copilot acquire-codebase-knowledge --scope user
```

- **Plugins are machine-local state.** In this setup, plugin enablement and marketplace cache details live in local `config.json` plus `installed-plugins/awesome-copilot/`; those are not the durable artifact for wave 1.
- **The README is the durable artifact.** This file records what was adopted, why it was chosen, and how to reproduce the local install state later.
- **This section is historical, not a live inventory.** Current local Awesome Copilot marketplace plugin state can evolve independently of the initial Wave 1 record.
- **For live machine-local state, check the local config.** Use `config.json` and `installed-plugins/awesome-copilot/` to inspect the current local marketplace plugins instead of treating this section as a current-state report.
- **The adopted skills are now also repo-tracked.** The initial user-scope skill installs were later brought into the repository's `./skills/` catalog, so the current repo tree is the best place to browse their present content.
- **The commands above install the current upstream versions.** If you later need a pinned revision, record that ref explicitly instead of assuming the marketplace default stayed unchanged.

### Deferred / follow-on items

| Item | Why it is not in wave 1 | When to revisit |
| --- | --- | --- |
| `context-engineering` | Useful, but it overlaps heavily with the local `context-map` skill plus the existing research→plan workflow, so it would duplicate context-mapping behavior rather than add a clearly new surface. | Revisit only if the packaged `/context-map` plugin workflow proves meaningfully better than the local skill + planning flow. |
| `project-planning` | The repo already has `implementation-planner`, `workflow-contracts`, and `plan-review-loop` skill, so another planning plugin would mostly duplicate existing planning/PRD generation surfaces. | Revisit if you want packaged PRD/issue-generation commands beyond the current local planning stack. |
| `Custom Agent Foundry` | Strong design reference, but the repo already has `skill-authoring`, custom agents, and established authoring patterns; keeping it out of wave 1 avoids duplicating daily authoring workflow. | Revisit as a rubric/reference if custom-agent authoring needs a dedicated external coach later. |
| `agentic-eval` | Valuable evaluator/optimizer pattern, but it is explicitly deferred so wave 1 can land documentation and the high-signal installs first without turning evaluation loops into a gate. | Consider as a separate follow-on once wave-1 usage is stable and documented. |

---

## Model Selection Tips

**All models are not created equal.** Each one has strengths and weak spots.

### Research Phase
- **Good**: GPT-5.4, Claude Sonnet, Claude Opus, Gemini (good at exploration and pattern synthesis)
- **Not great**: GPT-5.3-codex (strong at implementation, weaker at research discovery)

### Implementation Phase
- **Good**: GPT-5.3-codex, GPT-5.4, Claude Opus (fast, reliable, handles detailed edits)
- **Not great**: Gemini (hit-or-miss on complex implementation)

### Reasoning Effort
- Don't assume "max reasoning" is always better. Example: GPT-5.4's default is `medium`, but you might prefer `high`. Experiment. (`xhigh` often introduces more mistakes than it solves.)

### The Sweet Spot
Find the model and reasoning level that works for *you* and your workflow. No universal answer — it's personal preference + output quality for your use cases.

## Worktree Management

Git worktrees let you maintain multiple isolated checkouts in parallel — one branch per worktree, no checkout thrashing, no merge conflicts from parallel edits. All active worktrees live in `.worktrees/` and follow a structured naming scheme.

**The Golden Rule: Never commit `.worktrees/` to the repository. Ever.**

### Naming Convention

See the **[`git-worktrees` skill](./skills/git-worktrees/SKILL.md)** for comprehensive guidance:

- **`.worktrees/agent/<AGENT_ID>`** — Long-running agent lanes (days to weeks). Examples: `coherence-browser`, `phase-3-router-core`
- **`.worktrees/task/<TASK_ID>`** — Bounded feature/fix tasks (hours to 1–2 days). Examples: `fix-lore-backfill-ordering`, `add-style-retrieval`
- **`.worktrees/temp/<PURPOSE>`** — Throwaway exploration (minutes to hours). Examples: `spike-performance`, `test-integration`

For the full naming scheme, conventions, and lifecycle examples, see [`git-worktrees/references/naming-conventions.md`](./skills/git-worktrees/references/naming-conventions.md).

### Cleanup (Monthly Audit)

1. Check worktree status: `git -C .worktrees/<CATEGORY>/<ID> status`
2. Verify no uncommitted changes
3. Merge or abandon the branch
4. Remove: `git worktree remove .worktrees/<CATEGORY>/<ID>` for category-scoped paths, or `mr_worktree_remove <ID>` when you are removing an `agent/<ID>` worktree through the helper tool
5. Optionally delete the branch: `git branch -d agent/<ID>` or `git branch -d task/<ID>`

**Monthly audit**: Run `git worktree list`, check for branches inactive 30+ days, archive orphaned worktrees.

Older flat-pattern worktrees can be renamed incrementally as they are touched or retired, but the naming scheme above is the default for new worktrees and the migration target for legacy lanes.

---

## Custom Agents

Beyond the built-in agents currently documented by Copilot CLI (`task`, `explore`, `general-purpose`, and `code-review`), this repository tracks **4 custom agents** for specialized workflows:

| Agent | What It Does | Use When |
|-------|-------------|----------|
| **ci-migration-orchestrator** | Orchestrates multi-workflow CI migrations with planning, validation, and rollout coordination. Works with the reusable `circleci-to-github-actions-migration` skill. | CircleCI→GitHub Actions spans multiple workflows or environments and needs phased rollout |
| **implementation-planner** | Breaks complex work into actionable plans with clear tasks, dependencies, and parallelizable phases. Outputs stable `v1` planner contracts. | You want a detailed implementation plan before coding (explicitly ask for it) |
| **typescript-api-test-generator** | Writes runtime tests for TypeScript APIs, request handlers, and Lambda functions using your repo's existing test framework. | You need new or expanded test coverage around a TypeScript API surface |
| **web-research-analyst** | Investigates external docs, patterns, and prior art, then distills findings into actionable recommendations and handoff-friendly summaries. | You need research + comparisons grounded in actual documentation before deciding on an approach |

All four are manual-only (you invoke them explicitly), not auto-triggered. They integrate with skills and workflow contracts for clear handoff and coordination.

---

## Resources

| Name                                                                                                                                       | Description                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| [Anthropics Guide To Building Skills](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf?hsLang=en) | Comprehensive guide to building your own skills from the makers of Claude                                       |
| [Copilot Documentation](https://docs.github.com/en/copilot)                                                                                | Official Docs from GitHub, covers every aspect of Copilot (although not the 'experimental' features in the cli) |
| [Awesome Copilot](https://github.com/github/awesome-copilot)                                                                               | A collection of skills, agents, instructions from GitHub themselves                                             |
| [Matteo Collina's Skills](https://github.com/mcollina/skills)                                                                              | Skills from the NodeJS contributor and Fastify creator                                                          |
| [Superpowers](https://github.com/obra/superpowers) | An agentic skills framework & software development methodology that works |
| [UI-UX-Pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | An AI skill that provide design intelligence for building professional UI/UX multiple platforms |
