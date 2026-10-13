import "server-only";
import { id, insert, one, query, update } from "./db";
import { appUrl, fmtDate, fmtRM } from "./appurl";
import { emailShell } from "./integrations/email";
import { gate, type GateResult } from "./actions";
import type { EventRow, Sponsor, SponsorStatus, User, Venue } from "./types";

/**
 * Sponsors: a static reference list for the in-app "Find sponsors" button
 * (WorkBuddy does the live web research and saves through save_sponsors),
 * the outreach email, and the shared status updates.
 */

type Ref = { company: string; industry: string; website: string; email: string; tags: string[]; ask: string; fit: string };

const TECH = ["ai", "tech", "data", "code", "coding", "software", "cloud", "cyber", "robot", "digital", "hackathon", "startup", "computing", "machine", "developer"];
const MONEY = ["finance", "fintech", "money", "invest", "career", "business", "entrepreneur", "startup", "bank"];
const FOOD = ["food", "festival", "fair", "night", "social", "culture", "music", "sports", "run", "games"];

/** Malaysian companies that often back student events. Contacts are placeholders WorkBuddy replaces after real research. */
export const REFERENCE_SPONSORS: Ref[] = [
  { company: "Maybank", industry: "Banking", website: "https://www.maybank2u.com.my", email: "campus@maybank.example", tags: [...MONEY, "general"], ask: "RM5,000", fit: "Runs graduate and campus engagement programmes" },
  { company: "CIMB Bank", industry: "Banking", website: "https://www.cimb.com.my", email: "youth@cimb.example", tags: [...MONEY, "general"], ask: "RM5,000", fit: "Backs youth and career events through CIMB Foundation" },
  { company: "Public Bank", industry: "Banking", website: "https://www.pbebank.com", email: "csr@publicbank.example", tags: [...MONEY], ask: "RM3,000", fit: "Student account campaigns on campus" },
  { company: "Touch 'n Go Digital", industry: "Fintech", website: "https://www.touchngo.com.my", email: "partnerships@tngdigital.example", tags: [...MONEY, ...TECH], ask: "RM3,000", fit: "Targets students for eWallet sign-ups" },
  { company: "Boost", industry: "Fintech", website: "https://www.myboost.com.my", email: "marketing@boost.example", tags: [...MONEY, ...TECH], ask: "RM2,000", fit: "Campus cashback campaigns" },
  { company: "Microsoft Malaysia", industry: "Technology", website: "https://www.microsoft.com/en-my", email: "students@microsoft-my.example", tags: [...TECH], ask: "RM4,000", fit: "Learn Student Ambassadors and AI skilling drives" },
  { company: "Google Malaysia", industry: "Technology", website: "https://about.google", email: "devrel@google-my.example", tags: [...TECH], ask: "RM4,000", fit: "Google Developer Student Clubs support" },
  { company: "AWS Malaysia", industry: "Cloud", website: "https://aws.amazon.com/malaysia", email: "educate@aws-my.example", tags: [...TECH], ask: "Cloud credits + RM2,000", fit: "AWS Educate and cloud credits for student builders" },
  { company: "Intel Malaysia", industry: "Semiconductors", website: "https://www.intel.com/content/www/my/en/homepage.html", email: "university@intel-my.example", tags: [...TECH], ask: "RM3,000", fit: "Penang and Kulim hiring, strong STEM outreach" },
  { company: "Huawei Malaysia", industry: "Technology", website: "https://www.huawei.com/my", email: "seeds@huawei-my.example", tags: [...TECH], ask: "RM3,000", fit: "Seeds for the Future and ICT talent programmes" },
  { company: "MDEC", industry: "Government agency", website: "https://mdec.my", email: "talent@mdec.example", tags: [...TECH, "startup"], ask: "RM5,000", fit: "Funds digital talent and AI literacy events" },
  { company: "Grab Malaysia", industry: "Super app", website: "https://www.grab.com/my", email: "campus@grab.example", tags: [...TECH, ...FOOD], ask: "GrabFood vouchers", fit: "Student promos and tech hiring" },
  { company: "CelcomDigi", industry: "Telco", website: "https://www.celcomdigi.com", email: "youth@celcomdigi.example", tags: [...TECH, "general"], ask: "RM3,000", fit: "Youth plans and digital inclusion programmes" },
  { company: "Maxis", industry: "Telco", website: "https://www.maxis.com.my", email: "community@maxis.example", tags: [...TECH, "general"], ask: "RM3,000", fit: "Campus Hotlink campaigns" },
  { company: "ZUS Coffee", industry: "F&B", website: "https://zuscoffee.com", email: "events@zus.example", tags: [...FOOD, "general"], ask: "Coffee for 150 pax", fit: "Frequent campus pop-ups" },
  { company: "Tealive", industry: "F&B", website: "https://www.tealive.com.my", email: "marketing@tealive.example", tags: [...FOOD, "general"], ask: "Drinks for 150 pax", fit: "Sponsors drinks at student events" },
  { company: "Marrybrown", industry: "F&B", website: "https://www.marrybrown.com", email: "community@marrybrown.example", tags: [...FOOD, "general"], ask: "Meal boxes", fit: "Local brand with student meal deals" },
  { company: "Gigi Coffee", industry: "F&B", website: "https://gigicoffee.com.my", email: "hello@gigicoffee.example", tags: [...FOOD, "general"], ask: "Coffee vouchers", fit: "Young brand, active on student campuses" },
];

