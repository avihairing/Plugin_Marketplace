# DealHub Plugin Marketplace

Internal [Claude Code](https://code.claude.com/docs) plugins for DealHub teams.

| Plugin | For | What it does |
|---|---|---|
| [dealhub-onboarding](plugins/dealhub-onboarding/) | Customer Success | Gathers customer context from Gong, Fathom, Google Docs and the CSM, then generates the kickoff deck from the company Google Slides template. Built so that later onboarding phases can be added. |

## Install

In Claude Code:

```
/plugin marketplace add ortalohayon-cmd/Plugin_Marketplace
/plugin install dealhub-onboarding@dealhub-plugins
```

Or from a terminal:

```bash
claude plugin marketplace add ortalohayon-cmd/Plugin_Marketplace
claude plugin install dealhub-onboarding@dealhub-plugins
```

The repo is private, so Claude Code uses your own git credentials. If the
`add` step fails, run `gh auth login` and then `gh auth setup-git` once.

After installing, each plugin asks for its settings (for example the kickoff
template ID). See the plugin's README for setup.

### Updates

Plugins carry a version number. To get a new release, run
`/plugin marketplace update dealhub-plugins` and then
`/plugin update dealhub-onboarding@dealhub-plugins`. You can also turn on
auto-update for this marketplace in `/plugin` → Marketplaces.

### Set up a whole team's folder

Commit this to a shared project's `.claude/settings.json`. Teammates who trust
the folder are offered the marketplace and plugin automatically:

```json
{
  "extraKnownMarketplaces": {
    "dealhub-plugins": {
      "source": { "source": "github", "repo": "ortalohayon-cmd/Plugin_Marketplace" }
    }
  },
  "enabledPlugins": {
    "dealhub-onboarding@dealhub-plugins": true
  }
}
```

## Repository layout

```
.claude-plugin/marketplace.json   marketplace catalog (lists every plugin)
plugins/<plugin-name>/            one folder per plugin
docs/                             shared docs (e.g. presentation prompt)
.github/workflows/validate.yml    CI: validates manifests on every PR
```

## Contributing a plugin

1. Create `plugins/<name>/` with `.claude-plugin/plugin.json` (`name` in
   kebab-case, `version`, `description`, `author`).
2. Add components in the default folders: `skills/<skill>/SKILL.md` (also
   used for slash commands), `agents/*.md`, `hooks/hooks.json`, `.mcp.json`.
3. Add an entry to `.claude-plugin/marketplace.json` with
   `"source": "./plugins/<name>"`. Set the version only in `plugin.json`.
4. Validate and test locally:
   ```bash
   claude plugin validate .
   claude plugin validate plugins/<name>
   claude --plugin-dir plugins/<name>
   ```
5. Open a PR. CI runs the same validation.

**Shipping a change**: bump `version` in the plugin's `plugin.json` (semver).
Users only receive changes when the version changes. Optionally tag the
release with `claude plugin tag plugins/<name> --push`.

**Naming**: don't start plugin names with `claude-` or `anthropic-`, and keep
names to letters, digits, `-`, `_` and `.`.
