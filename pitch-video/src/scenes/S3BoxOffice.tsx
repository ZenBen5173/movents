import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BOX_ROWS } from "../data";
import { C, CONTENT, SCENES, border, hard } from "../theme";
import { count, lerp, money, pop, soft, typed } from "../ui/anim";
import { AppFrame } from "../ui/AppFrame";
import { F } from "../ui/fonts";
import { Icon } from "../ui/Icon";
import { Bar, Kicker, Mono, Note, Skel, card } from "../ui/kit";
import { Camera, Cursor } from "../ui/motion";

const COLS = [430, 180, 250, 170, 200, 150];
const HEADS = ["Event", "Countdown", "Progress", "Budget used", "Speakers", "Budget"];
const TABLE_Y = 250;
const HEAD_H = 52;
const ROW_H = 120;

const base = (i: number) => 40 + i * 22;

function Cell({ w, children }: { w: number; children: ReactNode }) {
  return <div style={{ width: w, flexShrink: 0, paddingRight: 18 }}>{children}</div>;
}

function Spinner({ f, color = C.tomato }: { f: number; color?: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 20 20" style={{ transform: `rotate(${f * 14}deg)` }}>
      <circle cx="10" cy="10" r="7.5" fill="none" stroke={C.line} strokeWidth="3" />
      <path d="M10 2.5 A7.5 7.5 0 0 1 17.5 10" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Row({ i, f, hover }: { i: number; f: number; hover: number }) {
  const r = BOX_ROWS[i];
  const b = base(i);
  const enter = pop(f, b, { damping: 16 });
  const nameStart = b + 34;
  const name = typed(r.title, f, nameStart, 0.75);
  const nameDone = f >= nameStart + r.title.length / 0.75;
  const t = { count: b + 70, prog: b + 84, bud: b + 98, sp: b + 112, money: b + 126, done: b + 200 };
  const working = f < t.done;
  return (
    <div style={{ height: ROW_H, display: "flex", alignItems: "center", padding: "0 24px", borderTop: `1.5px solid ${C.line}`, opacity: enter, transform: `translateY(${(1 - enter) * 30}px)`, background: hover > 0 ? `rgba(255,216,77,${0.35 * hover})` : "transparent" }}>
      <Cell w={COLS[0]}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: f >= nameStart ? r.dot : C.line, border: border(1.5), flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {f < nameStart ? (
              <Skel w={220} h={20} f={f} />
            ) : (
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 25, whiteSpace: "nowrap" }}>
                {name}
                {!nameDone && <span style={{ display: "inline-block", width: 3, height: 24, background: C.tomato, marginLeft: 3, verticalAlign: "middle" }} />}
              </div>
            )}
            <div style={{ marginTop: 8 }}>{f < nameStart + 22 ? <Skel w={160} h={11} f={f} /> : <Mono size={12.5} style={{ opacity: lerp(f, nameStart + 22, nameStart + 32) }}>{r.meta}</Mono>}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, border: border(1.5), borderRadius: 99, padding: "4px 10px", background: working ? "#fff" : C.mint, opacity: lerp(f, b + 10, b + 20) }}>
            {working ? <Spinner f={f} /> : <Icon name="check" size={14} stroke={3} color={C.green} />}
            <Mono size={11} color={C.ink}>{working ? "WorkBuddy" : "Planned"}</Mono>
          </div>
        </div>
      </Cell>
      <Cell w={COLS[1]}>
        {f < t.count ? (
          <Skel w={110} h={44} f={f} r={10} />
        ) : (
          <div style={{ display: "inline-flex", alignItems: "stretch", border: border(2), borderRadius: 10, overflow: "hidden", transform: `rotate(${(1 - pop(f, t.count)) * -12}deg) scale(${0.6 + 0.4 * pop(f, t.count)})`, boxShadow: hard(2) }}>
            <span style={{ background: C.sun, padding: "6px 10px", fontFamily: F.display, fontWeight: 700, fontSize: 26, borderRight: `2px dashed ${C.ink}`, minWidth: 54, textAlign: "center" }}>{count(f, t.count, 24, r.days)}</span>
            <span style={{ padding: "6px 9px", display: "grid", placeItems: "center", background: "#fff" }}>
              <Mono size={11} color={C.ink}>days</Mono>
            </span>
          </div>
        )}
      </Cell>
      <Cell w={COLS[2]}>
        {f < t.prog ? (
          <Skel w={200} h={14} f={f} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Bar value={lerp(f, t.prog, t.prog + 50) * r.progress} style={{ flex: 1 }} height={14} />
            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 16, width: 46 }}>{Math.round(lerp(f, t.prog, t.prog + 50) * r.progress * 100)}%</span>
          </div>
        )}
      </Cell>
      <Cell w={COLS[3]}>
        {f < t.bud ? (
          <Skel w={120} h={14} f={f} />
        ) : (
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24 }}>{count(f, t.bud, 30, r.budgetUsed)}%</div>
            <Bar value={lerp(f, t.bud, t.bud + 30) * (r.budgetUsed / 100)} color={C.green} height={8} style={{ marginTop: 5, width: 110 }} />
          </div>
        )}
      </Cell>
      <Cell w={COLS[4]}>
        {f < t.sp ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skel w={140} h={12} f={f} />
            <Skel w={110} h={12} f={f} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: F.body, fontSize: 16.5 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="search" size={16} />
              <b>{count(f, t.sp, 26, r.found)}</b> researched
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, opacity: lerp(f, t.sp + 20, t.sp + 30) }}>
              <Icon name="mail" size={16} color={C.tomatoInk} />
              <b>{count(f, t.sp + 20, 30, r.reached)}</b> reached out
            </span>
          </div>
        )}
      </Cell>
      <Cell w={COLS[5]}>{f < t.money ? <Skel w={100} h={22} f={f} /> : <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 25 }}>{money(Math.round(count(f, t.money, 26, r.budget) / 10) * 10)}</div>}</Cell>
    </div>
  );
}

