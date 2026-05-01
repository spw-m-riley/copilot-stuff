# ma tool surface

Use this file when the skill is active and you need exact tool behavior rather than top-level routing.

## Extension-first rule

- Prefer the extension tools before shelling out to `ma` directly.
- The extension exposes five tools: `ma_smart_read`, `ma_compress`, `ma_skeleton`, `ma_minify_schema`, and `ma_dedup`.
- The extension applies sensitive-path checks before invoking the binary.

## Supported extension tools

| Tool | Input | Best use | Important behavior |
| --- | --- | --- | --- |
| `ma_smart_read` | `path` | Default starting point for understanding reads | Auto-classifies files for prose/code/schema reduction; short files may pass through unchanged; if command execution or JSON parsing fails, it falls back to raw file contents |
| `ma_compress` | `path` | Prose-specific reduction | Returns compressed prose output or an explicit failure result; does not modify the file |
| `ma_skeleton` | `path` | API shape without implementation | Returns declarations/signatures or an explicit failure result |
| `ma_minify_schema` | `path` | JSON or YAML schema structure only | Removes descriptions/defaults/examples; returns an explicit failure result |
| `ma_dedup` | `paths[]` | Instruction-file redundancy audits | Detects exact and near-duplicate guidance across one or more files; returns an explicit failure result |

## Sensitive-path denylist

The extension refuses any path that matches one of these rules:

- blocked basenames: `.env`, `.env.local`, `id_rsa`, `id_ed25519`, `credentials`, `known_hosts`, `authorized_keys`
- blocked path components: `.ssh`, `.aws`, `.gnupg`, `.kube`

If a path is denied, the tool refuses it instead of calling the `ma` binary.

## Failure model

- `ma_smart_read` is **best-effort**. If the reduction command fails or its JSON output cannot be parsed, the extension falls back to reading the original file contents directly.
- `ma_compress`, `ma_skeleton`, `ma_minify_schema`, and `ma_dedup` do **not** fall back to raw file reads; they return explicit failure results instead.
- If `ma_smart_read` output suddenly looks unreduced, treat it as a normal full read and switch to `view` if line-for-line fidelity matters.

## Source files

- [`../../../extensions/ma/extension.mjs`](../../../extensions/ma/extension.mjs) - authoritative extension implementation and guardrails
