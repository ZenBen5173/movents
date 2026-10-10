import { C, border } from "../../theme";
import { lerp, pop, soft } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Icon } from "../../ui/Icon";
import { Avatar, Mono, Ring, card } from "../../ui/kit";

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

export function TasksTab({ f }: { f: number }) {
  const doneCount = TASKS.filter((t, i) => t.s === "done" && f >= 34 + i * 4).length;
  return (
    <div style={{ display: "flex", gap: 22 }}>
      <div style={{ flex: 1, ...card(5), overflow: "hidden" }}>
        <div style={{ display: "flex", padding: "12px 20px", background: C.sand, borderBottom: border(2) }}>
          <Mono size={12} color={C.ink} style={{ flex: 1 }}>Task</Mono>
          <Mono size={12} color={C.ink} style={{ width: 230 }}>Owner</Mono>
          <Mono size={12} color={C.ink} style={{ width: 110 }}>Due</Mono>
          <Mono size={12} color={C.ink} style={{ width: 110 }}>Status</Mono>
        </div>
        {TASKS.map((t, i) => {
          const p = soft(f, 4 + i * 4);
          const tick = t.s === "done" ? pop(f, 34 + i * 4) : 0;
          const isWB = t.who === "WorkBuddy";
          return (
            <div key={t.t} style={{ display: "flex", alignItems: "center", height: 52, padding: "0 20px", borderTop: i ? `1.5px solid ${C.line}` : undefined, opacity: p, transform: `translateX(${(1 - p) * -30}px)` }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, border: border(2), background: tick > 0 ? C.green : t.s === "doing" ? C.sun : "#fff", display: "grid", placeItems: "center", transform: `scale(${1 + Math.sin(tick * Math.PI) * 0.25})` }}>
                  {tick > 0.2 && <Icon name="check" size={15} stroke={3.2} color="#fff" />}
                </div>
                <span style={{ fontFamily: F.body, fontSize: 18, fontWeight: 500, color: tick > 0.5 ? C.muted : C.ink, textDecoration: tick > 0.5 ? "line-through" : "none" }}>{t.t}</span>
              </div>
              <div style={{ width: 230, display: "flex", alignItems: "center", gap: 10 }}>
                {isWB ? (
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "#0052D9", color: "#fff", display: "grid", placeItems: "center", fontFamily: F.display, fontWeight: 700, fontSize: 12 }}>WB</div>
                ) : (
                  <Avatar name={t.who} size={30} i={AV[t.who]} />
                )}
                <span style={{ fontSize: 16 }}>{t.who.split(" ")[0] === "Wei" ? "Wei Ling" : t.who.split(" ")[0]}</span>
              </div>
              <div style={{ width: 110 }}>
                <Mono size={12} color={C.ink}>{t.due}</Mono>
              </div>
              <div style={{ width: 110 }}>
                <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: border(1.5), borderRadius: 99, padding: "3px 9px", background: t.s === "done" && tick > 0.5 ? C.mint : t.s === "doing" ? C.sun : "#fff" }}>{t.s === "done" && tick > 0.5 ? "Done" : t.s === "doing" ? "Doing" : "To do"}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ ...card(4), padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transform: `scale(${pop(f, 10)})` }}>
          <Mono>This sprint</Mono>
          <Ring value={lerp(f, 30, 80) * 0.42} size={150} stroke={16}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38 }}>{doneCount}/24</div>
              <Mono size={11}>tasks done</Mono>
            </div>
          </Ring>
        </div>
        <div style={{ ...card(4), padding: 18, transform: `scale(${pop(f, 18)})` }}>
          <Mono>By owner</Mono>
          {["Wei Ling", "Priya", "Jason", "Arjun"].map((n, i) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <span style={{ width: 70, fontSize: 15 }}>{n}</span>
              <div style={{ flex: 1, height: 12, background: C.sand, border: border(1.5), borderRadius: 9, overflow: "hidden" }}>
                <div style={{ width: `${lerp(f, 24 + i * 5, 60 + i * 5) * [70, 55, 80, 35][i]}%`, height: "100%", background: [C.peach, C.sky, C.mint, C.sun][i] }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
