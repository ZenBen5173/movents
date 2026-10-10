import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TEAM } from "../data";
import { C, CONTENT, SCENES, border, hard } from "../theme";
import { count, lerp, mix, pop, soft } from "../ui/anim";
import { AppFrame, EVENT_PAGES } from "../ui/AppFrame";
import { F } from "../ui/fonts";
import { Icon } from "../ui/Icon";
import { Avatar, Chip, Kicker, Mono, Wristband } from "../ui/kit";
import { Camera, Cursor, type CurKey } from "../ui/motion";
import { OverviewTab } from "./event/Overview";
import { TasksTab } from "./event/Tasks";
import { RisksTab } from "./event/Risks";
import { BudgetTab } from "./event/Budget";
import { SpeakersTab } from "./event/Speakers";
import { SuppliersTab } from "./event/Suppliers";
import { MarketingTab } from "./event/Marketing";
import { InboxTab } from "./event/Inbox";
import { RunOfShowTab } from "./event/RunOfShow";
import { FilesTab } from "./event/Files";

const TABS = [OverviewTab, TasksTab, RisksTab, BudgetTab, SpeakersTab, SuppliersTab, MarketingTab, InboxTab, RunOfShowTab, FilesTab];

const OVERVIEW_LEN = 225;
const TAB_LEN = 105;
export const tabStart = (i: number) => (i === 0 ? 0 : OVERVIEW_LEN + (i - 1) * TAB_LEN);

const TAB_Y = 172;
const TAB_H = 52;
export const TAB_CONTENT_Y = TAB_Y + TAB_H + 22;

const tabW = (label: string) => 62 + label.length * 9.4;
const TAB_X: number[] = [];
EVENT_PAGES.reduce((x, p, i) => {
  TAB_X[i] = x;
  return x + tabW(p.label) + 6;
}, 0);

