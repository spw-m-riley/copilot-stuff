# Community hooks install notes (Lane T2)

## Scope

Install the community hook plugins `tool-guardian` and `governance-audit` through Copilot CLI plugin marketplaces, then document their config surface and smoke-test behavior.

## Marketplace discovery

Attempted discovery with `copilot plugin marketplace browse awesome-copilot` and retried once. The CLI could not fetch the marketplace because its internal `git clone` was rewritten to SSH and 1Password-backed SSH signing was refused:

```text
sign_and_send_pubkey: signing failed for ED25519 "SPW-Git" from agent: agent refused operation
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.
```

Fallback discovery with `copilot plugin marketplace browse copilot-plugins` failed the same way.

Because both marketplace fetches failed before listing entries, the exact marketplace slugs could not be confirmed from the CLI catalog in this lane. Direct install attempts used the expected slugs from the approved plan:

- `tool-guardian@awesome-copilot`
- `governance-audit@awesome-copilot`

Both install attempts failed with the same marketplace fetch/authentication error.

## Install status

`copilot plugin install tool-guardian@awesome-copilot` failed after retry due to marketplace fetch authentication failure.

`copilot plugin install governance-audit@awesome-copilot` failed after retry due to marketplace fetch authentication failure.

The install would mutate the user-global `~/.copilot/config.json` `installedPlugins` array if successful. Since both installs failed, no new persistent plugin install was observed.

`copilot plugin list` currently reports only:

```text
Installed plugins:
  • copilot-sdk@awesome-copilot (v1.0.0)
  • awesome-copilot@awesome-copilot (v1.1.0)
```

## Config surface findings

No `installed-plugins/awesome-copilot/tool-guardian/hooks.json` or `installed-plugins/awesome-copilot/governance-audit/hooks.json` could be inspected because neither plugin installed.

Warn/block defaults and knobs are therefore unverified. Follow-up after marketplace access is restored:

1. Re-run marketplace discovery and install through `copilot plugin install`.
2. Inspect each installed plugin's `hooks.json` under `installed-plugins/<marketplace>/<name>/`.
3. If a warn/block knob exists, default it to `warn` initially.
4. If hard-coded block mode ships with no warn knob, keep the plugin installed for this lane but track a follow-up to fork or patch warn mode.

## Smoke tests

Smoke tests were not runnable because neither hook installed.

Planned smoke tests once installed:

- `tool-guardian`: trigger a guarded command against a throwaway local-only branch, such as a force-push scenario, and confirm the hook warns or blocks as configured.
- `governance-audit`: submit a known prompt-injection pattern and confirm the hook emits its audit warning/log.

## Blocker

Lane T2 is blocked on Copilot CLI marketplace fetch/install because the underlying GitHub clone fails through the configured 1Password-backed SSH authentication path. Restore/approve the trusted 1Password SSH agent path, then rerun the discovery and install commands.
