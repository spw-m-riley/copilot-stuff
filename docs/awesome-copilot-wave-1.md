## Awesome Copilot Adoption (Wave 1)

> Historical adoption record. Extracted from `README.md` to keep the entry doc focused; the content below is a verbatim copy of the original section.

Wave 1 records the initial adoption of the highest-signal additions from [Awesome Copilot](https://github.com/github/awesome-copilot) without duplicating the planning, context-mapping, and agent-authoring surfaces this setup already had. This section is historical adoption context, not a full live inventory of the current local plugin state.

| Kind | Addition | Why it made wave 1 | Initial landing / durability |
| --- | --- | --- | --- |
| Plugin | `awesome-copilot@awesome-copilot` | Adds a lightweight discovery layer for re-checking new Awesome Copilot assets later. | Historical machine-local install recorded in `config.json` and `installed-plugins/awesome-copilot/`; this README remains the durable tracked record for the adoption decision. |
| Skill | `agent-governance` | Adds reusable governance patterns for tool access, approval gates, audit trails, and fail-closed behavior. | Initially installed as a user-scope skill in the live main checkout; it is now also tracked in this repository under [`./skills/agent-governance/`](../skills/agent-governance/). |
| Skill | `agent-supply-chain` | Adds integrity-manifest and verification patterns for reviewing third-party agent/plugin content. | Initially installed as a user-scope skill in the live main checkout; it is now also tracked in this repository under [`./skills/agent-supply-chain/`](../skills/agent-supply-chain/). |
| Skill | `acquire-codebase-knowledge` | Adds a durable repo-onboarding / reconnaissance workflow for producing traceable codebase knowledge packs. | Initially installed as a user-scope skill in the live main checkout; it is now also tracked in this repository under [`./skills/acquire-codebase-knowledge/`](../skills/acquire-codebase-knowledge/). |

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
| `agentic-eval` | Deferred from wave 1 to keep scope tight. | **Adopted post-wave-1** — now repo-tracked under [`./skills/agentic-eval/`](../skills/agentic-eval/). |

---
