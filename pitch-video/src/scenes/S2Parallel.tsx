import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BRIEFS } from "../data";
import { C, SCENES, border, hard } from "../theme";
import { EIO, lerp, mix, pop } from "../ui/anim";
import { F } from "../ui/fonts";
import { WorkBuddyWindow } from "../ui/WorkBuddyWindow";
import { chatState } from "./chatTimeline";
import { DeskBackdrop, PLANS, WB_POS } from "./S1Prompt";

const WW = 1560;
const WH = 880;
const GAP = 40;

export function S2Parallel() {
  const g = useCurrentFrame();
  const p = lerp(g, 4, 66, 0, 1, EIO);
  const worldW = WW * 2 + GAP;
  const worldH = WH * 2 + GAP;
  const s1 = 0.565;
  const s = mix(1, s1, p);
  const tx = mix(WB_POS.x, 960 - (worldW / 2) * s1, p);
  const ty = mix(WB_POS.y, 540 - (worldH / 2) * s1, p);
  const others = lerp(g, 8, 34);
  const sticker = pop(g, 150, { damping: 11 });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <DeskBackdrop />
      <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
        {BRIEFS.map((b, i) => {
          const x = (i % 2) * (WW + GAP);
          const y = Math.floor(i / 2) * (WH + GAP);
          const st = chatState(b, PLANS[i], i === 0 ? g + SCENES.prompt : g);
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, opacity: i === 0 ? 1 : others, transform: i === 0 ? undefined : `translateY(${(1 - others) * 60}px)` }}>
              <WorkBuddyWindow {...st} />
            </div>
          );
        })}
      </div>

      {g >= 150 && (
        <div style={{ position: "absolute", left: 960 - 130, top: 540 - 130, width: 260, height: 260, borderRadius: "50%", background: C.sun, border: border(3), boxShadow: hard(6), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${sticker}) rotate(${-8 + Math.sin(g / 20) * 3}deg)`, zIndex: 20 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 92, lineHeight: 0.9 }}>4</div>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 17, letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center", lineHeight: 1.3 }}>
            events
            <br />
            in parallel
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
