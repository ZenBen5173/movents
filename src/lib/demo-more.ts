import "server-only";
import { id, insert, one, query, update } from "./db";
import { decideApproval, facultyDecision } from "./actions";
import { Run } from "./agent/run";
import { execute } from "./agent/pipelines";
import { generateOpsPack, simulateEventDay, syncRsvps } from "./agent/tools";
import { generateKit } from "./marketing";
import { today } from "./appurl";
import { SUNWAY_SOP } from "./sop-default";
import { ensureSponsorDemo } from "./sponsors";
import { ensureMeetingDemo } from "./meetings";
import type { ApprovalRequest, Sop, User } from "./types";

/**
 * More of the world around the AI Talk: other universities with their own
 * SOPs, venues and vendors, and the society's other events at every stage,
 * from just briefed to closed with a post-event report. Idempotent.
 */

// ------------------------------------------------------------------ universities

type Uni = { id: string; name: string; short: string; office: string; email: string; venueWeeks: number; proposalWeeks: number; threshold: number; society: string; venues: [string, number, string[], string, string | null][]; vendors: [string, string, number, string, number, string][] };

const HALL = "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1000";
const THEATRE = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/BI_Norwegian_Business_School_Auditorium_7DM29184.jpg/960px-BI_Norwegian_Business_School_Auditorium_7DM29184.jpg";
const BALLROOM = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1000";
const OLDHALL = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Sunway_University_Hall.jpg/960px-Sunway_University_Hall.jpg";
const TERRACE = "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1000";

export const UNIVERSITIES: Uni[] = [
  {
    id: "uni_taylors",
    name: "Taylor's University",
    short: "Taylor's",
    office: "Student Life Office",
    email: "studentlife@taylors.example",
    venueWeeks: 5,
    proposalWeeks: 4,
    threshold: 1500,
    society: "Taylor's Computing Club",
    venues: [
      ["Grand Hall", 800, ["theatre", "banquet"], "Block C, Level 1", BALLROOM],
      ["Lecture Theatre 3", 220, ["theatre"], "Block E", THEATRE],
      ["Lakeside Lawn", 300, ["cocktail"], "Lakeside campus", TERRACE],
      ["Seminar Room 4", 60, ["classroom", "workshop clusters"], "Block D, Level 3", null],
    ],
    vendors: [
      ["food", "Lakeside Bistro Catering", 22, "pax", 4.4, "Halal buffet for campus events, minimum 40 pax."],
      ["tshirt", "Subang Print Hub", 11.5, "piece", 4.2, "Cotton tees with one colour front print, 50 pcs minimum."],
      ["lanyard", "BadgeWorks KL", 2.6, "piece", 4.0, "15mm polyester lanyards with full colour print."],
    ],
  },
  {
    id: "uni_monash",
    name: "Monash University Malaysia",
    short: "Monash",
    office: "Student Engagement (MUSA)",
    email: "engagement@monash.example",
    venueWeeks: 6,
    proposalWeeks: 5,
    threshold: 1000,
    society: "Monash Tech Society",
    venues: [
      ["Monash Auditorium", 450, ["theatre"], "Building 2, Level 1", HALL],
      ["Building 9 Lecture Theatre", 180, ["theatre"], "Building 9", THEATRE],
      ["Student Lounge", 90, ["cocktail", "workshop clusters"], "Building 3", null],
    ],
    vendors: [
      ["food", "Sunset Halal Kitchen", 18, "pax", 4.3, "Nasi lemak and bento sets, JAKIM certified."],
      ["tshirt", "Bandar Sunway Tees", 12, "piece", 4.1, "Dri-fit crew shirts, 2 week lead time."],
    ],
  },
  {
    id: "uni_um",
    name: "Universiti Malaya",
    short: "UM",
    office: "Student Affairs Division (HEP)",
    email: "hep@um.example",
    venueWeeks: 8,
    proposalWeeks: 6,
    threshold: 800,
    society: "UM Data Science Club",
    venues: [
      ["Dewan Tunku Canselor", 1500, ["theatre", "banquet"], "Main campus", OLDHALL],
      ["Dewan Kuliah A", 250, ["theatre"], "Faculty of Computer Science", THEATRE],
      ["Bilik Seminar 2", 70, ["classroom"], "Faculty of Computer Science", null],
    ],
    vendors: [
      ["food", "Kafe Siswa Catering", 15, "pax", 4.0, "Campus caterer, nasi campur and kuih sets."],
      ["tshirt", "Pantai Prints", 10, "piece", 3.9, "Budget cotton tees, silkscreen."],
      ["cardholder", "Kerja Tangan Supplies", 0.9, "piece", 4.1, "PVC holders with clip."],
    ],
  },
  {
    id: "uni_apu",
    name: "Asia Pacific University (APU)",
    short: "APU",
    office: "Student Affairs",
    email: "studentaffairs@apu.example",
    venueWeeks: 4,
    proposalWeeks: 3,
    threshold: 1200,
    society: "APU Cyber Security Club",
    venues: [
      ["APU Auditorium", 400, ["theatre"], "Level 3, APU campus", HALL],
      ["Atrium", 200, ["cocktail"], "Ground floor", TERRACE],
      ["Tech Lab 6", 50, ["workshop clusters"], "Level 6", null],
    ],
    vendors: [
      ["food", "TPM Catering Co.", 17, "pax", 4.2, "Technology Park caterer, buffet and boxed meals."],
      ["lanyard", "LanyardPro MY", 2.1, "piece", 4.3, "20mm sublimation lanyards, 100 pcs minimum."],
    ],
  },
  {
    id: "uni_ucsi",
    name: "UCSI University",
    short: "UCSI",
    office: "Student Affairs & Alumni",
    email: "saa@ucsi.example",
    venueWeeks: 5,
    proposalWeeks: 4,
    threshold: 1000,
    society: "UCSI Innovation Society",
    venues: [
      ["UCSI Grand Hall", 600, ["theatre", "banquet"], "Block G", BALLROOM],
      ["Lecture Hall 1", 200, ["theatre"], "Block C", THEATRE],
    ],
    vendors: [
      ["food", "Cheras Bento House", 16, "pax", 4.1, "Bento and finger food, halal certified."],
      ["tshirt", "KL Merch Lab", 13, "piece", 4.4, "Premium cotton, embroidery available."],
    ],
  },
];

