import { C, border, hard } from "../../theme";
import { blink, lerp, pop, soft, typed } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Icon } from "../../ui/Icon";
import { Avatar, Chip, Mono, Skel, card } from "../../ui/kit";
import { Generate, SkCircle, SkLine, type GenTarget } from "../../ui/Generate";

const LEFT_W = 520;
const GAP = 24;
const PANEL_X = LEFT_W + GAP;
const PANEL_W = 1400 - PANEL_X;
const PANEL_PAD = 24;
const ACT_Y = 286; // first action row, inside the panel
const ACT_H = 62;
const BTN_W = 112;
const BTN_H = 36;

/** Frame (local to the tab) when the cursor clicks "+ Task". */
export const MEET_CLICK = 94;
/** Centre of that "+ Task" button, in page-content coordinates (tab content origin). */
export const MEET_TASK_BTN = { x: PANEL_X + PANEL_W - PANEL_PAD - 2 - BTN_W / 2, y: ACT_Y + 2 + ACT_H / 2 };

const PEOPLE = [
  { n: "Wei Ling Chong", short: "Wei Ling", i: 0 },
  { n: "Priya Nair", short: "Priya", i: 1 },
  { n: "Jason Tan", short: "Jason", i: 2 },
  { n: "Arjun Menon", short: "Arjun", i: 3 },
];

const DECISIONS = [
  { t: "Go with Mix Mix Catering", at: 22 },
  { t: "Ask Selat Bank for RM5,000", at: 38 },
];
const ACTIONS = [
  { t: "Confirm 150 pax with Mix Mix Catering", who: 2, due: "16 Oct", at: 54 },
  { t: "Send sponsor proposal to Selat Bank", who: 0, due: "14 Oct", at: 62 },
  { t: "Post the speaker line-up on IG", who: 3, due: "18 Oct", at: 70 },
];

// calendar: Mon 5 Oct to Sun 15 Nov 2026 (6 weeks)
const dayOf = (k: number) => (k <= 26 ? { d: 5 + k, m: "Oct" } : { d: k - 26, m: "Nov" });
const TODAY = 6; // Sun 11 Oct
const NEXT = 8; // Tue 13 Oct
const EVENT = 41; // Sun 15 Nov
const MEETS = [1, 8, 15, 22, 29, 36]; // Tuesdays
const REHEARSAL = 40; // Sat 14 Nov

// countdown from Sun 11 Oct, 9:45:51 AM to Tue 13 Oct, 4:00 PM
const T0 = 2 * 86400 + 6 * 3600 + 14 * 60 + 9;
const pad = (n: number) => String(n).padStart(2, "0");