function Stat({ label, value, f, start, icon, bg }: { label: string; value: string; f: number; start: number; icon: "ticket" | "wallet" | "mic" | "tasks"; bg: string }) {
  const p = pop(f, start);
  return (
    <div style={{ flex: 1, ...card(4), padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, transform: `translateY(${(1 - p) * 30}px)`, opacity: Math.min(1, p * 1.4) }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: bg, border: border(2), display: "grid", placeItems: "center" }}>
        <Icon name={icon} size={26} />
      </div>
      <div>
        <Mono size={12}>{label}</Mono>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 34, lineHeight: 1.1 }}>{value}</div>
      </div>
    </div>
  );
}

export function S3BoxOffice() {
  const f = useCurrentFrame();
  const clickF = 372;
  const hover = lerp(f, 352, 362);
  const press = f >= clickF && f < clickF + 10 ? 0.985 : 1;
  const rowY = CONTENT.y + TABLE_Y + HEAD_H + ROW_H / 2;
  const live = BOX_ROWS.filter((_, i) => f < base(i) + 200).length;
  const head = soft(f, 6);
  return (
    <AbsoluteFill>
      <Camera
        keys={[
          { f: 0, s: 1, x: 960, y: 540 },
          { f: 24, s: 1, x: 960, y: 540 },
          { f: 90, s: 1.06, x: 1000, y: 590 },
          { f: 300, s: 1.06, x: 1000, y: 590 },
          { f: 350, s: 1.03, x: 980, y: 580 },
        ]}
      >
        <AppFrame crumbs={["Movents", "Box office"]} f={f} sidebar={{ active: "nav:Box office", projectAppear: [0, 1, 2, 3].map((i) => soft(f, base(i) + 34)), backstage: 2 }}>
          <div style={{ opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>
            <Mono>Box office · Sat 10 Oct 2026</Mono>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 }}>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 50, lineHeight: 1.05 }}>Good afternoon, Wei Ling</div>
                <div style={{ fontFamily: F.body, fontSize: 20, color: C.muted, marginTop: 6 }}>Four events in the works. WorkBuddy is planning all of them right now.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, ...card(3), padding: "10px 16px" }}>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: live ? C.green : C.muted, boxShadow: live ? `0 0 0 ${4 + 4 * Math.abs(Math.sin(f / 8))}px rgba(70,167,88,.25)` : undefined }} />
                <span style={{ fontFamily: F.body, fontWeight: 700, fontSize: 17 }}>{live ? `${live} WorkBuddy runs live` : "All plans ready"}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 22, marginTop: 30 }}>
            <Stat label="Events planning" value={`${BOX_ROWS.filter((_, i) => f >= base(i) + 34).length}`} f={f} start={20} icon="ticket" bg={C.peach} />
            <Stat label="Budget managed" value={money(Math.round(count(f, 120, 120, 22000) / 100) * 100)} f={f} start={26} icon="wallet" bg={C.mint} />
            <Stat label="Speakers contacted" value={`${count(f, 150, 120, 12)}`} f={f} start={32} icon="mic" bg={C.sky} />
            <Stat label="Tasks generated" value={`${count(f, 90, 150, 128)}`} f={f} start={38} icon="tasks" bg={C.sun} />
          </div>
          <div style={{ position: "absolute", top: TABLE_Y, left: 0, right: 0, ...card(5), overflow: "hidden", opacity: soft(f, 24), transform: `scale(${press})` }}>
            <div style={{ height: HEAD_H, display: "flex", alignItems: "center", padding: "0 24px", background: C.sand }}>
              {HEADS.map((h, i) => (
                <Cell key={h} w={COLS[i]}>
                  <Mono size={12.5} color={C.ink}>{h}</Mono>
                </Cell>
              ))}
            </div>
            {BOX_ROWS.map((_, i) => (
              <Row key={i} i={i} f={f} hover={i === 0 ? hover : 0} />
            ))}
          </div>
        </AppFrame>
        <Note f={f} start={190} x={1240} y={968} rotate={-3} size={38}>
          all four, at the same time
        </Note>
        <Cursor
          f={f}
          keys={[
            { f: 320, x: 1500, y: 900 },
            { f: 360, x: CONTENT.x + 170, y: rowY - 10 },
            { f: clickF, x: CONTENT.x + 170, y: rowY - 10, click: true },
          ]}
        />
      </Camera>
      <Kicker n="03" label="Box office fills itself in" f={f} x={1110} y={14} dur={SCENES.boxOffice} />
    </AbsoluteFill>
  );
}
