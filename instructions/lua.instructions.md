---
applyTo: "**/*.lua"
---

Assume Lua files are usually part of a Neovim config unless the surrounding codebase clearly indicates otherwise.
Prefer the existing config structure (`init.lua`, `lua/<namespace>/`, `plugin/`, `after/`, `ftplugin/`) and keep responsibilities in the right place.
Use modern Neovim Lua APIs and the surrounding config's patterns consistently; avoid mixing in older Vimscript-style approaches without a reason.
Keep plugin specs declarative and isolate plugin-specific setup to the relevant module instead of scattering it across the config.
Prefer the existing formatter, linter, and LSP setup already used by the config rather than introducing parallel tooling.
Keep keymaps, autocmds, options, and plugin side effects predictable, non-duplicated, and easy to trace when debugging behavior.
