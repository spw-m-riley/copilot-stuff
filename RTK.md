# RTK - Rust Token Killer

**Usage**: Token-optimized CLI proxy (60-90% savings on dev operations)

## Meta Commands (always use rtk directly)

```bash
rtk gain              # Show token savings analytics
rtk gain --history    # Show command usage history with savings
rtk discover          # Analyze Copilot/Claude history for missed opportunities
rtk proxy <cmd>       # Execute raw command without filtering (for debugging)
```

## Installation Verification

```bash
rtk --version         # Should show: rtk X.Y.Z
rtk gain              # Should work (not "command not found")
which rtk             # Verify correct binary
```

⚠️ **Name collision**: If `rtk gain` fails, you may have reachingforthejack/rtk (Rust Type Kit) installed instead.

## Hook-Based Usage

All other commands are automatically rewritten or redirected by the Copilot pre-tool hook.
Examples:
- `git status` -> Copilot is told to use `rtk git status`
- `rg foo .` -> Copilot is told to use `rtk grep foo .`

For Copilot CLI specifically, RTK currently returns a deny-with-suggestion response because the CLI does not yet honor transparent `updatedInput` rewrites.

Refer to `README.md` for where the RTK hook lives in this config.
