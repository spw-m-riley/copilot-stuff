# Copilot Config

| Column1                                                | Column2                                              |
| ------------------------------------------------------ | ---------------------------------------------------- |
| [User Copilot Instructions](./copilot-instructions.md) | Short, generic concepts for all projects             |
| [User Instructions](./instructions/)                   | General rules at a file type level                   |
| [User Agents](./agents/)                               | Specialised Agents for specific tasks                |
| [User Skills](./skills/)                               | A set of instructions that help with tasks/workflows |
| [User Extensions](./extensions/)                       | Think git hooks but for the agent lifecycle          |


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

## Extensions

These live in [`./extensions/`](./extensions/) and are auto-discovered by the Copilot CLI. They add either lifecycle hooks, custom tools, or both.

> Lore is the active local-memory system in this workspace.
> Remaining `coherence` naming in the root repo is legacy compatibility residue, not the primary implementation surface.

| Extension | What it does |
| --------- | ------------ |
| `lore` | Local-first memory and continuity extension for Copilot CLI. Keep Lore-specific setup, rollout, maintenance, browser, and health docs in [`./extensions/`](./extensions/). |
| `ci-migration-context` | Detects CI migration-related prompts such as CircleCI to GitHub Actions work and injects extra migration context in the parent turn, then propagates that checklist into relevant delegated child agents. |
| `copilot-healthcheck` | Adds the `mr_healthcheck_run` tool, which performs a lightweight environment check for the current working directory and reports things like repo state and key local Copilot files/tools. |
| `fleet-model-policy` | Applies prompt-time steering for fleet mode so implementation-heavy fleet work prefers `GPT-5.3-codex`, and now propagates that policy into delegated implementation-style child agents. |
| `gha-url-router` | Detects GitHub Actions run and job URLs in prompts, injects structured routing context in the parent turn, and now passes that run/job context into relevant delegated child agents too. |
| `plan-review-policy` | Adds the default `/plan` review policy, including the Jason (`GPT-5.3-codex`) and Freddy (`Claude Sonnet 4.6`) reviewer loop, and now propagates reviewer/helper guidance into delegated `/plan` child agents. |
| `post-edit-lint` | Watches edit-style tool calls and then runs targeted formatting, linting, and validation steps for common file types such as JS/TS, JSON, YAML, Terraform, and shell files, feeding the results back into the conversation. |
| `research-current-model-policy` | Keeps `/research` aligned with the currently selected foreground model and reasoning effort, instead of falling back to the bundled research model default. |
| `worktree-manager` | Adds the `mr_worktree_create`, `mr_worktree_list`, `mr_worktree_status`, and `mr_worktree_remove` tools, and now injects child-agent guidance for implementation-style delegated tasks so git edits stay isolated in dedicated worktrees. |

Child-agent context propagation is currently enabled in:

- `fleet-model-policy` (delegated implementation-style fleet subagents)
- `plan-review-policy` (delegated reviewer/helper subagents spawned from `/plan`)
- `ci-migration-context` (delegated CI migration and workflow-debugging subagents)
- `gha-url-router` (delegated GitHub Actions investigation subagents)
- `worktree-manager` (delegated implementation/edit/task-style subagents in git repos)

This improves fleet-mode execution by making policy, routing, and worktree expectations available inside delegated child runs instead of limiting that context to the parent prompt.

## Prompt Tips

- goal + constraints + deliverables + approval rule, plus @ mentions for exact files. Example: `There are npm packages in @package.json which need to be updated. Only update the packages which are non-major releases. The work is only complete if all tests and lint/formatting rules pass after the packages have been updated.`

- The most optimal workflow is Research -> Plan -> Implement
  - Use `/research` for your research. Example prompt: `/research @project-d/ needs to be migrated from CircleCI to GitHub Actions. There are other projects in this directory which have been through the process @project-a/ , @project-b/ and @project-c/ Use those as guides to how the migration should/could be done. Go in deep and make sure you have a full understanding of the shared workflows, the approach to the migrations, the terraform changes, and anything else which is required to make the migration run as smoothly as possible.`
  - Use `shift+tab` or `/plan` for the planning. Example: `/plan Turn the research into a fully actionable plan. Make the plan suitable for fleet to be used. Ask GPT-5.3-codex and Claude Sonnet 4.6 to review the plan. The plan should not be considered ready until the reviewers approve it. Every reviewer must review in each round of reviews. Delegated `/plan` child agents now inherit the reviewer/helper policy too.`
  - Use `shift+tab` till you get to autopilot and `/fleet` for implementation, often it will recommend it to you anyway. During delegated implementation/edit runs in git repos, child agents now receive fleet-policy and worktree guidance, so they are nudged toward the right model and one worktree per agent/task before editing.

## Model Tips

- All models are not the same.
  - Some models are great for the research phase (GPT-5.4, Claude Sonnet/Opus, Gemini) some are not (GPT-5.3-codex)
  - Some are great at the implementation phase (GPT-5.3-codex/5.4, Claude Opus) some are not (Gemini)
- Find the model which is best suited to you or delivers the best output for you. Presently, GPT-5.4 does the best of everything for **me** but I still want other models to check its work (alongside manual checks) prior to its release I would use Sonnet for research & plan and then 5.3-codex for implementation.
- Reasoning doesn't always work best at the highest setting.
  - When using `/model` you can select the reasoning level for the model, the default is often the one the copilot team believes is the most optimal but you may find different. Example: GPT-5.4 default is set at `medium`, I prefer the output of `high` and find `xhigh` to make more mistakes.

## Resources

| Name                                                                                                                                       | Description                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| [Anthropics Guide To Building Skills](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf?hsLang=en) | Comprehensive guide to building your own skills from the makers of Claude                                       |
| [Copilot Documentation](https://docs.github.com/en/copilot)                                                                                | Official Docs from GitHub, covers every aspect of Copilot (although not the 'experimental' features in the cli) |
| [Awesome Copilot](https://github.com/github/awesome-copilot)                                                                               | A collection of skills, agents, instructions from GitHub themselves                                             |
| [Matteo Collina's Skills](https://github.com/mcollina/skills)                                                                              | Skills from the NodeJS contributor and Fastify creator                                                          |
| [Superpowers](https://github.com/obra/superpowers) | An agentic skills framework & software development methodology that works |
| [UI-UX-Pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | An AI skill that provide design intelligence for building professional UI/UX multiple platforms |
