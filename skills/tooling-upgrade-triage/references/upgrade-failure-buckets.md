# Upgrade failure buckets

Use this table to classify the failure before proposing a fix. Name the bucket first, then apply the strategy — do not skip straight to solutions.

## Bucket reference

| Bucket | Symptoms | First check | Fix strategy |
|--------|----------|-------------|--------------|
| **Resolver conflict** | Tool reports incompatible version ranges; mentions two packages with conflicting constraints | Read the full conflict output; identify the two packages and the incompatible constraint | Pin one package to a version that satisfies both; or add an explicit exclude/override |
| **Lock file drift** | Lock file out of sync with manifest; tool refuses to install; integrity hash mismatch | Compare lock file timestamp vs manifest; check if lock file was committed without regenerating | Delete lock file and regenerate from scratch (`uv lock`, `npm install`, `go mod tidy`) |
| **Network / registry** | Connection refused, timeout, TLS error, 404 from a registry | `curl -I <registry-url>` from the same shell; check proxy env vars (`HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`) | Fix proxy config, add corporate CA cert, or switch to a mirror |
| **Binary / build failure** | Compilation fails during install; missing headers, `make`, `cc`, or `xcode` errors | Check for missing build tools (`xcode-select --install`, `brew install gcc`); check CPU arch | Install missing build deps; or use a pre-built wheel/binary if available |
| **Runtime version mismatch** | Tool requires Python 3.11+ but 3.9 is active; Go 1.22 required, 1.21 installed | Check `python --version`, `go version`, `node --version` against the tool's requirement | Use version manager (`pyenv`, `volta`, `go get toolchain`) to install the required version |
| **Post-upgrade breakage** | Upgrade reports success; tool then fails at runtime | Check if the new binary is on PATH; check for config file format changes in the new version | Rehash shell (`hash -r`); check release notes for breaking changes; roll back if needed |
| **Topgrade runner config** | Topgrade skips a step unexpectedly, or fails on one step and aborts | Read `~/.config/topgrade.toml`; check `[disable]` section and `skip_notify` | Remove from `[disable]`, fix misconfigured step, or add `--only <step>` to isolate |
| **Tap / source error** | Homebrew tap fails to fetch; formula not found; deprecated tap URL | `brew tap-info <tap>`; check if the tap URL changed or requires auth | `brew untap` and re-add with correct URL; or switch to the formula's new location |
| **Architecture mismatch** | Binary built for x86_64, running on arm64 (Apple Silicon); or vice versa | Check `file $(which <tool>)` or `arch` | Use `arch -x86_64 brew install` for Rosetta fallback; prefer arm64 native when available |

