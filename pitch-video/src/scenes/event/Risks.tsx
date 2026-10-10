import { C, border } from "../../theme";
import { pop, soft } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Generate, SkTable, type GenTarget } from "../../ui/Generate";
import { Mono, Skel, card } from "../../ui/kit";

const RISKS = [
  { name: "Compliance", l: 3, i: 4, score: 12, fix: "Speaker declarations to Student LIFE by 20 Oct", owner: "Priya" },
  { name: "AV / Tech", l: 4, i: 3, score: 12, fix: "Test portable TV and mics on 14 Nov", owner: "Jason" },
  { name: "Capacity", l: 2, i: 5, score: 10, fix: "Cap RSVPs at 150, waitlist on", owner: "Arjun" },
  { name: "Food", l: 3, i: 3, score: 9, fix: "Confirm halal menu with Mix Mix", owner: "Jason" },
  { name: "Attendance", l: 4, i: 2, score: 8, fix: "Reminder blast 3 days before", owner: "Arjun" },
];

const heat = (s: number) => (s >= 15 ? "#ff8a6e" : s >= 10 ? C.peach : s >= 6 ? "#ffeaa0" : C.mint);
const sev = (s: number) => (s >= 12 ? C.tomato : s >= 10 ? C.peach : s >= 9 ? C.sun : C.mint);

export const RISKS_GEN: GenTarget[] = [
  { at: 16, x: 300, y: 300, chip: "drafting risks…" },
  { at: 44, x: 980, y: 170 },
];
const [A_MAP, A_TABLE] = RISKS_GEN.map((g) => g.at);

export function RisksTab({ f }: { f: number }) {
  const cell = 92;
  const g = f - A_MAP;
  const t = f - A_TABLE;
  return (
    <div style={{ display: "flex", gap: 24 }}>
      <Generate
        f={f}
        at={A_MAP}
        style={{ width: 590 }}
        pad="18px 22px 22px"
        seed="riskmap"
        sparks={20}
        skel={
          <div>
            <Skel w={260} h={11} f={f} />
            <div style={{ marginTop: 18, marginLeft: 30, display: "grid", gridTemplateColumns: `repeat(5, ${cell - 6}px)`, gap: 6 }}>
              {Array.from({ length: 25 }).map((_, k) => (
                <Skel key={k} w={cell - 6} h={cell - 6} r={8} f={f} />
              ))}
            </div>
          </div>
        }
      >
        <div style={{ ...card(5), padding: "18px 22px 22px" }}>
          <Mono color={C.ink}>Heat map · likelihood x impact</Mono>
          <div style={{ display: "flex", marginTop: 14 }}>
            <div style={{ width: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mono size={11} style={{ transform: "rotate(-90deg)" }}>Likelihood</Mono>
            </div>
            <div>
              <div style={{ position: "relative", width: cell * 5, height: cell * 5, border: border(2), borderRadius: 10, overflow: "hidden" }}>
                {Array.from({ length: 25 }).map((_, k) => {
                  const col = k % 5;
                  const row = Math.floor(k / 5);
                  const L = 5 - row;
                  const I = col + 1;
                  const p = soft(g, (row + col) * 1.2);
                  return <div key={k} style={{ position: "absolute", left: col * cell, top: row * cell, width: cell, height: cell, background: heat(L * I), borderRight: col < 4 ? `1.5px solid rgba(22,21,20,.18)` : undefined, borderBottom: row < 4 ? `1.5px solid rgba(22,21,20,.18)` : undefined, opacity: p }} />;
                })}
                {RISKS.map((r, k) => {
                  const p = pop(g, 8 + k * 5, { damping: 9 });
                  const cx = (r.i - 1) * cell + cell / 2;
                  const cy = (5 - r.l) * cell + cell / 2;
                  return (
                    <div key={r.name} style={{ position: "absolute", left: cx - 30, top: cy - 30, width: 60, height: 60, borderRadius: 30, background: sev(r.score), border: border(2.5), display: "grid", placeItems: "center", opacity: g >= 8 + k * 5 ? 1 : 0, transform: `translateY(${(1 - Math.min(1, p)) * -120}px) scale(${0.5 + 0.5 * p})`, boxShadow: "3px 3px 0 #161514" }}>
                      <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 20 }}>{r.score}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <Mono size={11}>Impact</Mono>
              </div>
            </div>
          </div>
        </div>
      </Generate>
      <Generate f={f} at={A_TABLE} pad="0" style={{ flex: 1, alignSelf: "flex-start" }} seed="risktable" wipe={26} skel={<SkTable f={f} rows={5} rowH={86} cols={[130, 380, 60]} lead={44} />}>
        <div style={{ ...card(5), overflow: "hidden" }}>
          <div style={{ display: "flex", padding: "12px 20px", background: C.sand, borderBottom: border(2) }}>
            <Mono size={12} color={C.ink} style={{ width: 70 }}>Score</Mono>
            <Mono size={12} color={C.ink} style={{ width: 150 }}>Risk</Mono>
            <Mono size={12} color={C.ink} style={{ flex: 1 }}>Mitigation</Mono>
            <Mono size={12} color={C.ink} style={{ width: 80 }}>Owner</Mono>
          </div>
          {RISKS.map((r, k) => {
            const p = soft(t, 2 + k * 5);
            return (
              <div key={r.name} style={{ display: "flex", alignItems: "center", padding: "0 20px", height: 86, borderTop: k ? `1.5px solid ${C.line}` : undefined, opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
                <div style={{ width: 70 }}>
                  <span style={{ display: "inline-grid", placeItems: "center", width: 44, height: 44, borderRadius: 10, background: sev(r.score), border: border(2), fontFamily: F.mono, fontWeight: 700, fontSize: 17, transform: `scale(${pop(t, 4 + k * 5)})` }}>{r.score}</span>
                </div>
                <div style={{ width: 150, fontFamily: F.display, fontWeight: 700, fontSize: 20 }}>{r.name}</div>
                <div style={{ flex: 1, fontSize: 17, color: C.ink, paddingRight: 12 }}>{r.fix}</div>
                <div style={{ width: 80, fontSize: 16 }}>{r.owner}</div>
              </div>
            );
          })}
        </div>
      </Generate>
    </div>
  );
}
