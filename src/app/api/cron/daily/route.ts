import { NextResponse } from "next/server";
import { runScheduler } from "@/lib/scheduler";
import { pruneAuthTables } from "@/lib/auth/accounts";
import { safeEqual } from "@/lib/auth/tokens";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Vercel Cron only (Authorization: Bearer CRON_SECRET). Admins run it from Settings. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await runScheduler();
  await pruneAuthTables();
  return NextResponse.json(result);
}
