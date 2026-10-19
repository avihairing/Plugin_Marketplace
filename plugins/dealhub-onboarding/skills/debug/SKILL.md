---
name: debug
description: Turn the onboarding plugin's debug mode on or off, or show its status. In debug mode the pipeline reads mock Gong, Fathom and Google Drive data from a local folder and writes deck previews locally instead of using the real connectors.
argument-hint: "[on [mock folder] | off | status]"
disable-model-invocation: true
---

# Debug mode

- State file: `${CLAUDE_PLUGIN_DATA}/debug.json`
- Default mock folder: `${CLAUDE_PLUGIN_ROOT}/mock-data`
- Workspace: `${user_config.workspace_dir}`. If that's blank or an
  unexpanded `${…}` placeholder, use `~/DealHub Onboarding`.

Argument: `$ARGUMENTS`

| Argument | Action |
|---|---|
| `on` or `on <folder>` | Write the state file as `{"enabled": true, "mock_dir": "<absolute folder path, default mock folder if none given>", "updated_at": "<now, ISO-8601 UTC>"}` |
| `off` | Write `{"enabled": false, "mock_dir": "<keep the previous value>", "updated_at": "<now>"}` |
| empty or `status` | Read the state file. If it's missing, debug mode is off. |

When turning it on, check that the mock folder contains `gong/calls.json`,
`fathom/meetings.json` and `google-drive/index.json`. Warn about any that are
missing, because that source will report "unavailable".

Then report in a few lines:
- **Mode**: DEBUG or LIVE
- **In DEBUG**:
  - the mock folder
  - which customers the mock data contains: the `account` values in
    `gong/calls.json` and the folder names in `google-drive/index.json`
  - customer folders go to `<workspace>/_debug/`, kept apart from real ones
  - decks are written as local previews; nothing goes to Google
- **In LIVE**: data comes from the Gong, Fathom and Google Workspace
  connectors, and customer folders are in the workspace.
- The change applies to the next command, with no restart needed.