function sopFor(u: Uni): Sop {
  const swap = (s: string) => s.replace(/Student LIFE \(SLE\)/g, u.office).replace(/\bSLE\b/g, u.office);
  return {
    ...SUNWAY_SOP,
    version: "2026.1-seed",
    required_sections: SUNWAY_SOP.required_sections.map((r) => ({ ...r, hint: swap(r.hint) })),
    lead_times: SUNWAY_SOP.lead_times.map((l) => ({
      ...l,
      label: swap(l.label),
      weeks_before: l.key === "venue_booking" ? u.venueWeeks : l.key === "proposal_submission" ? u.proposalWeeks : l.weeks_before,
    })),
    approval_chain: SUNWAY_SOP.approval_chain.map((a) => ({ ...a, label: swap(a.label) })),
    budget_rules: { ...SUNWAY_SOP.budget_rules, president_threshold: u.threshold },
    rules: SUNWAY_SOP.rules.map(swap),
  };
}

function sopText(u: Uni, sop: Sop) {
  return `# ${u.name}, Clubs & Societies Event SOP (seed template)

Clubs run under ${u.office} (${u.email}). Replace this seed with the official SOP by uploading it here.

## 1. Approval chain
${sop.approval_chain.map((a) => `${a.step}. ${a.label}`).join("\n")}

## 2. Lead times
${sop.lead_times.map((l) => `- ${l.label}: at least ${l.weeks_before} weeks before`).join("\n")}

## 3. Proposal format
${sop.required_sections.map((s, i) => `${i + 1}. ${s.title}: ${s.hint}`).join("\n")}

## 4. Budget
- Include a ${sop.budget_rules.contingency_pct}% contingency inside the approved cap.
- Any spend above RM${sop.budget_rules.president_threshold} needs President/VP approval.

## 5. Rules
${sop.rules.map((r) => `- ${r}`).join("\n")}
`;
}