const mix = ["Banking", "F&B"];

/** Score the reference list against the event topic and add the best ~6 the event does not have yet. */
export async function findSponsors(eventId: string, limit = 6) {
  const ev = await one<EventRow>("SELECT * FROM events WHERE id = $1", [eventId]);
  if (!ev) throw new Error("Event not found");
  const have = new Set((await query<{ company: string }>("SELECT company FROM sponsors WHERE event_id = $1", [eventId])).map((r) => r.company.toLowerCase()));
  const words = `${ev.title} ${ev.topic ?? ""}`.toLowerCase();
  const scored = REFERENCE_SPONSORS.filter((r) => !have.has(r.company.toLowerCase()))
    .map((r) => ({ r, score: r.tags.filter((t) => words.includes(t)).length + (r.tags.includes("general") ? 0.5 : 0) }))
    .sort((a, b) => b.score - a.score);
  const picks: Ref[] = [];
  // Always keep one bank and one F&B in the mix, then fill by fit.
  for (const ind of mix) {
    const hit = scored.find((s) => s.r.industry === ind);
    if (hit) picks.push(hit.r);
  }
  for (const s of scored) {
    if (picks.length >= limit) break;
    if (!picks.includes(s.r)) picks.push(s.r);
  }
  return saveSponsors(
    eventId,
    picks.slice(0, limit).map((r) => ({ company: r.company, industry: r.industry, website: r.website, contact_email: r.email, ask: r.ask, fit_reason: r.fit })),
    "reference",
  );
}

export type SponsorInput = { company: string; industry?: string | null; website?: string | null; contact_name?: string | null; contact_email?: string | null; ask?: string | null; fit_reason?: string | null };

/** Insert sponsors, skipping companies the event already has. */
export async function saveSponsors(eventId: string, rows: SponsorInput[], source = "workbuddy") {
  const have = new Set((await query<{ company: string }>("SELECT company FROM sponsors WHERE event_id = $1", [eventId])).map((r) => r.company.toLowerCase()));
  const out: Sponsor[] = [];
  for (const r of rows) {
    const company = String(r.company ?? "").trim();
    if (!company || have.has(company.toLowerCase())) continue;
    have.add(company.toLowerCase());
    out.push(
      await insert<Sponsor>("sponsors", {
        id: id("spn"),
        event_id: eventId,
        company,
        industry: r.industry?.trim() || null,
        website: r.website?.trim() || null,
        contact_name: r.contact_name?.trim() || null,
        contact_email: r.contact_email?.trim() || null,
        ask: r.ask?.trim() || null,
        fit_reason: r.fit_reason?.trim() || null,
        status: "found",
        source,
      }),
    );
  }
  return out;
}

// ------------------------------------------------------------------ email

export type SponsorDraft = { to: string; subject: string; body: string };

type Ctx = { ev: Pick<EventRow, "id" | "title" | "date" | "start_time" | "end_time" | "pax" | "topic">; venue: Pick<Venue, "name"> | null; society: string; sender: Pick<User, "name"> };