export function S4Event() {
  const f = useCurrentFrame();
  let cur = 0;
  for (let i = 0; i < TABS.length; i++) if (f >= tabStart(i)) cur = i;
  const prev = Math.max(0, cur - 1);
  const slide = cur === 0 ? 1 : lerp(f, tabStart(cur), tabStart(cur) + 12);
  const indX = mix(TAB_X[prev], TAB_X[cur], slide);
  const indW = mix(tabW(EVENT_PAGES[prev].label), tabW(EVENT_PAGES[cur].label), slide);

  const head = soft(f, 4);
  const tabsIn = soft(f, 14);

  // cursor visits each tab
  const tabCY = CONTENT.y + TAB_Y + TAB_H / 2;
  const tabCX = (i: number) => CONTENT.x + TAB_X[i] + tabW(EVENT_PAGES[i].label) / 2;
  const keys: CurKey[] = [{ f: 190, x: 1500, y: 860 }];
  for (let i = 1; i < TABS.length; i++) {
    const s = tabStart(i);
    keys.push({ f: s - 16, x: tabCX(i), y: tabCY + 4 });
    keys.push({ f: s, x: tabCX(i), y: tabCY + 4, click: true });
    keys.push({ f: s + 34, x: tabCX(i) + 60, y: tabCY + 150 });
  }

  const Cur = TABS[cur];
  const Prev = cur > 0 ? TABS[cur - 1] : null;
  const outT = cur > 0 ? lerp(f, tabStart(cur), tabStart(cur) + 7) : 1;

  return (
    <AbsoluteFill>
      <Camera
        keys={[
          { f: 0, s: 1, x: 960, y: 540 },
          { f: 20, s: 1, x: 960, y: 540 },
          { f: 70, s: 1.04, x: 1000, y: 560 },
          { f: SCENES.event, s: 1.04, x: 1000, y: 560 },
        ]}
      >
        <AppFrame
          crumbs={["Movents", "Projects", "AI Talk @ Sunway", EVENT_PAGES[cur].label]}
          f={f}
          sidebar={{ active: `p:${EVENT_PAGES[cur].label}`, activeFrom: cur > 0 ? `p:${EVENT_PAGES[prev].label}` : undefined, activeT: slide, openProject: true, backstage: 2 }}
        >
          {/* project header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", opacity: head, transform: `translateY(${(1 - head) * 24}px)` }}>
            <div>
              <Mono>Project · Talk · Created by WorkBuddy</Mono>
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 6 }}>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 54, lineHeight: 1.05 }}>AI Talk @ Sunway</div>
                <div style={{ transform: `scale(${pop(f, 16)})` }}>
                  <Wristband label="Planning" bg={C.sun} size={13} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                {[
                  { i: "calendar" as const, t: "15 Nov 2026 · 2:00 PM" },
                  { i: "pin" as const, t: "Rooftop Terrace, Sunway University" },
                  { i: "users" as const, t: "150 pax" },
                  { i: "wallet" as const, t: "RM3,000 cap" },
                ].map((c, k) => (
                  <div key={k} style={{ opacity: soft(f, 18 + k * 5), transform: `translateY(${(1 - soft(f, 18 + k * 5)) * 12}px)` }}>
                    <Chip>
                      <Icon name={c.i} size={17} />
                      {c.t}
                    </Chip>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
              <div>
                <Mono size={11.5}>Team</Mono>
                <div style={{ display: "flex", marginTop: 8 }}>
                  {TEAM.map((m, k) => {
                    const p = pop(f, 22 + k * 5);
                    return <Avatar key={m.name} name={m.name} i={k} size={48} style={{ marginLeft: k ? -12 : 0, transform: `scale(${p}) translateY(${(1 - p) * 10}px)`, boxShadow: hard(2) }} />;
                  })}
                </div>
              </div>
              <div style={{ display: "flex", border: border(2), borderRadius: 14, overflow: "hidden", boxShadow: hard(4), transform: `rotate(${(1 - pop(f, 30)) * 10 + 2}deg) scale(${pop(f, 30)})` }}>
                <div style={{ background: C.tomato, padding: "10px 16px", textAlign: "center", borderRight: `2px dashed ${C.ink}` }}>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 44, lineHeight: 1 }}>{count(f, 30, 30, 36)}</div>
                  <Mono size={11} color={C.ink}>days to go</Mono>
                </div>
                <div style={{ background: "#fff", padding: "10px 14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Mono size={11}>Admit</Mono>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22 }}>150</div>
                </div>
              </div>
            </div>
          </div>

          {/* tab bar */}
          <div style={{ position: "absolute", top: TAB_Y, left: 0, right: 0, height: TAB_H, borderBottom: `2px solid ${C.ink}`, opacity: tabsIn }}>
            <div style={{ position: "absolute", left: indX, width: indW, top: 4, height: TAB_H - 10, background: "#fff", border: border(2), borderRadius: 11, boxShadow: hard(3) }} />
            <div style={{ position: "absolute", left: indX + 14, width: indW - 28, bottom: -2, height: 4, background: C.tomato }} />
            {EVENT_PAGES.map((p, i) => (
              <div key={p.label} style={{ position: "absolute", left: TAB_X[i], width: tabW(p.label), top: 4, height: TAB_H - 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: F.body, fontSize: 17, fontWeight: i === cur ? 700 : 500, color: i === cur ? C.ink : C.muted, opacity: lerp(f, 14 + i * 2, 24 + i * 2), whiteSpace: "nowrap" }}>
                <Icon name={p.icon} size={17} color={i === cur ? C.tomato : C.muted} />
                {p.label}
              </div>
            ))}
          </div>

          {/* tab content */}
          <div style={{ position: "absolute", top: TAB_CONTENT_Y, left: 0, right: 0, bottom: 0 }}>
            {Prev && outT < 1 && (
              <div style={{ position: "absolute", inset: 0, opacity: 1 - outT, transform: `translateY(${-outT * 14}px)` }}>
                <Prev f={f - tabStart(cur - 1)} />
              </div>
            )}
            <div style={{ position: "absolute", inset: 0, opacity: cur === 0 ? 1 : outT }}>
              <Cur f={f - tabStart(cur)} />
            </div>
          </div>
        </AppFrame>
        <Cursor f={f} keys={keys} />
      </Camera>
      <Kicker n="04" label="Inside one event" f={f} x={1110} y={14} dur={SCENES.event} />
    </AbsoluteFill>
  );
}
