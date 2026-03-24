---
applyTo: "**/*.lua"
---

Assume Lua files are usually part of a Neovim config unless the surrounding codebase clearly indicates otherwise.
Prefer the existing config structure (`init.lua`, `lua/<namespace>/`, `plugin/`, `after/`, `ftplugin/`) and keep responsibilities in the right place.
Use modern Neovim Lua APIs and the surrounding config's patterns consistently; avoid mixing in older Vimscript-style approaches without a reason.
Keep plugin specs declarative and isolate plugin-specific setup to the relevant module instead of scattering it across the config.
Prefer the existing formatter, linter, and LSP setup already used by the config rather than introducing parallel tooling.
Keep keymaps, autocmds, options, and plugin side effects predictable, non-duplicated, and easy to trace when debugging behavior.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
1. [NEOVIM] When consuming `vim.treesitter.query:iter_matches()` results on Neovim 0.12+, treat each capture slot as a list of nodes, not always a bare `TSNode`; unwrap the first capture before calling node methods like `:range()` - recent runtime changes broke older plugins that assumed a single userdata per capture
2. [NEOVIM] If a plugin starts causing cascading compatibility issues and the user says it is not worth more churn, remove the plugin cleanly instead of continuing to stack local shims - the user explicitly preferred dropping `ssr.nvim` over further debugging
