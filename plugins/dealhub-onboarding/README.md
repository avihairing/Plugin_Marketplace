# dealhub-onboarding

Claude plugin for DealHub CSMs. It gathers everything known about a new
customer into one profile, then generates the onboarding kickoff deck from the
company Google Slides template. Later phases (overview, discovery, weekly
update, steering committee, configuration) will plug into the same profile.

## Commands

| Command | What it does |
|---|---|
| `/dealhub-onboarding:kickoff <customer>` | Main command. Gathers context, reviews it with you, builds the kickoff deck. |
| `/dealhub-onboarding:gather <customer>` | Collects or refreshes the customer profile without building anything. |
| `/dealhub-onboarding:status [customer]` | Shows where every customer stands, or one in detail. Can also mark a phase done or skipped. |
| `/dealhub-onboarding:debug [on [folder] \| off \| status]` | Turns debug mode on or off. It reads local mock data instead of Gong, Fathom and Google Drive. |

## Debug mode (no Gong, Fathom or Google access needed)

```
/dealhub-onboarding:debug on            # use the bundled mock-data/ folder
/dealhub-onboarding:debug on D:\mocks   # or your own folder with the same layout
/dealhub-onboarding:kickoff Acme Industrial
/dealhub-onboarding:debug off           # back to the real connectors
```

When debug mode is on:

| Pipeline step | Live | Debug |
|---|---|---|
| Calls (call-intel-collector) | Gong + Fathom connectors | `mock-data/gong/` and `mock-data/fathom/` |
| Documents (document-collector) | Google Drive connector + `inbox/` | `mock-data/google-drive/` + `inbox/` |
| CSM interview, merge, conflicts, validation | same | same |
| Deck (deck-builder) | copy of the Google Slides template | `decks/<date>-kickoff.md` (preview) and `decks/<date>-kickoff.requests.json` (the exact Google API requests live mode would send) |
| Customer folders | `<workspace>/<customer>/` | `<workspace>/_debug/<customer>/` |

The on/off state is stored in the plugin's data folder
(`${CLAUDE_PLUGIN_DATA}/debug.json`). It survives restarts and plugin
updates, applies to the next command, and is per user, so it never reaches
anyone else.
At session start Claude is told when debug mode is on.

The mock data has a complete customer (**Acme Industrial**), which includes a
planted go-live conflict, sales commitments and risks. It also has a sparse
one (**Northwind Logistics**). See [mock-data/README.md](mock-data/README.md)
for the file formats and how to add customers. In debug mode, Gong, Fathom and
Google settings can stay blank. The connectors may show as "needs auth" or
"failed" in `/mcp`; that's expected, because debug mode never calls them.

## How it works

```
/kickoff Acme
   │
   ├─ call-intel-collector  (subagent) ── Gong, Fathom ──────────┐
   ├─ document-collector    (subagent) ── Google Drive/Docs,     │
   │                                      inbox/ files ──────────┤  run in parallel
   └─ CSM interview         (main chat) ── what only you know ───┘
                                   │
                         merge → profile.json   (every fact cited, conflicts flagged)
                                   │
                         you review a slide-by-slide preview
                                   │
                    deck-builder (subagent) → copy of the kickoff template, tokens filled
                                   │
                    deck link + TBD list + internal brief → log.md, phases.kickoff
```

| Building block | Files | Role |
|---|---|---|
| Commands (skills you invoke) | `skills/kickoff`, `skills/gather`, `skills/status`, `skills/debug` | What the CSM types |
| Mock data | `mock-data/` | Local stand-in for Gong, Fathom and Google Drive in debug mode |
| Knowledge skills | `skills/customer-profile`, `skills/onboarding-phases` | Data model, merge rules, gathering procedure, phase journey |
| Subagents | `agents/call-intel-collector.md`, `agents/document-collector.md`, `agents/deck-builder.md` | Parallel research and deck generation |
| MCP connectors | `.mcp.json` | Gong, Fathom, Google Workspace (Drive, Docs, Sheets, Slides) |
| Hooks | `hooks/hooks.json`, `hooks/scripts/*.js` | Session-start brief, approval gate on outbound sends, profile validation |

## Setup

### One-time admin setup (CS Ops / IT)

