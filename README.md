# Copilot Config

Your personal Copilot CLI setup — a collection of instructions, agents, skills, and extensions that work together to make AI-assisted development smoother and more powerful.

| What | Where | Purpose |
| --- | --- | --- |
| [User Copilot Instructions](./copilot-instructions.md) | Root | Core principles and learned rules that apply everywhere |
| [File-Type Instructions](./instructions/) | `instructions/` | Language-specific guidance (TypeScript, Go, YAML, etc.) |
| [Custom Agents](./agents/) | `agents/` | Specialized agents for orchestration and complex workflows |
| [Skills](./skills/) | `skills/` | Reusable task-specific workflows you can invoke directly |
| [Extensions](./extensions/) | `extensions/` | Auto-discovered lifecycle hooks and custom tools |          |


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

## Extensions

These live in [`./extensions/`](./extensions/) and are auto-discovered by the Copilot CLI. They're the unsung heroes quietly injecting themselves into your workflow via lifecycle hooks, custom tools, or both.

> **Lore is the active memory system here.** The remaining `coherence` naming in the root repo is legacy compatibility residue, not the primary implementation surface.

### Extension Catalog

| Extension | What It Does |
| --------- | ------------ |
| `lore` | Local-first memory and continuity for Copilot CLI. Handles session recall, learning from your workflow, and keeping context sharp across sessions. Keep Lore-specific setup, rollout, maintenance, and health docs in [`./extensions/lore`](./extensions/lore). |
| `plan-review-policy` | Adds the `/plan` review workflow with Jason (`GPT-5.3-codex`) and Freddy (`Claude Sonnet 4.6`) reviewer loop, then propagates that guidance into delegated `/plan` child agents. |
| `plan-review-orchestrator` | Adds passive plan-review orchestration: initializes review state on `/plan`, injects context into runtime-launched matching reviewer children, and tracks surfaced reviewer verdicts without launching reviewers itself. |
| `ci-migration-context` | Detects CI migration requests (e.g., CircleCI→GitHub Actions) and injects extra migration context + checklist into parent turns and delegated child agents. |
| `fleet-model-policy` | Steers implementation-heavy fleet work toward `GPT-5.3-codex`, then propagates that policy preference into delegated implementation-style child agents. |
| `gha-url-router` | Detects GitHub Actions run/job URLs in prompts, injects structured routing context, and passes that context into delegated investigation agents. |
| `post-edit-lint` | Watches `edit`-style tool calls and runs targeted formatting, linting, and validation for JS/TS, JSON, YAML, Terraform, and shell files, feeding results back into the conversation. |
| `research-current-model-policy` | Keeps `/research` aligned with your currently selected model and reasoning effort, instead of falling back to a bundled default. |
| `worktree-manager` | Adds `mr_worktree_create`, `mr_worktree_list`, `mr_worktree_status`, and `mr_worktree_remove` tools, plus injects worktree guidance into implementation-style child agents so edits stay isolated. |
| `copilot-healthcheck` | Adds the `mr_healthcheck_run` tool — a lightweight environment check that reports repo state and key local Copilot files/tools. |

### Child-Agent Context Propagation

Several extensions inject policy and guidance into delegated child agents:
- **fleet-model-policy** → implementation-style child agents (model preference)
- **plan-review-policy** → `/plan` child agents (reviewer loop)
- **plan-review-orchestrator** → plan review child agents (orchestration state)
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
Use `/plan` to turn research into actionable work. The plan gets reviewed by Jason (`GPT-5.3-codex`) and Freddy (`Claude Sonnet 4.6`) — both reviewers must approve before you move on.

```
/plan Turn the research into a fully actionable plan suitable for fleet execution. 
Jason and Freddy should review. The plan is not ready until both reviewers approve it.
```

### Step 3: Implement (Execute)
Use `/fleet` or direct agent delegation for implementation. Child agents inherit worktree guidance, model preferences, and fleet policy automatically.

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
After research approves, plan it:
```
/plan Turn this research into a migration timeline with clear phases. 
Include all affected workflows, test requirements, and rollback procedures. 
Jason and Freddy should review. Plan is ready only when both approve.
```
Then implement with `/fleet` — child agents inherit `ci-migration-context` guidance automatically.

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

This setup includes a growing library of reusable agent skills — a production-grade set of workflows that handles everything from TypeScript compile errors and type safety to CI/CD migrations, testing workflows, and git orchestration. Each skill activates only when its specific conditions are met, preventing overlap and ensuring the right tool gets used for each task.

The repo-tracked baseline now includes `context-map`, and the live `~/.copilot` profile also carries a wave-1 Awesome Copilot adoption set (`agent-governance`, `agent-supply-chain`, and `acquire-codebase-knowledge`) via user-scope installs into the main `~/.copilot` checkout's `skills/` directory. The category counts below describe the repo-tracked baseline catalog in this worktree; the wave-1 user-scope skills are documented separately because they currently live as local installs in the main `~/.copilot` profile. See [Awesome Copilot Adoption (Wave 1)](#awesome-copilot-adoption-wave-1) for the durable install notes and defer list.

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

