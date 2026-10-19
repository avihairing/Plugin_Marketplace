# Prompt: "DealHub Onboarding plugin" explainer presentation

Paste everything below the line into Claude (or another slide-generation tool).
Fill in the three bracketed fields first.

---

You are an expert in Claude's plugin ecosystem (slash commands, skills,
subagents, MCP connectors, hooks) and in Customer Success operations for B2B
SaaS. Build a presentation that explains a new Claude plugin we are building
for DealHub's Customer Success team.

**Audience**: [AUDIENCE, e.g. CS leadership and the CSM team]. They know
customer onboarding well, but most have never seen how Claude plugins are
built. **Presenter**: [NAME]. **Date**: [DATE].

**Goal**: by the end, the audience understands (1) what problem the plugin
solves, (2) how it works end to end, (3) what each Claude building block does
in it, (4) the guardrails that keep CSMs in control, and (5) the phase roadmap,
so they will back a pilot.

## Facts to use (don't add features that aren't listed here)

**Problem.** Before a kickoff, a CSM digs through Gong and Fathom recordings,
order forms, SOWs and handoff docs, plus their own notes. Then they rebuild the
kickoff deck by hand. Information is scattered, quality varies between CSMs,
and promises made during the sales cycle get lost in the handoff.

**The idea.** One command gathers everything about the customer into a single
customer profile. The kickoff deck is then generated from the company's fixed
Google Slides template. The same profile powers every later onboarding phase.

**Onboarding journey (phases).**
1. Kickoff: available in v1
2. Overview: demo of DealHub's showcase, tailored to the customer (planned)
3. Discovery: the customer's use cases and requirements (planned)
4. Configuration: automated setup for complex configurations (planned)
- Recurring: a weekly update (email or Slack: status, open items, risks) and a
  steering committee (executive status and decisions). Both planned.

**End-to-end flow of `/dealhub-onboarding:kickoff <customer>`.**
1. The CSM runs the command.
2. Three source streams run at the same time:
   - the **call-intel-collector** subagent reads Gong and Fathom calls
     (transcripts, summaries) and pulls out quotes and facts
   - the **document-collector** subagent reads Google Drive, Docs and Sheets
     (order form, SOW, proposal, mutual action plan, handoff notes) and files
     the CSM dropped into an inbox folder
   - Claude interviews the CSM about what only they know: the team, sales
     promises, politics, the kickoff date, how status updates should be sent
3. Everything is merged into `profile.json`. Every fact cites its source, and
   conflicts between sources are surfaced to the CSM rather than hidden.
   Precedence: the signed order form wins on commercial terms, the customer's
   own words win on goals and pains, and the CSM wins on people and dates.
4. The CSM reviews a slide-by-slide preview and corrects it.
5. The **deck-builder** subagent copies the kickoff template and fills its
   placeholders (13 slides: teams, current state, goals, scope, timeline,
   roles, communication plan, risks, next steps). Unknown values become `TBD`,
   never invented content.
6. The CSM gets the deck link, the list of TBDs, open conflicts, and a private
   internal brief (sales commitments, sensitive notes) that never goes on slides.

**Building blocks** (explain each one with its CSM analogy):

| Claude concept | Analogy for CSMs | In this plugin |
|---|---|---|
| Slash commands | The buttons a CSM presses | `/dealhub-onboarding:kickoff`, `:gather` (refresh the profile), `:status` (where every customer stands); future `:overview`, `:discovery`, `:weekly-update`, `:steering-committee`, `:configure` |
| Skills | The playbook Claude follows | `customer-profile` (data model, gathering and merge rules), `onboarding-phases` (the journey and what's next), the kickoff slide map |
| Subagents | Specialist researchers working in parallel | call-intel-collector, document-collector, deck-builder |
| MCP connectors | The cables to our tools | Gong, Fathom, Google Workspace (Drive, Docs, Sheets, Slides); Gmail and Slack arrive with the weekly update phase |
| Hooks | Automatic checkpoints that always run | Session start: brief Claude on active customers and flags. Before any send: always ask the CSM to approve emails, Slack posts and sharing. After saving a profile: validate it (every fact sourced, valid dates and roles) |

**Guardrails.** A human stays in the loop at every step: the CSM reviews the
preview, every customer-facing send needs explicit approval, every fact is
traceable to a call or document, internal notes never reach slides, and
nothing is invented.

**Distribution.** The plugin is published in our internal plugin marketplace
on GitHub. Each CSM installs it once (`/plugin marketplace add <org>/<repo>`,
then `/plugin install dealhub-onboarding@dealhub-plugins`) and receives
updates when we release them.

**Adding a phase later** takes four pieces: a new command, its playbook
skill, an optional Google Slides template with a slide map, and a row in the
phase registry. Because every phase reads the same customer profile, new
phases start with full context.

## Storyline (aim for 12 to 14 slides)

1. Title: the plugin's name and a one-line promise
2. The problem today (make it concrete: one CSM's week before a kickoff)
3. The idea in one picture: sources → customer profile → kickoff deck → every later phase
4. The onboarding journey: phases on a timeline, v1 highlighted, recurring tracks shown underneath
5. How `/kickoff` works: the end-to-end flow as a diagram with the three parallel streams
6. Building blocks overview: a 5-tile grid (concept, analogy, what it does here)
7. Commands and skills: what the CSM types vs. the playbooks behind it
8. Subagents and MCP: who does the research, and where it comes from
9. Hooks and guardrails: the three checkpoints, plus the human-in-the-loop moments
10. The customer profile: single source of truth, citations, conflict rules, internal-only fields
11. The kickoff deck: template, placeholders, TBD handling (show a before/after mock of one slide)
12. Roadmap: the next phases and what each one adds; how a phase gets added
13. Rollout: install from the company marketplace, pilot plan, feedback loop
14. The ask: pilot CSMs, kickoff template sign-off, Gong/Fathom/Google access

## Design and writing rules
- At most 40 words of body text per slide. Use diagrams for flows (slides 3, 4, 5, 8).
- Give each building block one consistent color and icon, used everywhere it
  appears: commands, skills, subagents, MCP, hooks.
- Write in plain CSM language. Explain every technical term the first time it
  appears, using its analogy.
- Include speaker notes (60 to 120 words) on every slide, with the story the presenter tells.
- Present any value claims (for example time saved per kickoff) as **pilot
  targets to measure**, not results.
- Keep the visual style clean and professional, with plenty of whitespace and no clip-art.

## Output
If you can create slides directly (Google Slides or PowerPoint), build the deck.
Otherwise, output each slide as: **title**, **body**, **visual** (a precise
description of the diagram or image), and **speaker notes**.
