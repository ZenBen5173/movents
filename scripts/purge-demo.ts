// Remove the hackathon demo data (demo societies, their people and events,
// fake venue bookings) from a database. Reference data (universities, SOPs,
// venues, supplier registry) and every real society are kept.
//
//   npm run purge-demo            # dry run: shows what would be deleted
//   npm run purge-demo -- --yes   # delete
import { query, transaction } from "../src/lib/db";

const DEMO_SOCIETIES = ["soc_aitech", "soc_robotics"];
const yes = process.argv.includes("--yes");

const EVENT_TABLES = [
  "tasks", "speakers", "budget_lines", "risks", "rsvps", "feedback", "promo_items", "reminders", "runsheet_items", "volunteers",
  "payments", "creatives", "sponsors", "meetings", "approval_requests", "emails", "calendar_events", "agent_runs", "event_members",
  "event_mailboxes", "audit_logs",
];

const events = (await query<{ id: string }>("SELECT id FROM events WHERE society_id = ANY($1::text[])", [DEMO_SOCIETIES])).map((r) => r.id);
// Demo people: members of only the demo societies, or the seeded @movents.test accounts.
const users = (
  await query<{ id: string }>(
    `SELECT u.id FROM users u WHERE u.email LIKE '%@movents.test'
       OR (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id AND m.society_id = ANY($1::text[]))
           AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id AND NOT (m.society_id = ANY($1::text[]))))`,
    [DEMO_SOCIETIES],
  )
).map((r) => r.id);
const bookings = await query<{ n: number }>("SELECT count(*)::int AS n FROM venue_bookings");

console.log(`Demo societies: ${DEMO_SOCIETIES.join(", ")}`);
console.log(`Events: ${events.length}, people: ${users.length}, venue calendar entries: ${bookings[0].n}`);
if (!yes) {
  console.log("Dry run. Re-run with --yes to delete.");
  process.exit(0);
}

await transaction(async () => {
  for (const t of EVENT_TABLES) await query(`DELETE FROM ${t} WHERE event_id = ANY($1::text[])`, [events]);
  await query("DELETE FROM vendors WHERE event_id = ANY($1::text[])", [events]);
  await query("DELETE FROM events WHERE id = ANY($1::text[])", [events]);
  await query("DELETE FROM audit_logs WHERE society_id = ANY($1::text[]) OR user_id = ANY($2::text[])", [DEMO_SOCIETIES, users]);
  await query("DELETE FROM notifications WHERE society_id = ANY($1::text[]) OR user_id = ANY($2::text[])", [DEMO_SOCIETIES, users]);
  await query("DELETE FROM approval_requests WHERE society_id = ANY($1::text[])", [DEMO_SOCIETIES]);
  await query("DELETE FROM invites WHERE society_id = ANY($1::text[])", [DEMO_SOCIETIES]);
  await query("DELETE FROM memberships WHERE society_id = ANY($1::text[]) OR user_id = ANY($2::text[])", [DEMO_SOCIETIES, users]);
  for (const t of ["sessions", "api_tokens", "oauth_tokens", "oauth_codes"]) await query(`DELETE FROM ${t} WHERE user_id = ANY($1::text[])`, [users]);
  await query("DELETE FROM users WHERE id = ANY($1::text[])", [users]);
  await query("DELETE FROM societies WHERE id = ANY($1::text[])", [DEMO_SOCIETIES]);
  // The seeded venue calendar was invented classes and club bookings.
  await query("DELETE FROM venue_bookings");
  await query("DELETE FROM sop_documents WHERE source_event_id = ANY($1::text[]) OR id = 'sop_lessons_ds'", [events]);
});
console.log("Demo data removed.");
process.exit(0);
