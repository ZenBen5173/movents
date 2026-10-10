import { Img, staticFile } from "remotion";
import { C, border, hard } from "../../theme";
import { lerp, pop, soft } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Generate, SkCircle, type GenTarget } from "../../ui/Generate";
import { Avatar, Mono, Skel, card } from "../../ui/kit";

// minutes after 1:30 PM
const BLOCKS = [
  { at: 0, len: 25, t: "Registration and check-in", bg: C.sand },
  { at: 25, len: 15, t: "Opening remarks", bg: C.sun },
  { at: 40, len: 40, t: "Talk · Dr. Aisha Kamal", bg: C.peach, photo: "aisha.jpg" },
  { at: 80, len: 40, t: "Talk · Jonathan Lee", bg: C.sky, photo: "jonathan.jpg" },
  { at: 120, len: 30, t: "Tea break · Mix Mix Catering", bg: C.mint },
  { at: 150, len: 40, t: "Talk · Priyanka Raman", bg: C.peach, photo: "priyanka.jpg" },
  { at: 190, len: 40, t: "Panel and Q&A", bg: C.sun },
  { at: 230, len: 40, t: "Networking and photos", bg: C.sand },
];
const CREW = [
  { at: 0, who: "Jason Tan", i: 2, t: "AV check, portable TV" },
  { at: 25, who: "Wei Ling Chong", i: 0, t: "Emcee" },
  { at: 52, who: "Priya Nair", i: 1, t: "Speaker host" },
  { at: 120, who: "Jason Tan", i: 2, t: "Buffet line" },
  { at: 150, who: "Arjun Menon", i: 3, t: "IG stories live" },
];
const PX = 2.0;
const AREA_TOP = 50;
const time = (m: number) => {
  const tot = 13 * 60 + 30 + m;
  const h = Math.floor(tot / 60);
  const mm = tot % 60;
  return `${h > 12 ? h - 12 : h}:${mm.toString().padStart(2, "0")}`;
};

export const RUNOFSHOW_GEN: GenTarget[] = [
  { at: 14, x: 470, y: AREA_TOP + 150, chip: "building the run of show…" },
  { at: 42, x: 1010, y: AREA_TOP + 110, chip: "assigning crew…" },
];
const [A_BLOCKS, A_CREW] = RUNOFSHOW_GEN.map((g) => g.at);

export function RunOfShowTab({ f }: { f: number }) {
  const b = f - A_BLOCKS;
  const c = f - A_CREW;
  const now = lerp(f, 18, 84) * 175;
  return (
    <div style={{ ...card(5), padding: "14px 22px 16px", height: 606, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Mono color={C.ink}>Run of show · 15 Nov</Mono>
        <Mono size={11.5}>Rooftop Terrace · 1:30 PM to 6:00 PM</Mono>
        <Mono size={11.5} style={{ marginLeft: "auto", width: 470 }}>Crew</Mono>
      </div>
      <div style={{ position: "absolute", left: 22, right: 22, top: AREA_TOP, height: 270 * PX }}>
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270].map((m) => (
          <div key={m} style={{ position: "absolute", left: 0, right: 0, top: m * PX, borderTop: `1.5px dashed ${C.line}` }}>
            <span style={{ position: "absolute", top: -9, left: 0, fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: C.muted, background: "#fff", paddingRight: 6 }}>{time(m)}</span>
          </div>
        ))}
        <Generate
          f={f}
          at={A_BLOCKS}
          frame={false}
          radius={10}
          seed="ros"
          wipe={30}
          sparks={24}
          style={{ position: "absolute", left: 80, top: 0, width: 700, height: 270 * PX }}
          skel={
            <div style={{ position: "relative", height: "100%" }}>
              {BLOCKS.map((bl) => (
                <Skel key={bl.t} w={700} h={bl.len * PX - 4} r={9} f={f} style={{ position: "absolute", left: 0, top: bl.at * PX + 2 }} />
              ))}
            </div>
          }
        >
          <div style={{ position: "relative", height: "100%" }}>
            {BLOCKS.map((bl, k) => {
              const p = soft(b, k * 4);
              const h = bl.len * PX - 4;
              return (
                <div key={bl.t} style={{ position: "absolute", left: 0, width: 700, top: bl.at * PX + 2, height: h * p, background: bl.bg, border: border(2), borderRadius: 9, overflow: "hidden", display: "flex", alignItems: "center", gap: 12, padding: "0 14px", boxShadow: p > 0.9 ? hard(2) : undefined }}>
                  <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12.5, width: 46 }}>{time(bl.at)}</span>
                  {bl.photo && h > 40 && (
                    <div style={{ width: 52, height: 52, borderRadius: 26, border: border(2), overflow: "hidden", flexShrink: 0, transform: `scale(${pop(b, 8 + k * 4)})` }}>
                      <Img src={staticFile(bl.photo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <span style={{ fontFamily: F.body, fontWeight: 700, fontSize: h > 40 ? 19 : 15.5, whiteSpace: "nowrap", opacity: lerp(b, 4 + k * 4, 10 + k * 4) }}>{bl.t}</span>
                  <span style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 12, color: "rgba(22,21,20,.6)" }}>{bl.len} MIN</span>
                </div>
              );
            })}
          </div>
        </Generate>
        <Generate
          f={f}
          at={A_CREW}
          frame={false}
          radius={10}
          seed="crew"
          style={{ position: "absolute", left: 830, top: 0, right: 0, height: 360 }}
          skel={
            <div style={{ position: "relative", height: "100%" }}>
              {CREW.map((cr, k) => (
                <div key={k} style={{ position: "absolute", left: 0, top: cr.at * PX + 4, display: "flex", alignItems: "center", gap: 10 }}>
                  <SkCircle f={f} size={34} />
                  <Skel w={200 + (k % 2) * 60} h={14} f={f} />
                </div>
              ))}
            </div>
          }
        >
          <div style={{ position: "relative", height: "100%" }}>
            {CREW.map((cr, k) => {
              const p = pop(c, 2 + k * 5);
              return (
                <div key={k} style={{ position: "absolute", left: 0, top: cr.at * PX + 4, display: "flex", alignItems: "center", gap: 10, transform: `scale(${p})`, transformOrigin: "left center", border: border(1.5), background: "#fff", borderRadius: 99, padding: "4px 14px 4px 4px", boxShadow: hard(2), whiteSpace: "nowrap" }}>
                  <Avatar name={cr.who} size={30} i={cr.i} />
                  <span style={{ fontSize: 15.5, fontWeight: 700 }}>{cr.who.split(" ")[0] === "Wei" ? "Wei Ling" : cr.who.split(" ")[0]}</span>
                  <span style={{ fontSize: 15, color: C.muted }}>{cr.t}</span>
                </div>
              );
            })}
          </div>
        </Generate>
        <div style={{ position: "absolute", left: 66, right: 0, top: now * PX, borderTop: `2.5px solid ${C.tomato}`, opacity: lerp(b, 22, 30) }}>
          <span style={{ position: "absolute", left: -10, top: -7, width: 12, height: 12, borderRadius: 6, background: C.tomato, border: border(1.5) }} />
        </div>
      </div>
    </div>
  );
}
