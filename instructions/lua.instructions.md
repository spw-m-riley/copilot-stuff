---
description: 'Guidance for Lua and Neovim-oriented files in this workspace'
applyTo: "**/*.lua"
---

# Lua and Neovim guidance

## Purpose and Scope

- Applies to `**/*.lua` files in this workspace.
- In this repo, Lua is usually part of a Neovim configuration, so these rules bias toward Neovim-specific structure, runtime behavior, and validation.

## Core Guidance

- Assume Lua files are usually part of a Neovim config unless the surrounding codebase clearly indicates otherwise.
- Prefer the existing config structure (`init.lua`, `lua/<namespace>/`, `plugin/`, `after/`, `ftplugin/`) and keep responsibilities in the right place.
- Use modern Neovim Lua APIs and the surrounding config's patterns consistently; avoid mixing in older Vimscript-style approaches without a reason.
- Keep plugin specs declarative and isolate plugin-specific setup to the relevant module instead of scattering it across the config.
- Prefer the existing formatter, linter, and LSP setup already used by the config rather than introducing parallel tooling.
- Keep keymaps, autocmds, options, and plugin side effects predictable, non-duplicated, and easy to trace when debugging behavior.

## Validation Expectations

- Use the repository's existing formatter, linter, and startup validation flow for the touched Lua surface.
- Prefer real TTY or interactive startup checks for UI-sensitive Neovim behavior instead of relying only on headless probes.

## Maintenance Notes

