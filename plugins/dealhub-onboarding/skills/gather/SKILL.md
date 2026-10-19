---
name: gather
description: Collect or refresh a DealHub customer's onboarding profile from Gong/Fathom calls, Google Docs and the CSM, without producing any phase output. Use when new calls or documents exist, or before preparing any onboarding phase.
argument-hint: <customer name>
disable-model-invocation: true
---

# Gather customer context

Customer: **$ARGUMENTS**. If no customer was given, ask for one first.

Load the `customer-profile` skill (read
`${CLAUDE_PLUGIN_ROOT}/skills/customer-profile/SKILL.md` if it isn't loaded
yet), determine the **data-source mode** (live or debug), then run its
**gathering procedure**. No phase is being prepared, so skip
phase-specific questions and the required-field check; still report gaps.

Finish with a short summary for the CSM:
- new sources found, by type (Gong, Fathom, Google Docs, files, CSM)
- what changed in the profile (new people, goals, risks, dates)
- open conflicts and missing information
- the suggested next phase, using the `onboarding-phases` skill