/** Plain-text draft the composer shows; paragraphs split on blank lines. */
export function sponsorDraft(sp: Pick<Sponsor, "company" | "contact_name" | "contact_email" | "ask" | "industry">, { ev, venue, society, sender }: Ctx): SponsorDraft {
  const hi = sp.contact_name ? `Hi ${sp.contact_name.split(" ")[0]},` : `Hello ${sp.company} team,`;
  const ask = sp.ask ? `We would love ${sp.company} to come on board as a sponsor with ${sp.ask}.` : `We would love ${sp.company} to come on board as a sponsor, in cash or in kind.`;
  const body = [
    hi,
    `I'm writing from the ${society} at Sunway University. We're organising ${ev.title} on ${fmtDate(ev.date)}, ${ev.start_time} to ${ev.end_time}${venue ? ` at ${venue.name}` : ""}, for around ${ev.pax} students${ev.topic ? ` interested in ${ev.topic}` : ""}.`,
    ask,
    `In return, ${sp.company} gets: your logo on the poster, slides and event page; a shout-out on stage and on our Instagram and LinkedIn; a table or booth on the day; and a mention in our post-event report with attendance numbers.`,
    `Our event proposal is attached with the full programme and budget. Happy to jump on a short call.`,
    `Warm regards,\n${sender.name}\n${society}`,
  ].join("\n\n");
  return { to: sp.contact_email ?? "", subject: `Sponsorship invitation: ${ev.title} (${fmtDate(ev.date)})`, body };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Wrap the plain-text body in the email shell with the proposal attachment. */
export function sponsorHtml(body: string, eventId: string) {
  const paras = body
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const pdf = `${appUrl()}/api/outputs/${eventId}/proposal.pdf`;
  const attach = `<p style="margin-top:18px;padding:10px 12px;border:1px solid #d9d9e0;border-radius:8px;font-size:13px">Attached: <a href="${pdf}">Event proposal (PDF)</a></p>`;
  return emailShell("Sponsorship invitation", paras + attach);
}

export async function sponsorContext(eventId: string, sender: Pick<User, "name">): Promise<Ctx> {
  const ev = await one<EventRow>("SELECT * FROM events WHERE id = $1", [eventId]);
  if (!ev) throw new Error("Event not found");
  const venue = ev.venue_id ? await one<Venue>("SELECT * FROM venues WHERE id = $1", [ev.venue_id]) : null;
  const soc = await one<{ name: string }>("SELECT name FROM societies WHERE id = $1", [ev.society_id]);
  return { ev, venue, society: soc?.name ?? "society", sender };
}

/** One gated send. Committee members get queued for the Programmes Director. */
export async function sendSponsorOutreach(user: User, sp: Sponsor, draft: SponsorDraft, runId: string | null = null) {
  const to = draft.to.trim() || sp.contact_email || `partnerships@${sp.company.toLowerCase().replace(/[^a-z0-9]+/g, "")}.example`;
  return gate(user, "email.sponsor", `Sponsorship email to ${sp.company}`, { sponsor_id: sp.id, event_id: sp.event_id, to, subject: draft.subject, html: sponsorHtml(draft.body, sp.event_id) }, { eventId: sp.event_id, runId });
}

/** Send the template to every found sponsor, or just the given ids. */
export async function outreachSponsors(user: User, eventId: string, ids: string[] | null, runId: string | null) {
  const ctx = await sponsorContext(eventId, user);
  const all = await query<Sponsor>("SELECT * FROM sponsors WHERE event_id = $1 ORDER BY created_at", [eventId]);
  const list = ids?.length ? all.filter((s) => ids.includes(s.id)) : all.filter((s) => s.status === "found");
  const results: { sponsor: string; status: GateResult["status"]; detail: string }[] = [];
  for (const sp of list) {
    const r = await sendSponsorOutreach(user, sp, sponsorDraft(sp, ctx), runId);
    results.push({ sponsor: sp.company, status: r.status, detail: r.status === "blocked" ? r.reason : r.status === "executed" ? `sent → ${String(r.result.intended_to ?? r.result.to)}, proposal attached` : r.error });
  }
  return results;
}

// ------------------------------------------------------------------ status

export type Decision = { status: SponsorStatus; offer_type?: "cash" | "in_kind" | null; offer_amount?: number | null; offer_note?: string | null; notes?: string | null };

/** Move a sponsor along the funnel, stamping the matching time. */
export async function recordSponsor(sponsorId: string, d: Decision) {
  const sp = await one<Sponsor>("SELECT * FROM sponsors WHERE id = $1", [sponsorId]);
  if (!sp) throw new Error("Sponsor not found");
  const now = new Date();
  const patch: Record<string, unknown> = { status: d.status };
  if (d.status !== "found" && !sp.contacted_at) patch.contacted_at = now;
  if (["opened", "replied", "accepted", "declined"].includes(d.status) && !sp.opened_at) patch.opened_at = now;
  if (["replied", "accepted", "declined"].includes(d.status) && !sp.replied_at) patch.replied_at = now;
  if (d.status === "accepted" || d.status === "declined") patch.decided_at = now;
  if (d.status === "accepted") {
    const type = d.offer_type === "in_kind" ? "in_kind" : "cash";
    const amount = d.offer_amount != null && Number.isFinite(Number(d.offer_amount)) ? Number(d.offer_amount) : null;
    if (type === "cash" && !(amount && amount > 0)) throw new Error("Cash offers need an amount");
    if (type === "in_kind" && !d.offer_note?.trim()) throw new Error("Say what they are giving");
    Object.assign(patch, { offer_type: type, offer_amount: amount, offer_note: d.offer_note?.trim() || null });
  }
  if (d.notes !== undefined) patch.notes = d.notes?.trim() || null;
  return (await update<Sponsor>("sponsors", sp.id, patch))!;
}

/** "RM8,000 cash" or "Coffee for 150 pax (in-kind)". */
export function offerLabel(sp: Pick<Sponsor, "offer_type" | "offer_amount" | "offer_note">) {
  if (sp.offer_type === "in_kind") return `${sp.offer_note ?? (sp.offer_amount ? fmtRM(sp.offer_amount) : "Goods")} (in-kind)`;
  return `${fmtRM(sp.offer_amount ?? 0)} cash`;
}

// ------------------------------------------------------------------ demo

/** Seed ~10 sponsors at every stage. Does nothing if the event already has sponsors. */
export async function ensureSponsorDemo(eventId: string) {
  const n = await one<{ n: number }>("SELECT count(*)::int AS n FROM sponsors WHERE event_id = $1", [eventId]);
  if (!n || n.n > 0) return;
  const ev = await one<EventRow>("SELECT * FROM events WHERE id = $1", [eventId]);
  if (!ev) return;
  const day = 86_400_000;
  const ago = (d: number) => new Date(Date.now() - d * day);
  type Seed = SponsorInput & { status: SponsorStatus; sent?: number; open?: number; reply?: number; decide?: number; offer_type?: "cash" | "in_kind"; offer_amount?: number; offer_note?: string; notes?: string };
  const seeds: Seed[] = [
    { company: "Selat Bank Berhad", industry: "Banking", website: "https://selatbank.example", contact_name: "Aisyah Rahman", contact_email: "aisyah.rahman@selatbank.example", ask: "RM5,000", fit_reason: "Graduate hiring push on campus", status: "accepted", sent: 12, open: 11, reply: 9, decide: 6, offer_type: "cash", offer_amount: 5000, offer_note: "Title sponsor, logo first on the poster", notes: "Wants 5 minutes on stage for their graduate programme" },
    { company: "Nusantara AI Labs", industry: "Technology", website: "https://nusantara-ai.example", contact_name: "Daniel Lim", contact_email: "daniel@nusantara-ai.example", ask: "RM3,000", fit_reason: "Local AI startup hiring interns", status: "accepted", sent: 12, open: 12, reply: 8, decide: 5, offer_type: "cash", offer_amount: 3000, offer_note: "Also judging the Q&A prize", notes: "Bring an intern sign-up QR" },
    { company: "Kopi Kampung Co.", industry: "F&B", website: "https://kopikampung.example", contact_name: "Farah Iskandar", contact_email: "farah@kopikampung.example", ask: "Coffee for 150 pax", fit_reason: "Campus pop-up coffee brand", status: "accepted", sent: 10, open: 9, reply: 7, decide: 4, offer_type: "in_kind", offer_amount: 1200, offer_note: "Coffee and pastries for 150 pax", notes: "Needs a power point and one table near the entrance" },
    { company: "Lintas Telco", industry: "Telco", website: "https://lintastelco.example", contact_name: "Kevin Tan", contact_email: "kevin.tan@lintastelco.example", ask: "RM3,000", fit_reason: "Youth data plan campaign", status: "declined", sent: 12, open: 10, reply: 6, decide: 6, notes: "Budget for this quarter already used" },
    { company: "Teras Fintech", industry: "Fintech", website: "https://terasfintech.example", contact_name: "Nurul Huda", contact_email: "nurul@terasfintech.example", ask: "RM2,000", fit_reason: "eWallet student sign-ups", status: "declined", sent: 10, open: 8, reply: 3, decide: 3, notes: "Only sponsors events above 300 pax" },
    { company: "Merdeka Cloud", industry: "Cloud", website: "https://merdekacloud.example", contact_name: "Raj Kumar", contact_email: "raj@merdekacloud.example", ask: "Cloud credits + RM2,000", fit_reason: "Cloud credits for student builders", status: "replied", sent: 8, open: 7, reply: 2, notes: "Asked for last year's attendance numbers" },
    { company: "Petaling Robotics", industry: "Engineering", website: "https://petalingrobotics.example", contact_name: "Mei Ling Chong", contact_email: "meiling@petalingrobotics.example", ask: "RM2,000", fit_reason: "Robotics demos and hiring", status: "opened", sent: 6, open: 4 },
    { company: "Rimba Energy", industry: "Energy", website: "https://rimbaenergy.example", contact_email: "csr@rimbaenergy.example", ask: "RM4,000", fit_reason: "STEM scholarship outreach", status: "opened", sent: 6, open: 2 },
    { company: "Mamak Express", industry: "F&B", website: "https://mamakexpress.example", contact_name: "Hafiz Osman", contact_email: "hafiz@mamakexpress.example", ask: "Meal boxes for crew", fit_reason: "Late-night student favourite", status: "contacted", sent: 3 },
    { company: "Pena Books", industry: "Retail", website: "https://penabooks.example", contact_email: "events@penabooks.example", ask: "Book prizes", fit_reason: "Prizes for best questions", status: "found" },
  ];
  const ctx = await sponsorContext(eventId, { name: "Programmes Director" });
  const sender = await one<{ id: string; name: string }>("SELECT id, name FROM society_members WHERE society_id = $1 AND role = 'director' ORDER BY name LIMIT 1", [ev.society_id]);
  if (sender) ctx.sender = sender;
  for (const s of seeds) {
    const row = await insert<Sponsor>("sponsors", {
      id: id("spn"),
      event_id: eventId,
      company: s.company,
      industry: s.industry,
      website: s.website,
      contact_name: s.contact_name ?? null,
      contact_email: s.contact_email,
      ask: s.ask,
      fit_reason: s.fit_reason,
      status: s.status,
      source: "workbuddy",
      offer_type: s.offer_type ?? null,
      offer_amount: s.offer_amount ?? null,
      offer_note: s.offer_note ?? null,
      notes: s.notes ?? null,
      contacted_at: s.sent != null ? ago(s.sent) : null,
      opened_at: s.open != null ? ago(s.open) : null,
      replied_at: s.reply != null ? ago(s.reply) : null,
      decided_at: s.decide != null ? ago(s.decide) : null,
      created_at: ago((s.sent ?? 1) + 1),
    });
    if (s.sent == null) continue;
    // The outreach email, so it shows in the event Inbox.
    const draft = sponsorDraft(row, ctx);
    await insert("emails", {
      id: id("eml"),
      event_id: eventId,
      kind: "sponsor_outreach",
      to_addr: draft.to,
      intended_to: draft.to,
      subject: draft.subject,
      body: sponsorHtml(draft.body, eventId),
      status: "sent",
      provider: null,
      related_id: row.id,
      sent_by: sender?.id ?? null,
      sent_at: ago(s.sent),
      created_at: ago(s.sent),
    });
  }
}