| Connector | Server | Admin task |
|---|---|---|
| Gong | Official Gong MCP, `https://mcp.gong.io/mcp` (OAuth, read-only) | In Gong: Admin center → Settings → Ecosystem → MCP → New MCP server integration. Choose automatic registration and add the redirect URI `http://localhost:8765/callback`. Users need a paid Gong seat. Answers consume Gong credits. |
| Fathom | Official Fathom MCP, `https://api.fathom.ai/mcp` (OAuth) | None. Each CSM signs in with their own Fathom account and sees only meetings they have access to. |
| Google Drive / Docs / Sheets / Slides | [`workspace-mcp`](https://github.com/taylorwilsdon/google_workspace_mcp) v2.1.0 (runs locally) | In Google Cloud, enable the Drive, Docs, Sheets and Slides APIs and create one **Desktop app** OAuth client. Share its client ID and secret with CSMs. |
| Slack, Gmail | not in v1 | Added with the weekly update phase. Slack will use Slack's official plugin (`/plugin install slack@claude-plugins-official`). |

### Each CSM

1. Install [uv](https://docs.astral.sh/uv/) (`winget install astral-sh.uv` or
   `brew install uv`). It runs the Google connector. You also need
   [Node.js](https://nodejs.org) 18+, which runs the hooks.
2. Install the plugin (see the [marketplace README](../../README.md)) and
   fill in the settings below when prompted.
3. Run `/mcp` and sign in to **gong** and **fathom**. Google opens a browser
   sign-in the first time a Google tool is used.

### Settings

Claude Code asks for these when you enable the plugin. To change them later,
go to `/plugin` → dealhub-onboarding.

| Setting | Example | Needed in debug mode |
|---|---|---|
| Onboarding workspace folder | `~/DealHub Onboarding` (default) | yes |
| Kickoff template (Google Slides ID) | `1AbC...xyz` (from `docs.google.com/presentation/d/<ID>/edit`) | no |
| Drive folder for generated decks | optional folder ID | no |
| Your Google Workspace email | your work Google account | no |
| Google OAuth client ID / secret | from CS Ops / IT (the secret is kept in secure storage) | no |

### Already have Gong or Google connected another way?
The agents look for tools by name pattern (`*gong*`, `*fathom*`,
`*google-workspace*`), so a server you've added yourself also works. One
example is the community [`gongio-mcp`](https://github.com/JustinBeckwith/gongio-mcp),
which reads full transcripts using a Gong API key. To stop the plugin's own
copy, disable it in `/mcp`.

## The kickoff template

The template is a normal Google Slides file owned by CS Ops. It contains
`{{tokens}}` that the plugin replaces. The complete token list, limits and
missing-data rules are in
[skills/kickoff/references/slide-map.md](skills/kickoff/references/slide-map.md).
Keep that file and the template in sync.

## Your customer data

Everything is stored locally in your workspace folder, one folder per customer:
`profile.json` (the source of truth), `sources/` (raw findings with quotes),
`inbox/` (drop extra files here) and `log.md`. Nothing is written to this
repository.

## Guardrails
- You approve the slide content before the deck is built.
- Every email, Slack post or Drive share always asks for your approval, even
  if you allowed that tool before (`hooks/scripts/guard-outbound.js`).
  Drafts don't need approval.
- Every fact in the profile cites a call, document or your interview.
  `profile.json` is checked on every save (`hooks/scripts/validate-profile.js`).
- Sales commitments and internal notes appear only in your private brief,
  never on slides.

## Adding a phase

All phases share the profile, so a new phase only adds its own output.

1. **Command**: `skills/<phase>/SKILL.md` with `disable-model-invocation: true`.
   Start it with "Load the `customer-profile` skill and run its gathering
   procedure". Then list the phase's extra CSM questions, its required fields,
   and what it produces.
2. **Template (if it makes a deck)**: create the Google Slides template with
   tokens, add `skills/<phase>/references/slide-map.md`, add a template-ID
   setting to `userConfig` in `.claude-plugin/plugin.json`, and reuse the
   `deck-builder` subagent.
3. **Registry**: in `skills/onboarding-phases/SKILL.md`, change the phase's
   status from *planned* to *available* and fill in its details. The phase
   keys already exist in the profile schema and the validator.
4. **Outbound messages** (weekly update): add `gmail` to the Google
   connector's `--tools` in `.mcp.json`, and add Slack through Slack's
   official plugin. Create drafts, then send only after the CSM approves. The
   outbound hook enforces the approval for any email, Slack or sharing tool.
5. **Debug mode**: if the phase reads a new source, add a mock folder for it
   under `mock-data/` and a "Debug mode" section to the subagent that reads
   it. If it produces output (a deck, an email), write it locally in debug
   mode instead of sending it.
6. Bump `version` in `plugin.json`, run `claude plugin validate`, and open a PR.

## Development

```bash
claude --plugin-dir plugins/dealhub-onboarding   # load this working copy
claude plugin validate plugins/dealhub-onboarding --strict
```

To run the full pipeline end to end without any connector access, start
with `--plugin-dir`, then run `/dealhub-onboarding:debug on` and
`/dealhub-onboarding:kickoff Acme Industrial`.

Inside a session, `/reload-plugins` picks up edits.
