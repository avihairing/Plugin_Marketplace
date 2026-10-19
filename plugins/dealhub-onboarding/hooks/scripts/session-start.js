#!/usr/bin/env node
// SessionStart: tell Claude which customers are mid-onboarding, whether debug mode is on,
// and flag missing setup. Never blocks the session: any failure exits 0 with no output.
const { debugState, loadWorkspace, currentPhase, flagsFor } = require("./lib");

function main() {
  const lines = [];
  const debug = debugState();
  const ws = loadWorkspace(debug);

  if (debug.enabled) {
    lines.push(`DEBUG MODE ON: Gong, Fathom and Google Drive are read from mock data (${debug.mockDir}); decks are local previews. Turn off with /dealhub-onboarding:debug off.`);
  } else if (!process.env.CLAUDE_PLUGIN_OPTION_KICKOFF_TEMPLATE_ID) {
    lines.push("Setup: the kickoff Google Slides template ID is not configured (/plugin → dealhub-onboarding).");
  }
  if (ws.customers.length) {
    lines.push(`Active customers in ${ws.dir} (${ws.customers.length}):`);
    for (const c of ws.customers.slice(0, 15)) {
      const phase = currentPhase(c.profile);
      const flags = flagsFor(c.profile);
      lines.push(`- ${c.profile.customer?.name || c.slug}: ${phase.label}${flags.length ? " · " + flags.join(", ") : ""}`);
    }
    if (ws.customers.length > 15) lines.push(`- …and ${ws.customers.length - 15} more (/dealhub-onboarding:status)`);
  }

  if (!lines.length) return;
  const context = ["[dealhub-onboarding]", ...lines].join("\n");
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context },
  }));
}

try { main(); } catch { /* never break session start */ }
