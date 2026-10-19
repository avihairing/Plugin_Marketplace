#!/usr/bin/env node
// PreToolUse: anything that sends, posts or shares outside Claude (email, Slack, Drive sharing)
// always asks the CSM first, even if the tool was previously allowed. Drafts are not gated.
const { readStdinJson } = require("./lib");

const READ_ONLY = /^(get|list|search|read|fetch|find|query|describe)/;
const DRAFT = /draft/;
const SENDS_DRAFT = /send_?draft/;
const OUTBOUND = /(send|post|reply|forward|share|invite|permission|access|publish|schedule_message)/;

const RECIPIENT_KEYS = ["to", "cc", "bcc", "recipients", "recipient", "email", "emails", "email_address", "channel", "channel_id", "channel_name", "user", "users", "share_with"];
const SUBJECT_KEYS = ["subject", "title"];
const BODY_KEYS = ["body", "text", "message", "content", "markdown_text"];

function pick(input, keys) {
  for (const k of keys) {
    const v = input?.[k];
    if (v === undefined || v === null || v === "") continue;
    return Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v);
  }
  return "";
}

function main() {
  const event = readStdinJson();
  const tool = event.tool_name || "";
  const action = tool.split("__").pop().toLowerCase();
  if (READ_ONLY.test(action) || !OUTBOUND.test(action)) return;
  if (DRAFT.test(action) && !SENDS_DRAFT.test(action)) return;

  const input = event.tool_input || {};
  const to = RECIPIENT_KEYS.map((k) => (input[k] ? `${k}: ${pick(input, [k])}` : "")).filter(Boolean).join(" · ");
  const subject = pick(input, SUBJECT_KEYS);
  const body = pick(input, BODY_KEYS).replace(/\s+/g, " ").slice(0, 160);

  const reason = [
    "Customer-facing action. Check recipients and content before approving.",
    `Tool: ${tool}`,
    to && `Recipients: ${to}`,
    subject && `Subject: ${subject}`,
    body && `Preview: ${body}${body.length >= 160 ? "…" : ""}`,
  ].filter(Boolean).join("\n");

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: reason },
  }));
}

try { main(); } catch { /* on error fall back to normal permission handling */ }
