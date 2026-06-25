# Tool inventory

Quick reference for tools commonly encountered during upgrade triage. For each tool: relevant env vars to check, common failure modes, and the key command to reproduce a failure independently.

## topgrade

| Item | Detail |
|------|--------|
| Config | `~/.config/topgrade.toml` |
| Isolate step | `topgrade --only <step>` |
| Skip a step | Add to `[disable]` section in config |
| Common failure | One underlying tool fails; rest of run is skipped |

**Failure pattern:** topgrade itself rarely fails; the error lives in the tool it delegates to. Always reproduce the underlying tool error directly.

---

## uv (Python package manager)

| Item | Detail |
|------|--------|
| Lock file | `uv.lock` |
| Regenerate lock | `uv lock` |
| Install from lock | `uv sync` |
| Key env vars | `UV_PYTHON`, `UV_INDEX_URL`, `UV_EXTRA_INDEX_URL`, `UV_CACHE_DIR` |
| Common failures | Resolver conflict, stale lock file, wrong Python version |

**Python version:** `uv` respects `python = ">=3.11"` in `pyproject.toml`. If `UV_PYTHON` points at an incompatible version, set it to a valid one or unset it.

---

## pip / pip-compile (Python)

| Item | Detail |
|------|--------|
| Lock file | `requirements.txt` or `requirements/*.txt` |
| Regenerate lock | `pip-compile requirements.in` |
| Install | `pip install -r requirements.txt` |
| Key env vars | `PIP_INDEX_URL`, `PIP_EXTRA_INDEX_URL`, `VIRTUAL_ENV` |
| Common failures | Resolver conflict, missing build deps for C extensions, VPN/proxy blocking index |

---

## Homebrew

| Item | Detail |
|------|--------|
| Update metadata | `brew update` |
| Upgrade formulae | `brew upgrade` |
| Single formula | `brew upgrade <formula>` |
| Diagnose | `brew doctor` |
| Build logs | `brew log <formula>` |
| Key env vars | `HOMEBREW_NO_AUTO_UPDATE`, `HOMEBREW_NO_ENV_HINTS`, `HOMEBREW_BOTTLE_DOMAIN` |
| Common failures | Dependency conflict, tap fetch failure, native build failure, Rosetta vs arm64 mismatch |

**Architecture (Apple Silicon):** Most formulae now ship arm64 bottles. Use `arch -x86_64 brew install <formula>` only as a last resort — prefer fixing the arm64 path.

---

## Go toolchain

| Item | Detail |
|------|--------|
| Check version | `go version` |
| Update toolchain | `go get toolchain@latest` or edit `go.mod` toolchain directive |
| Tidy modules | `go mod tidy` |
| Key env vars | `GOPATH`, `GOBIN`, `GOROOT`, `GOPROXY`, `GONOSUMCHECK`, `GOFLAGS` |
| Common failures | `go.mod` toolchain directive newer than installed Go, `go.sum` mismatch, private module proxy auth |

**Toolchain directive:** Go 1.21+ supports `toolchain` in `go.mod`. If it specifies a newer version than installed, `go` will try to download it — check `GOTOOLCHAIN` env var (`auto`, `local`, or pinned).

---

## Node.js — Volta

| Item | Detail |
|------|--------|
| Check version | `volta list` |
| Pin version | `volta pin node@<version>` |
| Install version | `volta install node@<version>` |
| Key env vars | `VOLTA_HOME` (usually `~/.volta`) |
| Common failures | Version not available on Volta registry, network error fetching release, PATH not picking up Volta shims |

**PATH check:** Volta shims live in `~/.volta/bin`. If `which node` doesn't point there, Volta isn't active in the shell.

---

## Node.js — nvm

| Item | Detail |
|------|--------|
| Check version | `nvm current` |
| Install version | `nvm install <version>` |
| Use version | `nvm use <version>` |
| Key env vars | `NVM_DIR` (usually `~/.nvm`) |
| Common failures | nvm not sourced in shell, `install` fails due to missing build tools, `.nvmrc` points at unavailable version |

---

## npm / npx

| Item | Detail |
|------|--------|
| Lock file | `package-lock.json` |
| Regenerate | `npm install` (rewrites lock from `package.json`) |
| Clean install | `npm ci` (requires lock file; fails if out of sync) |
| Key env vars | `NPM_CONFIG_REGISTRY`, `NODE_AUTH_TOKEN` |
| Common failures | Lock file mismatch (`npm ci` vs `npm install`), private registry auth failure, peer dependency conflict |
