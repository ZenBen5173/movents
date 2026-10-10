import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TEAM } from "../data";
import { C, CONTENT, SCENES, border, hard } from "../theme";
import { count, lerp, mix, pop, soft } from "../ui/anim";
import { AppFrame, EVENT_PAGES } from "../ui/AppFrame";
import { F } from "../ui/fonts";
import { Icon } from "../ui/Icon";
import { Avatar, Chip, Kicker, Mono, Wristband } from "../ui/kit";
import { Camera, Cursor, type CurKey } from "../ui/motion";
import { WorkBuddyCursor, type WBChip, type WBKey } from "../ui/WorkBuddyCursor";
import type { GenTarget } from "../ui/Generate";
import { OverviewTab, OVERVIEW_GEN } from "./event/Overview";
import { TasksTab, TASKS_GEN } from "./event/Tasks";
import { RisksTab, RISKS_GEN } from "./event/Risks";
import { BudgetTab, BUDGET_GEN } from "./event/Budget";
import { SpeakersTab, SPEAKERS_GEN } from "./event/Speakers";
import { SuppliersTab, SUPPLIERS_GEN } from "./event/Suppliers";
import { MarketingTab, MARKETING_GEN } from "./event/Marketing";
import { InboxTab, INBOX_GEN } from "./event/Inbox";
import { RunOfShowTab, RUNOFSHOW_GEN } from "./event/RunOfShow";
import { FilesTab, FILES_GEN } from "./event/Files";
import { SponsorsTab, SPONSORS_GEN } from "./event/Sponsors";
import { MeetingsTab, MEET_CLICK, MEET_TASK_BTN, MEETINGS_GEN } from "./event/Meetings";

const TABS = [OverviewTab, TasksTab, RisksTab, BudgetTab, SpeakersTab, SuppliersTab, SponsorsTab, MarketingTab, InboxTab, MeetingsTab, RunOfShowTab, FilesTab];
/** WorkBuddy's click targets per tab (same order as TABS). */
const GENS: GenTarget[][] = [OVERVIEW_GEN, TASKS_GEN, RISKS_GEN, BUDGET_GEN, SPEAKERS_GEN, SUPPLIERS_GEN, SPONSORS_GEN, MARKETING_GEN, INBOX_GEN, MEETINGS_GEN, RUNOFSHOW_GEN, FILES_GEN];

/** Frames each tab is on screen. Sum = SCENES.event (the last one runs into the wipe). */
const TAB_LENS = [210, 87, 87, 87, 87, 87, 120, 87, 96, 135, 87, 90];
export const tabStart = (i: number) => TAB_LENS.slice(0, i).reduce((a, b) => a + b, 0);
const MEET_I = TABS.indexOf(MeetingsTab);

const TAB_Y = 172;
const TAB_H = 52;
export const TAB_CONTENT_Y = TAB_Y + TAB_H + 22;

const tabW = (label: string) => 44 + label.length * 8.6;
const TAB_X: number[] = [];
EVENT_PAGES.reduce((x, p, i) => {
  TAB_X[i] = x;
  return x + tabW(p.label) + 5;
}, 0);