async function ensureUniversities() {
  for (const u of UNIVERSITIES) {
    if (await one("SELECT 1 FROM universities WHERE id = $1", [u.id])) continue;
    const sop = sopFor(u);
    await insert("universities", { id: u.id, name: u.name, short_name: u.short, sop });
    await insert("sop_documents", { id: `sop_${u.id}`, university_id: u.id, title: "Clubs & Societies Event SOP (seed template)", kind: "sop", content: sopText(u, sop), uploaded_by: null });
    await insert("societies", { id: `soc_${u.id.slice(4)}`, university_id: u.id, name: u.society });
    for (const [i, [name, capacity, setup_styles, location, photo]] of u.venues.entries()) {
      await insert("venues", { id: `ven_${u.id.slice(4)}_${i}`, university_id: u.id, name, capacity, setup_styles, av: capacity > 150 ? ["projector", "PA system", "wireless mics"] : ["TV screen", "portable speaker"], cost: capacity >= 600 ? 1200 : 0, booking_lead_weeks: Math.max(2, u.venueWeeks - (capacity < 100 ? 3 : 0)), location, photo_url: photo });
    }
    for (const [category, name, unit_price, unit, rating, snippet] of u.vendors) {
      await insert("vendors", { id: id("ven"), event_id: null, university_id: u.id, category, name, url: null, unit, unit_price, rating, snippet, source: "registry", contract_status: "none" });
    }
    // Other clubs' events, so each venue calendar is a real room.
    const soc = `soc_${u.id.slice(4)}`;
    const shows: [string, string, string, string, number][] = [
      [`${u.short} Tech Summit`, "2026-10-24", "09:00", "17:00", 0],
      [`${u.short} Hack Night`, "2026-11-07", "18:00", "23:00", 1],
      [`${u.short} Career Talk`, "2026-11-19", "14:00", "16:00", 1],
    ];
    for (const [title, date, start_time, end_time, v] of shows) {
      await insert("events", { id: id("evt"), society_id: soc, title, topic: "Technology", date, start_time, end_time, pax: 120, budget_cap: 3000, approved_budget: 3000, status: "approved", venue_id: `ven_${u.id.slice(4)}_${Math.min(v, u.venues.length - 1)}`, setup_style: "theatre", flags: [] });
    }
  }
}

// ------------------------------------------------------------------ the society's other events

const PEOPLE = [
  ["Farhan Aziz", "Head of Security Engineering, Petronas Digital", "men/75"],
  ["Mei Ling Ho", "Senior Data Scientist, Grab", "women/21"],
  ["Ravi Shankar", "CTO, Kuala Lumpur Fintech Hub", "men/52"],
  ["Nurul Huda", "UX Lead, AirAsia MOVE", "women/57"],
  ["Daniel Wong", "Robotics Engineer, Intel Penang", "men/11"],
  ["Siti Rahim", "Talent Partner, Shopee", "women/90"],
  ["Kevin Tan", "Founder, Nusa Robotics", "men/64"],
  ["Ananya Pillai", "Cloud Architect, AWS Malaysia", "women/33"],
  ["Haziq Ismail", "Game Designer, Lemon Sky Studios", "men/86"],
  ["Grace Lim", "Product Manager, Carsome", "women/12"],
];

type Plan = { prompt: string; title: string; by: string; progress: number; past?: boolean; report?: string; rsvps?: boolean };

