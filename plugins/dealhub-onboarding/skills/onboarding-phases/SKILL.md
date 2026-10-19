---
name: onboarding-phases
description: The DealHub customer onboarding journey, including each phase's purpose, inputs, outputs, exit criteria and the command that runs it (kickoff, overview demo, discovery, weekly status update, steering committee, configuration). Use to work out where a customer is in onboarding, what comes next, or what a phase needs.
user-invocable: false
---

# DealHub onboarding phases

Each phase reads and writes the customer profile (see the `customer-profile`
skill) and records its state under `phases.<key>` in `profile.json`.

| # | Phase | Key | Kind | Command | Status in plugin |
|---|---|---|---|---|---|
| 1 | Kickoff | `kickoff` | one-time | `/dealhub-onboarding:kickoff` | **available** |
| 2 | Overview (DealHub showcase demo) | `overview` | one-time | `/dealhub-onboarding:overview` | planned |
| 3 | Discovery (customer use cases) | `discovery` | one-time | `/dealhub-onboarding:discovery` | planned |
| - | Weekly update (email or Slack) | `weekly_update` | recurring, weekly | `/dealhub-onboarding:weekly-update` | planned |
| - | Steering committee | `steering_committee` | recurring | `/dealhub-onboarding:steering-committee` | planned |
| 4 | Configuration (automated complex setups) | `configuration` | one-time, iterative | `/dealhub-onboarding:configure` | planned |

Weekly updates start after kickoff and run until go-live. Steering committees
follow the cadence agreed at kickoff (`phases.steering_committee.cadence`).

When a CSM asks for a planned phase, say it isn't available yet. Offer what you
can do now from the profile, for example a draft agenda or a status summary in
chat.

## Phase details

### 1. Kickoff (available)
- **Purpose**: align both teams on goals, scope, roles, timeline and how we'll
  work together.
- **Inputs**: sales calls (Gong/Fathom), order form and handoff docs, CSM knowledge.
- **Output**: kickoff deck generated from the company Google Slides template;
  `phases.kickoff.deck_url`.
- **Required fields**: `customer.name`, `timeline.kickoff_date`, at least one
  customer contact, `deal.products`, at least one goal.
- **Done when**: the kickoff meeting has happened and next steps are agreed.

### 2. Overview (planned)
- **Purpose**: show the customer DealHub's showcase, tailored to their goals
  and pain points.
- **Inputs**: profile goals, pain points, products in scope.
- **Output**: demo storyline and talk track mapped to the customer's pains.

### 3. Discovery (planned)
- **Purpose**: capture the customer's real use cases: products, pricing, approval
  rules, document templates, integrations.
- **Inputs**: profile, discovery workshop recordings, customer artifacts.
- **Output**: discovery summary and requirements list, used as the input to configuration.

### Weekly update (planned, recurring)
- **Purpose**: keep the customer informed once a week with progress, open items
  and risks.
- **Output**: email or Slack message drafted for CSM approval (outbound sends
  always require approval through the plugin's hook).
- **State**: `phases.weekly_update.channel`, `last_sent`.

### Steering committee (planned, recurring)
- **Purpose**: executive-level status, decisions needed and escalations.
- **Output**: steering committee deck and status summary.
- **State**: `phases.steering_committee.cadence`, `last_held`.

### 4. Configuration (planned)
- **Purpose**: generate DealHub configurations automatically for complex
  requirements captured in discovery.
- **Inputs**: discovery requirements.
- **Output**: configuration artifacts plus a review checklist for the
  implementation lead.

## Picking the next step

1. The first one-time phase that isn't `done` or `skipped` is the current phase.
2. If kickoff is `done` and go-live hasn't passed, a weekly update is due when
   `phases.weekly_update.last_sent` is empty or 7 or more days old.
3. Flag anything blocking: `high` risks, overdue `action_items`, open
   `conflicts`, `TBD` values in a generated deck.