function NextMeeting({ f }: { f: number }) {
  const p = pop(f, 4, { damping: 14 });
  const left = T0 - Math.floor(f / 30);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  return (
    <div style={{ display: "flex", height: 222, border: border(2), borderRadius: 16, overflow: "hidden", boxShadow: hard(5), background: "#fff", transform: `translateY(${(1 - p) * 40}px) rotate(${(1 - p) * -4}deg)`, opacity: Math.min(1, p * 1.5) }}>
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column" }}>
        <Mono size={11.5}>Next meeting</Mono>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 34, lineHeight: 1.1, marginTop: 2 }}>Weekly sync</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {[
            { i: "calendar" as const, t: "Tue 13 Oct" },
            { i: "clock" as const, t: "4:00 PM" },
            { i: "video" as const, t: "Zoom" },
          ].map((c, k) => (
            <div key={c.t} style={{ opacity: soft(f, 10 + k * 4), transform: `translateY(${(1 - soft(f, 10 + k * 4)) * 10}px)` }}>
              <Chip style={{ fontSize: 14.5, padding: "3px 9px" }}>
                <Icon name={c.i} size={15} />
                {c.t}
              </Chip>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex" }}>
            {PEOPLE.map((a, k) => {
              const q = pop(f, 18 + k * 4);
              return <Avatar key={a.n} name={a.n} i={a.i} size={36} style={{ marginLeft: k ? -10 : 0, transform: `scale(${q}) translateY(${(1 - q) * 8}px)`, boxShadow: hard(2) }} />;
            })}
          </div>
          <span style={{ fontSize: 14, color: C.muted, opacity: lerp(f, 30, 38) }}>Wei Ling, Priya, Jason, Arjun</span>
        </div>
      </div>
      <div style={{ width: 150, background: C.tomato, borderLeft: `2px dashed ${C.ink}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <Mono size={11} color={C.ink}>Starts in</Mono>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 40, lineHeight: 1 }}>2d 6h</div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 15, background: "#fff", border: border(1.5), borderRadius: 7, padding: "1px 7px" }}>
          {pad(m)}m {pad(s)}s
        </div>
      </div>
    </div>
  );
}

function MiniCal({ f }: { f: number }) {
  const cw = 68;
  const ch = 37;
  const p = soft(f, 10);
  return (
    <div style={{ ...card(4), padding: "12px 16px 14px", opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Mono color={C.ink}>Oct to Nov 2026</Mono>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.muted }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: C.blue, border: border(1) }} /> Meeting
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.muted }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: C.tomato, border: border(1) }} /> Event day
        </span>
      </div>
      <div style={{ display: "flex", marginTop: 8 }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} style={{ width: cw, textAlign: "center" }}>
            <Mono size={10.5}>{d}</Mono>
          </div>
        ))}
      </div>
      <div style={{ position: "relative", height: ch * 6, marginTop: 4 }}>
        {Array.from({ length: 42 }).map((_, k) => {
          const col = k % 7;
          const row = Math.floor(k / 7);
          const { d, m } = dayOf(k);
          const o = lerp(f, 12 + row * 3 + col, 20 + row * 3 + col);
          const meet = MEETS.includes(k) || k === REHEARSAL;
          const dot = meet ? pop(f, 30 + MEETS.indexOf(k === REHEARSAL ? 36 : k) * 4 + (k === REHEARSAL ? 6 : 0)) : 0;
          const ev = k === EVENT ? pop(f, 50, { damping: 10 }) : 0;
          const next = k === NEXT;
          const pulse = next ? 0.5 + 0.5 * Math.sin(f / 6) : 0;
          return (
            <div key={k} style={{ position: "absolute", left: col * cw, top: row * ch, width: cw, height: ch, display: "grid", placeItems: "center", opacity: o }}>
              {k === EVENT && (
                <div style={{ position: "absolute", left: 10, right: 10, top: 2, bottom: 2, borderRadius: 9, background: C.tomato, border: border(2), boxShadow: hard(2), transform: `scale(${ev}) rotate(${(1 - ev) * -12}deg)` }} />
              )}
              {next && <div style={{ position: "absolute", left: 14, right: 14, top: 3, bottom: 3, borderRadius: 9, background: C.sun, border: border(1.5), boxShadow: `0 0 0 ${2 + pulse * 3}px rgba(255,216,77,${0.5 - pulse * 0.3})` }} />}
              {k === TODAY && <div style={{ position: "absolute", left: 16, right: 16, top: 4, bottom: 4, borderRadius: 9, border: `2px dashed ${C.ink}` }} />}
              <span style={{ position: "relative", fontFamily: F.mono, fontWeight: 700, fontSize: 13.5, color: k < TODAY ? "#b4ad9f" : C.ink, marginTop: -8 * Math.min(1, dot) }}>{d}</span>
              {d === 1 && m === "Nov" && <span style={{ position: "absolute", left: 4, top: 1, fontFamily: F.mono, fontWeight: 700, fontSize: 9, color: C.tomatoInk }}>NOV</span>}
              {meet && <span style={{ position: "absolute", bottom: 5, left: cw / 2 - 4, width: 8, height: 8, borderRadius: 4, background: k === REHEARSAL ? C.sun : k < TODAY ? "#b4ad9f" : C.blue, border: border(1), transform: `scale(${dot})` }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** `f` is shifted so the minutes start writing when WorkBuddy clicks; `real` is the tab frame (for the user's click). */
function Minutes({ f, real }: { f: number; real: number }) {
  const clicked = real >= MEET_CLICK;
  const morph = pop(real, MEET_CLICK, { damping: 12 });
  return (
    <div style={{ position: "relative", height: 556, ...card(5), padding: `18px ${PANEL_PAD}px` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Mono color={C.ink}>Meeting minutes</Mono>
        <Mono size={11}>Weekly sync · Tue 6 Oct</Mono>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 24, height: 24, borderRadius: 7, background: C.wb, color: "#fff", display: "grid", placeItems: "center", fontFamily: F.display, fontWeight: 700, fontSize: 10 }}>WB</span>
          <Mono size={10.5} color={C.blue}>Summarised by WorkBuddy</Mono>
        </span>
      </div>
      <div style={{ fontSize: 15, color: C.muted, marginTop: 8 }}>Present: Wei Ling, Priya, Jason, Arjun · 32 min on Zoom</div>
      <div style={{ borderTop: `1.5px dashed ${C.line}`, marginTop: 14 }} />

      <div style={{ marginTop: 14 }}>
        <Mono size={12} color={C.ink}>Decisions</Mono>
      </div>
      {DECISIONS.map((d, i) => {
        const on = f >= d.at;
        const tick = pop(f, d.at + Math.ceil(d.t.length / 1.6));
        const txt = typed(d.t, f, d.at, 1.6);
        const typing = on && txt.length < d.t.length;
        return (
          <div key={d.t} style={{ display: "flex", alignItems: "center", gap: 12, height: 42, marginTop: i ? 0 : 6, opacity: on ? 1 : 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, border: border(2), background: tick > 0.2 ? C.green : "#fff", display: "grid", placeItems: "center", transform: `scale(${1 + Math.sin(Math.min(1, tick) * Math.PI) * 0.2})` }}>
              {tick > 0.2 && <Icon name="check" size={15} stroke={3.2} color="#fff" />}
            </div>
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 21 }}>
              {txt}
              {typing && blink(f) && <span style={{ display: "inline-block", width: 2.5, height: 20, background: C.ink, marginLeft: 2, verticalAlign: "text-bottom" }} />}
            </span>
          </div>
        );
      })}

      <div style={{ position: "absolute", left: PANEL_PAD, top: ACT_Y - 30 }}>
        <Mono size={12} color={C.ink} style={{ opacity: lerp(f, 50, 56) }}>Action items</Mono>
      </div>
      {ACTIONS.map((a, i) => {
        const q = soft(f, a.at);
        const btn = pop(f, 76 + i * 3);
        const who = PEOPLE[a.who];
        const isClicked = i === 0 && clicked;
        return (
          <div key={a.t} style={{ position: "absolute", left: PANEL_PAD, right: PANEL_PAD, top: ACT_Y + i * ACT_H, height: ACT_H, display: "flex", alignItems: "center", gap: 14, borderTop: `1.5px solid ${C.line}`, opacity: q, transform: `translateX(${(1 - q) * -30}px)` }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: border(2), background: "#fff", flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 17.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden" }}>{typed(a.t, f, a.at, 2.6)}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, width: 130 }}>
              <Avatar name={who.n} i={who.i} size={28} />
              <span style={{ fontSize: 15 }}>{who.short}</span>
            </span>
            <span style={{ width: 70 }}>
              <Mono size={11.5} color={C.ink}>{a.due}</Mono>
            </span>
            <div style={{ width: BTN_W, height: BTN_H, position: "relative", flexShrink: 0 }}>
              {!isClicked ? (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: border(1.5), borderRadius: 10, background: i === 0 && real >= MEET_CLICK - 8 ? C.sun : "#fff", fontWeight: 700, fontSize: 15, transform: `scale(${btn})`, boxShadow: hard(2) }}>
                  <Icon name="plus" size={15} stroke={2.6} />
                  Task
                </div>
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: border(1.5), borderRadius: 99, background: C.mint, fontFamily: F.mono, fontWeight: 700, fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", transform: `scale(${0.6 + 0.4 * morph})`, boxShadow: hard(2) }}>
                  <Icon name="check" size={14} stroke={3} color={C.green} />
                  In Tasks
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* task chip that drops out of the clicked row */}
      {clicked && (
        <div style={{ position: "absolute", right: PANEL_PAD, top: ACT_Y + 3 * ACT_H + 18, display: "flex", alignItems: "center", gap: 10, ...card(3), background: C.sun, padding: "8px 14px", transform: `translateY(${(1 - morph) * -40}px) scale(${0.8 + 0.2 * morph}) rotate(${-1.5 * morph}deg)`, opacity: Math.min(1, morph * 1.5) }}>
          <Icon name="tasks" size={18} />
          <span style={{ fontWeight: 700, fontSize: 15.5 }}>Task added: Confirm 150 pax with Mix Mix Catering</span>
          <Mono size={10.5} color={C.ink}>Jason · 16 Oct</Mono>
        </div>
      )}
    </div>
  );
}

export const MEETINGS_GEN: GenTarget[] = [
  { at: 14, x: PANEL_X + PANEL_W / 2 - 60, y: 170, chip: "writing minutes…" },
  { at: 48, x: 240, y: 112, chip: "booking the next sync…" },
  { at: 62, x: 240, y: 392 },
];
const [A_MIN, A_NEXT, A_CAL] = MEETINGS_GEN.map((g) => g.at);

export function MeetingsTab({ f }: { f: number }) {
  return (
    <div style={{ position: "relative", height: 600 }}>
      <div style={{ width: LEFT_W, display: "flex", flexDirection: "column", gap: 20 }}>
        <Generate
          f={f}
          at={A_NEXT}
          pad="16px 20px"
          seed="nextmeet"
          skel={
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Skel w={110} h={10} f={f} />
              <Skel w={220} h={28} f={f} />
              <SkLine f={f} ws={[100, 80, 70]} h={24} gap={8} />
              <SkLine f={f} ws={[34, 34, 34, 34]} h={34} gap={2} style={{ marginTop: 22 }} />
            </div>
          }
        >
          <NextMeeting f={f - A_NEXT + 4} />
        </Generate>
        <Generate
          f={f}
          at={A_CAL}
          pad="12px 16px"
          seed="minical"
          skel={
            <div>
              <Skel w={160} h={11} f={f} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "14px 18px", marginTop: 22, padding: "0 10px" }}>
                {Array.from({ length: 42 }).map((_, k) => (
                  <Skel key={k} w={30} h={16} r={6} f={f} />
                ))}
              </div>
            </div>
          }
        >
          <MiniCal f={f - A_CAL + 10} />
        </Generate>
      </div>
      <Generate
        f={f}
        at={A_MIN}
        pad={`18px ${PANEL_PAD}px`}
        seed="minutes"
        sparks={22}
        style={{ position: "absolute", left: PANEL_X, top: 0, width: PANEL_W, height: 556 }}
        skel={
          <div>
            <SkLine f={f} ws={[170, 200]} h={11} />
            <Skel w={400} h={12} f={f} style={{ marginTop: 14 }} />
            <Skel w={100} h={10} f={f} style={{ marginTop: 32 }} />
            {[300, 260].map((w, k) => (
              <SkLine key={k} f={f} ws={[24, w]} h={k === 0 ? 24 : 18} gap={12} style={{ marginTop: 16 }} />
            ))}
            <Skel w={120} h={10} f={f} style={{ marginTop: 40 }} />
            {[0, 1, 2].map((k) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 14, height: ACT_H, borderTop: `1.5px solid ${C.line}`, marginTop: k ? 0 : 12 }}>
                <Skel w={22} h={22} r={6} f={f} />
                <Skel w={340 - k * 40} h={14} f={f} />
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
                  <SkCircle f={f} size={28} />
                  <Skel w={70} h={12} f={f} />
                  <Skel w={BTN_W} h={BTN_H} r={10} f={f} />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <Minutes f={f - 6} real={f} />
      </Generate>
    </div>
  );
}
