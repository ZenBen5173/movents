import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SPEAKERS } from "../data";
import { C, SCENES, border, hard } from "../theme";
import { EIO, lerp, pop, soft } from "../ui/anim";
import { AppFrame, UNI_PAGES } from "../ui/AppFrame";
import { DocThumb } from "../ui/DocThumb";
import { F } from "../ui/fonts";
import { Icon, type IconName } from "../ui/Icon";
import { Avatar, Kicker, Mono, Stamp, card } from "../ui/kit";
import { Camera } from "../ui/motion";

const S = (k: number) => 24 + k * 31;
const STEP_H = 108;

type Step = { title: string; who: string; when: string; desc: string; icon: IconName; extra?: (f: number) => ReactNode };

function Signature({ f, start, d }: { f: number; start: number; d: string }) {
  const p = lerp(f, start, start + 22);
  return (
    <svg width={150} height={40} viewBox="0 0 150 40">
      <path d={d} fill="none" stroke={C.blue} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={520} strokeDashoffset={520 * (1 - p)} />
    </svg>
  );
}

const STEPS: Step[] = [
  { title: "Plan event", who: "Committee", when: "8 weeks before", desc: "Objectives, date, budget and team", icon: "sparkles" },
  { title: "Pre-event proposal", who: "Committee", when: "6 weeks before", desc: "Fill the Student LIFE proposal template", icon: "file" },
  {
    title: "Student LIFE approval",
    who: "Student LIFE Office",
    when: "5 working days",
    desc: "Proposal reviewed",
    icon: "landmark",
    extra: (f) => <Stamp f={f} start={S(2) + 18} color={C.green} size={20}>Approved</Stamp>,
  },
  {
    title: "Signatures",
    who: "Two signatures",
    when: "Before booking",
    desc: "",
    icon: "edit",
    extra: (f) => (
      <div style={{ display: "flex", gap: 22 }}>
        {[
          { l: "President", d: "M6 28 C 18 6, 26 6, 22 26 S 40 30, 48 14 S 60 10, 62 24 C 66 34, 80 8, 92 18 S 110 26, 140 14" },
          { l: "Faculty advisor", d: "M6 24 C 14 4, 30 4, 28 22 C 26 34, 44 30, 54 12 C 60 4, 70 30, 84 22 S 104 6, 112 20 L 142 18" },
        ].map((s, i) => (
          <div key={s.l} style={{ textAlign: "center" }}>
            <Signature f={f} start={S(3) + 10 + i * 16} d={s.d} />
            <div style={{ borderTop: `1.5px solid ${C.ink}`, paddingTop: 2 }}>
              <Mono size={10}>{s.l}</Mono>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Speaker profiles",
    who: "Programme",
    when: "4 weeks before",
    desc: "Profile and declaration for each speaker",
    icon: "mic",
    extra: (f) => (
      <div style={{ display: "flex" }}>
        {SPEAKERS.map((s, i) => (
          <Avatar key={s.name} name={s.name} photo={s.photo} size={46} style={{ marginLeft: i ? -12 : 0, transform: `scale(${pop(f, S(4) + 8 + i * 4)})` }} />
        ))}
      </div>
    ),
  },
  { title: "Venue booking + floor plan", who: "Logistics", when: "3 weeks before", desc: "Book the room, submit the floor plan", icon: "building" },
  { title: "Event day", who: "Whole team", when: "15 Nov", desc: "Run of show, door check-in, photos", icon: "ticket" },
  { title: "Post-event report", who: "Committee", when: "Within 14 days", desc: "Attendance, spend and photos", icon: "book" },
];

export function S5Sop() {
  const f = useCurrentFrame();
  const head = soft(f, 4);
  const scroll = lerp(f, 138, 292, 0, 190, EIO);
  const docs = [
    { t: "Pre-event proposal", k: "Template · DOCX", a: C.tomato, v: "text" as const, at: S(1) + 6, step: 1, x: 0, y: 0, r: -3 },
    { t: "Speaker profile", k: "Template · DOCX", a: C.sky, v: "profile" as const, at: S(4) + 6, step: 4, x: 240, y: 30, r: 3 },
    { t: "Post-event report", k: "Template · DOCX", a: C.mint, v: "table" as const, at: S(7) + 6, step: 7, x: 110, y: 310, r: -2 },
  ];
  return (
    <AbsoluteFill>
      <Camera
        keys={[
          { f: 0, s: 1, x: 960, y: 540 },
          { f: 20, s: 1, x: 960, y: 540 },
          { f: 80, s: 1.04, x: 1000, y: 570 },
          { f: SCENES.sop, s: 1.04, x: 1000, y: 570 },
        ]}
      >
        <AppFrame crumbs={["Movents", "Universities", "Sunway University", "SOP library"]} f={f} sidebar={{ active: "u:SOP library", openUni: true, backstage: 2 }}>
          <div style={{ opacity: head, transform: `translateY(${(1 - head) * 20}px)`, display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 66, height: 66, borderRadius: 16, background: C.sky, border: border(2), boxShadow: hard(3), display: "grid", placeItems: "center" }}>
              <Icon name="landmark" size={34} />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 46, lineHeight: 1.05 }}>Sunway University</div>
              <div style={{ fontSize: 18, color: C.muted, marginTop: 2 }}>Student LIFE event procedure · 8 steps · followed for every event</div>
            </div>
          </div>
          <div style={{ position: "absolute", top: 98, left: 0, right: 0, height: 48, borderBottom: `2px solid ${C.ink}`, display: "flex", gap: 30, opacity: soft(f, 10) }}>
            {UNI_PAGES.map((p, i) => (
              <div key={p.label} style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, fontSize: 17.5, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? C.ink : C.muted }}>
                <Icon name={p.icon} size={18} color={i === 0 ? C.tomato : C.muted} />
                {p.label}
                {i === 0 && <div style={{ position: "absolute", left: 0, right: 0, bottom: -3, height: 4, background: C.tomato }} />}
              </div>
            ))}
          </div>

          {/* flow */}
          <div style={{ position: "absolute", top: 166, left: 0, width: 880, bottom: 0, overflow: "hidden" }}>
            <div style={{ position: "relative", transform: `translateY(${-scroll}px)`, paddingTop: 8 }}>
              {STEPS.map((s, k) => {
                const p = pop(f, S(k), { damping: 14 });
                const done = f >= S(k) + 26;
                const line = lerp(f, S(k) + 6, S(k + 1));
                return (
                  <div key={s.title} style={{ position: "relative", height: STEP_H }}>
                    {k < STEPS.length - 1 && (
                      <div style={{ position: "absolute", left: 27 - 1.5, top: 56, width: 3, height: (STEP_H - 54) * line + 2, background: C.ink }} />
                    )}
                    <div style={{ position: "absolute", left: 0, top: 4, width: 54, height: 54, borderRadius: 27, border: border(2.5), background: done ? C.green : f >= S(k) ? C.tomato : "#fff", display: "grid", placeItems: "center", fontFamily: F.display, fontWeight: 700, fontSize: 22, transform: `scale(${0.4 + 0.6 * p})`, boxShadow: hard(2), color: done ? "#fff" : C.ink }}>
                      {done ? <Icon name="check" size={26} stroke={3.4} color="#fff" /> : k + 1}
                    </div>
                    <div style={{ position: "absolute", left: 80, top: 0, width: 780, height: STEP_H - 16, ...card(4), display: "flex", alignItems: "center", gap: 16, padding: "0 20px", opacity: Math.min(1, p * 1.4), transform: `translateX(${(1 - p) * 80}px)` }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: [C.peach, C.sun, C.mint, C.sky][k % 4], border: border(2), display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <Icon name={s.icon} size={22} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 23 }}>{s.title}</div>
                        <div style={{ fontSize: 15.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.who}
                          {s.desc ? ` · ${s.desc}` : ""}
                        </div>
                      </div>
                      {s.extra && <div style={{ flexShrink: 0 }}>{s.extra(f)}</div>}
                      <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: border(1.5), borderRadius: 99, padding: "3px 10px", background: C.bg, whiteSpace: "nowrap", flexShrink: 0 }}>{s.when}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* templates */}
          <div style={{ position: "absolute", top: 166, left: 920, right: 0, bottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: soft(f, S(1)) }}>
              <Mono color={C.ink}>Templates</Mono>
              <Mono size={11}>from Student LIFE</Mono>
            </div>
            <div style={{ position: "relative", marginTop: 18 }}>
              {docs.map((d) => {
                const p = pop(f, d.at, { damping: 13 });
                const active = f >= d.at && f < S(d.step) + 60 ? 1 : 0;
                const glow = lerp(f, d.at, d.at + 10) * (active ? 1 : 0);
                return (
                  <div key={d.t} style={{ position: "absolute", left: d.x, top: d.y, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * 300}px) rotate(${d.r + (1 - p) * 20}deg) scale(${1 + glow * 0.05})`, zIndex: active ? 2 : 1 }}>
                    <div style={{ borderRadius: 14, outline: glow > 0 ? `4px solid rgba(255,90,54,${glow})` : undefined, outlineOffset: 4 }}>
                      <DocThumb title={d.t} kind={d.k} accent={d.a} w={220} p={lerp(f, d.at + 4, d.at + 40)} variant={d.v} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </AppFrame>
      </Camera>
      <Kicker n="05" label="The university's SOP, built in" f={f} x={1110} y={14} dur={SCENES.sop} />
    </AbsoluteFill>
  );
}
