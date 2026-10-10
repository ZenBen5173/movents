import { SPEAKERS } from "../../data";
import { C, border } from "../../theme";
import { lerp, pop } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Generate, SkCircle, type GenTarget } from "../../ui/Generate";
import { Avatar, Barcode, Mono, Pass, Skel } from "../../ui/kit";

const TONES = [C.tomato, C.blue, C.sun];
const PASS_W = 340;
const GAP = 90;
const passX = (k: number) => (1400 - (PASS_W * 3 + GAP * 2)) / 2 + k * (PASS_W + GAP) + PASS_W / 2;

export const SPEAKERS_GEN: GenTarget[] = [
  { at: 14, x: passX(0), y: 250, chip: "researching speakers…" },
  { at: 32, x: passX(1), y: 250 },
  { at: 50, x: passX(2), y: 250 },
];

function PassSkel({ f }: { f: number }) {
  return (
    <div style={{ width: PASS_W, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 28, height: 70 }}>
        <div style={{ width: 0, height: "100%", borderLeft: `3px dashed ${C.line}`, transform: "rotate(-14deg)" }} />
        <div style={{ width: 0, height: "100%", borderLeft: `3px dashed ${C.line}`, transform: "rotate(14deg)" }} />
      </div>
      <div style={{ width: "100%", height: 400, marginTop: 8, background: "#fbf9f4", border: `2px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ height: 50, background: "#f1ede4", borderBottom: `2px solid ${C.line}` }} />
        <div style={{ padding: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <SkCircle f={f} size={118} />
          <Skel w={190} h={20} f={f} />
          <Skel w={150} h={12} f={f} />
          <Skel w={120} h={12} f={f} />
          <Skel w={230} h={30} f={f} style={{ marginTop: 6 }} />
        </div>
      </div>
    </div>
  );
}

export function SpeakersTab({ f }: { f: number }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: lerp(f, 2, 10) }}>
        <Mono color={C.ink}>Speakers</Mono>
        <Mono size={11.5}>3 researched by WorkBuddy · 1 confirmed · 2 in conversation</Mono>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: GAP, marginTop: 4 }}>
        {SPEAKERS.map((s, k) => {
          const at = SPEAKERS_GEN[k].at;
          const drop = pop(f, at, { damping: 12, stiffness: 120 });
          const t = Math.max(0, f - at);
          const swing = 11 * Math.exp(-t / 26) * Math.sin(t / 4.2 + 0.6) * (k % 2 ? -1 : 1) + Math.sin(f / 22 + k) * 0.8;
          return (
            <Generate key={s.name} f={f} at={at} frame={false} skel={<PassSkel f={f} />} seed={`sp${k}`} sparks={18} radius={16} style={{ width: PASS_W }}>
              <div style={{ transform: `translateY(${(1 - drop) * -160}px)` }}>
                <Pass header="Speaker" tone={TONES[k]} headerColor={k === 1 ? "#fff" : C.ink} swing={swing} width={PASS_W}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <Avatar name={s.name} photo={s.photo} size={118} style={{ border: border(2.5) }} />
                    <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 25, marginTop: 12 }}>{s.name}</div>
                    <div style={{ fontSize: 15.5, color: C.muted, marginTop: 2 }}>{s.headline}</div>
                    <div style={{ fontSize: 15.5, fontWeight: 700 }}>{s.org}</div>
                    <div style={{ fontFamily: F.hand, fontWeight: 700, fontSize: 25, lineHeight: 1.05, marginTop: 10, color: C.tomatoInk, minHeight: 52 }}>"{s.talk}"</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 12 }}>
                      <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: border(1.5), borderRadius: 99, padding: "3px 10px", background: s.tone, color: s.tone === C.blue ? "#fff" : C.ink, transform: `scale(${pop(f, at + 18)})` }}>{s.status}</span>
                      <Barcode seed={s.name} width={120} height={26} />
                    </div>
                  </div>
                </Pass>
              </div>
            </Generate>
          );
        })}
      </div>
    </div>
  );
}
