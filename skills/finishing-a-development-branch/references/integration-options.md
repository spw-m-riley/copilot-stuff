# Integration options

Use this table after the branch, base, worktree cleanliness, and verification status are known.

| Option | Use when | Required validation |
| --- | --- | --- |
| Merge locally | The branch is ready and direct local integration is allowed | Base is current, merge succeeds, checks pass on base, feature branch/worktree cleanup is complete |
| Push and create PR | Human review or CI gate is required before merge | Branch is pushed, PR targets the right base, title/body are clear, worktree stays available |
| Keep as-is | The work should be preserved without immediate integration | Branch and worktree path are reported; no cleanup or destructive action occurs |
| Discard | The user explicitly confirms the work should be abandoned | User typed confirmation, branch/worktree are removed, no residual files remain |

## Blocker handling

- Dirty worktree: stop and ask for commit/stash/cleanup before integration actions.
- Failing checks: stop and report the failing command unless the user is choosing keep or discard.
- Missing branch: stop and resolve branch identity before presenting options.
- Stale base: refresh or verify the base before local merge.

## Destructive action rule

Discard requires explicit typed confirmation. Do not infer discard from frustration, failed checks, or "this approach is bad" unless the user confirms deletion.
