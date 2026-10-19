// Shared helpers for the dealhub-onboarding hooks. No dependencies: Node built-ins only.
const fs = require("fs");
const os = require("os");
const path = require("path");

const ONE_TIME_PHASES = ["kickoff", "overview", "discovery", "configuration"];
const DAY_MS = 24 * 60 * 60 * 1000;

function expandHome(p) {
  if (!p) return "";
  return p === "~" || p.startsWith("~/") || p.startsWith("~\\") ? path.join(os.homedir(), p.slice(1)) : p;
}

// Same default as userConfig.workspace_dir in plugin.json (options aren't set under --plugin-dir).
const DEFAULT_WORKSPACE = "~/DealHub Onboarding";

function workspaceDir() {
  return expandHome((process.env.CLAUDE_PLUGIN_OPTION_WORKSPACE_DIR || "").trim() || DEFAULT_WORKSPACE);
}

// Debug mode state, written by /dealhub-onboarding:debug to ${CLAUDE_PLUGIN_DATA}/debug.json.
function debugState() {
  const dataDir = process.env.CLAUDE_PLUGIN_DATA;
  if (!dataDir) return { enabled: false };
  try {
    const state = JSON.parse(fs.readFileSync(path.join(dataDir, "debug.json"), "utf8"));
    return { enabled: state.enabled === true, mockDir: state.mock_dir || "" };
  } catch {
    return { enabled: false };
  }
}

function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Customer folders live in the workspace, or in its _debug sub-folder in debug mode.
function loadWorkspace(debug = debugState()) {
  const base = workspaceDir();
  const dir = base && debug.enabled ? path.join(base, "_debug") : base;
  const customers = [];
  if (!dir || !fs.existsSync(dir)) return { dir, customers };
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(dir, entry.name, "profile.json");
    if (!fs.existsSync(file)) continue;
    try {
      customers.push({ slug: entry.name, file, profile: JSON.parse(fs.readFileSync(file, "utf8")) });
    } catch {
      customers.push({ slug: entry.name, file, profile: { customer: { name: entry.name } }, broken: true });
    }
  }
  return { dir, customers };
}

function currentPhase(profile) {
  const phases = profile.phases || {};
  for (const key of ONE_TIME_PHASES) {
    const status = phases[key]?.status || "not_started";
    if (status !== "done" && status !== "skipped") return { key, label: `${key} (${status})` };
  }
  return { key: null, label: "all phases complete" };
}

function flagsFor(profile, now = Date.now()) {
  const flags = [];
  const highRisks = (profile.risks || []).filter((r) => r.severity === "high").length;
  if (highRisks) flags.push(`${highRisks} high risk${highRisks > 1 ? "s" : ""}`);

  const overdue = (profile.action_items || []).filter((a) => a.due && Date.parse(a.due) < now - DAY_MS && a.status !== "done").length;
  if (overdue) flags.push(`${overdue} overdue action item${overdue > 1 ? "s" : ""}`);

  const openConflicts = (profile.conflicts || []).filter((c) => c.status !== "resolved").length;
  if (openConflicts) flags.push(`${openConflicts} open conflict${openConflicts > 1 ? "s" : ""}`);

  const kickoffDone = profile.phases?.kickoff?.status === "done";
  const goLive = Date.parse(profile.timeline?.target_go_live || "");
  const lastSent = Date.parse(profile.phases?.weekly_update?.last_sent || "");
  const beforeGoLive = Number.isNaN(goLive) || now <= goLive;
  if (kickoffDone && beforeGoLive && (Number.isNaN(lastSent) || now - lastSent >= 7 * DAY_MS)) {
    flags.push("weekly update due");
  }
  return flags;
}

module.exports = { readStdinJson, workspaceDir, debugState, loadWorkspace, currentPhase, flagsFor, expandHome };
