# File overlap check

Use this worksheet before dispatching concurrent lanes. The goal is to prove independence, not assume it.

## Quick worksheet

Fill one row per candidate lane before you choose `serial` or `parallel`.

| Lane | Goal | Reads | Writes | Shared mutable state | Validation owner | Needs worktree? |
| --- | --- | --- | --- | --- | --- | --- |
| Lane A | ... | ... | ... | ... | ... | yes/no |
| Lane B | ... | ... | ... | ... | ... | yes/no |

If you cannot name the write set yet, stop and treat the lane as overlapping until you learn more.

## Overlap classes

### Hard overlap — never parallelize these lanes

Choose `inline` or `serial` if any concurrent pair has one of these conditions:

- The lanes edit the same file.
- One lane edits a directory or generated output that the other lane also edits or regenerates.
- The lanes both rewrite the same manifest, lockfile, migration chain, schema, snapshot, golden file, or session artifact path.
- One lane depends on unpublished output from the other lane (for example generated types, rewritten imports, or a commit that changes the target API).
- The lanes need the same branch, worktree, or mutable runtime surface such as the same local database, port, seeded fixture set, or long-running dev server state.

### Soft overlap — default to serial unless you split the scope more cleanly

These cases are often technically possible in parallel, but the coordination cost usually outweighs the speedup:

- The files differ, but both lanes change the same public contract or exported behavior.
- The lanes validate through the same snapshots, broad formatting sweep, or codegen command that rewrites shared artifacts.
- Merge ownership is ambiguous because both lanes would need to review the same final diff before it is safe to land.
- You only know subsystem-level boundaries (for example "auth" vs "billing") and not the concrete file-level writes.

### No overlap — parallel is eligible

Parallel execution is safe only when all of these are true for every concurrent pair:

- The write sets are disjoint.
- Shared mutable state is either absent or explicitly partitioned.
- Each lane can validate its own success without rewriting another lane's artifacts.
- A human or agent owner is named for the merge or handoff of each lane.

## Shared mutable state checklist

Treat these as overlap unless you have explicit isolation:

- `package.json`, lockfiles, workspace manifests, and project-reference configs
- migration histories, schemas, generated clients, and codegen outputs
- snapshot directories, golden files, fixture archives, and seeded databases
- session-state outputs, review artifacts, and other durable scratch files
- shared branches, shared worktrees, and the same checked-out path
- long-running services that mutate shared local state while another lane assumes a stable baseline

## Decision rules

1. **All lanes read-only:** parallel is fine; no worktree needed.
2. **One mutating lane plus any number of read-only lanes:** parallel is usually fine if the read-only lanes stay read-only and do not generate shared artifacts.
3. **Two or more mutating lanes with no overlap:** route to [`git-worktrees`](../../git-worktrees/SKILL.md) first so each mutating lane gets its own checkout.
4. **Any hard overlap:** keep the work inline or serial; do not try to rescue it with wishful prompting.
5. **Any unknown write set or soft overlap you cannot resolve quickly:** choose serial until the boundary is concrete.

## Escalation cues

Stop and re-plan if a dispatched lane:

- claims a new file that belongs to another lane
- discovers a shared generator, lockfile, or migration it must rewrite
- can only validate by running a command that mutates another lane's outputs
- needs to switch from read-only research to mutating implementation

At that point, collapse back to `serial` or route fresh mutating lanes through [`git-worktrees`](../../git-worktrees/SKILL.md).
