#!/usr/bin/env node
// PostToolUse (Write|Edit): validate a customer profile.json right after Claude writes it.
// Exit 2 sends the error list back to Claude so it fixes the file in the same turn.
const fs = require("fs");
const path = require("path");
const { readStdinJson } = require("./lib");

const SOURCE_TYPES = ["gong", "fathom", "gdoc", "gsheet", "file", "csm", "email", "other"];
const ROLES = {
  customer: ["executive_sponsor", "project_lead", "admin", "champion", "end_user", "it", "finance", "legal"],
  dealhub: ["csm", "implementation_lead", "account_executive", "solution_engineer", "executive"],
};
const PHASE_KEYS = ["kickoff", "overview", "discovery", "weekly_update", "steering_committee", "configuration"];
const PHASE_STATUS = ["not_started", "in_progress", "done", "skipped"];
const FACT_LISTS = [
  "people", "current_state.pain_points", "goals", "scope.in_scope", "scope.out_of_scope",
  "scope.integrations", "timeline.milestones", "risks", "open_questions", "action_items",
  "commitments", "internal_notes",
];
const DATE_KEYS = new Set(["date", "due", "kickoff_date", "target_go_live", "contract_start", "session_date", "last_sent", "last_held"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const get = (obj, dotted) => dotted.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

function validate(profile, file) {
  const errors = [];
  if (profile.schema_version !== 1) errors.push("schema_version must be 1");
  if (!profile.customer?.name) errors.push("customer.name is required");

  const slug = profile.customer?.slug || "";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.push(`customer.slug "${slug}" must be lowercase words joined by "-"`);
  const folder = path.basename(path.dirname(file));
  if (slug && folder !== slug) errors.push(`customer.slug "${slug}" must match the folder name "${folder}"`);

  const ids = new Set();
  for (const [i, s] of (profile.sources || []).entries()) {
    if (!/^S\d+$/.test(s.id || "")) errors.push(`sources[${i}].id "${s.id}" must look like S1, S2, …`);
    else if (ids.has(s.id)) errors.push(`sources[${i}].id "${s.id}" is duplicated`);
    ids.add(s.id);
    if (!SOURCE_TYPES.includes(s.type)) errors.push(`sources[${i}].type "${s.type}" must be one of ${SOURCE_TYPES.join(", ")}`);
  }

  for (const list of FACT_LISTS) {
    const items = get(profile, list);
    if (items === undefined) continue;
    if (!Array.isArray(items)) { errors.push(`${list} must be an array`); continue; }
    items.forEach((item, i) => {
      if (!Array.isArray(item?.src) || item.src.length === 0) errors.push(`${list}[${i}] has no src (every fact needs a source)`);
    });
  }

  (profile.people || []).forEach((p, i) => {
    if (!ROLES[p.side]) errors.push(`people[${i}].side "${p.side}" must be customer or dealhub`);
    else if (p.role && !ROLES[p.side].includes(p.role)) errors.push(`people[${i}].role "${p.role}" is not a valid ${p.side} role (${ROLES[p.side].join(", ")})`);
  });
  (profile.risks || []).forEach((r, i) => {
    if (!["high", "medium", "low"].includes(r.severity)) errors.push(`risks[${i}].severity must be high, medium or low`);
  });
  (profile.conflicts || []).forEach((c, i) => {
    if (c.status && !["open", "resolved"].includes(c.status)) errors.push(`conflicts[${i}].status must be open or resolved`);
  });
  for (const [key, phase] of Object.entries(profile.phases || {})) {
    if (!PHASE_KEYS.includes(key)) errors.push(`phases.${key} is not a known phase (${PHASE_KEYS.join(", ")})`);
    if (phase?.status && !PHASE_STATUS.includes(phase.status)) errors.push(`phases.${key}.status must be one of ${PHASE_STATUS.join(", ")}`);
  }

  // Walk the whole document: every src id must exist and dates must be YYYY-MM-DD.
  (function walk(node, at) {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${at}[${i}]`));
    if (!node || typeof node !== "object") return;
    for (const [k, v] of Object.entries(node)) {
      const here = at ? `${at}.${k}` : k;
      if (k === "src" && Array.isArray(v)) {
        v.filter((id) => !ids.has(id)).forEach((id) => errors.push(`${here} cites "${id}", which is not in sources[]`));
      } else if (DATE_KEYS.has(k) && typeof v === "string" && v && !DATE_RE.test(v)) {
        errors.push(`${here} "${v}" must be YYYY-MM-DD`);
      } else {
        walk(v, here);
      }
    }
  })(profile, "");

  return errors;
}

function main() {
  const event = readStdinJson();
  const file = event.tool_input?.file_path || "";
  if (path.basename(file) !== "profile.json" || !fs.existsSync(file)) return 0;

  let profile;
  try {
    profile = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    process.stderr.write(`profile.json is not valid JSON (${file}): ${e.message}\nFix it and save again.`);
    return 2;
  }
  // Works in the live workspace and its _debug folder alike; skip unrelated profile.json files.
  if (!(profile && "schema_version" in profile && "phases" in profile)) return 0;

  const errors = validate(profile, file);
  if (!errors.length) return 0;
  const shown = errors.slice(0, 25).map((e) => `- ${e}`).join("\n");
  const more = errors.length > 25 ? `\n- …and ${errors.length - 25} more` : "";
  process.stderr.write(`profile.json failed validation (${file}):\n${shown}${more}\nFix these and save again. Schema: skills/customer-profile/references/profile.example.json`);
  return 2;
}

try { process.exitCode = main(); } catch { process.exitCode = 0; }
