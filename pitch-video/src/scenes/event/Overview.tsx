import type { ReactNode } from "react";
import { C, border } from "../../theme";
import { count, lerp, money, pop } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Generate, SkLine, SkRing, type GenTarget } from "../../ui/Generate";
import { Icon } from "../../ui/Icon";
import { Bar, Mono, Ring, Skel, Wristband, card } from "../../ui/kit";

// Tiles: 5 across 1400px with 20px gaps -> 264px each, 176px tall.
const TILE_W = 264;
const tileX = (i: number) => i * (TILE_W + 20) + TILE_W / 2;

/** WorkBuddy's click targets on this tab (tab-content coords, local frames). */
export const OVERVIEW_GEN: GenTarget[] = [
  { at: 40, x: tileX(0) - 30, y: 92, chip: "calculating budget…" },
  { at: 58, x: tileX(1) - 30, y: 92 },
  { at: 76, x: tileX(2) - 30, y: 92 },
  { at: 96, x: tileX(3) - 30, y: 92, chip: "scoring risks…" },
  { at: 114, x: tileX(4) - 30, y: 92 },
  { at: 140, x: 640, y: 360, chip: "mapping the critical path…" },
];
const AT = OVERVIEW_GEN.map((g) => g.at);

function TileSkel({ f, kind }: { f: number; kind: "num" | "ring" | "squares" | "icon" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Skel w={70} h={10} f={f} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
        {kind === "num" && (
          <>
            <Skel w={150} h={30} f={f} />
            <Skel w={170} h={10} f={f} />
            <Skel w="100%" h={12} f={f} />
          </>
        )}
        {kind === "ring" && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <SkRing f={f} size={92} stroke={14} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skel w={60} h={16} f={f} />
              <Skel w={80} h={10} f={f} />
            </div>
          </div>
        )}
        {kind === "squares" && (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2, 3, 4].map((k) => (
                <Skel key={k} w={40} h={40} r={8} f={f} />
              ))}
            </div>
            <Skel w={190} h={10} f={f} />
          </>
        )}
        {kind === "icon" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Skel w={62} h={62} r={16} f={f} />
              <Skel w={40} h={40} f={f} />
            </div>
            <SkLine f={f} ws={[80, 70]} h={16} gap={6} />
          </>
        )}
      </div>
    </div>
  );
}

