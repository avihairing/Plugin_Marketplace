# Mock data sources (debug mode)

When debug mode is on (`/dealhub-onboarding:debug on`), the collectors read
this folder **instead of** the Gong, Fathom and Google Drive connectors. The
deck builder writes a local preview instead of creating a Google Slides deck.
Everything else in the pipeline works as in live mode: the CSM interview,
merge rules, conflicts, the profile validator hook, and the logs.

All companies, people and email domains here are fictional and use the
reserved `.example` domain.

```
mock-data/
  gong/
    calls.json                 like Gong GET /v2/calls (+ parties)
    transcripts/<call id>.md   one transcript per call
  fathom/
    meetings.json              like Fathom GET /meetings (summary + action items)
    transcripts/<recording id>.md
  google-drive/
    index.json                 like Drive files.list (folders + files, with parents)
    files/                     file contents: Docs as .md, Sheets as .csv
```

## Customers in the mock data

| Customer | Domain | Gong | Fathom | Drive | Good for testing |
|---|---|---|---|---|---|
| Acme Industrial | `acme-industrial.example` | 3 calls | 2 meetings (1 internal handoff) | order form, mutual action plan, handoff notes, IT requirements | the full kickoff. Planted conflict: CRO wants a Dec 15 go-live, the order form says Jan 15. Also sales commitments, risks and open questions. |
| Northwind Logistics | `northwind-logistics.example` | 1 call | none | draft proposal | sparse data: TBD handling, missing sources, filtering by customer |

Drive folder link to give the collector when testing:
`https://drive.google.com/drive/folders/1mockFolderAcme`

## Adding a mock customer

1. **Gong**: add an entry to `gong/calls.json`. Set `account` to the company
   name, list `parties` with `affiliation` `Internal` or `External`, and
   point `transcript` at a new file under `gong/transcripts/`.
2. **Fathom**: add an entry to `fathom/meetings.json`, including
   `calendar_invitees` with `is_external`, and add a transcript under
   `fathom/transcripts/`.
3. **Drive**: add a folder entry and file entries to `google-drive/index.json`
   (`parents` = folder id) and put each file's content under
   `google-drive/files/`.
4. Use speaker lines like `[hh:mm:ss] Name (Company): text` (Gong) or
   `hh:mm:ss - Name (Company): text` (Fathom), so quotes can be attributed.

Mock data ships with the plugin. Never put real customer data here.
