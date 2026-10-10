import { one } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handle } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireUser();
    const { id } = await params;
    const run = await one("SELECT * FROM agent_runs WHERE id = $1", [id]);
    if (!run) throw new Error("Run not found");
    return run;
  });
}
