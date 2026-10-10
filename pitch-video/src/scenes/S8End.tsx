import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, border, hard } from "../theme";
import { lerp, pop, soft } from "../ui/anim";
import { F } from "../ui/fonts";
import { Barcode, Bunting, Confetti, Logo, Stamp } from "../ui/kit";
import { Mascot } from "../ui/WorkBuddyWindow";

const LINE = ["Tell", "WorkBuddy", "the", "event.", "Movents", "plans", "the", "rest."];

export function S8End() {
  const f = useCurrentFrame();
  const t = pop(f, 6, { damping: 14, stiffness: 120 });
  const logo = pop(f, 18, { damping: 9 });
  const peek = soft(f, 70, 18);
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(22,21,20,.12) 1.4px, transparent 1.6px)", backgroundSize: "26px 26px" }} />
      <div style={{ position: "absolute", left: 40, top: 6 }}>
        <Bunting width={1840} f={f} count={34} />
      </div>

      <div style={{ position: "absolute", left: 960 - 680, top: 540 - 270, width: 1360, height: 540, transform: `translateY(${(1 - t) * 500}px) rotate(${(1 - t) * -8 - 1.2}deg)` }}>
        {/* mascot peeking over the ticket */}
        <div style={{ position: "absolute", left: 860, top: -70 + (1 - peek) * 80, opacity: peek }}>
          <Mascot size={110} f={f} />
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", border: border(3), borderRadius: 28, boxShadow: hard(10), background: "#fff", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: "60px 70px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
              <div style={{ transform: `scale(${logo}) rotate(${(1 - logo) * -30}deg)` }}>
                <Logo size={130} notch="#fff" />
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 150, lineHeight: 1, letterSpacing: "-0.03em", opacity: lerp(f, 22, 32), transform: `translateX(${(1 - soft(f, 22)) * -40}px)` }}>Movents</div>
            </div>
            <div style={{ marginTop: 40, fontFamily: F.display, fontWeight: 700, fontSize: 50, lineHeight: 1.15, display: "flex", flexWrap: "wrap", columnGap: 15, maxWidth: 900 }}>
              {LINE.map((w, i) => {
                const p = soft(f, 36 + i * 4, 20);
                const hi = w === "WorkBuddy" || w === "Movents";
                return (
                  <span key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * 26}px)`, color: w === "WorkBuddy" ? "#0052D9" : hi ? C.tomatoInk : C.ink }}>
                    {w}
                  </span>
                );
              })}
            </div>
          </div>
          <div style={{ width: 320, background: C.tomato, borderLeft: `3px dashed ${C.ink}`, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
            <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: "0.2em" }}>ADMIT ALL</div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 44, lineHeight: 1, textAlign: "center" }}>
              Dormathon
              <br />
              2026
            </div>
            <div style={{ background: C.ink, color: "#fff", borderRadius: 10, padding: "8px 16px", fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: "0.14em" }}>TRACK 2</div>
            <div style={{ background: "#fff", padding: 8, border: border(2), borderRadius: 8 }}>
              <Barcode seed="dormathon" width={200} height={50} />
            </div>
          </div>
        </div>
        {/* notches */}
        {[-1, 1].map((s) => (
          <div key={s} style={{ position: "absolute", left: 1360 - 320 - 22, [s < 0 ? "top" : "bottom"]: -22, width: 44, height: 44, borderRadius: 22, background: C.bg, border: border(3) }} />
        ))}
        <div style={{ position: "absolute", left: 980, top: 395 }}>
          <Stamp f={f} start={78} color={C.green} size={30} rotate={-12}>Approved</Stamp>
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 50, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: "0.16em", color: C.muted, opacity: lerp(f, 90, 105) }}>
        DORMATHON 2026 · TRACK 2 · POWERED BY TENCENT WORKBUDDY
      </div>
      <Confetti f={f} start={40} x={960} y={420} n={90} spread={1500} seed="end" />
    </AbsoluteFill>
  );
}
