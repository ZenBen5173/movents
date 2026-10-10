import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { appUrl, fmtDate } from "@/lib/appurl";
import type { Creative, EventRow, Venue } from "@/lib/types";

export const dynamic = "force-dynamic";

let fonts: { name: string; data: Buffer; weight: 500 | 700; style: "normal" }[] | null = null;
async function loadFonts() {
  if (fonts) return fonts;
  const dir = path.join(process.cwd(), "node_modules", "@fontsource");
  const [g7, g5, m7] = await Promise.all([
    fs.readFile(path.join(dir, "space-grotesk/files/space-grotesk-latin-700-normal.woff")),
    fs.readFile(path.join(dir, "space-grotesk/files/space-grotesk-latin-500-normal.woff")),
    fs.readFile(path.join(dir, "space-mono/files/space-mono-latin-700-normal.woff")),
  ]);
  fonts = [
    { name: "Grotesk", data: g7, weight: 700, style: "normal" },
    { name: "Grotesk", data: g5, weight: 500, style: "normal" },
    { name: "Mono", data: m7, weight: 700, style: "normal" },
  ];
  return fonts;
}

function bars(seed: string) {
  let h = 7;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return Array.from({ length: 34 }, () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return 2 + (h % 3) * 2;
  });
}

/** Serves a creative: the attached Nano Banana / WorkBuddy image, or a branded "admit one" poster rendered from live event data. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await one<Creative>("SELECT * FROM creatives WHERE id = $1", [id]);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const download = new URL(req.url).searchParams.has("download");
  if (c.image_data) {
    const [meta, b64] = c.image_data.split(",");
    const mime = meta.slice(5, meta.indexOf(";"));
    return new NextResponse(new Uint8Array(Buffer.from(b64, "base64")), {
      headers: { "content-type": mime, "cache-control": "no-store", ...(download ? { "content-disposition": `attachment; filename="${c.kind}.${mime.split("/")[1]}"` } : {}) },
    });
  }
  if (c.image_url) return NextResponse.redirect(c.image_url);

  const ev = await one<EventRow & { society: string; uni: string }>("SELECT e.*, s.name AS society, u.short_name AS uni FROM events e JOIN societies s ON s.id = e.society_id JOIN universities u ON u.id = s.university_id WHERE e.id = $1", [c.event_id]);
  if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const venue = ev.venue_id ? await one<Venue>("SELECT * FROM venues WHERE id = $1", [ev.venue_id]) : null;
  const W = c.width;
  const H = c.height;
  const wide = W > H;
  const s = Math.min(W, H) / 1080;
  const ink = "#161514";
  const tomato = "#ff5a36";
  const titleSize = Math.round((wide ? 92 : ev.title.length > 24 ? 112 : 136) * s);
  const mono = { fontFamily: "Mono", letterSpacing: 6 * s, textTransform: "uppercase" as const };
  const field = (label: string, value: string) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 * s }}>
      <span style={{ ...mono, fontSize: 20 * s, color: "#6b665e" }}>{label}</span>
      <span style={{ ...mono, fontSize: 34 * s, color: ink, letterSpacing: 2 * s }}>{value}</span>
    </div>
  );
  const res = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f7f5ef", padding: 64 * s, fontFamily: "Grotesk", color: ink, position: "relative" }}>
        {/* bunting */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", padding: `0 ${40 * s}px` }}>
          {["#ff5a36", "#ffd84d", "#3d6cf5", "#d3efca", "#ffc9b8", "#ff5a36", "#ffd84d", "#3d6cf5", "#d3efca"].map((col, i) => (
            <svg key={i} width={36 * s} height={44 * s} viewBox="0 0 36 44" style={{ marginTop: Math.sin((i / 8) * Math.PI) * 18 * s }}><path d="M0 0 H36 L18 44 Z" fill={col} stroke={ink} strokeWidth="2" /></svg>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 34 * s }}>
          <span style={{ ...mono, fontSize: 24 * s, color: tomato }}>{ev.society}</span>
          <span style={{ ...mono, fontSize: 20 * s, border: `${3 * s}px solid ${tomato}`, color: tomato, padding: `${6 * s}px ${14 * s}px`, borderRadius: 10 * s, transform: "rotate(-6deg)" }}>{c.kind === "video" ? "Teaser" : "Free entry"}</span>
        </div>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", gap: 22 * s }}>
          <span style={{ ...mono, fontSize: 26 * s, color: tomato }}>{(ev.topic ?? "talk") + " · " + ev.uni} presents</span>
          <span style={{ fontSize: titleSize, fontWeight: 700, lineHeight: 0.98, letterSpacing: -4 * s, maxWidth: wide ? W * 0.72 : W - 128 * s }}>{ev.title}</span>
        </div>
        {/* ticket */}
        <div style={{ display: "flex", border: `${4 * s}px solid ${ink}`, borderRadius: 26 * s, background: "white", boxShadow: `${8 * s}px ${8 * s}px 0 ${ink}` }}>
          <div style={{ display: "flex", flex: 1, flexDirection: "column", padding: 30 * s, gap: 18 * s }}>
            <span style={{ ...mono, fontSize: 20 * s, color: tomato }}>Admit one</span>
            <div style={{ display: "flex", gap: 44 * s, flexWrap: "wrap" }}>
              {field("Date", fmtDate(ev.date).toUpperCase())}
              {field("Time", `${ev.start_time}`)}
              {field("Venue", (venue?.name ?? ev.uni).toUpperCase())}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", background: tomato, borderLeft: `${4 * s}px dashed ${ink}`, padding: 28 * s, width: (wide ? 300 : 280) * s, borderRadius: `0 ${22 * s}px ${22 * s}px 0` }}>
            <span style={{ fontSize: 34 * s, fontWeight: 700, textAlign: "center" }}>Register now →</span>
            <div style={{ display: "flex", gap: 3 * s, height: 60 * s, alignItems: "stretch" }}>
              {bars(ev.id).map((w, i) => <div key={i} style={{ display: "flex", width: w * s, background: ink }} />)}
            </div>
          </div>
        </div>
        <span style={{ ...mono, fontSize: 18 * s, color: "#6b665e", marginTop: 22 * s, letterSpacing: 2 * s }}>{appUrl().replace(/^https?:\/\//, "")}/e/{ev.id}</span>
      </div>
    ),
    { width: W, height: H, fonts: await loadFonts() },
  );
  if (download) res.headers.set("content-disposition", `attachment; filename="${c.kind}.png"`);
  return res;
}
