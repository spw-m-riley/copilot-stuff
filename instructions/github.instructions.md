---
description: 'Guidance for GitHub CLI and pull-request operations'
applyTo: "**/*"
---

# GitHub operations guidance

## Purpose and Scope

- Applies to repository work that uses GitHub CLI, pull requests, checks, reviews, or repository metadata.
- Use `gh` for GitHub operations when it provides the supported local interface.

## Core Guidance

- Verify the repository, branch, account, and target resource before mutating GitHub state.
- If a GitHub CLI operation reports an Enterprise Managed User or access restriction, inspect `gh auth status` for multiple `github.com` accounts and select the account that owns or can access the repository.
- When asked to complete or update a pull request description, update the pull request directly rather than only drafting text in chat.
- Keep GitHub-side changes scoped to the requested repository and branch.

## Validation Expectations

- Re-read the resulting pull request, issue, workflow, or check state after a successful mutation.
- Confirm that the resource belongs to the intended repository and current branch before reporting completion.
- Treat a successful CLI command as transport evidence, not proof that the requested remote state changed as intended.

## Maintenance Notes

- Keep `## Learned Rules` as the final section in the file; do not add new sections after it.
- Append new learned rules without renumbering existing entries; numbering gaps can reflect archived or superseded entries.
- Use `[GITHUB]` for GitHub CLI and repository-operation rules.

## Learned Rules

<!-- New Rules appended below this line. Do not edit above this section -->
87. [WORKFLOW] When Matt asks to complete a pull request description and `gh` CLI access is available, update the PR description directly instead of only drafting text in chat.
110. [GIT] When `gh pr create` fails with an Enterprise Managed User or access-restriction error against a personal repo, run `gh auth status` to check for multiple logged-in `github.com` accounts and switch to the account that owns or can access that repo before retrying.
