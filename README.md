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

Skill and agent bodies remain the source of truth; this README keeps a current categorized snapshot for quick discovery:

- **Skills** — browse [`./skills/`](./skills/); each `SKILL.md` declares its own trigger conditions.
- **Agents** — browse [`./agents/`](./agents/); each `*.agent.md` declares its scope.
- **Extensions** — see the [Extensions](#extensions) table below.

Use the linked directories for complete workflow details and support-file inventories.

## Extensions

These live in [`./extensions/`](./extensions/) and are auto-discovered by the Copilot CLI. They're the unsung heroes quietly injecting themselves into your workflow via lifecycle hooks, custom tools, or both.

> **Lore is the active memory system here.** The remaining `coherence` naming in the root repo is legacy compatibility residue, not the primary implementation surface.

### Extension Catalog

| Extension | What It Does |
| --------- | ------------ |
| `lore` | Local-first memory and continuity for Copilot CLI. Handles session recall, learning from your workflow, and keeping context sharp across sessions. Keep Lore-specific setup, rollout, maintenance, and health docs in [`./extensions/lore`](./extensions/lore). |
| `gha-url-router` | Detects GitHub Actions run/job URLs in prompts and injects structured routing context. |
| `post-edit-lint` | Watches `edit`-style tool calls and runs targeted formatting, linting, and validation for JS/TS, JSON, YAML, Terraform, and shell files, feeding results back into the conversation. |
| `worktree-manager` | Adds `mr_worktree_create`, `mr_worktree_list`, `mr_worktree_status`, `mr_worktree_remove`, and `mr_worktree_merge` tools. |
| `rtk-hook` | Runs `rtk hook copilot` on Bash pre-tool calls so RTK can deny raw commands and steer Copilot CLI toward the token-saving `rtk ...` equivalent. See [`./docs/RTK.md`](./docs/RTK.md). |
| `stabilisation-guard` | Surfaces unresolved `open_loop` and `assistant_goal` Lore memories at session start, then denies the first `edit`/`create`/`apply_patch` call once so pending items are acknowledged before implementation begins. Reads `lore.db` directly; fails open on any error. |

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
Once the plan is approved, switch out of plan mode if needed and use that approved plan as the execution contract. Then use `/fleet` or direct agent delegation for implementation.

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
Once Jason and Freddy both approve, switch out of plan mode if needed and implement the approved plan with `/fleet`.

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

**TypeScript (5 skills)** — Compile-time and runtime type safety, configuration, and diagnostics
- `tsc-error-triage` — When `tsc` screams at you, find the first real error (not the cascade)
- `tsconfig-hardening` — Enable stricter TypeScript without your codebase exploding, including an explicit project-references mode for incremental `tsc -b` adoption across a workspace (formerly the standalone `project-references-migration` skill)
- `schema-boundary-typing` — Untrusted input? Validate at runtime before treating it as typed
- `typescript-any-eliminator` — Replace that `any` with the narrowest truthful type
- `typescript-triage` — Route unclear TypeScript problems to the right specialist skill

**Migrations (2 skills)** — Framework and tool transitions handled in staged batches
- `aws-sdk-v2-to-v3-migration` — Migrate AWS SDK v2 → v3 modular clients without breaking things
- `circleci-to-github-actions-migration` — Move from CircleCI → GitHub Actions with parity checking

**Testing & Development (4 skills)** — Test authoring, debugging, and verification
- `test-driven-development` — Failing test first. Implementation after. Always.
- `systematic-debugging` — Hit a wall? Isolate the root cause before guessing at fixes
- `verification-before-completion` — Don't claim "tests pass" without running them fresh
- `api-smoke-validation` — Quick, repeatable smoke validation of API endpoints with hurl after changes (explicit invocation only — this repo has no hurl fixtures of its own to justify implicit routing)

**Workflow & Planning (14 skills)** — Planning, handoff docs, discovery, and decision support
- `acquire-codebase-knowledge` — Produce traceable codebase knowledge packs for onboarding and repo discovery
- `context-map` — Map likely files, dependencies, tests, and reference patterns before multi-file work
- `doc-coauthoring` — Write docs collaboratively with context gathering and reader feedback loops
- `execution-strategy` — Choose inline, serial, or parallel execution before dispatching agents
- `grill` — Stress-test a plan or design through structured interrogation, with an optional mode that updates domain docs such as `CONTEXT.md` and ADRs along the way (consolidates the former `grill-me` and `grill-with-docs` skills), plus an opt-in frontier/round question-batching mode
- `improve` — Audit a codebase for high-leverage improvements and produce an implementation plan
- `issue-tracker-triage` — Classify a raw issue or PR into a tracker-agnostic category, lifecycle state, and durable behavioral brief before planning or ticketing
- `plan-review-loop` — Run explicit Jason/Freddy plan review rounds after `/plan` (explicit invocation only)
- `reverse-prompt` — Turn a request into an executable task brief when the user explicitly asks for a prompt rewrite or sharper brief
- `session-handoff` — Create durable handoff context when switching sessions or lanes
- `workflow-contracts` — Create versioned markdown handoff artifacts for multi-turn work
- `work-prep` — Route request shaping, issue triage, PRD synthesis, and issue slicing with explicit commands
- `to-prd` — Turn repository and conversation context into a product requirements document
- `to-issues` — Split approved work into dependency-aware issue slices, with an expand-contract exception for wide mechanical refactors

**Optimization & Evaluation (2 skills)** — Iterative improvement and evaluator loops
- `agentic-eval` — Build evaluator/optimizer loops and rubric-driven refinement pipelines
- `autoresearch` — Run a bounded number of autonomous experiments to improve a measurable metric (explicit invocation only; requires a confirmed experiment or time budget, and scopes its journal under `.autoresearch/<tag>/` instead of root-level `results.tsv`/`run.log`)

**Governance & Supply Chain (2 skills)** — Agent runtime controls, provenance, and integrity
- `agent-safety` — Add policy enforcement, trust scoring, audit trails, and tool-access controls to agents, and generate/verify integrity manifests for agent plugins and tools (consolidates the former `agent-governance` and `agent-supply-chain` skills into governance and supply-chain reference sections)
- `secret-scan-triage` — Triage gitleaks findings with containment and false-positive adjudication before merging

**CI/CD (1 skill)** — GitHub Actions troubleshooting, diagnosis, and local reproduction
- `github-actions-failure-triage` — GitHub Actions broke. Find the root cause and fix it.

**Code Quality (2 skills)** — JS/TS code-health analysis, cleanup, and structural search
- `fallow` — Use Fallow for dead code, duplication, complexity, boundary, and cleanup workflows in JS/TS repos
- `ast-grep` — Structural code search, linting, and safe codemod rewrites with ast-grep

**Architecture & Design (1 skill)** — Shared structural vocabulary and boundary-health checks
- `codebase-design` — Module/interface/adapter/depth/seam vocabulary, the deletion test, the two-adapters rule, and dependency categories, shared by `test-driven-development`, `code-review`, `systematic-debugging`, and `improve`

**Authoring & Configuration (4 skills)** - Skill creation and setup workflows
- `copilot-extension-development` - Build and register Copilot CLI extensions
- `skill-authoring` - Write reusable agent skills from scratch with activation conditions
- `init` - Create or update copilot-instructions.md and per-file instruction files
- `human-setup-wizard` - Generate a human-only setup walkthrough with confirmation gates and safe secret handling; never executed end-to-end by an agent

**Version Control (3 skills)** — Worktree, branching, and PR workflows
- `git-signing-troubleshoot` — Diagnose GPG, SSH, or 1Password signing blockers
- `git-worktrees` — Create and manage isolated Git worktrees for parallel lanes, including Worktrunk (`wt`) hooks, LLM commits, merge pipeline, and parallel-agent lane configuration (consolidates the former standalone `worktrunk` skill)
- `github-cli-pr-workflow` — Complete PR lifecycle with `gh`: create/update, resolve review comments, watch checks, and choose merge, keep, or discard

**Review & Analysis (2 skills)** — Evidence-backed review and repository comparison
- `code-review` — Review diffs, PRs, branches, and patches with evidence and validation
- `cross-repo-diff` — Compare repositories for feature parity, drift, or migration reference

**Utilities (3 skills)** — Context reduction, code navigation, and web patterns
- `code-intelligence` — Navigate and refactor code with the right search tool (LSP, rg, or semantic) and proper degradation fallback
- `herdr` — Inspect panes, create tabs, wait for output, and coordinate agents in herdr
- `modern-web-guidance` — Write HTML, CSS, JavaScript, forms, and animations without reaching for legacy patterns

**Infrastructure & Cloud (3 skills)** — Terraform, AWS deployment, and cloud-agent failure diagnosis
- `iam-oidc-triage` — Diagnose AWS STS AssumeRole AccessDenied on OIDC paths
- `sam-cloudformation` — Diagnose AWS SAM and CloudFormation failures
- `terraform-skill` — Write, review, or debug Terraform/OpenTofu — modules, tests, CI/CD, security scans, and state operations

**Memory & Session (2 skills)** — Lore memory management and session continuity
- `lore-memory-operations` — Write and verify Lore memories with scope and persistence semantics
- `resolve-open-loops` — Close out active `open_loop` and `assistant_goal` Lore memories when the stabilisation-guard fires or when pending items need explicit resolution

**Tooling (1 skill)** — Package-manager, runtime, and toolchain upgrade diagnosis
- `tooling-upgrade-triage` — Diagnose failed package-manager, runtime, or toolchain upgrades

### Recent consolidations

The skill library was audited and several packages were merged or retired to keep the catalog coherent. Old direct-name invocations for the removed packages no longer resolve — use the replacement names below:

| Removed | Replaced by | Why |
| --- | --- | --- |
| `customize-cloud-agent` | — (deleted) | Deferred to the general `copilot-setup-steps` guidance surfaced elsewhere; not enough distinct workflow to justify a standalone skill. |
| `grill-me`, `grill-with-docs` | `grill` | Same interrogation workflow with a mode switch (`interrogate` vs `interrogate-with-docs`) instead of two near-duplicate packages. |
| `worktrunk` | `git-worktrees` | One user-facing worktree skill instead of two; `git-worktrees` now covers both raw `git worktree` and Worktrunk (`wt`) configuration. |
| `project-references-migration` | `tsconfig-hardening` (project-references mode) | Project-references adoption is now an explicit mode of the same TypeScript config skill instead of a separate package. |
| `agent-governance`, `agent-supply-chain` | `agent-safety` | Governance (runtime policy) and supply-chain integrity are related agent-safety concerns, kept as clearly separated reference sections in one package. |

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
| Learned-rule ID integrity | `node scripts/validate-rule-ids.mjs` — checks the global-pool ledger files (root + deprecated + go/memory/shell/review/github instructions) for a reused ID with different content; also wired into `check-health.mjs`. |
| Skill validation | `node skills/skill-authoring/scripts/validate-skill-library.mjs`. |
| DB compaction | Between sessions, `sqlite3 lore.db 'VACUUM;'` and the same on `session-store.db`. Both DBs are open while Copilot CLI is running. |

---

## Custom Agents

Alongside the built-in agents, this repository tracks **8 custom agents** for specialized workflows:

| Agent | What It Does | Use When |
|-------|-------------|----------|
| **ci-migration-orchestrator** | Orchestrates multi-workflow CI migration and workflow-modernization work with phased rollout, validation, and contract checks. Works with reusable GitHub Actions skills. | CI work spans multiple workflows, environments, or rollout stages |
| **copilot-config-curator** | Audits and improves this `~/.copilot` repo's skills, agents, instructions, extensions, docs, and validators as one coherent library. | You want repo-wide Copilot config curation driven by current state and recent sessions |
| **implementation-planner** | Breaks complex work into actionable plans with clear tasks, dependencies, and parallelizable phases. Outputs stable `v1` planner contracts. | You want a detailed implementation plan before coding |
| **pr-operations-orchestrator** | Coordinates PR descriptions, review-thread handling, workflow checks, and merge-readiness once most code changes already exist. | The remaining work is GitHub-side PR orchestration rather than fresh implementation |
| **typescript-api-test-generator** | Writes runtime tests for TypeScript APIs, request handlers, and Lambda functions using your repo's existing test framework. | You need new or expanded test coverage around a TypeScript API surface |
| **web-research-analyst** | Investigates external docs, patterns, and prior art, then distills findings into actionable recommendations and handoff-friendly summaries. | You need research + comparisons grounded in actual documentation before deciding on an approach |
| **research-fleet** | Fans research into visible, pane-per-subtopic Copilot processes and synthesizes their findings. | You explicitly want separate herdr panes for parallel research |
| **workflow-bash-refactor** | Refactors dense inline Bash and hard-to-read GitHub Actions conditions without changing behavior. | A workflow needs structural clarity rather than a root-cause fix |

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
