# Kickoff deck: slide map

This is the contract between the **fixed Google Slides kickoff template** and the
plugin. The template designer places each `{{token}}` (exactly as written, double
curly braces, lowercase) inside a text box on the listed slide. The deck-builder
agent replaces each token with text derived from `profile.json`.

Rules for the template designer:

- One token per text box where possible, so the box's formatting (font, size,
  bullets) is what the replaced text inherits.
- For **list** tokens, format the text box as a bulleted list. Each list item is
  inserted as its own paragraph, so it becomes its own bullet.
- Do not put tokens inside grouped shapes or speaker notes.
- `{{customer_logo}}` goes in a **rectangle shape** (not a text box) sized and
  positioned where the logo should appear. It is replaced by an image.
- Static content (agenda, methodology diagram, Q&A) needs no tokens.

## Tokens

Type `text` is a single line. Type `list` is newline-separated items. Limits are
enforced by the deck builder so text does not overflow the template boxes.

| Slide | Title on slide | Token | Type | Built from (`profile.json`) | Limit |
|---|---|---|---|---|---|
| 1 | Title | `{{customer_name}}` | text | `customer.name` | 40 chars |
| 1 | Title | `{{kickoff_date}}` | text | `timeline.kickoff_date`, formatted `MMMM D, YYYY` | - |
| 1 | Title | `{{customer_logo}}` | image | `customer.logo_url` (must be a public https URL) | - |
| 2 | Agenda | *(static)* | - | - | - |
| 3 | Meet the teams | `{{customer_team}}` | list | `people[side=customer]` → `Name, Title (role label)` | 6 items |
| 3 | Meet the teams | `{{dealhub_team}}` | list | `people[side=dealhub]` → `Name, Title` | 5 items |
| 4 | Where you are today | `{{current_process}}` | text | `current_state.quoting_today` | 220 chars |
| 4 | Where you are today | `{{systems_landscape}}` | text | `CRM: … · ERP: … · E-sign: …` from `current_state` | 120 chars |
| 4 | Where you are today | `{{pain_points}}` | list | `current_state.pain_points[].text` | 4 items × 90 chars |
| 5 | Goals & success criteria | `{{goals}}` | list | `goals[]` → `goal: metric` | 4 items × 110 chars |
| 6 | Scope | `{{products}}` | text | `deal.products` joined with ` · ` | 80 chars |
| 6 | Scope | `{{in_scope}}` | list | `scope.in_scope[].item` | 5 items × 90 chars |
| 6 | Scope | `{{integrations}}` | list | `scope.integrations[]` → `System (direction): notes` | 4 items × 90 chars |
| 6 | Scope | `{{out_of_scope}}` | list | `scope.out_of_scope[].item` | 3 items × 90 chars |
| 7 | Your onboarding journey | *(static diagram of the phases)* | - | - | - |
| 8 | Timeline & milestones | `{{milestones}}` | list | `timeline.milestones[]` → `Mon D: name`, sorted by date | 6 items × 80 chars |
| 8 | Timeline & milestones | `{{target_go_live}}` | text | `timeline.target_go_live`, formatted `MMMM D, YYYY` | - |
| 9 | Roles & responsibilities | `{{exec_sponsor}}` | text | `people[role=executive_sponsor].name` | 40 chars |
| 9 | Roles & responsibilities | `{{project_lead}}` | text | `people[role=project_lead].name` | 40 chars |
| 9 | Roles & responsibilities | `{{customer_admin}}` | text | `people[role=admin].name` | 40 chars |
| 9 | Roles & responsibilities | `{{dealhub_csm}}` | text | `people[role=csm].name` | 40 chars |
| 9 | Roles & responsibilities | `{{dealhub_impl_lead}}` | text | `people[role=implementation_lead].name` | 40 chars |
| 10 | How we'll communicate | `{{weekly_update_channel}}` | text | `phases.weekly_update.channel` (`Email` / `Slack`) | - |
| 10 | How we'll communicate | `{{steering_cadence}}` | text | `phases.steering_committee.cadence` | - |
| 11 | Risks & dependencies | `{{risks}}` | list | `risks[]` → `risk: mitigation`, highest severity first | 4 items × 110 chars |
| 12 | Next steps | `{{next_steps}}` | list | `action_items[]` → `item (owner, due Mon D)` | 6 items × 90 chars |
| 12 | Next steps | `{{overview_session_date}}` | text | milestone named like "Overview…", formatted `MMMM D` | - |
| 13 | Q&A | *(static)* | - | - | - |

Role labels for `{{customer_team}}`: `executive_sponsor` → Executive sponsor,
`project_lead` → Project lead, `admin` → System admin, `champion` → Champion,
`end_user` → End-user rep, `it` → IT, `finance` → Finance, `legal` → Legal.

## Missing data

Never leave a `{{token}}` in the finished deck and never invent content.

| Situation | Replace with |
|---|---|
| Single `text` value unknown | `TBD` |
| Person/role unknown | `To be confirmed` |
| `list` empty | one item: `To be confirmed at kickoff` |
| `{{customer_logo}}` with no usable URL | delete the placeholder shape |

Report every `TBD` / `To be confirmed` back to the CSM so they can fill it in
before the meeting.

## Changing the template

If the template gains, loses, or renames a token, update this table in the same
pull request and bump the plugin version. Tokens that are in the template but not
in this table are flagged by the deck builder's final check.
