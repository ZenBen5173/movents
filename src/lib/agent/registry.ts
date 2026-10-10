import "server-only";
import { Run } from "./run";
import * as T from "./tools";
import { execute, classify } from "./pipelines";
import { parsePrompt } from "../planning";
import { appUrl, today } from "../appurl";
import { one, query } from "../db";
import { decideApproval } from "../actions";
import { runScheduler } from "../scheduler";
import { loadBundle, budgetTotals } from "../docs/builders";
import { generateKit, imageHref, setImage } from "../marketing";
import { update as updateRow } from "../db";
import type { AgentRun, Creative, StepStatus, User } from "../types";
import { addMembers, assertMember, listMembers, removeMember, resolvePeople, visibleSql } from "../members";

type Args = Record<string, unknown>;
type Tool = {
  name: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  run: (args: Args, user: User) => Promise<unknown>;
};

const str = (description: string) => ({ type: "string", description });
const ev = { event_id: str("Event id (evt_...) returned by create_event") };
const runId = { run_id: str("Optional agent run id from start_run, when given, this call is recorded as a step in the live trace") };

function outputs(eventId: string) {
  const base = appUrl();
  return {
    dashboard: `${base}/events/${eventId}`,
    proposal_pdf: `${base}/api/outputs/${eventId}/proposal.pdf`,
    proposal_docx: `${base}/api/outputs/${eventId}/proposal.docx`,
    budget_xlsx: `${base}/api/outputs/${eventId}/budget.xlsx`,
    budget_csv: `${base}/api/outputs/${eventId}/budget.csv`,
    risks_xlsx: `${base}/api/outputs/${eventId}/risks.xlsx`,
    risks_pdf: `${base}/api/outputs/${eventId}/risks.pdf`,
    runsheet_pdf: `${base}/api/outputs/${eventId}/runsheet.pdf`,
    timeline_ics: `${base}/api/outputs/${eventId}/timeline.ics`,
    report_pdf: `${base}/api/outputs/${eventId}/report.pdf`,
    report_docx: `${base}/api/outputs/${eventId}/report.docx`,
    marketing_kit: `${base}/events/${eventId}/promotion`,
    audit_log: `${base}/audit?event=${eventId}`,
  };
}

/** Wrap a tool so that, given run_id, the call shows up in the run's live trace. */
async function traced(user: User, args: Args, name: string, tool: string, fn: () => Promise<unknown>) {
  const rid = args.run_id ? String(args.run_id) : null;
  const run = rid ? await Run.load(rid, user) : null;
  if (!run) return fn();
  if (args.event_id && !run.eventId) await run.setEvent(String(args.event_id));
  return run.step(name, `workbuddy → ${tool}`, args, async () => {
    const out = await fn();
    return { output: out, ...describe(out) };
  }).then((r) => r.output);
}

type Check = { check?: string; label?: string; passed: boolean; detail?: string; deadline?: string; days_late?: number };

