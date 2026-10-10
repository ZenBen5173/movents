import "server-only";
import { id, insert } from "./db";
import type { Role, User } from "./types";

export async function audit(
  actor: Pick<User, "id" | "name"> | { id: null; name: string },
  action: string,
  details: Record<string, unknown> = {},
  opts: { eventId?: string | null; approvedBy?: string | null } = {},
) {
  return insert("audit_logs", {
    id: id("aud"),
    event_id: opts.eventId ?? null,
    user_id: actor.id,
    actor: actor.name,
    action,
    details,
    approved_by: opts.approvedBy ?? null,
  });
}

export async function notify(
  target: { userId?: string; role?: Role },
  title: string,
  body: string,
  link?: string,
) {
  return insert("notifications", {
    id: id("ntf"),
    user_id: target.userId ?? null,
    role: target.role ?? null,
    title,
    body,
    link: link ?? null,
  });
}
