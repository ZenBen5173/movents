import { C, border } from "../../theme";
import { lerp, pop, soft, typed } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Generate, SkLine, SkRing, SkTable, type GenTarget } from "../../ui/Generate";
import { Icon } from "../../ui/Icon";
import { Avatar, Mono, Ring, Skel, card } from "../../ui/kit";

const TASKS = [
  { t: "Set objectives and budget", who: "Wei Ling Chong", due: "10 Oct", s: "done" },
  { t: "Research 3 AI speakers", who: "WorkBuddy", due: "12 Oct", s: "done" },
  { t: "Request supplier quotes", who: "Jason Tan", due: "13 Oct", s: "done" },
  { t: "Draft pre-event proposal", who: "Priya Nair", due: "14 Oct", s: "done" },
  { t: "Book Rooftop Terrace + floor plan", who: "Jason Tan", due: "16 Oct", s: "done" },
  { t: "Collect speaker declarations", who: "Priya Nair", due: "20 Oct", s: "doing" },
  { t: "Instagram campaign", who: "Arjun Menon", due: "25 Oct", s: "doing" },
  { t: "Email blast to members", who: "Arjun Menon", due: "1 Nov", s: "todo" },
  { t: "Confirm catering numbers", who: "Jason Tan", due: "8 Nov", s: "todo" },
  { t: "Run of show rehearsal", who: "Wei Ling Chong", due: "14 Nov", s: "todo" },
];
const AV: Record<string, number> = { "Wei Ling Chong": 0, "Priya Nair": 1, "Jason Tan": 2, "Arjun Menon": 3 };

export const TASKS_GEN: GenTarget[] = [
  { at: 16, x: 330, y: 150, chip: "writing tasks…" },
  { at: 46, x: 1250, y: 112 },
  { at: 62, x: 1250, y: 330 },
];
const [A_TABLE, A_RING, A_OWNER] = TASKS_GEN.map((g) => g.at);

const rowAt = (i: number) => 2 + i * 3;
const tickAt = (i: number) => 14 + i * 3;

export function TasksTab({ f }: { f: number }) {
  const g = f - A_TABLE;
  const doneCount = TASKS.filter((t, i) => t.s === "done" && g >= tickAt(i)).length;
  const r = f - A_RING;
  const o = f - A_OWNER;
  return (
    <div style={{ display: "flex", gap: 22 }}>
      <Generate f={f} at={A_TABLE} pad="0" style={{ flex: 1 }} seed="tasks" wipe={32} sparks={20} skel={<SkTable f={f} rows={10} rowH={52} cols={[300, 140, 70, 80]} lead={24} />}>
        <div style={{ ...card(5), overflow: "hidden" }}>
          <div style={{ display: "flex", padding: "12px 20px", background: C.sand, borderBottom: border(2) }}>
            <Mono size={12} color={C.ink} style={{ flex: 1 }}>Task</Mono>
            <Mono size={12} color={C.ink} style={{ width: 230 }}>Owner</Mono>
            <Mono size={12} color={C.ink} style={{ width: 110 }}>Due</Mono>
            <Mono size={12} color={C.ink} style={{ width: 110 }}>Status</Mono>
          </div>
          {TASKS.map((t, i) => {
            const p = soft(g, rowAt(i));
            const tick = t.s === "done" ? pop(g, tickAt(i)) : 0;
            const isWB = t.who === "WorkBuddy";
            const meta = lerp(g, rowAt(i) + 4, rowAt(i) + 10);
            return (
              <div key={t.t} style={{ display: "flex", alignItems: "center", height: 52, padding: "0 20px", borderTop: i ? `1.5px solid ${C.line}` : undefined, opacity: p, transform: `translateX(${(1 - p) * -30}px)` }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, border: border(2), background: tick > 0 ? C.green : t.s === "doing" ? C.sun : "#fff", display: "grid", placeItems: "center", transform: `scale(${1 + Math.sin(tick * Math.PI) * 0.25})` }}>
                    {tick > 0.2 && <Icon name="check" size={15} stroke={3.2} color="#fff" />}
                  </div>
                  <span style={{ fontFamily: F.body, fontSize: 18, fontWeight: 500, color: tick > 0.5 ? C.muted : C.ink, textDecoration: tick > 0.5 ? "line-through" : "none", whiteSpace: "nowrap" }}>{typed(t.t, g, rowAt(i), 3.4)}</span>
                </div>
                <div style={{ width: 230, display: "flex", alignItems: "center", gap: 10, opacity: meta }}>
                  {isWB ? (
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: C.wb, color: "#fff", display: "grid", placeItems: "center", fontFamily: F.display, fontWeight: 700, fontSize: 12 }}>WB</div>
                  ) : (
                    <Avatar name={t.who} size={30} i={AV[t.who]} />
                  )}
                  <span style={{ fontSize: 16 }}>{t.who.split(" ")[0] === "Wei" ? "Wei Ling" : t.who.split(" ")[0]}</span>
                </div>
                <div style={{ width: 110, opacity: meta }}>
                  <Mono size={12} color={C.ink}>{t.due}</Mono>
                </div>
                <div style={{ width: 110, opacity: meta }}>
                  <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: border(1.5), borderRadius: 99, padding: "3px 9px", background: t.s === "done" && tick > 0.5 ? C.mint : t.s === "doing" ? C.sun : "#fff" }}>{t.s === "done" && tick > 0.5 ? "Done" : t.s === "doing" ? "Doing" : "To do"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Generate>
      <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 20 }}>
        <Generate
          f={f}
          at={A_RING}
          pad="20px"
          seed="tring"
          skel={
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Skel w={90} h={10} f={f} />
              <SkRing f={f} size={150} stroke={18} />
            </div>
          }
        >
          <div style={{ ...card(4), padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transform: `scale(${0.94 + 0.06 * pop(r, 0)})` }}>
            <Mono>This sprint</Mono>
            <Ring value={lerp(r, 2, 34) * 0.42} size={150} stroke={16}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38 }}>{doneCount}/24</div>
                <Mono size={11}>tasks done</Mono>
              </div>
            </Ring>
          </div>
        </Generate>
        <Generate
          f={f}
          at={A_OWNER}
          pad="18px"
          seed="towner"
          skel={
            <div>
              <Skel w={80} h={10} f={f} />
              {[0, 1, 2, 3].map((k) => (
                <SkLine key={k} f={f} ws={[60, "100%"]} h={12} gap={10} style={{ marginTop: 16 }} />
              ))}
            </div>
          }
        >
          <div style={{ ...card(4), padding: 18 }}>
            <Mono>By owner</Mono>
            {["Wei Ling", "Priya", "Jason", "Arjun"].map((n, i) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <span style={{ width: 70, fontSize: 15 }}>{n}</span>
                <div style={{ flex: 1, height: 12, background: C.sand, border: border(1.5), borderRadius: 9, overflow: "hidden" }}>
                  <div style={{ width: `${lerp(o, 2 + i * 3, 24 + i * 3) * [70, 55, 80, 35][i]}%`, height: "100%", background: [C.peach, C.sky, C.mint, C.sun][i] }} />
                </div>
              </div>
            ))}
          </div>
        </Generate>
      </div>
    </div>
  );
}
