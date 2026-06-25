# Comparison dimensions

Use this as a menu when establishing scope. Agree with the user which dimensions matter before reading files — reading everything in both repos wastes time and obscures the signal.

## Dimension menu

| Dimension | What it covers | High-signal files to read |
|-----------|---------------|--------------------------|
| **CI/CD config** | Workflow triggers, jobs, steps, runners, secrets, deploy gates | `.github/workflows/*.yml`, `.circleci/config.yml`, `Makefile` targets used in CI |
| **Runtime versions** | Node, Python, Go, Ruby versions and how they're pinned | `package.json` (`engines`), `.nvmrc`, `volta.json`, `go.mod` (`go` directive), `.python-version`, `pyproject.toml` |
| **Dependencies** | Library versions, lock files, outdated packages | `go.mod`, `go.sum`, `package.json`, `package-lock.json`, `pyproject.toml`, `uv.lock`, `requirements.txt` |
| **API surface** | HTTP routes, handler shapes, request/response types | Router files, handler directories, OpenAPI/Swagger specs, proto files |
| **Build & tooling** | How the project is built, linted, tested, and released | `Makefile`, `Taskfile.yml`, `justfile`, `scripts/`, `.golangci.yml`, `eslint.config.*`, `goreleaser.yml` |
| **Infrastructure / deployment** | How the service is deployed and configured | `template.yml` (SAM), `terraform/`, `serverless.yml`, `Dockerfile`, `docker-compose.yml`, `.env.example` |
| **Code patterns** | How a common concern is handled (auth, error handling, logging) | Source directories for the pattern in question |
| **Documentation** | README quality, architecture docs, ADRs, CONTEXT.md | `README.md`, `docs/`, `CONTEXT.md`, `adr/` |
| **Test coverage** | Test structure, coverage tooling, integration vs unit split | `*_test.go`, `*.test.ts`, `jest.config.*`, `go test ./...` output |
| **Security surface** | Secret scanning, OIDC setup, IAM roles, dependency audit | `.github/workflows/` (secret scan steps), IAM role names, `govulncheck` config |

## How to choose dimensions

Start with the comparison goal:

- **"Does repo B have what repo A has?"** → CI/CD config + runtime versions + dependencies as baseline; add others based on user interest.
- **"Use repo A as a guide for implementing X in repo B"** → focus on the 1–2 dimensions most relevant to X; don't compare everything.
- **"Are our sibling repos consistent?"** → CI/CD config + runtime versions + build tooling are usually the right three.
- **"Parity check after migration"** → CI/CD config is primary; runtime versions and deploy config are secondary.

## Reading order

For each dimension:
1. Read the reference repo's surface first — understand the pattern.
2. Read the target repo's equivalent — note differences immediately.
3. Classify before moving to the next dimension.

Avoid jumping between repos mid-dimension; it makes it easy to lose track of which differences are real gaps vs intentional choices.

## Classification key

| Class | Meaning | Typical action |
|-------|---------|----------------|
| `missing` | Target lacks something the reference has | Recommend adopting unless there's a clear reason not to |
| `diverged` | Both have it but differently, no clear reason | Investigate — may be accidental drift or a deliberate choice not yet documented |
| `intentional` | Difference is explained by context (different infra, different language) | Document; no action needed |
| `equivalent` | Same outcome, different syntax or tooling | No action needed; confirm once and move on |
