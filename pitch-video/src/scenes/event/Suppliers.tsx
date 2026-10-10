import { C, border, hard } from "../../theme";
import { lerp, pop, soft } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Generate, SkLine, SkTable, type GenTarget } from "../../ui/Generate";
import { Icon } from "../../ui/Icon";
import { Mono, Skel, Stamp, card } from "../../ui/kit";

type Step = 0 | 1 | 2; // 0 not started, 1 in progress, 2 done
const ROWS: { name: string; what: string; price: string; steps: Step[]; note: string }[] = [
  { name: "Mix Mix Catering", what: "Food & beverage", price: "RM20/pax", steps: [2, 2, 2], note: "Deposit paid" },
  { name: "e-print.my", what: "Crew T-shirts", price: "RM9.50/pc", steps: [2, 2, 1], note: "Deposit awaiting approval" },
  { name: "CUSTA", what: "Lanyards", price: "RM2.22/pc", steps: [2, 1, 0], note: "Contract sent" },
  { name: "CUSTA", what: "PVC card holders", price: "RM0.79/pc", steps: [2, 1, 0], note: "Contract sent" },
];
const STEP_NAMES = ["Quote", "Contract", "Deposit"];

export const SUPPLIERS_GEN: GenTarget[] = [
  { at: 14, x: 380, y: 140, chip: "chasing supplier quotes…" },
  { at: 44, x: 200, y: 462 },
  { at: 60, x: 640, y: 462 },
];
const [A_TABLE, A_RECEIPT, A_WAIT] = SUPPLIERS_GEN.map((g) => g.at);

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
  const g = f - A_TABLE;
  const r = f - A_RECEIPT;
  const w = f - A_WAIT;
  return (
    <div>
      <Generate f={f} at={A_TABLE} pad="0" seed="supp" wipe={18} sparks={20} skel={<SkTable f={f} rows={4} rowH={84} cols={[200, 150, 100, 300, 140]} lead={46} />}>
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
          {ROWS.map((row, i) => {
            const p = soft(g, 2 + i * 4);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", height: 84, padding: "0 22px", borderTop: i ? `1.5px solid ${C.line}` : undefined, opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
                <div style={{ width: 300, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, border: border(2), background: [C.peach, C.sky, C.mint, C.mint][i], display: "grid", placeItems: "center" }}>
                    <Icon name="store" size={22} />
                  </div>
                  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22 }}>{row.name}</span>
                </div>
                <div style={{ width: 210, fontSize: 17 }}>{row.what}</div>
                <div style={{ width: 160, fontFamily: F.mono, fontWeight: 700, fontSize: 16 }}>{row.price}</div>
                <div style={{ width: 380, position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 40 }}>
                  <div style={{ position: "absolute", left: 17, width: 306, top: "50%", height: 3, background: C.line, marginTop: -1.5 }} />
                  {row.steps.map((s, k) => {
                    if (k === 0) return null;
                    const st = 8 + i * 4 + k * 6;
                    const fill = s === 0 ? 0 : lerp(g, st - 5, st);
                    return <div key={k} style={{ position: "absolute", left: 17 + (k - 1) * 153, top: "50%", height: 3, marginTop: -1.5, width: 153 * fill, background: s === 2 ? C.green : C.sun }} />;
                  })}
                  {row.steps.map((s, k) => (
                    <Dot key={k} s={s} p={pop(g, 8 + i * 4 + k * 6)} />
                  ))}
                </div>
                <div style={{ flex: 1, fontSize: 16, fontWeight: 500, opacity: lerp(g, 24 + i * 4, 30 + i * 4) }}>{row.note}</div>
              </div>
            );
          })}
        </div>
      </Generate>

      <div style={{ display: "flex", gap: 24, marginTop: 26, alignItems: "flex-start" }}>
        {/* receipt stub */}
        <Generate
          f={f}
          at={A_RECEIPT}
          radius={14}
          pad="14px 20px"
          seed="receipt"
          skel={
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Skel w={200} h={10} f={f} />
              <Skel w={240} h={26} f={f} />
              <Skel w={280} h={11} f={f} />
            </div>
          }
        >
          <div style={{ display: "flex", border: border(2), borderRadius: 14, overflow: "hidden", boxShadow: hard(4), background: "#fff", transform: `translateY(${(1 - pop(r, 0)) * 30}px) rotate(${-1.5}deg)` }}>
            <div style={{ padding: "14px 20px" }}>
              <Mono size={11.5}>Receipt · Mix Mix Catering</Mono>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 32, marginTop: 4 }}>RM180 deposit</div>
              <div style={{ fontSize: 15, color: C.muted }}>Approved by the President · paid 9 Oct</div>
            </div>
            <div style={{ background: C.mint, borderLeft: `2px dashed ${C.ink}`, padding: "0 26px", display: "grid", placeItems: "center" }}>
              <Stamp f={r} start={10} color={C.green} size={20}>Paid</Stamp>
            </div>
          </div>
        </Generate>
        <Generate
          f={f}
          at={A_WAIT}
          pad="14px 20px"
          seed="wait"
          skel={
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Skel w={150} h={10} f={f} />
              <SkLine f={f} ws={[320]} h={20} />
              <Skel w={200} h={11} f={f} />
            </div>
          }
        >
          <div style={{ ...card(4), padding: "14px 20px", background: C.sun, transform: `translateY(${(1 - pop(w, 0)) * 30}px) rotate(1.5deg)`, maxWidth: 420 }}>
            <Mono size={11.5} color={C.ink}>Waiting backstage</Mono>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, marginTop: 4 }}>Pay RM143 deposit to e-print.my</div>
            <div style={{ fontSize: 15 }}>Needs the President's tap</div>
          </div>
        </Generate>
      </div>
    </div>
  );
}