- Keep `## Learned Rules` as the final section in the file; do not add new sections after it.
- Append new learned rules without renumbering existing entries; numbering gaps can reflect archived or superseded rules.
- Use `[NEOVIM]` for repo-specific learned rules in this file because this workspace's Lua surface is primarily Neovim-oriented; keep broader cross-cutting policy in the root instructions.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [NEOVIM] When consuming `vim.treesitter.query:iter_matches()` results on Neovim 0.12+, treat each capture slot as a list of nodes, not always a bare `TSNode`; unwrap the first capture before calling node methods like `:range()` - recent runtime changes broke older plugins that assumed a single userdata per capture
2. [NEOVIM] If a plugin starts causing cascading compatibility issues and the user says it is not worth more churn, remove the plugin cleanly instead of continuing to stack local shims - the user explicitly preferred dropping `ssr.nvim` over further debugging
3. [NEOVIM] When migrating a Neovim dashboard from lazy.nvim to vim.pack, replace any Snacks or local footer sections that call `lazy.stats` before enabling the dashboard - the UI can initialize successfully but still crash during startup rendering on the first dashboard open
4. [NEOVIM] When validating a vim.pack migration, verify eager-plugin config side effects directly instead of assuming an active package or available command means the plugin's `config` callback ran - this migration exposed a case where Snacks was active in `vim.pack` but still needed an explicit bootstrap guard
5. [NEOVIM] When validating a Neovim config from a repo checkout or worktree, explicitly point `nvim` at that config with `XDG_CONFIG_HOME`/`NVIM_APPNAME` (or an equivalent config-path override); changing directories alone does not make Neovim load that checkout - this session initially validated the live symlinked config instead of the worktree by accident
6. [NEOVIM] When this Neovim repo uses nested `.worktrees/` checkouts, make repo-wide validators ignore `.worktrees/**` before trusting commands like `selene .` or `stylua --check .` - otherwise the main checkout lints duplicated migration lanes and the documented validation commands stop being trustworthy
8. [NEOVIM] When migrating lazy.nvim specs to `vim.pack`, do not carry over lazy-only shorthand blindly: use real upstream repos (for example `echasnovski/mini.nvim` with explicit `name` for `mini.*` modules) and replace wildcard versions like `*`/`v2.*` with verified branches, tags, or lockfile-backed refs - this session showed lazy-style repo/version shorthands can leave `vim.pack` installs half-checked-out or unloadable
9. [NEOVIM] Prefer plugin-local `main = ...` annotations or explicit `config` functions over a central loader override table for Lua module names in this Neovim config - plugin-specific setup knowledge belongs with the plugin spec, and a shared override map drifts as plugins are renamed or replaced
10. [NEOVIM] When discussing this vim.pack loader, keep the distinction explicit: `opts` are the arguments for a plugin's `.setup(...)`, while `main` or `config` decides how that setup is reached - this correction flagged an answer that blurred config transport with module-target inference
11. [NEOVIM] When the user agrees with a scoped Lua/Neovim cleanup direction for the current change, implement it in the next turn instead of treating the agreement as conversational only - this session required an extra prompt because the agreed `main_overrides` cleanup was not applied immediately
12. [NEOVIM] Validate interactive UI startup behavior in a real TTY session, not just `nvim --headless` probes - this session showed colorscheme/dashboard startup state can look unset in headless mode while behaving correctly in an actual UI
13. [NEOVIM] When integrating Blink with `copilot.lua` in this Neovim config, do not call `copilot.api` through a cached Copilot client reference; reacquire the current attached client for each request and return no items until it is initialized - `vim.pack` startup timing exposed nil-client races that broke completions
14. [NEOVIM] When decoding optional JSON in Neovim Lua, treat `vim.json.decode("null")` as the `vim.NIL` sentinel and normalize it before list operations like `#`, `ipairs`, or `vim.islist` - this session's Pack review helper crashed because `null` was assumed to become plain Lua `nil`
15. [NEOVIM] When a Lua helper takes an LSP client from attach/replay logic in this Neovim config, always guard `client` before indexing fields like `client.name` or calling methods - existing-client scans and deferred callbacks can hand the helper a nil client and crash with `attempt to index local 'client'`
16. [NEOVIM] When a generic `client` nil crash persists in this Neovim config, trace the specific interactive plugin path before concluding on a fix - multiple Copilot/LSP integrations can use a local `client`, and headless probes or plausible repo-local guesses are not enough
17. [NEOVIM] When the user provides an exact Neovim plugin stack path in `:messages`, fix that reported plugin path first and revert any speculative workaround that targeted a different integration - this session's nil-`client` crash came from `copilot.lua` API requests, not the Sidekick path first suspected
18. [NEOVIM] When composing a native statusline in Neovim Lua, treat `vim.ui.progress_status()` as already statusline-formatted text and do not pass it through generic `%` escaping helpers - double-escaping its `%` markers corrupts the rendered progress segment
19. [NEOVIM] When wrapping native `nvim.undotree` with a repo-local global toggle, do not stop after closing an existing undotree window unless the command was invoked from the undotree window itself - otherwise retargeting from buffer A to buffer B regresses into a two-press close-then-reopen flow instead of a single-step panel swap
20. [NEOVIM] When reloading a Blink provider from `LspAttach` in this Neovim config, first check `blink.cmp.config.sources.providers` for that provider id - `blink.reload()` asserts on unknown providers and turns a stale Copilot hook into a user-visible LSP attach error
21. [NEOVIM] When converting `string.find()` positions into extmark columns for bracketed progress/status segments, remember the source indices are 1-based/inclusive while extmark columns are 0-based/end-exclusive; for `%b[]` ranges the extmark start should use the opening bracket index and the extmark end should use the closing bracket index - this pack-review merge regressed the progress bar by one character on both ends
22. [NEOVIM] When a user reports a live Neovim config behavior is still missing after a feature lane was finished, first verify the active checkout/branch actually contains the promoted commit before debugging runtime UI behavior - this pack-review progress issue turned out to be main still running pre-promotion code
23. [NEOVIM] When validating this live `~/.config/nvim` checkout with `XDG_CONFIG_HOME`/`NVIM_APPNAME`, set `XDG_CONFIG_HOME` to the parent `.config` directory, not the repo root itself - pointing `XDG_CONFIG_HOME` at the repo makes `stdpath('config')` resolve to a nested `.../nvim/nvim` path and can create a stray `nvim/nvim-pack-lock.json`
24. [NEOVIM] When the user scopes a Pack Review Lua lane to the existing seam helpers and asks for the minimal truthful implementation, stop extra Neovim API/doc research and implement directly through those seams unless a concrete runtime issue blocks progress - this correction explicitly redirected discovery-progress work away from more `vim.system` doc spelunking
25. [NEOVIM] When pinning `saghen/blink.cmp` in this Neovim config, use `branch = "v1"` and keep the lockfile on a `v1` commit; the legacy `version = "v0.*"` pin no longer keeps `vim.pack` off Blink V2, which now hard-requires `saghen/blink.lib`
26. [NEOVIM] When checking updates for version-pinned plugins through `vim.pack.update()` or the Pack Review UI in this Neovim config, verify the reported target ref before trusting it; Blink showed `spec.version = "v1"` while review discovery still compared against `main`
27. [NEOVIM] When pinning `saghen/blink.cmp` in this Neovim config and the goal is vim.pack-native stable major-line tracking, prefer `version = vim.version.range("^1")` over branch-only guidance, and preserve that explicit pin when the plugin is also referenced as an unpinned dependency; this session showed duplicate registry merges could nil out the pin and send `vim.pack.update()` to Blink V2 on `main`
28. [NEOVIM] When running isolated headless `vim.pack` repros for this Neovim config, isolate `XDG_CONFIG_HOME` as well as `XDG_DATA_HOME`/`XDG_STATE_HOME`/`XDG_CACHE_HOME`; otherwise the repro can leave synthetic plugin entries in the real `nvim-pack-lock.json` even if installs go to temp data dirs - this session's build-hook callback repro leaked `build-hook-test` into the live lockfile until the config-home path was isolated too
29. [NEOVIM] When merging Lua config booleans in this Neovim config, never use an `and/or` ternary pattern to preserve explicit `false`; check `~= nil` explicitly so flags like `lazy = false` survive spec merges - this session showed `raw.lazy == false and false or spec.lazy` silently turned eager plugins back into lazy ones
30. [NEOVIM] When fixing shutdown-time LSP behavior in this Neovim config, do not assume an active client will trigger `LspAttach` or attach to the current buffer; detached clients like Copilot can still hit global `VimLeavePre` cleanup, so preload runtime helpers on the LSP setup path instead of buffer-attach hooks - this session's `vim.lsp._watchfiles` error persisted until the preload moved out of `LspAttach`
