# Integrity patterns

Agent plugins and MCP servers carry the same supply-chain risks as packages or containers. Use this reference to keep integrity checks deterministic and reviewable.

## Manifest lifecycle

```text
Plugin directory -> Hash source files -> Write INTEGRITY.json
Plugin directory -> Re-hash files -> Compare with INTEGRITY.json -> verified or tampered
```

## Manifest shape

`INTEGRITY.json` should include:

| Field | Meaning |
| --- | --- |
| `plugin_name` | Directory or package name being verified |
| `generated_at` | ISO timestamp for review context |
| `algorithm` | Hash algorithm, normally `sha256` |
| `file_count` | Count of hashed source files |
| `files` | Map of repo-relative file path to SHA-256 digest |
| `manifest_hash` | Chain hash over the sorted file digests |

Exclude `.git`, dependency directories, virtualenvs, caches, OS metadata, generated build output, and the manifest file itself unless the package's release contract says otherwise.

## Verification outcomes

| Outcome | Meaning |
| --- | --- |
| `VERIFIED` | Every recorded file exists and matches, and no extra hashed files were found |
| `MODIFIED` | A recorded file exists but its digest differs |
| `MISSING` | A recorded file is absent |
| `UNTRACKED` | A current source file is not present in the manifest |

Report each class separately. Do not collapse all failures into a generic "tampered" message.

## Dependency audit checks

- `package.json`: flag `*`, `latest`, `^`, and `~` ranges for packages that must be reproducible.
- Python requirements: prefer exact pins or bounded ranges appropriate to the deployment policy.
- MCP server config: flag `@latest` and other floating package references.
- CI actions: pin action versions according to the repository's workflow policy.

## Promotion gate checklist

- [ ] Manifest exists and verifies cleanly.
- [ ] Required package files exist, such as README and plugin manifest.
- [ ] No unpinned runtime dependencies remain in the plugin package.
- [ ] CI verifies the manifest before deployment.
- [ ] Reviewers can see the manifest diff in the same promotion change.