function Tile({ f, i, label, kind, children }: { f: number; i: number; label: string; kind: "num" | "ring" | "squares" | "icon"; children: ReactNode }) {
  const p = pop(f, AT[i], { damping: 14 });
  return (
    <Generate f={f} at={AT[i]} skel={<TileSkel f={f} kind={kind} />} style={{ flex: 1, height: 176 }} pad="16px 18px" seed={`ov${i}`}>
      <div style={{ height: 176, ...card(4), padding: "16px 18px", transform: `scale(${0.94 + 0.06 * p})`, display: "flex", flexDirection: "column" }}>
        <Mono size={12}>{label}</Mono>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
      </div>
    </Generate>
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
  const g = (i: number) => f - AT[i];
  const cpAt = AT[5];
  const c = f - cpAt;
  return (
    <div>
      <div style={{ display: "flex", gap: 20 }}>
        <Tile f={f} i={0} label="Budget" kind="num">
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38 }}>{money(Math.round(count(g(0), 2, 36, 2725) / 5) * 5)}</div>
          <div style={{ fontSize: 15, color: C.muted, marginBottom: 10 }}>planned of RM3,000 cap</div>
          <Bar value={lerp(g(0), 2, 40) * 0.91} color={C.tomato} height={12} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <Mono size={11}>{Math.round(lerp(g(0), 2, 40) * 29)}% spent</Mono>
            <Mono size={11}>10% buffer</Mono>
          </div>
        </Tile>
        <Tile f={f} i={1} label="Tasks" kind="ring">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Ring value={lerp(g(1), 2, 40) * 0.42} size={96} color={C.tomato}>
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24 }}>{Math.round(lerp(g(1), 2, 40) * 42)}%</span>
            </Ring>
            <div style={{ fontSize: 16, lineHeight: 1.35 }}>
              <b style={{ fontSize: 22 }}>{count(g(1), 2, 38, 10)}</b> of 24
              <br />
              <span style={{ color: C.muted }}>done</span>
            </div>
          </div>
        </Tile>
        <Tile f={f} i={2} label="Going" kind="ring">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Ring value={lerp(g(2), 2, 40) * 0.64} size={96} color={C.green}>
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24 }}>{count(g(2), 2, 38, 96)}</span>
            </Ring>
            <div style={{ fontSize: 16, lineHeight: 1.35 }}>
              RSVPs
              <br />
              <span style={{ color: C.muted }}>of 150 seats</span>
            </div>
          </div>
        </Tile>
        <Tile f={f} i={3} label="Risks" kind="squares">
          <div style={{ display: "flex", gap: 8 }}>
            {[12, 12, 10, 9, 8].map((s, k) => {
              const p = pop(g(3), 2 + k * 4);
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
        <Tile f={f} i={4} label="Backstage" kind="icon">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: C.sky, border: border(2), display: "grid", placeItems: "center" }}>
              <Icon name="inbox" size={30} />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 46 }}>{count(g(4), 2, 16, 2)}</div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
            <Wristband label="President" bg={C.blue} color="#fff" size={10} />
            <Wristband label="Advisor" bg={C.mint} size={10} />
          </div>
        </Tile>
      </div>

      {/* critical path */}
      <Generate
        f={f}
        at={cpAt}
        style={{ marginTop: 24, height: 400 }}
        pad="18px 24px"
        seed="ovcp"
        wipe={34}
        sparks={24}
        skel={
          <div>
            <SkLine f={f} ws={[120, 220]} h={11} />
            <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 34 }}>
              {PATH.map((r, k) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  <Skel w={60} h={10} f={f} />
                  <Skel w={(x(r.b) - x(r.a)) * 0.95} h={30} r={10} f={f} style={{ marginLeft: x(r.a) - 60 }} />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <div style={{ ...card(5), height: 400, position: "relative", padding: "18px 24px" }}>
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
            <div style={{ position: "absolute", left: x(2), top: 22, bottom: 0, borderLeft: `2.5px solid ${C.tomato}`, opacity: lerp(c, 4, 12) }}>
              <span style={{ position: "absolute", top: -4, left: -34, background: C.tomato, border: border(1.5), borderRadius: 6, padding: "1px 6px", fontFamily: F.mono, fontWeight: 700, fontSize: 11 }}>TODAY</span>
            </div>
            {/* event day */}
            <div style={{ position: "absolute", left: x(38), top: 22, bottom: 0, borderLeft: `2.5px solid ${C.ink}`, opacity: lerp(c, 40, 48) }}>
              <div style={{ position: "absolute", top: -4, left: -2, background: C.ink, color: "#fff", borderRadius: "0 8px 8px 0", padding: "3px 10px", fontFamily: F.mono, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>EVENT DAY</div>
            </div>
            {PATH.map((r, k) => {
              const s = 2 + k * 6;
              const gr = lerp(c, s, s + 22);
              const y = 36 + k * 48;
              return (
                <div key={r.name}>
                  <div style={{ position: "absolute", left: 0, top: y + 8, width: 170, opacity: lerp(c, s, s + 8) }}>
                    <Mono size={11} color={k === 0 ? C.green : C.muted}>{k === 0 ? "Done" : `Step ${k + 1}`}</Mono>
                  </div>
                  <div style={{ position: "absolute", left: x(r.a), top: y, height: 38, width: (x(r.b) - x(r.a)) * gr, background: r.color, border: border(2), borderRadius: 10, overflow: "hidden", display: "flex", alignItems: "center", padding: "0 12px", gap: 8, boxShadow: gr > 0.95 ? "2px 2px 0 #161514" : undefined }}>
                    {r.done && <Icon name="check" size={16} stroke={3} color={r.color === C.green ? "#fff" : C.ink} />}
                    <span style={{ fontFamily: F.body, fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", color: r.color === C.green ? "#fff" : C.ink, opacity: lerp(c, s + 12, s + 20) }}>{r.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Generate>
    </div>
  );
}
