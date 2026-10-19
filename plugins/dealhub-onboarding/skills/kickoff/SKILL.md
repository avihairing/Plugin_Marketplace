---
name: kickoff
description: Prepare a new DealHub customer's onboarding kickoff. Gathers context from Gong/Fathom calls, Google Docs and the CSM, saves the customer profile, and generates the kickoff deck from the company Google Slides template.
argument-hint: <customer name>
disable-model-invocation: true
---

# Kickoff preparation

Customer: **$ARGUMENTS**. If no customer was given, ask for one before doing
anything else.

Configuration:
- Kickoff template (Google Slides ID): `${user_config.kickoff_template_id}`
- Drive folder for generated decks: `${user_config.drive_folder_id}` (blank means the CSM's My Drive)
- Slide map: `${CLAUDE_SKILL_DIR}/references/slide-map.md`

## 0. Mode and setup

Load the `customer-profile` skill (read
`${CLAUDE_PLUGIN_ROOT}/skills/customer-profile/SKILL.md` if it isn't loaded
yet) and determine the **data-source mode** (live or debug).

In LIVE mode, if the template ID isn't set (blank or an unexpanded `${…}`
placeholder), stop and tell the CSM to set it with `/plugin` →
dealhub-onboarding. In DEBUG mode no template is needed.

## 1. Gather context

Run the customer-profile skill's **gathering procedure** for this customer.

Add these kickoff questions to the CSM interview:
- Kickoff meeting date (and the overview session date, if already set).
- Weekly update channel: email or Slack, and which day.
- Steering committee cadence (monthly, bi-weekly, or none).
- Anything that must stay **off** the slides.

Kickoff required fields: `customer.name`, `timeline.kickoff_date`, at least one
customer contact, `deal.products`, at least one goal.

## 2. Review the slide content with the CSM

Read the slide map. Show the CSM a compact preview of what will go on each
slide (one or two lines per slide, not the full text), then list:
- every token that will become `TBD` / `To be confirmed`
- open conflicts that affect the slides
- anything taken from `commitments` or `internal_notes` (these must not be on slides)

Ask the CSM to confirm or correct the preview. Apply the corrections to
`profile.json` (cite the CSM source), then continue.

## 3. Build the deck

Delegate to the `dealhub-onboarding:deck-builder` subagent. Pass it:
- `phase: kickoff`
- the absolute path of the customer's `profile.json`
- the slide map path above
- the template ID and Drive folder ID above
- the deck title: `<Customer name> × DealHub | Onboarding Kickoff | <kickoff date YYYY-MM-DD>`
- in debug mode: `mode: debug`. It then writes a local preview to the
  customer's `decks/` folder instead of creating a Google Slides deck, and
  returns that file's path as `deck_url`.

## 4. Record the result

Update `profile.json`:
`phases.kickoff = { status: "in_progress", deck_url, session_date, updated_at }`.
Also set `phases.weekly_update.channel` and `phases.steering_committee.cadence`
from the interview. Append to `log.md`:
`YYYY-MM-DD HH:MM · kickoff · deck generated · <deck_url>`
(`kickoff (debug)` in debug mode).

## 5. Report to the CSM

Keep it short:
- the deck link (in debug mode, the local preview path plus the
  `.requests.json` file that shows what would have been sent to Google)
- the slides with `TBD` / `To be confirmed` to fill before the meeting
- open conflicts to resolve with the customer at kickoff
- **internal brief** (for the CSM only, never for the customer): sales
  commitments and internal notes to keep in mind in the room
- next step: after the meeting, mark kickoff done with
  `/dealhub-onboarding:status`; the overview phase comes next
