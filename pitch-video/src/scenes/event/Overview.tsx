import { C, border } from "../../theme";
import { count, lerp, money, pop } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Icon } from "../../ui/Icon";
import { Bar, Mono, Ring, Wristband, card } from "../../ui/kit";

function Tile({ f, i, label, children }: { f: number; i: number; label: string; children: React.ReactNode }) {
  const p = pop(f, 30 + i * 7);
  return (
    <div style={{ flex: 1, height: 176, ...card(4), padding: "16px 18px", transform: `translateY(${(1 - p) * 40}px) rotate(${(1 - p) * (i % 2 ? 3 : -3)}deg)`, opacity: Math.min(1, p * 1.5), display: "flex", flexDirection: "column" }}>
      <Mono size={12}>{label}</Mono>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

// Critical path on a day axis: 0 = 8 Oct, 40 = 17 Nov.
const DAYS = 40;
const PATH = [
  { name: "Pre-event proposal", a: 2, b: 9, color: C.green, done: true },
  { name: "Venue booking + floor plan", a: 4, b: 16, color: C.sun },
  { name: "Speaker outreach", a: 4, b: 25, color: C.sky },
  { name: "Student LIFE approval", a: 9, b: 23, color: C.tomato },
  { name: "Catering order", a: 18, b: 28, color: C.peach },
  { name: "Publicity campaign", a: 20, b: 37, color: C.mint },
];
const TICKS = [
  { d: 4, l: "12 OCT" },
  { d: 11, l: "19 OCT" },
  { d: 18, l: "26 OCT" },
  { d: 25, l: "2 NOV" },
  { d: 32, l: "9 NOV" },
];

export function OverviewTab({ f }: { f: number }) {
  const W = 1400 - 48 - 180;
  const x = (d: number) => 180 + (d / DAYS) * W;
  const cp = pop(f, 70, { damping: 18 });
  return (
    <div>
      <div style={{ display: "flex", gap: 20 }}>
        <Tile f={f} i={0} label="Budget">
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38 }}>{money(Math.round(count(f, 38, 40, 2725) / 5) * 5)}</div>
          <div style={{ fontSize: 15, color: C.muted, marginBottom: 10 }}>planned of RM3,000 cap</div>
          <Bar value={lerp(f, 40, 80) * 0.91} color={C.tomato} height={12} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <Mono size={11}>{Math.round(lerp(f, 40, 80) * 29)}% spent</Mono>
            <Mono size={11}>10% buffer</Mono>
          </div>
        </Tile>
        <Tile f={f} i={1} label="Tasks">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Ring value={lerp(f, 46, 90) * 0.42} size={96} color={C.tomato}>
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24 }}>{Math.round(lerp(f, 46, 90) * 42)}%</span>
            </Ring>
            <div style={{ fontSize: 16, lineHeight: 1.35 }}>
              <b style={{ fontSize: 22 }}>{count(f, 46, 44, 10)}</b> of 24
              <br />
              <span style={{ color: C.muted }}>done</span>
            </div>
          </div>
        </Tile>
        <Tile f={f} i={2} label="Going">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Ring value={lerp(f, 52, 96) * 0.64} size={96} color={C.green}>
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24 }}>{count(f, 52, 44, 96)}</span>
            </Ring>
            <div style={{ fontSize: 16, lineHeight: 1.35 }}>
              RSVPs
              <br />
              <span style={{ color: C.muted }}>of 150 seats</span>
            </div>
          </div>
        </Tile>
        <Tile f={f} i={3} label="Risks">
          <div style={{ display: "flex", gap: 8 }}>
            {[12, 12, 10, 9, 8].map((s, k) => {
              const p = pop(f, 60 + k * 5);
              const bg = s >= 12 ? C.tomato : s >= 10 ? C.peach : s >= 9 ? C.sun : C.mint;
              return (
                <div key={k} style={{ width: 42, height: 42, borderRadius: 8, background: bg, border: border(2), display: "grid", placeItems: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 15, transform: `scale(${p})` }}>
                  {s}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 15, color: C.muted, marginTop: 12 }}>5 open, 2 with mitigations due</div>
        </Tile>
        <Tile f={f} i={4} label="Backstage">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: C.sky, border: border(2), display: "grid", placeItems: "center" }}>
              <Icon name="inbox" size={30} />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 46 }}>{count(f, 66, 20, 2)}</div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
            <Wristband label="President" bg={C.blue} color="#fff" size={10} />
            <Wristband label="Advisor" bg={C.mint} size={10} />
          </div>
        </Tile>
      </div>

      {/* critical path */}
      <div style={{ marginTop: 24, ...card(5), height: 400, position: "relative", padding: "18px 24px", opacity: Math.min(1, cp * 1.4), transform: `translateY(${(1 - cp) * 40}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Mono color={C.ink}>Critical path</Mono>
          <Mono size={11}>6 workstreams · drafted by WorkBuddy</Mono>
        </div>
        <div style={{ position: "absolute", left: 24, right: 24, top: 56, bottom: 18 }}>
          {TICKS.map((t) => (
            <div key={t.l} style={{ position: "absolute", left: x(t.d), top: 0, bottom: 0, borderLeft: `1.5px dashed ${C.line}` }}>
              <Mono size={11} style={{ position: "absolute", top: 0, left: 6 }}>{t.l}</Mono>
            </div>
          ))}
          {/* today */}
          <div style={{ position: "absolute", left: x(2), top: 22, bottom: 0, borderLeft: `2.5px solid ${C.tomato}`, opacity: lerp(f, 80, 90) }}>
            <span style={{ position: "absolute", top: -4, left: -34, background: C.tomato, border: border(1.5), borderRadius: 6, padding: "1px 6px", fontFamily: F.mono, fontWeight: 700, fontSize: 11 }}>TODAY</span>
          </div>
          {/* event day */}
          <div style={{ position: "absolute", left: x(38), top: 22, bottom: 0, borderLeft: `2.5px solid ${C.ink}`, opacity: lerp(f, 150, 160) }}>
            <div style={{ position: "absolute", top: -4, left: -2, background: C.ink, color: "#fff", borderRadius: "0 8px 8px 0", padding: "3px 10px", fontFamily: F.mono, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>EVENT DAY</div>
          </div>
          {PATH.map((r, k) => {
            const s = 86 + k * 9;
            const g = lerp(f, s, s + 26);
            const y = 36 + k * 48;
            return (
              <div key={r.name}>
                <div style={{ position: "absolute", left: 0, top: y + 8, width: 170, opacity: lerp(f, s, s + 8) }}>
                  <Mono size={11} color={k === 0 ? C.green : C.muted}>{k === 0 ? "Done" : `Step ${k + 1}`}</Mono>
                </div>
                <div style={{ position: "absolute", left: x(r.a), top: y, height: 38, width: (x(r.b) - x(r.a)) * g, background: r.color, border: border(2), borderRadius: 10, overflow: "hidden", display: "flex", alignItems: "center", padding: "0 12px", gap: 8, boxShadow: g > 0.95 ? "2px 2px 0 #161514" : undefined }}>
                  {r.done && <Icon name="check" size={16} stroke={3} color={r.color === C.green ? "#fff" : C.ink} />}
                  <span style={{ fontFamily: F.body, fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", color: r.color === C.green ? "#fff" : C.ink, opacity: lerp(f, s + 14, s + 24) }}>{r.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
