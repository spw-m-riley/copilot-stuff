---
applyTo: "**/*"
---

Prefer RTK-wrapped shell commands when an equivalent exists.
Typical mappings include `git status`, `git diff`, `git log`, `ls`, `cat`, `head`, `tail`, `rg`, `grep`, and supported test or build commands.
If a command is already prefixed with `rtk` or RTK has no equivalent rewrite, use the raw command.
Treat RTK as a shell rewrite layer provided through the Copilot pre-tool hook, not as MCP or a model-specific integration.
