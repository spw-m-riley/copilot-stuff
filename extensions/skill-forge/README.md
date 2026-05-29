# skill-forge

`skill-forge` registers the `/skill-forge` slash command to scaffold new `skills/<name>/SKILL.md` files from an elicitation form.

## Slash command UX

Run `/skill-forge` and fill in:

| Field | Rules |
| --- | --- |
| Skill name | Kebab-case, 3-64 chars, `^[a-z][a-z0-9-]*$` |
| Description | 20-90 chars; include a trigger phrase such as `Use when` |
| applyTo glob | Optional safe relative glob; stored as `metadata.applyTo` |
| Use-cases | 2-3 newline-separated use-cases |
| Reference files | Existing repo-relative paths, one per line |

Invalid forms are re-prompted up to three times. Success is reported as `skill-forge created skills/<name>/SKILL.md`.

## Sanitization

The extension never shells out and never interpolates paths into commands. Skill names must match the strict allowlist above and are resolved as `skills/<name>`; the resolved target must remain inside `skills/` and existing skill directories are refused.

Text, glob, and reference inputs use tight allowlists. Reference files must be existing repo-relative paths without absolute paths, dot segments, dotfiles, backslashes, protocol markers, or traversal.

## Output template

Generated skills include validator-compatible frontmatter with `name`, `description`, and `metadata` fields. `applyTo` is preserved in `metadata.applyTo` so the file remains compatible with `skills/skill-authoring/scripts/validate-skill-library.mjs`.

The scaffold includes these sections:

- `## Use this skill when`
- `## Do not use this skill when`
- `## Routing boundary`
- `## Inputs to gather`
- `## First move`
- `## Workflow`
- `## Outputs`
- `## Guardrails`
- `## Validation`
- `## Examples`
- `## Reference files`
- `## Learned Rules`

`## Learned Rules` is always the final section, and the reference section always contains at least one resolvable local file.
