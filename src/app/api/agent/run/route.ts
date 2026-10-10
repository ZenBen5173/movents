import { after } from "next/server";
import { requireUser } from "@/lib/session";
import { handle } from "@/lib/server/http";
import { execute, startRun } from "@/lib/agent/pipelines";

export const maxDuration = 300;

/** Start an agent run from one prompt. Returns immediately; poll /api/runs/:id for the live trace. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const { prompt } = (await req.json()) as { prompt?: string };
    if (!prompt?.trim()) throw new Error("prompt is required");
    const { run, kind } = await startRun(user, prompt.trim());
    after(() => execute(run, kind));
    return { run_id: run.id, kind, trace_url: `/runs/${run.id}` };
  });
}
