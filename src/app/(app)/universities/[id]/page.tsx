import { pageUser } from "@/lib/guard";
import { currentUser } from "@/lib/session";
import { one, query } from "@/lib/db";
import { canManageSop } from "@/lib/rbac";
import { SopView } from "@/components/app/sop-view";
import type { University } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function UniversitySop({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await pageUser();
  const uni = (await one<University>("SELECT * FROM universities WHERE id = $1", [id]))!;
  const docs = await query<{ id: string; title: string; kind: string; content: string; created_at: string; by: string | null }>(
    "SELECT d.*, u.name AS by FROM sop_documents d LEFT JOIN users u ON u.id = d.uploaded_by WHERE d.university_id = $1 ORDER BY d.created_at DESC",
    [id],
  );
  const ours = await one("SELECT 1 FROM societies WHERE id = $1 AND university_id = $2", [user.society_id, id]);
  return <SopView university={JSON.parse(JSON.stringify(uni))} docs={docs.map((d) => ({ ...d, created_at: new Date(d.created_at).toISOString() }))} canEdit={Boolean(ours) && canManageSop(user)} />;
}
