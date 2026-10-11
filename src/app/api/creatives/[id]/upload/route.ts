import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { assertMemberOf } from "@/lib/members";
import { imageHref, setImage } from "@/lib/marketing";
import { appUrl, verifyToken } from "@/lib/appurl";
import type { Creative } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Upload a generated image or video for a creative as the raw request body, e.g.
 * curl -X POST -H "Content-Type: image/png" --data-binary @poster.png "<signed upload link from attach_creative_media>"
 * Lets WorkBuddy attach a local file when Movents runs on another machine (Vercel).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // A signed link from attach_creative_media (already checked the caller is on the team), or a logged-in member.
  const signed = verifyToken(`upload:${id}`, new URL(req.url).searchParams.get("t"));
  const user = signed ? null : await currentUser();
  if (!signed && !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await one<Creative>("SELECT * FROM creatives WHERE id = $1", [id]);
  if (!c) return NextResponse.json({ error: "Creative not found" }, { status: 404 });
  try {
    if (user) await assertMemberOf(user, "creatives", id);
    const type = (req.headers.get("content-type") ?? "image/png").split(";")[0];
    if (!/^(image|video)\//.test(type)) throw new Error("Content-Type must be image/* or video/*");
    const buf = Buffer.from(await req.arrayBuffer());
    if (type.startsWith("image/") && buf.length < 60_000) throw new Error("This image looks drawn with code, not AI-generated. Generate it with your image generation tool from the creative's image_prompt.");
    const r = await setImage(id, `data:${type};base64,${buf.toString("base64")}`, "workbuddy");
    return NextResponse.json({ creative_id: id, attached: true, preview: r ? `${appUrl()}${imageHref(r)}` : null });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