/** Turn a tool result into the trace's status / summary / checks / adapt note. */
function describe(out: unknown): { status: StepStatus; summary?: string; validation?: { check: string; passed: boolean; detail: string }[]; adapt?: string } {
  const toChecks = (rows: Check[]) => rows.map((c) => ({ check: c.check ?? c.label ?? "check", passed: c.passed, detail: c.detail ?? (c.deadline ? `due ${c.deadline}${c.days_late ? `, ${c.days_late} days late` : ""}` : "") }));
  if (Array.isArray(out)) {
    if (out.length && typeof out[0] === "object" && out[0] && "passed" in out[0]) {
      const v = toChecks(out as Check[]);
      return { status: v.every((x) => x.passed) ? "ok" : "warn", validation: v, summary: `${v.filter((x) => x.passed).length}/${v.length} checks passed` };
    }
    const blocked = out.filter((x) => (x as { status?: string }).status === "blocked").length;
    return { status: blocked ? "blocked" : "ok", summary: blocked ? `${blocked} of ${out.length} blocked → approval queue` : `${out.length} done` };
  }
  if (out && typeof out === "object") {
    const o = out as Record<string, unknown>;
    if (Array.isArray(o.checks)) {
      const v = toChecks(o.checks as Check[]);
      return { status: v.every((x) => x.passed) ? "ok" : "warn", validation: v, adapt: o.allPassed === false ? `Earliest compliant date: ${String(o.suggestedDate)}` : undefined, summary: `${v.filter((x) => x.passed).length}/${v.length} lead times met` };
    }
    if (Array.isArray(o.iterations)) {
      const its = o.iterations as { total: number; change: string; withinCap: boolean }[];
      return { status: Number(o.shortfall) > 0 ? "fail" : its.length > 1 ? "warn" : "ok", summary: its.map((i) => `RM${i.total}`).join(" → "), adapt: its.length > 1 ? its.slice(1).map((i) => i.change).join(" | ") : undefined };
    }
    if (o.status === "blocked") return { status: "blocked", summary: String(o.reason ?? "Blocked → approval queue") };
    if (o.status === "failed") return { status: "fail", summary: String(o.error ?? "failed") };
    if (o.status === "executed") return { status: "ok", summary: String(o.reason ?? "executed") };
    if (typeof o.chosen === "string") return { status: "ok", summary: o.chosen };
    if (Array.isArray(o.speakers)) return { status: o.mode === "live" ? "ok" : "warn", summary: `${(o.speakers as { name: string }[]).map((s) => s.name).join(", ")} (${String(o.mode)})` };
    if (o.university) return { status: "ok", summary: `${String(o.university)} SOP v${String(o.sopVersion)}` };
    if (typeof o.tasks === "number") return { status: "ok", summary: `${o.tasks} tasks across 5 phases` };
    if (typeof o.count === "number") return { status: "ok", summary: `${o.count} risks` };
    if (typeof o.runsheetBlocks === "number") return { status: "ok", summary: `${o.runsheetBlocks} run-sheet blocks, ${String(o.promoItems)} promo tasks, ${String(o.reminders)} reminders` };
    return { status: "ok", summary: JSON.stringify(o).slice(0, 160) };
  }
  return { status: "ok", summary: String(out) };
}

