# Copilot Config

Your personal Copilot CLI setup — a collection of instructions, agents, skills, and extensions that work together to make AI-assisted development smoother and more powerful.

| What | Where | Purpose |
| --- | --- | --- |
| [Repo CONTEXT](./CONTEXT.md) | Root | Domain vocabulary and conventions for this repo |
| [User Copilot Instructions](./copilot-instructions.md) | Root | Core principles and learned rules that apply everywhere |
| [File-Type Instructions](./instructions/) | `instructions/` | Language-specific guidance (TypeScript, Go, YAML, etc.) |
| [Custom Agents](./agents/) | `agents/` | Specialized agents for orchestration and complex workflows |
| [Skills](./skills/) | `skills/` | Reusable task-specific workflows you can invoke directly |
| [Extensions](./extensions/) | `extensions/` | Auto-discovered lifecycle hooks and custom tools |
| [Maintenance scripts](./scripts/) | `scripts/` | Housekeeping utilities (e.g. `prune-session-state.sh`) |
| [RTK Awareness](./docs/RTK.md) | `docs/` | RTK usage notes and the Copilot-side hook behavior |


## Capabilities index

Full catalogs live with the source of truth — they are surfaced in-session via skill/agent metadata rather than mirrored here:

- **Skills** — browse [`./skills/`](./skills/); each `SKILL.md` declares its own trigger conditions.
- **Agents** — browse [`./agents/`](./agents/); each `*.agent.md` declares its scope.
- **Extensions** — see the [Extensions](#extensions) table below.

This avoids the README drifting out of sync as skills/agents are added or renamed.

## Extensions

These live in [`./extensions/`](./extensions/) and are auto-discovered by the Copilot CLI. They're the unsung heroes quietly injecting themselves into your workflow via lifecycle hooks, custom tools, or both.

> **Lore is the active memory system here.** The remaining `coherence` naming in the root repo is legacy compatibility residue, not the primary implementation surface.

### Extension Catalog

| Extension | What It Does |
| --------- | ------------ |
| `lore` | Local-first memory and continuity for Copilot CLI. Handles session recall, learning from your workflow, and keeping context sharp across sessions. Keep Lore-specific setup, rollout, maintenance, and health docs in [`./extensions/lore`](./extensions/lore). |
| `ma` | Adds reduced-context file-reading tools (`ma_smart_read`, `ma_skeleton`, `ma_compress`, `ma_minify_schema`, `ma_dedup`) and injects reduction-first guidance for understanding-oriented file reads. |
| `ci-migration-context` | Detects CI migration requests (e.g., CircleCI→GitHub Actions), injects extra migration context into parent turns, and caches the same guidance for child-agent propagation when the runtime supports that hook. |
| `fleet-model-policy` | Steers implementation-heavy fleet work toward the implementation-focused default, then caches that preference for child-agent propagation when the runtime supports it. |
| `gha-url-router` | Detects GitHub Actions run/job URLs in prompts, injects structured routing context, and caches that routing data for delegated investigation agents when child-hook support is available. |
| `post-edit-lint` | Watches `edit`-style tool calls and runs targeted formatting, linting, and validation for JS/TS, JSON, YAML, Terraform, and shell files, feeding results back into the conversation. |
| `worktree-manager` | Adds `mr_worktree_create`, `mr_worktree_list`, `mr_worktree_status`, `mr_worktree_remove`, and `mr_worktree_merge` tools, plus injects worktree guidance into the parent session and prepares the same guidance for child agents when the runtime supports that hook. |
| `copilot-healthcheck` | Adds the `mr_healthcheck_run` tool — a lightweight environment check that reports repo state and key local Copilot files/tools. |
| `rtk-hook` | Runs `rtk hook copilot` on Bash pre-tool calls so RTK can deny raw commands and steer Copilot CLI toward the token-saving `rtk ...` equivalent. See [`./docs/RTK.md`](./docs/RTK.md). |
| `stabilisation-guard` | Surfaces unresolved `open_loop` and `assistant_goal` Lore memories at session start, then denies the first `edit`/`create`/`apply_patch` call once so pending items are acknowledged before implementation begins. Reads `lore.db` directly; fails open on any error. |

### Child-Agent Context Propagation

Several extensions inject policy and guidance into the parent session today and keep child-agent propagation handlers wired for future runtime support:
- **fleet-model-policy** → implementation-style child agents (model preference)
- **ci-migration-context** → CI migration & workflow-debug child agents (migration checklists)
- **gha-url-router** → GitHub Actions investigation child agents (run/job context)
- **worktree-manager** → implementation/edit/task child agents (worktree guidance)

In the current bundled Copilot CLI SDK, named `onSubagentStart` hooks are not dispatched, so this child-agent inheritance path is **wired but currently dormant**. Treat it as future-facing behavior until the runtime adds a supported child-interception hook.

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
Once the plan is approved, switch out of plan mode if needed and use that approved plan as the execution contract. Then use `/fleet` or direct agent delegation for implementation. Parent turns receive worktree guidance and fleet policy immediately; the child-agent inheritance path is wired but currently dormant until the runtime supports `onSubagentStart`.

---

## Prompt Tips

- **Be specific**: Goal + constraints + deliverables + approval rule. Example:
  > "There are npm packages in @package.json that need updates. Only update non-major releases. Work is done when all tests and lint/formatting pass."

- **@ mention files**: Point directly at files you're concerned about, especially for audits or refactors.

- **Model preferences matter**: Different models excel at different tasks. Treat model choice as an empirical workflow preference, not a hard-coded rule, and adjust it to the phase of work.

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
Once Jason and Freddy both approve, switch out of plan mode if needed and implement the approved plan with `/fleet` — the parent session receives `ci-migration-context` guidance immediately, and the child-agent inheritance path remains pending runtime hook support.

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

**Testing & Development (4 skills)** — Test authoring, debugging, and verification
- `test-driven-development` — Failing test first. Implementation after. Always.
- `systematic-debugging` — Hit a wall? Isolate the root cause before guessing at fixes
- `verification-before-completion` — Don't claim "tests pass" without running them fresh
- `api-smoke-validation` — Quick, repeatable smoke validation of API endpoints with hurl after changes

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

**Governance & Supply Chain (3 skills)** — Agent controls, provenance, and integrity
- `agent-governance` — Add policy enforcement, trust scoring, audit trails, and tool-access controls to agents
- `agent-supply-chain` — Generate and verify integrity manifests for agent plugins and tools
- `secret-scan-triage` — Triage gitleaks findings with containment and false-positive adjudication before merging

**Code Review (1 skill)** — Pull request integration
- `review-comment-resolution` — Resolve PR review comments and push to completion

**CI/CD (2 skills)** — GitHub Actions troubleshooting and local reproduction
- `github-actions-failure-triage` — GitHub Actions broke. Find the root cause and fix it.
- `github-actions-local-repro` — Reproduce a GitHub Actions failure locally with `act` before pushing

**Code Quality (2 skills)** — JS/TS code-health analysis, cleanup, and structural search
- `fallow` — Use Fallow for dead code, duplication, complexity, boundary, and cleanup workflows in JS/TS repos
- `ast-grep` — Structural code search, linting, and safe codemod rewrites with ast-grep

**Authoring & Configuration (2 skills)** - Skill creation and setup workflows
- `skill-authoring` - Write reusable agent skills from scratch with activation conditions
- `init` - Create or update copilot-instructions.md and per-file instruction files

**Version Control (3 skills)** — Worktree, branching, and PR workflows
- `git-worktrees` — Create and manage isolated Git worktrees for parallel lanes
- `worktrunk` — Advanced worktree lifecycle, LLM-generated commits, and coordination
- `github-cli-pr-workflow` — PR lifecycle with `gh` CLI: create or update a PR, watch checks, prepare review handoff

**Utilities (3 skills)** — Context reduction, code navigation, and web patterns
- `ma` — Reduce large local files for understanding before deciding whether a full-fidelity read is necessary
- `code-intelligence` — Navigate and refactor code with the right search tool (LSP, rg, or semantic) and proper degradation fallback
- `modern-web-guidance` — Write HTML, CSS, JavaScript, forms, and animations without reaching for legacy patterns

**Infrastructure (1 skill)** — Terraform and OpenTofu workflows
- `terraform-skill` — Write, review, or debug Terraform/OpenTofu — modules, tests, CI/CD, security scans, and state operations

**Memory & Session (1 skill)** — Lore memory management
- `resolve-open-loops` — Close out active `open_loop` and `assistant_goal` Lore memories when the stabilisation-guard fires or when pending items need explicit resolution

### Using Skills

Skills activate in three ways:

- **You invoke directly** — When you know your task matches a skill's activation condition, just call it by name
- **We recommend it** — The CLI watches context and suggests skills when boundaries match
- **You ask `/skills`** — Inspect the installed skills, then drill into one with `/help <skill-name>`

Think of skills as specialized tools you grab when you recognize the problem. No guessing. Clear activation rules. Explicit boundaries.

### Quarterly Skill Review

The skills catalog is reviewed quarterly for new additions, removals, or routing adjustments. Reviews are baked into quarterly planning cycles. For the current inventory, browse [`./skills/`](./skills/) or use `/skills` in the CLI.

## Awesome Copilot Adoption (Wave 1)

Historical adoption record — see [`docs/awesome-copilot-wave-1.md`](./docs/awesome-copilot-wave-1.md).


## Model Selection Tips

**All models are not created equal.** Match the model to the phase of work instead of treating one choice as universally best.

### Research Phase
- Prefer models that are strong at exploration, synthesis, and ambiguity reduction.
- Be skeptical of models that jump straight into implementation before mapping the space.

### Implementation Phase
- Prefer models that stay grounded in the local codebase and make precise, low-churn edits.
- Be skeptical of models that over-generalize past the repository's actual patterns.

### Reasoning Effort
- Don't assume "max reasoning" is always better. Start from the model's default and raise it only when the task genuinely needs deeper search or synthesis.

### The Sweet Spot
Find the model and reasoning level that works for *you* and your workflow. Re-check periodically because the best choice can change as models and tasks shift.

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

## Maintenance

| Concern | How |
| --- | --- |
| Stale session state | `scripts/prune-session-state.sh` — dry-run by default; `--apply` deletes; `--days N` overrides the 90-day default. |
| Worktree audit | Monthly — see [Worktree Management](#worktree-management) above. |
| Learned-rule review | Quarterly — see `copilot-instructions.md` § *Learned Rules Review Cadence*. |
| Skill validation | `node skills/skill-authoring/scripts/validate-skill-library.mjs`. |
| DB compaction | Between sessions, `sqlite3 lore.db 'VACUUM;'` and the same on `session-store.db`. Both DBs are open while Copilot CLI is running. |

---

## Custom Agents

Alongside the built-in agents, this repository tracks **6 custom agents** for specialized workflows:

| Agent | What It Does | Use When |
|-------|-------------|----------|
| **ci-migration-orchestrator** | Orchestrates multi-workflow CI migration and workflow-modernization work with phased rollout, validation, and contract checks. Works with reusable GitHub Actions skills. | CI work spans multiple workflows, environments, or rollout stages |
| **copilot-config-curator** | Audits and improves this `~/.copilot` repo's skills, agents, instructions, extensions, docs, and validators as one coherent library. | You want repo-wide Copilot config curation driven by current state and recent sessions |
| **implementation-planner** | Breaks complex work into actionable plans with clear tasks, dependencies, and parallelizable phases. Outputs stable `v1` planner contracts. | You want a detailed implementation plan before coding |
| **pr-operations-orchestrator** | Coordinates PR descriptions, review-thread handling, workflow checks, and merge-readiness once most code changes already exist. | The remaining work is GitHub-side PR orchestration rather than fresh implementation |
| **typescript-api-test-generator** | Writes runtime tests for TypeScript APIs, request handlers, and Lambda functions using your repo's existing test framework. | You need new or expanded test coverage around a TypeScript API surface |
| **web-research-analyst** | Investigates external docs, patterns, and prior art, then distills findings into actionable recommendations and handoff-friendly summaries. | You need research + comparisons grounded in actual documentation before deciding on an approach |

These custom agents are still **manual-only** in the current runtime: Lore can recommend them and local skills can route toward them, but they are not auto-invoked as background subagents by the CLI itself.

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