/** WorkBuddy cursor path and status chips for the whole scene, in stage coords. */
const WB_PLAN = (() => {
  const ox = CONTENT.x;
  const oy = CONTENT.y + TAB_CONTENT_Y;
  const wbKeys: WBKey[] = [{ f: 18, x: 1990, y: 470 }];
  const wbChips: WBChip[] = [];
  GENS.forEach((gens, i) => {
    const s = tabStart(i);
    const end = s + TAB_LENS[i];
    gens.forEach((t) => {
      wbKeys.push({ f: s + t.at - 4, x: ox + t.x, y: oy + t.y });
      wbKeys.push({ f: s + t.at, x: ox + t.x, y: oy + t.y, click: true });
    });
    const withChip = gens.filter((t) => t.chip);
    withChip.forEach((t, k) => {
      const next = withChip[k + 1];
      wbChips.push({ from: Math.max(i === 0 ? 0 : s, s + t.at - 18), to: next ? s + next.at - 20 : Math.min(end - 4, s + gens[gens.length - 1].at + 28), text: t.chip! });
    });
  });
  return { wbKeys, wbChips };
})();

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
  const keys: CurKey[] = [{ f: 165, x: 1500, y: 860 }];
  for (let i = 1; i < TABS.length; i++) {
    const s = tabStart(i);
    keys.push({ f: s - 16, x: tabCX(i), y: tabCY + 4 });
    keys.push({ f: s, x: tabCX(i), y: tabCY + 4, click: true });
    keys.push({ f: s + 34, x: tabCX(i) + 40, y: tabCY + 84 });
    if (i === MEET_I) {
      // turn an action item into a task
      const bx = CONTENT.x + MEET_TASK_BTN.x;
      const by = CONTENT.y + TAB_CONTENT_Y + MEET_TASK_BTN.y;
      keys.push({ f: s + MEET_CLICK - 14, x: bx, y: by });
      keys.push({ f: s + MEET_CLICK, x: bx, y: by, click: true });
      keys.push({ f: s + MEET_CLICK + 22, x: bx + 70, y: by + 70 });
    }
  }

  const Cur = TABS[cur];
  const Prev = cur > 0 ? TABS[cur - 1] : null;
  const outT = cur > 0 ? lerp(f, tabStart(cur), tabStart(cur) + 7) : 1;

  // WorkBuddy's cursor: flies in from the right, then visits each tab's skeletons in turn
  const { wbKeys, wbChips } = WB_PLAN;

  // per-tab build progress (thin strip under the tab bar)
  const lf = f - tabStart(cur);
  const gens = GENS[cur];
  const prog = gens.reduce((a, g) => a + lerp(lf, g.at - 10, g.at + 8), 0) / gens.length;
  const lastAt = gens[gens.length - 1].at;
  const stripO = lerp(lf, lastAt + 16, lastAt + 28, 1, 0) * (cur === 0 ? lerp(f, 24, 32) : 1);
  const live = pop(f, 22, { damping: 14 });
  const pulse = 0.5 + 0.5 * Math.sin(f / 5);

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
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#eaf1ff", border: `1.5px solid ${C.wb}`, borderRadius: 99, padding: "4px 12px 4px 9px", transform: `scale(${live})`, opacity: Math.min(1, live * 1.5), boxShadow: "2px 2px 0 rgba(0,82,217,.35)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 5, background: C.wb, boxShadow: `0 0 0 ${2 + pulse * 4}px rgba(0,82,217,${0.32 - pulse * 0.22})` }} />
                  <Mono size={12} color={C.wb}>WorkBuddy · live</Mono>
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
              <div key={p.label} style={{ position: "absolute", left: TAB_X[i], width: tabW(p.label), top: 4, height: TAB_H - 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: F.body, fontSize: 15.5, fontWeight: i === cur ? 700 : 500, color: i === cur ? C.ink : C.muted, opacity: lerp(f, 14 + i * 1.6, 24 + i * 1.6), whiteSpace: "nowrap" }}>
                <Icon name={p.icon} size={16} color={i === cur ? C.tomato : C.muted} />
                {p.label}
              </div>
            ))}
          </div>

          {/* WorkBuddy build progress for this tab */}
          {stripO > 0 && (
            <div style={{ position: "absolute", top: TAB_Y + TAB_H + 7, left: 0, right: 0, height: 5, borderRadius: 3, background: "rgba(0,82,217,.12)", overflow: "hidden", opacity: stripO }}>
              <div style={{ width: `${prog * 100}%`, height: "100%", borderRadius: 3, background: C.wb, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, bottom: 0, width: 160, left: ((f * 14) % 1600) - 160, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.75), rgba(255,255,255,0))" }} />
              </div>
            </div>
          )}

          {/* tab content */}
          <div style={{ position: "absolute", top: TAB_CONTENT_Y, left: 0, right: 0, bottom: 0 }}>
            {Prev && outT < 1 && (
              <div style={{ position: "absolute", inset: 0, opacity: 1 - outT, transform: `translateY(${-outT * 14}px)` }}>
                <Prev f={f - tabStart(cur - 1)} />
              </div>
            )}
            <div style={{ position: "absolute", inset: 0, opacity: cur === 0 ? lerp(f, 8, 22) : outT }}>
              <Cur f={f - tabStart(cur)} />
            </div>
          </div>
        </AppFrame>
        <WorkBuddyCursor f={f} keys={wbKeys} chips={wbChips} seed="wb4" />
        <Cursor f={f} keys={keys} />
      </Camera>
      <Kicker n="04" label="Inside one event" f={f} x={1110} y={14} dur={SCENES.event} />
    </AbsoluteFill>
  );
}