export const TOOLS: Tool[] = [
  {
    name: "list_society_members",
    description: "People in the caller's society (name, role, department, email). Use to pick an event team.",
    inputSchema: { type: "object", properties: {} },
    run: async (_, user) => query("SELECT name, role, department, email FROM users WHERE society_id = $1 AND role <> 'faculty_advisor' ORDER BY name", [user.society_id]),
  },
  {
    name: "list_my_events",
    description: "Events the caller is on the team for (President, VP and advisor see all).",
    inputSchema: { type: "object", properties: {} },
    run: async (_, user) => query(`SELECT e.id AS event_id, e.title, e.date, e.status FROM events e WHERE e.society_id = $1 AND ${visibleSql(user, 2)} ORDER BY e.date`, [user.society_id, user.id]),
  },
  {
    name: "event_team",
    description: "Show, add or remove people on an event team. Only team members can see and edit an event.",
    inputSchema: { type: "object", properties: { ...ev, add: { type: "array", items: { type: "string" }, description: "Names or emails to add" }, remove: { type: "array", items: { type: "string" }, description: "Names or emails to remove" } }, required: ["event_id"] },
    run: async (a, user) => {
      const eventId = String(a.event_id);
      const add = Array.isArray(a.add) ? (a.add as string[]) : [];
      const rem = Array.isArray(a.remove) ? (a.remove as string[]) : [];
      const added = await resolvePeople(user.society_id ?? "", add);
      await addMembers(eventId, added.ids, user.id);
      const removed = await resolvePeople(user.society_id ?? "", rem);
      for (const uid of removed.ids) await removeMember(eventId, uid);
      return { team: (await listMembers(eventId)).map((m) => ({ name: m.name, role: m.member_role, department: m.department })), not_found: [...added.unknown, ...removed.unknown] };
    },
  },
  {
    name: "list_event_emails",
    description: "Every email Movents sent for one event (speaker invites, supplier quotes, faculty proposal, attendee reminders), newest first, plus the event's tagged mailbox. Inbox UI: /events/<event_id>/inbox.",
    inputSchema: { type: "object", properties: { ...ev }, required: ["event_id"] },
    run: async (a) => {
      const eventId = String(a.event_id);
      const box = await query<{ address: string }>("SELECT address FROM event_mailboxes WHERE event_id = $1", [eventId]).catch(() => []);
      const emails = await query<{ id: string; subject: string; to: string; kind: string; status: string; sent_at: string | null }>(
        `SELECT id, subject, COALESCE(intended_to, to_addr) AS "to", kind, status, COALESCE(sent_at, created_at) AS sent_at FROM emails WHERE event_id = $1 ORDER BY created_at DESC LIMIT 200`,
        [eventId],
      );
      return { mailbox: box[0]?.address ?? null, inbox_url: `${appUrl()}/events/${eventId}/inbox`, count: emails.length, emails: emails.map((e) => ({ ...e, link: `${appUrl()}/events/${eventId}/inbox#${e.id}` })) };
    },
  },
  {
    name: "whoami",
    description: "Returns the Movents user this API key acts as, their role, and what they are allowed to do without approval.",
    inputSchema: { type: "object", properties: {} },
    run: async (_, user) => ({ id: user.id, name: user.name, role: user.role, department: user.department, note: "Outbound actions you are not allowed to do are queued for approval automatically." }),
  },
  {
    name: "start_run",
    description: "Start a WorkBuddy agent run so every following tool call (with run_id) appears in the Movents live trace UI. Call this first with the user's original prompt.",
    inputSchema: { type: "object", properties: { prompt: str("The user's original one-line request") }, required: ["prompt"] },
    run: async (a, user) => {
      const r = await Run.start(user, String(a.prompt), classify(String(a.prompt)), "workbuddy");
      return { run_id: r.id, trace_url: `${appUrl()}/runs/${r.id}` };
    },
  },
  {
    name: "plan_event_end_to_end",
    description: "Run the complete Movents planning pipeline from one prompt (parse → SOP → timeline → venue → lead-time validation → speakers & suppliers → budget with adapt loop → risks → ops pack → proposal → gated sends → calendar → Luma). Returns run id, event id and links to every output. Use for one-shot demos; use the granular tools to orchestrate step by step.",
    inputSchema: { type: "object", properties: { prompt: str('e.g. "Plan a 150-pax AI talk at Sunway on 15 Nov, budget RM3,000, with Jason and Priya."'), team: { type: "array", items: { type: "string" }, description: "Names or emails of society members working on this event. Only they (plus President, VP, advisor) can see and edit it." }, suppliers: { type: "array", items: { type: "string" }, description: "Supplier names the organiser wants used (they win over ratings and price when a saved quote matches)" } }, required: ["prompt"] },
    run: async (a, user) => {
      const team = Array.isArray(a.team) ? (a.team as string[]).filter(Boolean) : [];
      const sup = Array.isArray(a.suppliers) ? (a.suppliers as string[]).filter(Boolean) : [];
      const prompt = `${String(a.prompt)}${team.length ? ` Team: ${team.join(", ")}.` : ""}${sup.length ? ` Suppliers: ${sup.join(", ")}.` : ""}`;
      const kind = classify(prompt);
      const r = await Run.start(user, prompt, kind, "workbuddy");
      await execute(r, kind);
      const row = await one<AgentRun>("SELECT * FROM agent_runs WHERE id = $1", [r.id]);
      return { run_id: r.id, status: row?.status, event_id: row?.event_id, trace_url: `${appUrl()}/runs/${r.id}`, steps: row?.steps.map((s) => `${s.status.toUpperCase()} ${s.name}: ${s.summary ?? ""}`), outputs: row?.event_id ? outputs(row.event_id) : {} };
    },
  },
  {
    name: "generate_post_event_report",
    description: "Generate the post-event report (registered vs actual, budget vs actual, cost per attendee, NPS, feedback themes, lessons learned) as PDF and Word, and feed lessons back into the SOP knowledge base.",
    inputSchema: { type: "object", properties: { prompt: str('e.g. "Generate the post-event report for the AI talk."') }, required: ["prompt"] },
    run: async (a, user) => {
      const r = await Run.start(user, String(a.prompt), "report", "workbuddy");
      await execute(r, "report");
      const row = await one<AgentRun>("SELECT * FROM agent_runs WHERE id = $1", [r.id]);
      return { run_id: r.id, status: row?.status, event_id: row?.event_id, trace_url: `${appUrl()}/runs/${r.id}`, steps: row?.steps.map((s) => `${s.status.toUpperCase()} ${s.name}: ${s.summary ?? ""}`), outputs: row?.event_id ? outputs(row.event_id) : {} };
    },
  },
  {
    name: "create_event",
    description: "Parse a one-line goal and create a draft event for the caller's society. The caller becomes the event lead; pass team to add collaborators (only team members can see and edit the event).",
    inputSchema: { type: "object", properties: { prompt: str("One-line event goal"), team: { type: "array", items: { type: "string" }, description: "Names or emails of society members working on this event" }, suppliers: { type: "array", items: { type: "string" }, description: "Supplier names the organiser asked for" }, ...runId }, required: ["prompt"] },
    run: (a, user) =>
      traced(user, a, "Create event", "create_event", async () => {
        const p = parsePrompt(String(a.prompt), today());
        if (Array.isArray(a.team)) p.team = [...p.team, ...(a.team as string[])];
        if (Array.isArray(a.suppliers)) p.suppliers = [...p.suppliers, ...(a.suppliers as string[])];
        const e = await T.createEvent(user, p);
        if (a.run_id) {
          const r = await Run.load(String(a.run_id), user);
          await r?.setEvent(e.id);
        }
        return { event_id: e.id, parsed: p };
      }),
  },
  { name: "read_sop", description: "Read the university's SOP (required proposal sections, lead times, rules) plus lessons learned from past events.", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Read university SOP", "read_sop", () => T.readSop(String(a.event_id))) },
  { name: "plan_timeline", description: "Back-calculate the phased task timeline (concept, planning, promotion, execution, post-event) from the event date and SOP lead times.", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Back-calculate timeline", "plan_timeline", () => T.planTimeline(String(a.event_id))) },
  { name: "match_venue", description: "Pick the smallest free venue that fits, with clash detection against other bookings that day.", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Match venue", "match_venue", async () => { const r = await T.matchVenue(String(a.event_id)); return { chosen: r.chosen?.name ?? null, considered: r.considered.map((c) => ({ venue: c.venue.name, ok: c.ok, reason: c.reason })) }; }) },
  { name: "check_lead_times", description: "Validate the event date against SOP lead times. Returns each check, and the earliest compliant date if any are missed.", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Validate lead times", "check_lead_times", () => T.checkLeads(String(a.event_id))) },
  {
    name: "save_speakers",
    description: "Save speakers YOU found with your own web search (name, headline, profile URL, email if public). Replaces placeholder speakers.",
    inputSchema: { type: "object", properties: { ...ev, speakers: { type: "array", items: { type: "object", properties: { name: str("Full name"), headline: str("Role / organisation"), source_url: str("Profile or source page"), email: str("Public email, if any"), fit_reason: str("Why they fit") }, required: ["name"] } }, ...runId }, required: ["event_id", "speakers"] },
    run: (a, u) => traced(u, a, "Save speakers from web search", "save_speakers", async () => { const r = await T.saveSpeakers(String(a.event_id), (a.speakers as never[]) ?? []); return { saved: r.length, speakers: r.map((s) => ({ id: s.id, name: s.name })) }; }),
  },
  {
    name: "save_supplier_quotes",
    description: "Save supplier prices YOU found with your own web search. category: food | tshirt | lanyard | cardholder. unit_price in RM; unit: pax or piece. Always include the source url.",
    inputSchema: { type: "object", properties: { ...ev, quotes: { type: "array", items: { type: "object", properties: { category: str("food | tshirt | lanyard | cardholder"), name: str("Supplier"), url: str("Source page"), unit_price: { type: "number" }, unit: str("pax | piece"), snippet: str("Evidence text with the price") }, required: ["category", "name", "unit_price", "url"] } }, ...runId }, required: ["event_id", "quotes"] },
    run: (a, u) => traced(u, a, "Save supplier quotes from web search", "save_supplier_quotes", async () => { const r = await T.saveSupplierQuotes(String(a.event_id), (a.quotes as never[]) ?? []); return { saved: r.length }; }),
  },
  { name: "list_speakers_and_suppliers", description: "Speakers and supplier options currently on the event (after saving, call draft_budget to recompute).", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Research on file", "list_speakers_and_suppliers", async () => { const sp = await T.researchSpeakers(String(a.event_id), 3); const su = await T.researchSuppliers(String(a.event_id)); return { speakers: sp.speakers.map((s) => s.name), suppliers: Object.fromEntries(Object.entries(su.suppliers).map(([k, v]) => [k, v.map((x) => `${x.name} RM${x.unit_price}`)])) }; }) },
  { name: "draft_budget", description: "Compose the budget with 10% contingency and run the adapt loop (swap to cheaper vendors, apply cuts) until it fits the cap.", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Draft budget & adapt", "draft_budget", async () => { const s = await T.readSop(String(a.event_id)); const r = await T.draftBudget(String(a.event_id), s.signals); return { iterations: r.iterations.map((i) => ({ label: i.label, total: i.total, withinCap: i.withinCap, change: i.change })), final_total: r.final.total, shortfall: r.shortfall }; }) },
  { name: "validate_budget", description: "Check total ≤ cap incl. contingency, contingency present, supplier links present.", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Validate budget", "validate_budget", () => T.checkBudget(String(a.event_id))) },
  { name: "generate_risks", description: "Generate the risk register with mitigations and a weather/contingency plan (Open-Meteo data).", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Risk register", "generate_risks", () => T.generateRisks(String(a.event_id))) },
  { name: "generate_ops_pack", description: "Generate the 15-minute run sheet, promotion checklist, reminder cadence and volunteer roster.", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Ops pack", "generate_ops_pack", () => T.generateOpsPack(String(a.event_id))) },
  { name: "validate_proposal", description: "Check that the generated proposal contains every section the university SOP requires.", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Validate proposal", "validate_proposal", () => T.checkProposal(String(a.event_id))) },
  { name: "get_outputs", description: "Links to every generated file for an event (proposal PDF/DOCX, budget XLSX/CSV, risk register, run sheet, timeline ICS, report).", inputSchema: { type: "object", properties: { ...ev }, required: ["event_id"] }, run: async (a) => outputs(String(a.event_id)) },
  { name: "get_event", description: "Summary of an event: status, venue, budget totals, speakers, approvals and flags.", inputSchema: { type: "object", properties: { ...ev }, required: ["event_id"] }, run: async (a) => { const b = await loadBundle(String(a.event_id)); if (!b) throw new Error("Event not found"); const approvals = await query("SELECT id, title, status, approver_role FROM approval_requests WHERE event_id = $1 ORDER BY created_at", [b.event.id]); return { event: b.event, venue: b.venue?.name, budget: budgetTotals(b.lines, b.university?.sop.budget_rules.contingency_pct ?? 10), speakers: b.speakers.map((s) => ({ name: s.name, status: s.status })), approvals, rsvps: b.rsvps.length }; } },
  { name: "send_speaker_outreach", description: "Send invitation emails to found speakers. Role-gated: committee members' emails are queued for Director approval.", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Send speaker outreach", "send_speaker_outreach (outlook)", () => T.outreachSpeakers(u, String(a.event_id), (a.run_id as string) ?? null)) },
  { name: "request_vendor_quotes", description: "Email selected suppliers for written quotes. Role-gated (Logistics Director).", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Request supplier quotes", "request_vendor_quotes", () => T.requestVendorQuotes(u, String(a.event_id), (a.run_id as string) ?? null)) },
  { name: "request_budget_approval", description: "Route the budget total for approval (President/VP above the SOP threshold).", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Request budget approval", "request_budget_approval", () => T.requestBudgetApproval(u, String(a.event_id), (a.run_id as string) ?? null)) },
  { name: "submit_to_faculty", description: "Email the proposal to the faculty advisor with approve/reject links. Role-gated: needs President/VP approval first.", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Submit to faculty", "submit_to_faculty (outlook)", () => T.submitToFaculty(u, String(a.event_id), (a.run_id as string) ?? null)) },
  { name: "push_calendar", description: "Push the timeline milestones to Google Calendar (or the subscribable .ics feed).", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Push to calendar", "push_calendar", () => T.pushToCalendar(u, String(a.event_id), (a.run_id as string) ?? null)) },
  { name: "publish_event", description: "Create the public event page on Luma or Meetup. Role-gated (President/VP).", inputSchema: { type: "object", properties: { ...ev, platform: { type: "string", enum: ["luma", "meetup"] }, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Publish event page", `publish_event (${String(a.platform ?? "luma")})`, () => T.publishEvent(u, String(a.event_id), (a.run_id as string) ?? null, (a.platform as "luma" | "meetup") ?? "luma")) },
  { name: "sync_rsvps", description: "Pull RSVPs from Luma or Meetup into the registration list.", inputSchema: { type: "object", properties: { ...ev, platform: { type: "string", enum: ["luma", "meetup"] }, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Sync RSVPs", "sync_rsvps", () => T.syncRsvps(String(a.event_id), (a.platform as "luma" | "meetup") ?? "luma")) },
  {
    name: "generate_marketing_kit",
    description: "Create the event's marketing kit: campus poster (4:5), Instagram post (1:1) and story (9:16), LinkedIn image, channel-specific captions and hashtags, plus a 15-second Reels/TikTok storyboard. Each creative includes an image_prompt ready for Nano Banana. Returns creative ids, generate the images/video with your Nano Banana integration and attach them with attach_creative_media.",
    inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] },
    run: (a, u) =>
      traced(u, a, "Create marketing kit", "generate_marketing_kit", async () => {
        const r = await generateKit(String(a.event_id), { withImages: false });
        return { mode: r.mode, creatives: r.creatives.map((c) => ({ creative_id: c.id, kind: c.kind, channel: c.channel, size: `${c.width}x${c.height}`, caption: c.caption, hashtags: c.hashtags, image_prompt: c.image_prompt, preview: `${appUrl()}${imageHref(c)}` })) };
      }),
  },
  {
    name: "attach_creative_media",
    description: "Attach an image (or video) WorkBuddy generated with Nano Banana to a creative. Pass media_url (https) or media_base64 + mime_type (e.g. image/png).",
    inputSchema: { type: "object", properties: { creative_id: str("crv_..."), media_url: str("https URL of the generated image/video"), media_base64: str("Base64 data, without the data: prefix"), mime_type: str("e.g. image/png, image/jpeg, video/mp4"), ...runId }, required: ["creative_id"] },
    run: (a, u) =>
      traced(u, a, "Attach Nano Banana media", "attach_creative_media", async () => {
        const media = a.media_url ? String(a.media_url) : a.media_base64 ? `data:${String(a.mime_type ?? "image/png")};base64,${String(a.media_base64)}` : "";
        if (!media) throw new Error("media_url or media_base64 is required");
        const c = await setImage(String(a.creative_id), media, "workbuddy");
        return { creative_id: c?.id, attached: true, preview: c ? `${appUrl()}${imageHref(c)}` : null };
      }),
  },
  {
    name: "update_creative_copy",
    description: "Replace a creative's caption and/or hashtags (e.g. after WorkBuddy rewrites them in the society's voice).",
    inputSchema: { type: "object", properties: { creative_id: str("crv_..."), caption: str("New caption"), hashtags: str("New hashtags") }, required: ["creative_id"] },
    run: async (a) => {
      const c = await updateRow<Creative>("creatives", String(a.creative_id), { caption: a.caption as string | undefined, hashtags: a.hashtags as string | undefined, updated_at: new Date() });
      if (!c) throw new Error("Creative not found");
      return { creative_id: c.id, caption: c.caption, hashtags: c.hashtags };
    },
  },
  { name: "request_social_approval", description: "Send the poster and social posts for approval (President/VP). Approved creatives satisfy the SOP publicity-approval step.", inputSchema: { type: "object", properties: { ...ev, ...runId }, required: ["event_id"] }, run: (a, u) => traced(u, a, "Request poster & social approval", "request_social_approval", () => T.requestSocialApproval(u, String(a.event_id), (a.run_id as string) ?? null)) },
  { name: "list_creatives", description: "List the event's marketing creatives with status and preview links.", inputSchema: { type: "object", properties: { ...ev }, required: ["event_id"] }, run: async (a) => (await query<Creative>("SELECT * FROM creatives WHERE event_id = $1 ORDER BY created_at", [String(a.event_id)])).map((c) => ({ creative_id: c.id, kind: c.kind, status: c.status, image_source: c.image_source, preview: `${appUrl()}${imageHref(c)}` })) },
  { name: "list_approvals", description: "List approval requests (default: pending).", inputSchema: { type: "object", properties: { status: str("pending | approved | executed | rejected | awaiting_faculty | all") } }, run: async (a) => query(`SELECT id, event_id, action_type, title, approver_role, approver_department, status, result, created_at FROM approval_requests ${a.status === "all" ? "" : "WHERE status = $1"} ORDER BY created_at DESC LIMIT 100`, a.status === "all" ? [] : [String(a.status ?? "pending")]) },
  { name: "decide_approval", description: "Approve or reject a pending request. Only works if the API key's user has the authority (role check enforced).", inputSchema: { type: "object", properties: { approval_id: str("apr_..."), decision: { type: "string", enum: ["approve", "reject"] }, note: str("Optional note") }, required: ["approval_id", "decision"] }, run: (a, u) => decideApproval(u, String(a.approval_id), a.decision as "approve" | "reject", a.note as string | undefined) },
  { name: "run_scheduler", description: "Run the daily automations now: speaker follow-ups, vendor reminders (7 days before), attendee reminder cadence, 90% spend alerts, feedback surveys.", inputSchema: { type: "object", properties: {} }, run: () => runScheduler() },
  {
    name: "log_step",
    description: "Record a step WorkBuddy performed outside Movents (e.g. wrote the slide deck, drafted a poster) so it appears in the live trace.",
    inputSchema: { type: "object", properties: { run_id: str("Run id"), name: str("Step name"), tool: str("Tool used"), status: { type: "string", enum: ["ok", "warn", "fail", "blocked"] }, summary: str("What happened / result"), output_url: str("Optional link to a produced file") }, required: ["run_id", "name", "summary"] },
    run: async (a, user) => {
      const r = await Run.load(String(a.run_id), user);
      if (!r) throw new Error("Run not found");
      const s = await r.record({ name: String(a.name), tool: `workbuddy → ${String(a.tool ?? "workbuddy")}`, status: (a.status as StepStatus) ?? "ok", summary: String(a.summary) });
      if (a.output_url) await r.output(String(a.name), String(a.output_url), "external");
      return { recorded: s.id };
    },
  },
  {
    name: "finish_run",
    description: "Mark a WorkBuddy run as finished and attach the event's output links to it.",
    inputSchema: { type: "object", properties: { run_id: str("Run id"), summary: str("One-paragraph run summary") }, required: ["run_id"] },
    run: async (a, user) => {
      const r = await Run.load(String(a.run_id), user);
      if (!r) throw new Error("Run not found");
      if (r.eventId) for (const [k, v] of Object.entries(outputs(r.eventId))) await r.output(k.replace(/_/g, " ").replace(/^[a-z]/, (c) => c.toUpperCase()).replace(/ (pdf|docx|xlsx|csv|ics)$/, " (.$1)"), v.replace(appUrl(), ""), k.split("_").pop() ?? "page");
      await r.finish({ summary: a.summary ?? "", event_id: r.eventId });
      return { done: true, trace_url: `${appUrl()}/runs/${r.id}` };
    },
  },
];

/** Every event-scoped tool checks the caller is on that event's team. */
export function findTool(name: string): Tool | undefined {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return undefined;
  return {
    ...tool,
    run: async (a: Args, u: User) => {
      if (a.event_id) await assertMember(u, String(a.event_id));
      return tool.run(a, u);
    },
  };
}
