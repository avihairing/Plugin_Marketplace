---
name: status
description: Show where each DealHub customer is in onboarding (current phase, key dates, risks, open items), or one customer in detail; can also mark a phase done or skipped.
argument-hint: "[customer name] [mark <phase> done|skipped]"
---

# Onboarding status

Workspace: `${user_config.workspace_dir}`. If that's blank or an unexpanded
`${…}` placeholder, use `~/DealHub Onboarding`.

First read `${CLAUDE_PLUGIN_DATA}/debug.json`. If `enabled` is `true`, use
`<workspace>/_debug` as the workspace and start your answer with "Debug mode
(mock data)".

Read every `<workspace>/*/profile.json`. Use the `onboarding-phases` skill to
work out each customer's current phase and next step.

**No customer given**: show one table, with customers sorted by the nearest
upcoming date:

| Customer | Current phase | Next date | Next step | Flags |
|---|---|---|---|---|

Flags: `high` risks, overdue action items, open conflicts, decks with `TBD`
values, weekly update due.

**Customer given** (`$ARGUMENTS`): show that customer's phase timeline, open
action items with owners, risks, open conflicts and the next step. Include the
latest deck links from `phases`.

**Updating a phase**: if the CSM asks to mark a phase `done` or `skipped`
(for example `acme mark kickoff done`), confirm the phase key, update
`phases.<key>.status` and `updated_at`, and append to `log.md`. Don't change
anything else.

If the workspace has no customers yet, suggest `/dealhub-onboarding:kickoff <customer>`.
