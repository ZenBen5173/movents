import Link from "next/link";
import { query } from "@/lib/db";
import { PageHeader } from "@/components/app/ui";
import { AuditFeed } from "@/components/app/audit-feed";
import type { AuditLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const { event } = await searchParams;
  const events = await query<{ id: string; title: string }>("SELECT id, title FROM events ORDER BY created_at DESC");
  const rows = await query<AuditLog & { event_title: string | null }>(
    `SELECT a.*, e.title AS event_title FROM audit_logs a LEFT JOIN events e ON e.id = a.event_id ${event ? "WHERE a.event_id = $1" : ""} ORDER BY a.created_at DESC LIMIT 400`,
    event ? [event] : [],
  );
  return (
    <div>
      <PageHeader eyebrow="Admin" title="Audit log" description="Who did what, when, and who approved it. Every agent step, approval, send, payment and sign-in is recorded and can’t be edited from the app." />
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Link href="/audit" className={`rounded-full border px-3 py-1 ${!event ? "border-ink bg-ink text-white" : "border-ink/20 hover:border-ink"}`}>All</Link>
        {events.map((e) => (
          <Link key={e.id} href={`/audit?event=${e.id}`} className={`rounded-full border px-3 py-1 ${event === e.id ? "border-ink bg-ink text-white" : "border-ink/20 hover:border-ink"}`}>{e.title}</Link>
        ))}
      </div>
      <AuditFeed rows={rows.map((r) => ({ ...r, created_at: new Date(r.created_at).toISOString() }))} />
    </div>
  );
}
