---
name: customer-profile
description: The DealHub onboarding customer profile, which is the single source of truth every onboarding phase reads and writes. Covers where customer folders live, the profile.json schema, source citation and conflict rules, and the gathering procedure that collects context from Gong/Fathom calls, Google Docs and the CSM. Use whenever you read, create, refresh or edit a customer's onboarding profile.
user-invocable: false
---

# Customer profile

Every onboarding phase (kickoff, overview, discovery, weekly update, steering
committee, configuration) works from one file per customer: `profile.json`.
Gather once, reuse everywhere, and refresh when new calls or documents appear.

## Data-source mode: live or debug

Check this before anything else. Read `${CLAUDE_PLUGIN_DATA}/debug.json`.
If the file exists and `enabled` is `true`, you are in **DEBUG mode**;
otherwise you are in **LIVE mode**.

In DEBUG mode:
- Start by telling the CSM: "Debug mode: using mock data from `<mock_dir>`.
  Turn it off with `/dealhub-onboarding:debug off`."
- The workspace is `<workspace>/_debug`, so mock customers stay apart from
  real ones.
- Add `mode: debug` and `mock_dir: <mock_dir>` to every subagent prompt. The
  subagents then read the mock folder and never call Gong, Fathom or Google
  tools.
- Write `<action> (debug)` in `log.md` lines.

Everything else (interview, merge rules, conflicts, validation) is the same in
both modes.

## Workspace layout

Customer folders live in the CSM's onboarding workspace:
`${user_config.workspace_dir}` (in debug mode, its `_debug` sub-folder).

```
<workspace>/
  <customer-slug>/
    profile.json      single source of truth (schema below)
    inbox/            CSM drops extra files here (PDF, TXT, MD, CSV)
    sources/
      calls.md        call-intel collector findings, with quotes
      documents.md    document collector findings
      csm-notes.md    CSM interview answers, verbatim
    log.md            append-only history: what ran, when, links produced
    decks/            local deck previews (debug mode only)
```

- **Slug**: lowercase, ASCII, words joined by `-`, legal suffixes dropped
  (`Acme Industrial, Inc.` → `acme-industrial`).
- Expand a leading `~` to the user's home directory, and use absolute paths.
- Create missing folders as needed. Never delete anything in a customer folder.
- **Unset settings**: a plugin setting counts as not set when it's blank or
  still shows an unexpanded `${…}` placeholder. This happens when the plugin
  is loaded with `--plugin-dir`. If the workspace isn't set, use
  `~/DealHub Onboarding` (the plugin's default).

## profile.json schema

The canonical shape is [references/profile.example.json](references/profile.example.json).
Read it before writing a profile for the first time in a session. Key rules:

- `schema_version` is `1`. `updated_at` is an ISO-8601 UTC timestamp.
- Dates are `YYYY-MM-DD`. Unknown values are `""` or `[]`, never guessed.
- **Every fact carries `src`**: an array of ids from `sources[]`. A fact with
  no source is not allowed. CSM-provided facts cite the CSM interview source.
- `sources[]` entries: `id` (`S1`, `S2`, … never reused), `type`
  (`gong` | `fathom` | `gdoc` | `gsheet` | `file` | `csm` | `email` | `other`),
  `title`, `date`, `ref` (URL or file path).
- `people[].side`: `customer` | `dealhub`. `people[].role`: `executive_sponsor`,
  `project_lead`, `admin`, `champion`, `end_user`, `it`, `finance`, `legal`
  (customer) or `csm`, `implementation_lead`, `account_executive`,
  `solution_engineer`, `executive` (dealhub).
- `risks[].severity`: `high` | `medium` | `low`.
- `action_items[].status` and `conflicts[].status`: `open` | `done` and
  `open` | `resolved`.
- `phases.<phase>.status`: `not_started` | `in_progress` | `done` | `skipped`.
  Phase keys: `kickoff`, `overview`, `discovery`, `weekly_update`,
  `steering_committee`, `configuration`. A phase may add its own fields
  (for example `deck_url`).
- **Internal only**: `commitments` (what DealHub sales promised) and
  `internal_notes`. Use them to brief the CSM, but never put them in anything
  customer-facing.

A hook validates `profile.json` every time it is written. If it reports
errors, fix them right away.

## Source precedence and conflicts

When sources disagree, pick a working value with these rules:

| Fact type | Precedence (strongest first) |
|---|---|
| Commercial terms: products, licenses, contract dates, term | signed order form / contract > CSM > calls |
| Goals, pain points, current process | customer's own words on calls > CSM > documents |
| People, roles, timeline, meeting dates | CSM > most recent call > documents |
| Anything else | newest source wins |

Never silently drop the losing value. Record it in `conflicts[]` with both
values, their sources, the resolution you applied, and `status: "open"`. Set
it to `resolved` once the CSM or customer confirms. If the conflict affects the
phase being prepared, ask the CSM about it.

## Gathering procedure

Phase commands run this procedure before producing anything. Sources are
handled in three separate streams, as the onboarding spec requires.

| Stream | Who handles it | Sources |
|---|---|---|
| Calls | `dealhub-onboarding:call-intel-collector` subagent | Gong, Fathom |
| Documents | `dealhub-onboarding:document-collector` subagent | Google Drive/Docs/Sheets, files in `inbox/` |
| CSM knowledge | you, in the main conversation | the CSM |

1. **Identify the customer.** Resolve the customer name, email domain and any
   aliases (for example the parent company). Load `profile.json` if it exists;
   in that case this is a **refresh**, so collect the `ref` of every registered
   source to skip it.
2. **Ask for document pointers.** Ask the CSM in one short message for: the
   customer's Google Drive folder or doc links (order form, SOW, proposal,
   mutual action plan, handoff notes), and whether they dropped files into
   `inbox/`. Accept "none".
3. **Launch both collectors in parallel, in the background.** Give each one:
   the customer name, domain, aliases, the refs to skip, any links from step 2,
   the absolute path of the customer folder, and the file to write its findings
   to (`sources/calls.md` or `sources/documents.md`). In debug mode, also give
   them `mode: debug` and the `mock_dir`.
4. **Interview the CSM while they run.** Ask only what calls and documents
   can't tell you, at most 6 questions, and accept "skip":
   - Who is on the DealHub team for this account (CSM, implementation lead, AE, SE)?
   - Customer contacts and their roles, if known.
   - Anything sales promised that the customer will hold us to.
   - Concerns, politics or red flags the CSM is aware of.
   - Plus the questions the phase command lists.
   Save the answers verbatim to `sources/csm-notes.md` and register them as one
   `csm` source dated today.
5. **Merge.** When both collectors return, map each finding to a profile field,
   register its source with the next free `S` id, apply the precedence rules
   and record conflicts. Merge into existing data; don't replace good values
   with empty ones.
6. **Check for gaps.** Compare the profile with the phase's required fields.
   Ask the CSM only about missing required fields and conflicts that matter.
7. **Save.** Write `profile.json` (set `updated_at`), then append a line to
   `log.md`: `YYYY-MM-DD HH:MM · gather · N new sources · M conflicts`
   (`gather (debug)` in debug mode).

If a collector reports that a source is unavailable (not connected, auth
failed, nothing found), tell the CSM which one. Offer two fallbacks: paste the
notes or transcript into chat, or drop files into `inbox/` and rerun. Don't
fail the whole run because one source is missing.
