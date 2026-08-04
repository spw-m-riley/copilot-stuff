---
description: 'Guidance for Copilot CLI extension code and integration surfaces'
applyTo: "extensions/**/*"
---

# Extension guidance

## Guidance

- Defer to a nested extension repository's own instructions and keep this file focused on integration boundaries.
- Verify hook names and payload contracts against the shipped Copilot CLI SDK or bundled runtime source before implementing them; issue descriptions can mention unsupported hooks.
- Normalize extension tool arguments before reading fields because interactive payloads can arrive as JSON strings.
- Keep extension reloads separate from follow-up extension-tool calls so availability changes are validated sequentially.
- Do not add branded model names or model IDs to extension files unless Matt explicitly requests them.
- Keep root documentation high-level and keep detailed setup, rollout, maintenance, and product guidance with the owning nested extension.
- Do not suggest direct calls to blocked Copilot API endpoints; use the supported local or editor-backed fallback.
- Prefer syntax checks and extension-runtime validation over plain Node imports when dependencies are provided only by Copilot CLI.
- When live-testing a tool handler, pass the structured arguments implied by the natural-language request before diagnosing routing.
- When an extension or its test surface moves, update the tracked README and CI/test references in the same slice.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [EXTENSIONS] Never batch `extensions_reload` with follow-up extension tool invocations; reload first, then run extension tools in a separate step and report the pause up front - this session stalled when a post-reload `lore_onboard` call was interrupted in the same batch
2. [DOCS] When updating the root `~/.copilot` docs for a nested extension repo, keep the root README high-level and move detailed setup, rollout, maintenance, and product documentation into that extension repo's own docs - Matt explicitly wants Lore documentation to live in the Lore repo instead of being duplicated here
3. [EXTENSIONS] In this environment, `api.githubcopilot.com` is blocked by the corporate firewall - do not suggest any tool that calls it directly (including `llm-github-copilot`, `CopilotChat.nvim`, or `codecompanion.nvim`). For LLM commit messages in worktrunk, use the Neovim editor fallback instead of a Copilot-backed CLI tool
4. [EXTENSIONS] In files under `extensions/`, never reference branded model names or specific model IDs unless Matt explicitly asks for them - he explicitly asked to remove names like Sonnet and `GPT-5.3-codex` from that subtree
5. [RESEARCH] When the user asks about Copilot CLI or extension-runtime capabilities, inspect the bundled CLI/SDK source or other authoritative runtime source first instead of inferring behavior from local `~/.copilot` usage examples - repo-local extension patterns are not the runtime contract
6. [WORKFLOW] When a repo-local extension or test surface moves to a new path, update the tracked README and CI/test-command references in the same slice before promotion - a prior move left automation and documentation stale
7. [EXTENSIONS] Before implementing a Copilot CLI hook, verify the hook name exists in the shipped SDK docs/types for the current CLI version; unknown hook keys are silently ignored at runtime
8. [EXTENSIONS] In Copilot CLI session hooks, always normalize `toolArgs` before reading fields like `path`, `view_range`, or `forceReadLargeFiles`; interactive runtime payloads can arrive as JSON strings even when object-shaped args appear elsewhere
9. [WORKFLOW] When live-testing a tool handler directly, pass the structured arguments that the natural-language request implies before diagnosing routing from rendered output - omitting an implied scope flag can look like a routing failure
