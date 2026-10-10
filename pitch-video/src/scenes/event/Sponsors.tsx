import { C, border, hard } from "../../theme";
import { count, lerp, pop, soft, typed } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Icon } from "../../ui/Icon";
import { Mono, card } from "../../ui/kit";

// 10 sponsors across the outreach funnel
const FUNNEL = [
  { name: "Not contacted", n: 1, color: "#bdb6a8" },
  { name: "Contacted", n: 1, color: C.sky },
  { name: "Opened", n: 2, color: C.sun },
  { name: "Replied", n: 1, color: C.blue },
  { name: "Accepted", n: 3, color: C.green },
  { name: "Declined", n: 2, color: C.peach },
];
const N = 10;

const OFFERS = [
  { co: "Selat Bank Berhad", ini: "SB", bg: C.sky, what: "RM5,000 cash", kind: "Cash" },
  { co: "Nusantara AI Labs", ini: "NA", bg: C.mint, what: "RM3,000 cash", kind: "Cash" },
  { co: "Kopi Kampung Co.", ini: "KK", bg: C.peach, what: "Coffee and pastries for 150 pax (in-kind)", kind: "In-kind" },
];

// step reached: 1 contacted, 2 opened, 3 replied, 4 decided
const PIPE: { co: string; ini: string; bg: string; ind: string; step: number; status: string; sBg: string; declined?: boolean }[] = [
  { co: "Selat Bank Berhad", ini: "SB", bg: C.sky, ind: "Banking", step: 4, status: "Accepted", sBg: C.mint },
  { co: "Nusantara AI Labs", ini: "NA", bg: C.mint, ind: "AI research", step: 4, status: "Accepted", sBg: C.mint },
  { co: "Kopi Kampung Co.", ini: "KK", bg: C.peach, ind: "F&B", step: 4, status: "Accepted", sBg: C.mint },
  { co: "Awan Cloud", ini: "AC", bg: C.sun, ind: "Cloud", step: 3, status: "Replied", sBg: C.sky },
  { co: "Bayu Telco", ini: "BT", bg: C.sky, ind: "Telco", step: 2, status: "Opened", sBg: C.sun },
  { co: "Mesra Motors", ini: "MM", bg: C.sand, ind: "Automotive", step: 4, status: "Declined", sBg: C.peach, declined: true },
];
const STEPS = ["Contacted", "Opened", "Replied", "Decided"];
const TRACK = 250;
const DOT = 24;
const dotX = (k: number) => (k * (TRACK - DOT)) / 3;

const PITCH = "150 students, 3 AI speakers, one rooftop. Here is where your brand fits in.";

function Bubble({ ini, bg, size = 34, p = 1 }: { ini: string; bg: string; size?: number; p?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, border: border(2), background: bg, display: "grid", placeItems: "center", fontFamily: F.display, fontWeight: 700, fontSize: size * 0.36, flexShrink: 0, transform: `scale(${p})` }}>
      {ini}
    </div>
  );
}

