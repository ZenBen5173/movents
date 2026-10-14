import { NextResponse } from "next/server";
import { runScheduler } from "@/lib/scheduler";
import { pruneAuthTables } from "@/lib/auth/accounts";
import { safeEqual } from "@/lib/auth/tokens";
import { backupDatabase } from "@/lib/backup";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Vercel Cron only (Authorization: Bearer CRON_SECRET). Admins run it from Settings. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await runScheduler();
  await pruneAuthTables();
  // A failed backup must not stop the day's reminders; log it loudly instead.
  const backup = await backupDatabase().catch((err: unknown) => {
    console.error(JSON.stringify({ level: "error", msg: "daily backup failed", err: String(err) }));
    return { error: "backup failed" };
  });
  return NextResponse.json({ ...result, backup });
}
