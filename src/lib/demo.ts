import "server-only";
import { id, insert, one, query, update } from "./db";
import { decideApproval, facultyDecision, gate } from "./actions";
import { Run } from "./agent/run";
import { execute } from "./agent/pipelines";
import { publishEvent, syncRsvps } from "./agent/tools";
import { ensureMore, resetMoreState } from "./demo-more";
import type { ApprovalRequest, User } from "./types";

/**
 * Demo state: the AI Talk already planned by the agent and about halfway
 * through — speakers replying, vendors signed, people registered, most
 * approvals through — so the app looks like it is in use. Runs once.
 */

const PROMPT = "Plan a 150-pax AI talk at Sunway on 15 Nov, budget RM3,000, with Priya, Jason and Arjun. Use Mix Mix Catering for food.";

// Fictional people with stock portraits (randomuser.me) — not real profiles.
const SPEAKERS = [
  {
    name: "Dr. Aisha Kamal",
    headline: "Principal ML Scientist, Nusantara AI Labs",
    email: "aisha.kamal@nusantara-ai.example",
    phone: "+60 12-778 2041",
    photo_url: "https://randomuser.me/api/portraits/women/44.jpg",
    bio: "Leads applied machine learning research for Southeast Asian languages. PhD in Computer Science, 10 years building speech and translation models used by millions of users across the region.",
    talk_title: "Building AI for Malaysian languages",
    status: "confirmed",
  },
  {
    name: "Jonathan Lee",
    headline: "Founder and CEO, Petaling Robotics",
    email: "jonathan@petalingrobotics.example",
    phone: "+60 17-305 6612",
    photo_url: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "Started Petaling Robotics after graduating in mechatronics. The company builds vision guided robots for local factories and has raised two funding rounds.",
    talk_title: "From student project to AI startup",
    status: "replied",
  },
  {
    name: "Priyanka Raman",
    headline: "AI Product Lead, Selangor Digital Bank",
    email: "priyanka.raman@sdbank.example",
    phone: "+60 11-2390 8874",
    photo_url: "https://randomuser.me/api/portraits/women/68.jpg",
    bio: "Runs the product team behind the bank's fraud detection and customer assistant models. Mentors women in tech through a campus outreach programme.",
    talk_title: "Shipping responsible AI in finance",
    status: "followed_up",
  },
];

const DONE_KEYS = ["objectives", "budget", "datecheck", "speakers", "quotes", "draft", "venue_booking", "proposal_submission", "luma", "poster"];
const DOING_KEYS = ["speaker_declaration", "campaign", "blast"];

let running: Promise<void> | null = null;

export function resetDemoState() {
  running = null;
  resetMoreState();
}

export function ensureDemo() {
  if (process.env.DEMO_BOOTSTRAP === "0") return Promise.resolve();
  if (!running) running = bootstrap().then(() => ensureMore()).catch((e) => {
    running = null;
    console.error("demo bootstrap failed", e);
  });
  return running;
}