const PLANS: Plan[] = [
  { prompt: "Plan a 120-pax Robotics Showcase at Sunway on 13 Oct 2026, 2pm-6pm, budget RM2,500, with Jason and Wei Ling.", title: "Robotics Showcase", by: "usr_dir_log", progress: 0.9, rsvps: true },
  { prompt: "Plan a 200-pax hackathon at Sunway on 22 Nov 2026, 9am-9pm, budget RM5,000, with Jason, Arjun and Wei Ling.", title: "Hackathon 2026", by: "usr_dir_prog", progress: 0.35, rsvps: true },
  { prompt: "Plan a 300-pax career fair at Sunway on 29 Nov 2026, 10am-4pm, budget RM8,000, with Priya and Wei Ling.", title: "Career Fair", by: "usr_vp", progress: 0.15 },
  { prompt: "Plan a 250-pax cultural night at Sunway on 6 Dec 2026, 7pm-10pm, budget RM6,000, with Arjun.", title: "Cultural Night", by: "usr_committee2", progress: 0.03 },
  { prompt: "Plan a 100-pax freshers tech night at Sunway on 26 Sep 2026, 6pm-9pm, budget RM1,800, with Priya and Arjun.", title: "Freshers Tech Night", by: "usr_committee", progress: 1, past: true, report: "Generate the post-event report for the Freshers Tech Night." },
  { prompt: "Plan a 80-pax cybersecurity workshop at Sunway on 22 Aug 2026, 2pm-5pm, budget RM1,500, with Jason.", title: "Cybersecurity CTF", by: "usr_dir_log", progress: 1, past: true, report: "Generate the post-event report for the Cybersecurity CTF." },
];

async function approveAll(eventId: string, users: Record<string, User>) {
  const pending = await query<ApprovalRequest>("SELECT * FROM approval_requests WHERE event_id = $1 AND status = 'pending' ORDER BY created_at", [eventId]);
  for (const a of pending) {
    const approver = a.approver_role === "director" ? (a.approver_department === "Logistics" ? users.usr_dir_log : users.usr_dir_prog) : users.usr_president;
    if (approver) await decideApproval(approver, a.id, "approve").catch(() => null);
  }
  const faculty = await one<ApprovalRequest>("SELECT * FROM approval_requests WHERE event_id = $1 AND action_type = 'email.faculty' AND status = 'awaiting_faculty'", [eventId]);
  if (faculty) await facultyDecision(faculty.id, "approve", "Approved.").catch(() => null);
}

