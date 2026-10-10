import { C, border } from "../../theme";
import { count, lerp, money, soft } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Mono, card } from "../../ui/kit";

const CATS = [
  { name: "Food & beverage", v: 1200, color: C.tomato },
  { name: "Merchandise", v: 926.5, color: C.sun },
  { name: "Speakers", v: 450, color: C.blue },
  { name: "Publicity", v: 148.5, color: C.mint },
];
const TOTAL = 2725;

const LINES = [
  { cat: 0, item: "Mix Mix Catering, refreshments", qty: "1 order", plan: 1200, actual: 180 },
  { cat: 1, item: "Crew T-shirts, e-print.my", qty: "50 × RM9.50", plan: 475, actual: 475 },
  { cat: 1, item: "Lanyards, CUSTA", qty: "150 × RM2.22", plan: 333, actual: 0 },
  { cat: 1, item: "PVC card holders, CUSTA", qty: "150 × RM0.79", plan: 118.5, actual: 0 },
  { cat: 2, item: "Speaker tokens and gifts", qty: "3 × RM150", plan: 450, actual: 0 },
  { cat: 3, item: "Posters and IG boost", qty: "1 lot", plan: 148.5, actual: 135 },
];

export function BudgetTab({ f }: { f: number }) {
  const R = 120;
  const SW = 46;
  const circ = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div style={{ display: "flex", gap: 24 }}>
      <div style={{ ...card(5), width: 470, padding: "18px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Mono color={C.ink} style={{ alignSelf: "flex-start" }}>Where the money goes</Mono>
        <div style={{ position: "relative", width: 300, height: 300, marginTop: 14 }}>
          <svg width={300} height={300} viewBox="0 0 300 300" style={{ transform: "rotate(-90deg)" }}>
            <circle cx={150} cy={150} r={R} fill="none" stroke={C.sand} strokeWidth={SW} />
            {CATS.map((c, i) => {
              const frac = c.v / TOTAL;
              const start = acc;
              acc += frac;
              const g = lerp(f, 6 + i * 9, 22 + i * 9);
              return <circle key={c.name} cx={150} cy={150} r={R} fill="none" stroke={c.color} strokeWidth={SW} strokeDasharray={`${circ * frac * g} ${circ}`} strokeDashoffset={-circ * start} />;
            })}
            <circle cx={150} cy={150} r={R + SW / 2} fill="none" stroke={C.ink} strokeWidth={2} />
            <circle cx={150} cy={150} r={R - SW / 2} fill="none" stroke={C.ink} strokeWidth={2} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36 }}>{money(Math.round(count(f, 6, 40, TOTAL) / 5) * 5)}</div>
              <Mono size={11}>planned</Mono>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 22px", marginTop: 18, alignSelf: "stretch" }}>
          {CATS.map((c, i) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 9, opacity: lerp(f, 10 + i * 9, 20 + i * 9) }}>
              <span style={{ width: 16, height: 16, borderRadius: 5, background: c.color, border: border(1.5) }} />
              <span style={{ fontSize: 15.5 }}>{c.name}</span>
              <span style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 13, fontWeight: 700 }}>{Math.round((c.v / TOTAL) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { l: "Cap", v: "RM3,000", bg: "#fff" },
            { l: "Contingency 10%", v: "RM272.50", bg: C.sky },
            { l: "Spent", v: `${count(f, 30, 30, 29)}%`, bg: C.mint },
          ].map((s, i) => {
            const p = soft(f, 8 + i * 5);
            return (
              <div key={s.l} style={{ flex: 1, ...card(3), background: s.bg, padding: "12px 18px", opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
                <Mono size={11.5}>{s.l}</Mono>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 30 }}>{s.v}</div>
              </div>
            );
          })}
        </div>
        <div style={{ ...card(5), overflow: "hidden" }}>
          <div style={{ display: "flex", padding: "11px 20px", background: C.sand, borderBottom: border(2) }}>
            <Mono size={12} color={C.ink} style={{ flex: 1 }}>Budget sheet</Mono>
            <Mono size={12} color={C.ink} style={{ width: 150 }}>Qty</Mono>
            <Mono size={12} color={C.ink} style={{ width: 110, textAlign: "right" }}>Planned</Mono>
            <Mono size={12} color={C.ink} style={{ width: 110, textAlign: "right" }}>Actual</Mono>
          </div>
          {LINES.map((l, i) => {
            const p = soft(f, 14 + i * 6);
            return (
              <div key={l.item} style={{ display: "flex", alignItems: "center", height: 50, padding: "0 20px", borderTop: i ? `1.5px solid ${C.line}` : undefined, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
                <span style={{ width: 12, height: 12, borderRadius: 4, background: CATS[l.cat].color, border: border(1.5), marginRight: 12 }} />
                <span style={{ flex: 1, fontSize: 17 }}>{l.item}</span>
                <span style={{ width: 150, fontFamily: F.mono, fontSize: 13.5, color: C.muted }}>{l.qty}</span>
                <span style={{ width: 110, textAlign: "right", fontFamily: F.mono, fontSize: 15, fontWeight: 700 }}>{money(l.plan)}</span>
                <span style={{ width: 110, textAlign: "right", fontFamily: F.mono, fontSize: 15, color: l.actual ? C.green : C.muted, fontWeight: 700 }}>{l.actual ? money(l.actual) : "-"}</span>
              </div>
            );
          })}
          <div style={{ display: "flex", alignItems: "center", height: 54, padding: "0 20px", borderTop: border(2), background: C.sun, opacity: lerp(f, 54, 62) }}>
            <span style={{ flex: 1, fontFamily: F.display, fontWeight: 700, fontSize: 19 }}>Total</span>
            <span style={{ width: 110, textAlign: "right", fontFamily: F.mono, fontSize: 16, fontWeight: 700 }}>RM2,725</span>
            <span style={{ width: 110, textAlign: "right", fontFamily: F.mono, fontSize: 16, fontWeight: 700 }}>RM790</span>
          </div>
        </div>
      </div>
    </div>
  );
}
