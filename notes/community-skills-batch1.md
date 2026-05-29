# Community skills batch 1 (Lane T3)

## Summary

The requested `copilot plugin install <slug>@awesome-copilot` commands could not complete because the marketplace fetch fell back to GitHub SSH authentication and the configured 1Password agent refused or could not complete signing. To keep Lane T3 moving, all five requested awesome-copilot skills were forked into local `skills/<name>/` packages with local frontmatter and validation-compatible reference files.

The browse transcript is saved at `notes/awesome-browse-t3.txt`. The install attempt output is reflected in the shell history and summarized here.

## Outcomes

| Skill | Outcome | Notes |
| --- | --- | --- |
| `create-architectural-decision-record` | Forked locally | Upstream slug exists in `github/awesome-copilot`; marketplace install failed before plugin copy. |
| `create-technical-spike` | Forked locally | Upstream slug exists in `github/awesome-copilot`; marketplace install failed before plugin copy. |
| `what-context-needed` | Forked locally | Upstream slug exists in `github/awesome-copilot`; marketplace install failed before plugin copy. |
| `memory-merger` | Forked locally | Upstream slug exists in `github/awesome-copilot`; marketplace install failed before plugin copy. |
| `create-github-action-workflow-specification` | Forked locally | Upstream slug exists in `github/awesome-copilot`; marketplace install failed before plugin copy. |

## Frontmatter normalization

No upstream banned frontmatter keys were present in the fetched `SKILL.md` files. Each local fork adds the required local `metadata` block, uses a trigger-oriented single-line `description`, references `references/upstream-notes.md`, and keeps `## Learned Rules` as the final H2.
