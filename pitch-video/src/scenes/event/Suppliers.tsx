import { C, border, hard } from "../../theme";
import { lerp, pop, soft } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Icon } from "../../ui/Icon";
import { Mono, Stamp, card } from "../../ui/kit";

type Step = 0 | 1 | 2; // 0 not started, 1 in progress, 2 done
const ROWS: { name: string; what: string; price: string; steps: Step[]; note: string }[] = [
  { name: "Mix Mix Catering", what: "Food & beverage", price: "RM20/pax", steps: [2, 2, 2], note: "Deposit paid" },
  { name: "e-print.my", what: "Crew T-shirts", price: "RM9.50/pc", steps: [2, 2, 1], note: "Deposit awaiting approval" },
  { name: "CUSTA", what: "Lanyards", price: "RM2.22/pc", steps: [2, 1, 0], note: "Contract sent" },
  { name: "CUSTA", what: "PVC card holders", price: "RM0.79/pc", steps: [2, 1, 0], note: "Contract sent" },
];
const STEP_NAMES = ["Quote", "Contract", "Deposit"];

function Dot({ s, p }: { s: Step; p: number }) {
  const bg = s === 2 ? C.green : s === 1 ? C.sun : "#fff";
  return (
    <div style={{ width: 34, height: 34, borderRadius: 17, border: border(2), background: p > 0.5 ? bg : "#fff", display: "grid", placeItems: "center", transform: `scale(${0.6 + 0.4 * p})`, zIndex: 1 }}>
      {s === 2 && p > 0.5 && <Icon name="check" size={18} stroke={3.2} color="#fff" />}
      {s === 1 && p > 0.5 && <div style={{ width: 10, height: 10, borderRadius: 5, background: C.ink }} />}
    </div>
  );
}

export function SuppliersTab({ f }: { f: number }) {
  return (
    <div>
      <div style={{ ...card(5), overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "12px 22px", background: C.sand, borderBottom: border(2) }}>
          <Mono size={12} color={C.ink} style={{ width: 300 }}>Supplier</Mono>
          <Mono size={12} color={C.ink} style={{ width: 210 }}>For</Mono>
          <Mono size={12} color={C.ink} style={{ width: 160 }}>Unit price</Mono>
          <div style={{ width: 380, display: "flex", justifyContent: "space-between", paddingRight: 30 }}>
            {STEP_NAMES.map((s) => (
              <Mono key={s} size={12} color={C.ink}>{s}</Mono>
            ))}
          </div>
          <Mono size={12} color={C.ink} style={{ flex: 1 }}>Status</Mono>
        </div>
        {ROWS.map((r, i) => {
          const p = soft(f, 4 + i * 6);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", height: 84, padding: "0 22px", borderTop: i ? `1.5px solid ${C.line}` : undefined, opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
              <div style={{ width: 300, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, border: border(2), background: [C.peach, C.sky, C.mint, C.mint][i], display: "grid", placeItems: "center" }}>
                  <Icon name="store" size={22} />
                </div>
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22 }}>{r.name}</span>
              </div>
              <div style={{ width: 210, fontSize: 17 }}>{r.what}</div>
              <div style={{ width: 160, fontFamily: F.mono, fontWeight: 700, fontSize: 16 }}>{r.price}</div>
              <div style={{ width: 380, position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 40 }}>
                <div style={{ position: "absolute", left: 17, width: 306, top: "50%", height: 3, background: C.line, marginTop: -1.5 }} />
                {r.steps.map((s, k) => {
                  if (k === 0) return null;
                  const st = 16 + i * 6 + k * 8;
                  const fill = s === 0 ? 0 : lerp(f, st - 6, st);
                  return <div key={k} style={{ position: "absolute", left: 17 + (k - 1) * 153, top: "50%", height: 3, marginTop: -1.5, width: 153 * fill, background: s === 2 ? C.green : C.sun }} />;
                })}
                {r.steps.map((s, k) => (
                  <Dot key={k} s={s} p={pop(f, 16 + i * 6 + k * 8)} />
                ))}
              </div>
              <div style={{ flex: 1, fontSize: 16, fontWeight: 500, opacity: lerp(f, 40 + i * 6, 48 + i * 6) }}>{r.note}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 24, marginTop: 26, alignItems: "flex-start" }}>
        {/* receipt stub */}
        <div style={{ display: "flex", border: border(2), borderRadius: 14, overflow: "hidden", boxShadow: hard(4), background: "#fff", transform: `translateY(${(1 - pop(f, 50)) * 60}px) rotate(${-1.5}deg)`, opacity: lerp(f, 50, 56) }}>
          <div style={{ padding: "14px 20px" }}>
            <Mono size={11.5}>Receipt · Mix Mix Catering</Mono>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 32, marginTop: 4 }}>RM180 deposit</div>
            <div style={{ fontSize: 15, color: C.muted }}>Approved by the President · paid 9 Oct</div>
          </div>
          <div style={{ background: C.mint, borderLeft: `2px dashed ${C.ink}`, padding: "0 26px", display: "grid", placeItems: "center" }}>
            <Stamp f={f} start={66} color={C.green} size={20}>Paid</Stamp>
          </div>
        </div>
        <div style={{ ...card(4), padding: "14px 20px", background: C.sun, transform: `translateY(${(1 - pop(f, 58)) * 60}px) rotate(1.5deg)`, opacity: lerp(f, 58, 64), maxWidth: 420 }}>
          <Mono size={11.5} color={C.ink}>Waiting backstage</Mono>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, marginTop: 4 }}>Pay RM143 deposit to e-print.my</div>
          <div style={{ fontSize: 15 }}>Needs the President's tap</div>
        </div>
      </div>
    </div>
  );
}
