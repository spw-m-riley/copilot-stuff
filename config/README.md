# Config templates

This directory holds optional, copyable templates for user-managed configuration.

## `skill-defaults.example.yaml`

`skill-defaults.example.yaml` is a template for per-skill defaults such as output shape,
routing preferences, and validation expectations.

- Copy it to `config/skill-defaults.local.yaml` to keep personal defaults out of Git.
- The `.local` file is ignored by the repository.
- The template is intentionally separate from the managed root `config.json` and
  `settings.json` files.

## Current status

This template is **documentation only right now**.

- No runtime code in this repository reads `skill-defaults.example.yaml`.
- No runtime code in this repository reads `skill-defaults.local.yaml`.
- Future consumers must document any supported keys explicitly before relying on them.

Until then, treat the file as a safe starting point for discussing or drafting per-skill
preferences without changing active Copilot CLI settings.