async function bootstrap() {
  const committee = await one<User>("SELECT * FROM users WHERE id = 'usr_committee'");
  if (!committee) return;
  const exists = await one("SELECT 1 FROM events WHERE society_id = $1 AND title = 'AI Talk @ Sunway'", [committee.society_id]);
  if (exists) return;

  // 1. The agent plans it, exactly as from the prompt box.
  const prevDelay = process.env.AGENT_STEP_DELAY_MS;
  process.env.AGENT_STEP_DELAY_MS = "0";
  const run = await Run.start(committee, PROMPT, "plan", "workbuddy");
  await execute(run, "plan");
  process.env.AGENT_STEP_DELAY_MS = prevDelay ?? "";
  const ev = await one<{ id: string; date: string }>("SELECT id, date FROM events WHERE id = (SELECT event_id FROM agent_runs WHERE id = $1)", [run.id]);
  if (!ev) return;

  // 2. Real looking speakers in place of the placeholders.
  const placeholders = await query<{ id: string; name: string }>("SELECT id, name FROM speakers WHERE event_id = $1 ORDER BY name", [ev.id]);
  for (const [i, sp] of SPEAKERS.entries()) {
    const row = placeholders[i];
    if (!row) continue;
    await query("UPDATE runsheet_items SET activity = replace(activity, $2, $3) WHERE event_id = $1", [ev.id, row.name, sp.name]);
    await query("UPDATE creatives SET caption = replace(caption, $2, $3) WHERE event_id = $1", [ev.id, row.name, sp.name]);
    await update("speakers", row.id, { name: sp.name, headline: sp.headline, email: sp.email, phone: sp.phone, photo_url: sp.photo_url, bio: sp.bio, talk_title: sp.talk_title, source: "workbuddy", source_url: null, fit_reason: sp.bio });
  }

  // 3. The right people approve everything the agent queued.
  const users = Object.fromEntries((await query<User>("SELECT * FROM users WHERE society_id = $1", [committee.society_id])).map((u) => [u.id, u]));
  const pending = await query<ApprovalRequest>("SELECT * FROM approval_requests WHERE event_id = $1 AND status = 'pending' ORDER BY created_at", [ev.id]);
  for (const a of pending) {
    const approver = a.approver_role === "director" ? (a.approver_department === "Logistics" ? users.usr_dir_log : users.usr_dir_prog) : users.usr_president;
    if (approver) await decideApproval(approver, a.id, "approve").catch(() => null);
  }
  const faculty = await one<ApprovalRequest>("SELECT * FROM approval_requests WHERE event_id = $1 AND action_type = 'email.faculty' AND status = 'awaiting_faculty'", [ev.id]);
  if (faculty) await facultyDecision(faculty.id, "approve", "Looks good. Please share the speaker declarations with SLE.");

  // 4. Speaker replies on top of the sent invitations.
  const spRows = await query<{ id: string; name: string }>("SELECT id, name FROM speakers WHERE event_id = $1", [ev.id]);
  for (const sp of SPEAKERS) {
    const row = spRows.find((r) => r.name === sp.name);
    if (row) await update("speakers", row.id, { status: sp.status, replied_at: sp.status === "followed_up" ? null : new Date(), followed_up_at: sp.status === "followed_up" ? new Date() : null });
  }

  // 5. Halfway through the plan.
  await query(`UPDATE tasks SET status = 'done' WHERE event_id = $1 AND key = ANY($2::text[])`, [ev.id, DONE_KEYS]);
  await query(`UPDATE tasks SET status = 'doing' WHERE event_id = $1 AND key = ANY($2::text[])`, [ev.id, DOING_KEYS]);
  const mitigations = await query<{ id: string; risk_id: string }>("SELECT id, risk_id FROM tasks WHERE event_id = $1 AND risk_id IS NOT NULL ORDER BY due_date LIMIT 2", [ev.id]);
  for (const m of mitigations) {
    await update("tasks", m.id, { status: "done" });
    await update("risks", m.risk_id, { status: "closed" });
  }

  // 6. Live on Luma and Meetup; people registered through both.
  if (users.usr_president) await publishEvent(users.usr_president, ev.id, null, "meetup").catch(() => null);
  await syncRsvps(ev.id, "luma");
  await syncRsvps(ev.id, "meetup");

  // 7. Money moving: suppliers signed, catering deposit paid, first receipts in.
  const vendors = await query<{ id: string; category: string; quote: number | null }>("SELECT id, category, quote FROM vendors WHERE event_id = $1 AND selected = true", [ev.id]);
  for (const v of vendors) {
    await update("vendors", v.id, { contract_status: v.category === "food" || v.category === "tshirt" ? "signed" : "sent", contact_email: `sales@${v.category}-supplier.example` });
    if (v.category === "food" && v.quote) {
      const amount = Math.max(50, Math.round(v.quote * 0.3));
      await insert("payments", { id: id("pay"), event_id: ev.id, vendor_id: v.id, amount, provider: "mock", status: "paid", checkout_url: null, provider_ref: "demo", created_by: "usr_president", paid_at: new Date() });
      await update("vendors", v.id, { deposit_amount: amount, deposit_status: "paid" });
    }
  }
  const lines = await query<{ id: string; category: string; description: string; estimated: number }>("SELECT id, category, description, estimated FROM budget_lines WHERE event_id = $1", [ev.id]);
  for (const l of lines) {
    if (/T-shirts/.test(l.description)) await update("budget_lines", l.id, { actual: l.estimated });
    if (/Posters/.test(l.description)) await update("budget_lines", l.id, { actual: Math.round(l.estimated * 0.9 * 100) / 100 });
    if (l.category === "Food & beverage") await update("budget_lines", l.id, { actual: Math.round(l.estimated * 0.3) });
  }

  // 8. One thing still waiting backstage: the T-shirt deposit, asked by the committee.
  const tee = await one<{ id: string; name: string; quote: number | null }>("SELECT id, name, quote FROM vendors WHERE event_id = $1 AND category = 'tshirt' AND selected = true", [ev.id]);
  if (tee?.quote) {
    const amount = Math.max(50, Math.round(tee.quote * 0.3));
    await gate(committee, "payment.deposit", `Pay RM${amount} deposit to ${tee.name.split(" — ")[0]}`, { vendor_id: tee.id, event_id: ev.id, amount }, { eventId: ev.id, amount });
  }

  // 9. Marketing out the door.
  await query("UPDATE creatives SET status = 'posted', posted_url = 'https://www.instagram.com/' WHERE event_id = $1 AND kind = 'ig_post'", [ev.id]);
  const promo = await query<{ id: string }>("SELECT id FROM promo_items WHERE event_id = $1 ORDER BY due_date LIMIT 4", [ev.id]);
  for (const p of promo) await update("promo_items", p.id, { status: "done" });
}
