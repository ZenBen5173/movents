import "server-only";
import { query, one } from "./db";
import type { Role, User } from "./types";

/** Who oversees every event in the society without being added. */
const OVERSIGHT: Role[] = ["president", "vp", "faculty_advisor"];

export const seesAll = (u: Pick<User, "role">) => OVERSIGHT.includes(u.role);

export type Member = { user_id: string; name: string; role: Role; department: string | null; email: string; member_role: "lead" | "colead" | "member" };

/**
 * SQL filter for "events this user can open". `e` is the events alias;
 * `n` is the position of the user id parameter.
 */
export function visibleSql(user: Pick<User, "role">, n: number) {
  return seesAll(user) ? `($${n}::text IS NOT NULL)` : `EXISTS (SELECT 1 FROM event_members m WHERE m.event_id = e.id AND m.user_id = $${n})`;
}

export async function isMember(user: Pick<User, "id" | "role">, eventId: string) {
  if (seesAll(user)) return true;
  return Boolean(await one("SELECT 1 FROM event_members WHERE event_id = $1 AND user_id = $2", [eventId, user.id]));
}

export async function assertMember(user: Pick<User, "id" | "role">, eventId: string | null | undefined) {
  if (!eventId) return;
  if (!(await isMember(user, eventId))) throw new Error("You are not on this event's team. Ask the event lead to add you.");
}

/** Look up the event a row belongs to, then check the user is on it. */
export async function assertMemberOf(user: Pick<User, "id" | "role">, table: string, rowId: string) {
  const r = await one<{ event_id: string | null }>(`SELECT event_id FROM ${table} WHERE id = $1`, [rowId]);
  await assertMember(user, r?.event_id);
}

export function listMembers(eventId: string) {
  return query<Member>(
    `SELECT u.id AS user_id, u.name, u.role, u.department, u.email, m.role AS member_role
     FROM event_members m JOIN users u ON u.id = m.user_id WHERE m.event_id = $1
     ORDER BY (m.role = 'lead') DESC, m.added_at`,
    [eventId],
  );
}

export async function addMembers(eventId: string, userIds: string[], addedBy: string | null, role: "lead" | "member" = "member") {
  for (const uid of userIds) {
    await query(
      "INSERT INTO event_members (event_id, user_id, role, added_by) VALUES ($1, $2, $3, $4) ON CONFLICT (event_id, user_id) DO NOTHING",
      [eventId, uid, role, addedBy],
    );
  }
}

export async function removeMember(eventId: string, userId: string) {
  await query("DELETE FROM event_members WHERE event_id = $1 AND user_id = $2 AND role <> 'lead'", [eventId, userId]);
}

/** Match "Jason", "Priya Nair" or an email to people in the society. */
export async function resolvePeople(societyId: string, names: string[]) {
  const people = await query<{ id: string; name: string; email: string }>("SELECT id, name, email FROM users WHERE society_id = $1", [societyId]);
  const found: string[] = [];
  const unknown: string[] = [];
  for (const raw of names) {
    const n = raw.trim().toLowerCase();
    if (!n) continue;
    const hit =
      people.find((p) => p.email.toLowerCase() === n || p.name.toLowerCase() === n) ??
      people.find((p) => p.name.toLowerCase().split(/\s+/).includes(n)) ??
      people.find((p) => p.name.toLowerCase().startsWith(n));
    if (hit) found.push(hit.id);
    else unknown.push(raw.trim());
  }
  return { ids: [...new Set(found)], unknown };
}
