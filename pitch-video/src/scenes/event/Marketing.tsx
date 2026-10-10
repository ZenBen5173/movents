import { Img, staticFile } from "remotion";
import { SPEAKERS } from "../../data";
import { C, border, hard } from "../../theme";
import { count, lerp, pop, soft, typed } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Icon } from "../../ui/Icon";
import { Barcode, Mono, card } from "../../ui/kit";

const CHECK = [
  { t: "Poster designed", done: true },
  { t: "IG post scheduled", done: true },
  { t: "Luma page live", done: true },
  { t: "Email blast · 1 Nov", done: false },
  { t: "Reminder · 12 Nov", done: false },
];

export function MarketingTab({ f }: { f: number }) {
  const poster = pop(f, 4, { damping: 14 });
  const ig = pop(f, 14, { damping: 14 });
  const caption = "3 speakers. 1 rooftop. Free entry for 150. RSVP via link in bio.";
  return (
    <div style={{ display: "flex", gap: 34, alignItems: "flex-start" }}>
      {/* poster */}
      <div style={{ width: 410, height: 580, background: C.tomato, border: border(2.5), borderRadius: 14, boxShadow: hard(6), position: "relative", overflow: "hidden", transform: `translateY(${(1 - poster) * 300}px) rotate(${-2 + (1 - poster) * -8}deg)`, padding: 26 }}>
        <div style={{ position: "absolute", right: -50, top: -50, width: 170, height: 170, borderRadius: "50%", background: C.sun, border: border(2.5), transform: `scale(${pop(f, 12)})` }} />
        <Mono size={13} color={C.ink}>AI &amp; Tech Society</Mono>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 62, lineHeight: 0.95, marginTop: 16, position: "relative", letterSpacing: "-0.02em" }}>
          {["AI TALK", "@ SUNWAY"].map((l, i) => (
            <div key={l} style={{ opacity: lerp(f, 10 + i * 5, 16 + i * 5), transform: `translateX(${(1 - soft(f, 10 + i * 5)) * -40}px)` }}>{l}</div>
          ))}
        </div>
        <div style={{ marginTop: 18, display: "inline-block", background: C.ink, color: "#fff", padding: "6px 12px", borderRadius: 8, fontFamily: F.mono, fontWeight: 700, fontSize: 16, opacity: lerp(f, 20, 26) }}>15 NOV · 2 PM · ROOFTOP TERRACE</div>
        <div style={{ display: "flex", gap: 14, marginTop: 30 }}>
          {SPEAKERS.map((s, k) => (
            <div key={s.name} style={{ textAlign: "center", transform: `scale(${pop(f, 24 + k * 5)})` }}>
              <div style={{ width: 98, height: 98, borderRadius: "50%", border: border(2.5), overflow: "hidden", background: "#fff" }}>
                <Img src={staticFile(s.photo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 13.5, marginTop: 6, width: 104 }}>{s.name}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 22, display: "flex", justifyContent: "space-between", alignItems: "flex-end", opacity: lerp(f, 36, 44) }}>
          <div>
            <div style={{ fontFamily: F.hand, fontWeight: 700, fontSize: 34, lineHeight: 1 }}>free entry!</div>
            <Mono size={12} color={C.ink}>RSVP on Luma</Mono>
          </div>
          <div style={{ background: "#fff", padding: 6, border: border(2), borderRadius: 6 }}>
            <Barcode seed="poster" width={110} height={36} />
          </div>
        </div>
      </div>

      {/* instagram post */}
      <div style={{ width: 420, ...card(5), overflow: "hidden", transform: `translateY(${(1 - ig) * 300}px) rotate(${1.5 + (1 - ig) * 8}deg)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 17, background: `conic-gradient(${C.tomato}, ${C.sun}, ${C.blue}, ${C.tomato})`, padding: 3 }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 14, background: C.ink, color: "#fff", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700 }}>AI</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>sunway.aitech</div>
          <Mono size={10.5} style={{ marginLeft: "auto" }}>Scheduled · 18 Oct</Mono>
        </div>
        <div style={{ height: 320, background: C.sun, borderTop: border(2), borderBottom: border(2), position: "relative", overflow: "hidden", padding: 26 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 46, lineHeight: 1, letterSpacing: "-0.02em" }}>
            3 speakers.
            <br />1 rooftop.
            <br />
            <span style={{ color: C.tomatoInk }}>15 Nov.</span>
          </div>
          {SPEAKERS.map((s, k) => (
            <div key={s.name} style={{ position: "absolute", right: 24 + k * 56, bottom: 22 + (k % 2) * 30, width: 84, height: 84, borderRadius: 14, border: border(2), overflow: "hidden", transform: `rotate(${(k - 1) * 8}deg) scale(${pop(f, 26 + k * 4)})`, boxShadow: hard(3) }}>
              <Img src={staticFile(s.photo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ transform: `scale(${1 + Math.sin(lerp(f, 50, 62) * Math.PI) * 0.4})` }}>
              <svg width={26} height={26} viewBox="0 0 24 24">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" fill={f > 52 ? C.tomato : "none"} stroke={C.ink} strokeWidth={2} />
              </svg>
            </div>
            <Icon name="message" size={24} />
            <Icon name="send" size={23} />
            <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 15 }}>{count(f, 46, 34, 284)} likes</span>
          </div>
          <div style={{ fontSize: 15.5, marginTop: 8, lineHeight: 1.4, minHeight: 44 }}>
            <b>sunway.aitech</b> {typed(caption, f, 30, 1.6)}
          </div>
        </div>
      </div>

      {/* checklist */}
      <div style={{ flex: 1, ...card(4), padding: "18px 22px" }}>
        <Mono color={C.ink}>Promo plan</Mono>
        {CHECK.map((c, i) => {
          const p = soft(f, 20 + i * 6);
          return (
            <div key={c.t} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, opacity: p, transform: `translateX(${(1 - p) * 30}px)` }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, border: border(2), background: c.done ? C.green : "#fff", display: "grid", placeItems: "center" }}>{c.done && <Icon name="check" size={16} stroke={3.2} color="#fff" />}</div>
              <span style={{ fontSize: 17.5, color: c.done ? C.ink : C.muted }}>{c.t}</span>
            </div>
          );
        })}
        <div style={{ marginTop: 22, borderTop: `1.5px dashed ${C.line}`, paddingTop: 14, opacity: lerp(f, 50, 60) }}>
          <Mono size={11.5}>Reach so far</Mono>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36 }}>{count(f, 46, 34, 2140).toLocaleString("en-US")}</div>
          <div style={{ fontSize: 14.5, color: C.muted }}>across IG, Luma and email</div>
        </div>
      </div>
    </div>
  );
}
