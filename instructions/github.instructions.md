---
description: 'Guidance for GitHub CLI and pull-request operations'
applyTo: "**/*"
---

# GitHub operations guidance

## Guidance

- Use `gh` when it provides the supported local interface.
- Verify the repository, branch, account, and target resource before mutating GitHub state.
- If a GitHub CLI operation reports an Enterprise Managed User or access restriction, inspect `gh auth status` for multiple `github.com` accounts and select the account that owns or can access the repository.
- When asked to complete or update a pull request description, update the pull request directly rather than only drafting text in chat.
- Keep GitHub-side changes scoped to the requested repository and branch.
- Re-read the resulting pull request, issue, workflow, or check state after a successful mutation.
- Treat a successful CLI command as transport evidence, not proof that the requested remote state changed as intended.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
87. [WORKFLOW] When Matt asks to complete a pull request description and `gh` CLI access is available, update the PR description directly instead of only drafting text in chat.
110. [GIT] When `gh pr create` fails with an Enterprise Managed User or access-restriction error against a personal repo, run `gh auth status` to check for multiple logged-in `github.com` accounts and switch to the account that owns or can access that repo before retrying.