export function SponsorsTab({ f }: { f: number }) {
  const R = 104;
  const SW = 40;
  const circ = 2 * Math.PI * R;
  let acc = 0;
  const mail = pop(f, 54, { damping: 15 });
  return (
    <div style={{ display: "flex", gap: 24 }}>
      {/* funnel donut */}
      <div style={{ ...card(5), width: 440, padding: "18px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Mono color={C.ink}>Sponsor funnel</Mono>
          <Mono size={11}>{N} sponsors</Mono>
        </div>
        <div style={{ position: "relative", width: 260, height: 260, marginTop: 16 }}>
          <svg width={260} height={260} viewBox="0 0 260 260" style={{ transform: "rotate(-90deg)" }}>
            <circle cx={130} cy={130} r={R} fill="none" stroke="#f3f0e8" strokeWidth={SW} />
            {FUNNEL.map((s, i) => {
              const frac = s.n / N;
              const start = acc;
              acc += frac;
              const g = lerp(f, 6 + i * 7, 20 + i * 7);
              return <circle key={s.name} cx={130} cy={130} r={R} fill="none" stroke={s.color} strokeWidth={SW} strokeDasharray={`${circ * frac * g} ${circ}`} strokeDashoffset={-circ * start} />;
            })}
            {/* slice dividers */}
            {FUNNEL.map((s, i) => {
              const at = FUNNEL.slice(0, i).reduce((a, b) => a + b.n, 0) / N;
              const a = at * Math.PI * 2;
              const o = lerp(f, 6 + i * 7, 10 + i * 7);
              return <line key={s.name} x1={130 + Math.cos(a) * (R - SW / 2)} y1={130 + Math.sin(a) * (R - SW / 2)} x2={130 + Math.cos(a) * (R + SW / 2)} y2={130 + Math.sin(a) * (R + SW / 2)} stroke={C.ink} strokeWidth={2} opacity={o} />;
            })}
            <circle cx={130} cy={130} r={R + SW / 2} fill="none" stroke={C.ink} strokeWidth={2} />
            <circle cx={130} cy={130} r={R - SW / 2} fill="none" stroke={C.ink} strokeWidth={2} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 34, lineHeight: 1 }}>RM{(Math.round(count(f, 8, 40, 8000) / 50) * 50).toLocaleString("en-US")}</div>
              <div style={{ display: "inline-block", marginTop: 6, background: C.sun, border: border(1.5), borderRadius: 99, padding: "1px 10px", fontFamily: F.body, fontWeight: 700, fontSize: 14, transform: `scale(${pop(f, 46)})` }}>+ 1 in-kind</div>
              <div style={{ marginTop: 4 }}>
                <Mono size={10.5}>committed</Mono>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 22px", marginTop: 18, alignSelf: "stretch" }}>
          {FUNNEL.map((s, i) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 9, opacity: lerp(f, 10 + i * 7, 20 + i * 7) }}>
              <span style={{ width: 16, height: 16, borderRadius: 5, background: s.color, border: border(1.5) }} />
              <span style={{ fontSize: 15.5 }}>{s.name}</span>
              <span style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 13, fontWeight: 700 }}>{s.n}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 20 }}>
          {/* offers */}
          <div style={{ flex: 1, ...card(4), overflow: "hidden", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", padding: "10px 18px", background: C.sand, borderBottom: border(2) }}>
              <Mono size={12} color={C.ink}>Offers</Mono>
              <Mono size={11} style={{ marginLeft: "auto" }}>3 accepted</Mono>
            </div>
            {OFFERS.map((o, i) => {
              const p = pop(f, 26 + i * 8, { damping: 14 });
              return (
                <div key={o.co} style={{ display: "flex", alignItems: "center", gap: 12, height: 56, padding: "0 18px", borderTop: i ? `1.5px solid ${C.line}` : undefined, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * 40}px) scale(${0.94 + 0.06 * p})`, transformOrigin: "left center" }}>
                  <Bubble ini={o.ini} bg={o.bg} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 17, lineHeight: 1.15 }}>{o.co}</div>
                    <div style={{ fontSize: 14.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.what}</div>
                  </div>
                  <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: border(1.5), borderRadius: 99, padding: "2px 9px", background: o.kind === "Cash" ? C.mint : C.sun, flexShrink: 0 }}>{o.kind}</span>
                </div>
              );
            })}
          </div>

          {/* outreach email */}
          <div style={{ width: 372, ...card(4), padding: "12px 16px", background: "#fff", display: "flex", flexDirection: "column", opacity: Math.min(1, mail * 1.5), transform: `translateX(${(1 - mail) * 360}px) rotate(${1.2 + (1 - mail) * 6}deg)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: C.wb, color: "#fff", display: "grid", placeItems: "center", fontFamily: F.display, fontWeight: 700, fontSize: 10 }}>WB</div>
              <Mono size={10.5} color={C.blue}>Outreach email</Mono>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: C.sun, border: border(1.2), borderRadius: 99, padding: "1px 8px", transform: `scale(${pop(f, 98)})` }}>Opened</span>
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 17, marginTop: 8, lineHeight: 1.2 }}>Sponsor AI Talk @ Sunway, 15 Nov</div>
            <div style={{ fontSize: 13.5, color: C.muted, marginTop: 2 }}>To: Awan Cloud partnerships</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.4, marginTop: 6, minHeight: 40 }}>{typed(PITCH, f, 62, 2.6)}</div>
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start", border: border(1.5), borderRadius: 10, padding: "5px 11px", background: C.bg, transform: `scale(${pop(f, 88)})`, transformOrigin: "left center" }}>
              <Icon name="attach" size={15} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>Attached: Event proposal (PDF)</span>
            </div>
          </div>
        </div>

        {/* pipeline */}
        <div style={{ ...card(5), overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "10px 20px", background: C.sand, borderBottom: border(2) }}>
            <Mono size={12} color={C.ink} style={{ width: 290 }}>Pipeline</Mono>
            <Mono size={12} color={C.ink} style={{ width: 160 }}>Industry</Mono>
            <div style={{ width: TRACK + 16, position: "relative", height: 16 }}>
              {STEPS.map((s, k) => (
                <Mono key={s} size={10} color={C.ink} style={{ position: "absolute", left: dotX(k) + DOT / 2, transform: "translateX(-50%)", top: 1 }}>{s}</Mono>
              ))}
            </div>
            <Mono size={12} color={C.ink} style={{ marginLeft: "auto", width: 110 }}>Status</Mono>
          </div>
          {PIPE.map((r, i) => {
            const p = soft(f, 14 + i * 5);
            const base = 24 + i * 5;
            return (
              <div key={r.co} style={{ display: "flex", alignItems: "center", height: 48, padding: "0 20px", borderTop: i ? `1.5px solid ${C.line}` : undefined, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
                <div style={{ width: 290, display: "flex", alignItems: "center", gap: 12 }}>
                  <Bubble ini={r.ini} bg={r.bg} size={32} p={pop(f, 14 + i * 5)} />
                  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18 }}>{r.co}</span>
                </div>
                <div style={{ width: 160 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500, border: `1.5px solid ${C.line}`, background: C.bg, borderRadius: 8, padding: "2px 9px", whiteSpace: "nowrap" }}>{r.ind}</span>
                </div>
                <div style={{ width: TRACK + 16, position: "relative", height: DOT }}>
                  <div style={{ position: "absolute", left: DOT / 2, width: TRACK - DOT, top: DOT / 2 - 1.5, height: 3, background: C.line }} />
                  {[1, 2, 3].map((k) => {
                    if (k >= r.step) return null;
                    const st = base + k * 7;
                    const g = lerp(f, st - 6, st);
                    const last = r.declined && k === 3;
                    return <div key={k} style={{ position: "absolute", left: dotX(k - 1) + DOT / 2, top: DOT / 2 - 1.5, height: 3, width: (dotX(k) - dotX(k - 1)) * g, background: last ? C.tomato : C.green }} />;
                  })}
                  {STEPS.map((_, k) => {
                    const on = k < r.step;
                    const q = pop(f, base + k * 7);
                    const no = r.declined && k === 3;
                    const fill = on && q > 0.5;
                    return (
                      <div key={k} style={{ position: "absolute", left: dotX(k), top: 0, width: DOT, height: DOT, borderRadius: DOT / 2, border: border(2), background: fill ? (no ? C.tomato : C.green) : "#fff", display: "grid", placeItems: "center", transform: `scale(${on ? 0.7 + 0.3 * q : 0.85})` }}>
                        {fill && <Icon name={no ? "x" : "check"} size={13} stroke={3.4} color="#fff" />}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginLeft: "auto", width: 110 }}>
                  <span style={{ display: "inline-block", fontFamily: F.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: border(1.5), borderRadius: 99, padding: "3px 9px", background: r.sBg, transform: `scale(${pop(f, base + r.step * 7 + 4)})`, boxShadow: hard(1.5) }}>{r.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
