import { SPEAKERS } from "../../data";
import { C, border } from "../../theme";
import { lerp, pop } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Avatar, Barcode, Mono, Pass } from "../../ui/kit";

const TONES = [C.tomato, C.blue, C.sun];

export function SpeakersTab({ f }: { f: number }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: lerp(f, 2, 10) }}>
        <Mono color={C.ink}>Speakers</Mono>
        <Mono size={11.5}>3 researched by WorkBuddy · 1 confirmed · 2 in conversation</Mono>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 90, marginTop: 4 }}>
        {SPEAKERS.map((s, k) => {
          const start = 6 + k * 8;
          const drop = pop(f, start, { damping: 12, stiffness: 120 });
          const t = Math.max(0, f - start);
          const swing = 11 * Math.exp(-t / 26) * Math.sin(t / 4.2 + 0.6) * (k % 2 ? -1 : 1) + Math.sin(f / 22 + k) * 0.8;
          return (
            <div key={s.name} style={{ transform: `translateY(${(1 - drop) * -560}px)` }}>
              <Pass header="Speaker" tone={TONES[k]} headerColor={k === 1 ? "#fff" : C.ink} swing={swing} width={340}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <Avatar name={s.name} photo={s.photo} size={118} style={{ border: border(2.5) }} />
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 25, marginTop: 12 }}>{s.name}</div>
                  <div style={{ fontSize: 15.5, color: C.muted, marginTop: 2 }}>{s.headline}</div>
                  <div style={{ fontSize: 15.5, fontWeight: 700 }}>{s.org}</div>
                  <div style={{ fontFamily: F.hand, fontWeight: 700, fontSize: 25, lineHeight: 1.05, marginTop: 10, color: C.tomatoInk, minHeight: 52 }}>"{s.talk}"</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 12 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: border(1.5), borderRadius: 99, padding: "3px 10px", background: s.tone, color: s.tone === C.blue ? "#fff" : C.ink, transform: `scale(${pop(f, start + 26)})` }}>{s.status}</span>
                    <Barcode seed={s.name} width={120} height={26} />
                  </div>
                </div>
              </Pass>
            </div>
          );
        })}
      </div>
    </div>
  );
}
