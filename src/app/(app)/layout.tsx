import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { one, query } from "@/lib/db";
import { AppShell } from "@/components/app/app-shell";
import { ensureDemo } from "@/lib/demo";
import { canDecide } from "@/lib/rbac";
import type { ApprovalRequest, User } from "@/lib/types";
import { visibleSql } from "@/lib/members";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await ensureDemo();
  const user = await currentUser();
  if (!user) redirect("/login");
  const [pending, users, notes, society, projects, universities] = await Promise.all([
    query<ApprovalRequest>("SELECT * FROM approval_requests WHERE status IN ('pending','awaiting_faculty')"),
    query<User>("SELECT * FROM users WHERE society_id = $1 ORDER BY CASE role WHEN 'president' THEN 0 WHEN 'vp' THEN 1 WHEN 'director' THEN 2 WHEN 'committee' THEN 3 ELSE 4 END, name", [user.society_id]),
    query<{ id: string; title: string; body: string; link: string; read: boolean; created_at: string }>(
      "SELECT * FROM notifications WHERE (user_id = $1 OR role = $2) ORDER BY created_at DESC LIMIT 15",
      [user.id, user.role],
    ),
    one<{ name: string; uni: string }>("SELECT s.name, u.short_name AS uni FROM societies s JOIN universities u ON u.id = s.university_id WHERE s.id = $1", [user.society_id]),
    query<{ id: string; title: string; date: string; status: string; venue: string | null; open_tasks: number }>(
      `SELECT e.id, e.title, e.date, e.status, v.name AS venue,
        (SELECT count(*)::int FROM tasks t WHERE t.event_id = e.id AND t.status <> 'done') AS open_tasks
       FROM events e LEFT JOIN venues v ON v.id = e.venue_id WHERE e.society_id = $1 AND ${visibleSql(user, 2)} ORDER BY e.date DESC`,
      [user.society_id, user.id],
    ),
    query<{ id: string; name: string; short_name: string }>("SELECT id, name, short_name FROM universities ORDER BY created_at"),
  ]);
  const mine = pending.filter((p) => (p.status === "pending" && canDecide(user, p)) || (p.status === "awaiting_faculty" && user.role === "faculty_advisor")).length;
  return (
    <AppShell
      user={{ id: user.id, name: user.name, role: user.role, department: user.department }}
      users={users.map((u) => ({ id: u.id, name: u.name, role: u.role, department: u.department }))}
      pendingForMe={mine}
      notifications={notes.map((n) => ({ ...n, created_at: new Date(n.created_at).toISOString() }))}
      society={society?.name ?? "Society"}
      university={society?.uni ?? ""}
      projects={projects}
      universities={universities}
    >
      {children}
    </AppShell>
  );
}