async function ensureEvents() {
  const users = Object.fromEntries((await query<User>("SELECT * FROM users WHERE society_id = 'soc_aitech'")).map((u) => [u.id, u]));
  let pool = 0;
  for (const p of PLANS) {
    if (await one("SELECT 1 FROM events WHERE society_id = 'soc_aitech' AND title = $1", [p.title])) continue;
    const by = users[p.by];
    if (!by) continue;
    const run = await Run.start(by, p.prompt, "plan", "workbuddy");
    await execute(run, "plan");
    const ev = await one<{ id: string }>("SELECT event_id AS id FROM agent_runs WHERE id = $1", [run.id]);
    if (!ev?.id) continue;
    await update("events", ev.id, { title: p.title });

    // Real looking speakers.
    const sps = await query<{ id: string; name: string }>("SELECT id, name FROM speakers WHERE event_id = $1 ORDER BY name", [ev.id]);
    for (const sp of sps) {
      const [name, headline, pic] = PEOPLE[pool++ % PEOPLE.length];
      await query("UPDATE runsheet_items SET activity = replace(activity, $2, $3) WHERE event_id = $1", [ev.id, sp.name, name]);
      await query("UPDATE approval_requests SET title = replace(title, $2, $3) WHERE event_id = $1", [ev.id, sp.name, name]);
      await query("UPDATE emails SET subject = replace(subject, $2, $3), body = replace(body, $2, $3), intended_to = replace(coalesce(intended_to, ''), $2, $3) WHERE event_id = $1", [ev.id, sp.name, name]);
      await query("UPDATE creatives SET caption = replace(caption, $2, $3) WHERE event_id = $1", [ev.id, sp.name, name]);
      await update("speakers", sp.id, { name, headline, photo_url: `https://randomuser.me/api/portraits/${pic}.jpg`, email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@speaker.example`, talk_title: null, source: "workbuddy", status: p.progress > 0.5 ? "confirmed" : p.progress > 0.1 ? "contacted" : "found" });
    }

    if (p.progress >= 0.15) await approveAll(ev.id, users);

    // Progress: earliest tasks first.
    const tasks = await query<{ id: string; risk_id: string | null }>("SELECT id, risk_id FROM tasks WHERE event_id = $1 ORDER BY due_date, sort", [ev.id]);
    const n = Math.round(tasks.length * p.progress);
    for (const [i, t] of tasks.entries()) {
      if (i < n) {
        await update("tasks", t.id, { status: "done" });
        if (t.risk_id) await update("risks", t.risk_id, { status: "closed" });
      } else if (i < n + 2 && p.progress < 1) await update("tasks", t.id, { status: "doing" });
    }

    if (p.rsvps || p.past) {
      await syncRsvps(ev.id, "luma").catch(() => null);
      await syncRsvps(ev.id, "meetup").catch(() => null);
    }
    if (p.progress >= 0.9) {
      await query("UPDATE vendors SET contract_status = 'signed', deposit_status = 'paid', deposit_amount = GREATEST(50, round(coalesce(quote, 0) * 0.3)) WHERE event_id = $1 AND selected = true", [ev.id]);
      await query("UPDATE creatives SET status = 'posted', posted_url = 'https://www.instagram.com/' WHERE event_id = $1", [ev.id]);
      await query("UPDATE promo_items SET status = 'done' WHERE event_id = $1", [ev.id]);
    }

    // Closed out: the agent writes the post-event report.
    if (p.report) {
      const rep = await Run.start(by, p.report, "report", "workbuddy");
      await execute(rep, "report");
      await update("events", ev.id, { status: "completed" });
    }
  }
}

/**
 * Every project gets the full working set (sponsors, meetings, run sheet,
 * marketing kit, mail), shaped to its stage: just started, mid planning,
 * days away, or finished. Registration may stay empty for early events.
 */
async function ensureProjectExtras() {
  const events = await query<{ id: string; title: string; date: string; status: string }>("SELECT id, title, date, status FROM events WHERE society_id = 'soc_aitech' ORDER BY date");
  const now = today();
  for (const ev of events) {
    const fresh = !(await one("SELECT 1 FROM sponsors WHERE event_id = $1 LIMIT 1", [ev.id]));
    await ensureSponsorDemo(ev.id);
    await ensureMeetingDemo(ev.id);
    const done = await one<{ d: number; n: number }>("SELECT count(*) FILTER (WHERE status = 'done')::int AS d, count(*)::int AS n FROM tasks WHERE event_id = $1", [ev.id]);
    const progress = done && done.n ? done.d / done.n : 0;
    const past = ev.date < now;

    if (fresh && ev.title !== "AI Talk @ Sunway") {
      if (past) {
        // Finished: every sponsor has an answer.
        await query("UPDATE sponsors SET status = 'declined', decided_at = coalesce(decided_at, replied_at, opened_at, contacted_at, now()) WHERE event_id = $1 AND status IN ('found','contacted','opened')", [ev.id]);
        await query("UPDATE sponsors SET status = 'accepted', offer_type = 'cash', offer_amount = 1500, offer_note = 'RM1,500 cash', decided_at = coalesce(decided_at, now()) WHERE event_id = $1 AND status = 'replied'", [ev.id]);
      } else if (progress < 0.2) {
        // Early: outreach just started, no deals yet.
        await query("UPDATE sponsors SET status = CASE WHEN status IN ('accepted','declined') THEN 'replied' WHEN status = 'replied' THEN 'opened' ELSE status END, offer_type = NULL, offer_amount = NULL, offer_note = NULL, decided_at = NULL WHERE event_id = $1", [ev.id]);
        await query("UPDATE sponsors SET status = 'accepted', offer_type = 'in_kind', offer_amount = 800, offer_note = 'Snacks and drinks for the crew', decided_at = now() WHERE id = (SELECT id FROM sponsors WHERE event_id = $1 AND status = 'replied' ORDER BY company LIMIT 1)", [ev.id]);
      }
    }

    // Meetings belong before the event (plus a debrief after a finished one).
    const ms = await query<{ id: string; starts_at: string }>("SELECT id, starts_at FROM meetings WHERE event_id = $1 ORDER BY starts_at", [ev.id]);
    const evDay = Date.parse(`${ev.date}T00:00:00Z`);
    if (past) {
      for (const [i, m] of ms.entries()) {
        const t = new Date(m.starts_at);
        const shifted = new Date(evDay - (ms.length - i) * 7 * 86_400_000 + (t.getUTCHours() * 3600 + t.getUTCMinutes() * 60) * 1000);
        await query("UPDATE meetings SET starts_at = $2, status = 'done' WHERE id = $1", [m.id, shifted.toISOString()]);
      }
    } else {
      for (const m of ms) if (Date.parse(m.starts_at) > evDay) await query("DELETE FROM meetings WHERE id = $1", [m.id]);
    }

    // Older seeded events never ran the agent: give them the ops pack, kit, mail and guests.
    if (!(await one("SELECT 1 FROM runsheet_items WHERE event_id = $1 LIMIT 1", [ev.id]))) await generateOpsPack(ev.id).catch(() => null);
    if (!(await one("SELECT 1 FROM creatives WHERE event_id = $1 LIMIT 1", [ev.id]))) {
      await generateKit(ev.id, { withImages: false }).catch(() => null);
      if (past) await query("UPDATE creatives SET status = 'posted', posted_url = 'https://www.instagram.com/' WHERE event_id = $1", [ev.id]);
    }
    if (!(await one("SELECT 1 FROM emails WHERE event_id = $1 LIMIT 1", [ev.id]))) {
      const spk = await query<{ id: string; name: string; email: string | null }>("SELECT id, name, email FROM speakers WHERE event_id = $1 LIMIT 2", [ev.id]);
      const mails: [string, string, string, string, string | null][] = [
        ...spk.map((s) => ["speaker_outreach", s.email ?? "speaker@speaker.example", `Speaking invitation: ${ev.title}`, `<p>Hi ${s.name.split(" ")[0]},</p><p>We would love you to speak at <b>${ev.title}</b>.</p>`, s.id] as [string, string, string, string, string | null]),
        ["vendor_quote", "sales@food-supplier.example", `Quotation request: ${ev.title}`, `<p>Hello,</p><p>Could you send a written quotation for catering at <b>${ev.title}</b>?</p>`, null],
        ["faculty_submission", "farah.advisor@movents.test", `Proposal for approval: ${ev.title}`, `<p>Dear Dr. Farah,</p><p>The proposal for <b>${ev.title}</b> is attached for your approval.</p>`, null],
      ];
      for (const [kind, to, subject, body, related] of mails) {
        await insert("emails", { id: id("eml"), event_id: ev.id, kind, to_addr: to, subject, body, status: "sent", provider: "demo", related_id: related, sent_by: "usr_committee", sent_at: new Date(Date.parse(`${ev.date}T00:00:00Z`) - 20 * 86_400_000) });
      }
    }
    if (past && !(await one("SELECT 1 FROM rsvps WHERE event_id = $1 LIMIT 1", [ev.id]))) await simulateEventDay(ev.id).catch(() => null);
    if (past || progress >= 0.3) {
      // Ran or running publicly: both ticket pages are live.
      await query("UPDATE events SET luma = coalesce(luma, jsonb_build_object('url', 'https://lu.ma/' || id, 'mode', 'mock', 'synced_at', now())), meetup = coalesce(meetup, jsonb_build_object('url', 'https://www.meetup.com/sunway-ai-tech/events/' || id, 'mode', 'mock', 'synced_at', now())) WHERE id = $1", [ev.id]);
    }
  }
}

let running: Promise<void> | null = null;

export function ensureMore() {
  if (!running)
    running = (async () => {
      const prev = process.env.AGENT_STEP_DELAY_MS;
      process.env.AGENT_STEP_DELAY_MS = "0";
      try {
        await ensureUniversities();
        await ensureEvents();
        await ensureProjectExtras();
      } finally {
        process.env.AGENT_STEP_DELAY_MS = prev ?? "";
      }
    })().catch((e) => {
      running = null;
      console.error("demo extras failed", e);
    });
  return running;
}

export function resetMoreState() {
  running = null;
}
