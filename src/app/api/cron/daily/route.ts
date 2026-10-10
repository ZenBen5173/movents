import { NextResponse } from "next/server";
import { runScheduler } from "@/lib/scheduler";
import { currentUser } from "@/lib/session";
import { isFinal } from "@/lib/rbac";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Vercel Cron (Bearer CRON_SECRET) or a signed-in President/VP. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const cronOk = Boolean(process.env.CRON_SECRET) && auth === `Bearer ${process.env.CRON_SECRET}`;
  if (!cronOk) {
    const u = await currentUser();
    if (!u || !isFinal(u)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const today = new URL(req.url).searchParams.get("today") ?? undefined;
  return NextResponse.json(await runScheduler({ todayOverride: today }));
}