**Workflow & Planning** — Planning, handoff docs, and task orchestration
- `context-map` — Map likely files, dependencies, tests, and reference patterns before multi-file work
- `reverse-prompt` — Turn a vague request into an executable task brief (explicit user trigger)
- `workflow-contracts` — Create versioned markdown handoff artifacts for multi-turn work
- `finishing-a-development-branch` — Branch is done. Now what? Merge, PR, stash, or discard?
- `doc-coauthoring` — Write docs collaboratively with context gathering and reader feedback loops

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

### Using Skills

Skills activate in three ways:

- **You invoke directly** — When you know your task matches a skill's activation condition, just call it by name
- **We recommend it** — The CLI watches context and suggests skills when boundaries match
- **You ask `/help skills`** — List the installed skills or drill into one with `/help <skill-name>`

Think of skills as specialized tools you grab when you recognize the problem. No guessing. Clear activation rules. Explicit boundaries.

### Quarterly Skill Review

The skills catalog is reviewed quarterly for new additions, removals, or routing adjustments. Reviews are baked into quarterly planning cycles. See the [Skills Audit](./session-state/skills-audit.md) for the complete inventory.

## Awesome Copilot Adoption (Wave 1)

Wave 1 adopts the highest-signal additions from [Awesome Copilot](https://github.com/github/awesome-copilot) without duplicating the planning, context-mapping, and agent-authoring surfaces this setup already has.

| Kind | Addition | Why it made wave 1 | Where it lives / durability |
| --- | --- | --- | --- |
| Plugin | `doublecheck@awesome-copilot` | Adds a verification-heavy research and writeup pass with explicit confidence labels. | Local plugin state only: the install is reflected in local `config.json` and `installed-plugins/awesome-copilot/`, while this README is the durable tracked record. |
| Plugin | `awesome-copilot@awesome-copilot` | Adds a lightweight discovery layer for re-checking new Awesome Copilot assets later. | Local plugin state only: same local-only durability boundary as `doublecheck`. |
| Skill | `agent-governance` | Adds reusable governance patterns for tool access, approval gates, audit trails, and fail-closed behavior. | User-scope install under `~/.copilot/skills/agent-governance/` in the live main checkout. |
| Skill | `agent-supply-chain` | Adds integrity-manifest and verification patterns for reviewing third-party agent/plugin content. | User-scope install under `~/.copilot/skills/agent-supply-chain/` in the live main checkout. |
| Skill | `acquire-codebase-knowledge` | Adds a durable repo-onboarding / reconnaissance workflow for producing traceable codebase knowledge packs. | User-scope install under `~/.copilot/skills/acquire-codebase-knowledge/` in the live main checkout. |

### Install notes

```bash
copilot plugin install doublecheck@awesome-copilot
copilot plugin install awesome-copilot@awesome-copilot
gh skill install github/awesome-copilot agent-governance --scope user
gh skill install github/awesome-copilot agent-supply-chain --scope user
gh skill install github/awesome-copilot acquire-codebase-knowledge --scope user
```

- **Plugins are machine-local state.** In this setup, plugin enablement and marketplace cache details live in local `config.json` plus `installed-plugins/awesome-copilot/`; those are not the durable artifact for wave 1.
- **The README is the durable artifact.** This file records what was adopted, why it was chosen, and how to reproduce the local install state later.
- **User-scope skills land in the main `~/.copilot` checkout's `skills/` directory.** For this profile, `gh skill install --scope user` materializes the adopted skills there rather than inside ignored plugin caches.
- **Those skill copies are currently local install state.** They live in a tracked-looking path, but for this wave the authoritative tracked artifact is the README update in this worktree rather than the live installed copies from the main checkout.
- **The commands above install the current upstream versions.** If you later need a pinned revision, record that ref explicitly instead of assuming the marketplace default stayed unchanged.

### Deferred / follow-on items

| Item | Why it is not in wave 1 | When to revisit |
| --- | --- | --- |
| `context-engineering` | Useful, but it overlaps heavily with the local `context-map` skill plus the existing research→plan workflow, so it would duplicate context-mapping behavior rather than add a clearly new surface. | Revisit only if the packaged `/context-map` plugin workflow proves meaningfully better than the local skill + planning flow. |
| `project-planning` | The repo already has `implementation-planner`, `workflow-contracts`, and plan-review extensions, so another planning plugin would mostly duplicate existing planning/PRD generation surfaces. | Revisit if you want packaged PRD/issue-generation commands beyond the current local planning stack. |
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
4. Remove: `mr_worktree_remove <ID>` or `git worktree remove .worktrees/<CATEGORY>/<ID>`
5. Optionally delete the branch: `git branch -d agent/<ID>` or `git branch -d task/<ID>`

**Monthly audit**: Run `git worktree list`, check for branches inactive 30+ days, archive orphaned worktrees.

**54 existing worktrees** are being transitioned to this naming scheme. A proof-of-concept batch of 8 high-visibility worktrees has already been renamed. The remaining ~46 flat-pattern worktrees will migrate incrementally as their work completes.

---

## Custom Agents

Beyond the built-in agents (task, explore, rubber-duck, code-review, general-purpose), this setup includes **4 custom agents** for specialized workflows:

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
