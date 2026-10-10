import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { VENUES } from "../data";
import { C, CONTENT, SCENES, border, hard } from "../theme";
import { EIO, lerp, mix, pop, soft } from "../ui/anim";
import { AppFrame, UNI_PAGES } from "../ui/AppFrame";
import { CLUSTERS, FloorPlan, PLAN_CHAIRS, PLAN_TABLES, planCounts } from "../ui/FloorPlan";
import { F } from "../ui/fonts";
import { Icon } from "../ui/Icon";
import { Chip, Kicker, Mono, Note, Stamp, card } from "../ui/kit";
import { Camera, Cursor } from "../ui/motion";

const TILE_W = 448;
const GAP = 28;
const PHOTO_H = 252;
const GRID_Y = 170;
const tileX = (i: number) => (i % 3) * (TILE_W + GAP);
const tileY = (i: number) => GRID_Y + Math.floor(i / 3) * (PHOTO_H + 76 + 24);

const CLICK = 104;
const FLY = [CLICK + 4, CLICK + 34] as const;
const HERO = { x: 0, y: 36, w: 1400, h: 400 };
const CAL_Y = 700;
const PLAN_Y = 1250;
const PLAN_START = 350;

const BOOKINGS: Record<number, { t: string; bg: string; ours?: boolean }> = {
  7: { t: "Robotics Club", bg: C.sky },
  15: { t: "AI Talk @ Sunway", bg: C.tomato, ours: true },
  20: { t: "Photo Society", bg: C.mint },
  26: { t: "Booked", bg: C.sand },
  28: { t: "Dance Club", bg: C.peach },
};

function Tiles({ f, fade }: { f: number; fade: number }) {
  const hover = lerp(f, 90, 100) * (1 - lerp(f, CLICK, CLICK + 4));
  return (
    <>
      {VENUES.map((v, i) => {
        const p = pop(f, 8 + i * 6, { damping: 14 });
        const isRoof = i === 1;
        const lift = isRoof ? hover : 0;
        return (
          <div key={v.name} style={{ position: "absolute", left: tileX(i), top: tileY(i), width: TILE_W, opacity: Math.min(1, p * 1.4) * (isRoof ? (f >= FLY[0] ? 0 : 1) : fade), transform: `translateY(${(1 - p) * 50 - lift * 8}px) scale(${0.92 + 0.08 * p})` }}>
            <div style={{ ...card(4 + lift * 4), overflow: "hidden" }}>
              <div style={{ position: "relative", height: PHOTO_H, borderBottom: border(2), overflow: "hidden" }}>
                <Img src={staticFile(v.img)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1 + lift * 0.06})` }} />
                <div style={{ position: "absolute", left: 12, top: 12, display: "flex", alignItems: "center", gap: 6, background: "#fff", border: border(1.5), borderRadius: 9, padding: "4px 10px" }}>
                  <Icon name="seat" size={15} />
                  <Mono size={12} color={C.ink}>{v.seats} seats</Mono>
                </div>
              </div>
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 74 }}>
                <div>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 23 }}>{v.name}</div>
                  <Mono size={11}>{v.kind}</Mono>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 18, border: border(1.5), display: "grid", placeItems: "center", background: lift > 0.5 ? C.sun : "#fff" }}>
                  <Icon name="chevron" size={17} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function Calendar({ f }: { f: number }) {
  const cw = 1400 / 7;
  const ch = 88;
  return (
    <div style={{ ...card(5), overflow: "hidden" }}>
      <div style={{ display: "flex", background: C.sand, borderBottom: border(2) }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ width: cw, padding: "8px 14px" }}>
            <Mono size={12} color={C.ink}>{d}</Mono>
          </div>
        ))}
      </div>
      <div style={{ position: "relative", height: ch * 5 }}>
        {Array.from({ length: 35 }).map((_, k) => {
          const day = k + 1;
          const col = k % 7;
          const row = Math.floor(k / 7);
          const b = BOOKINGS[day];
          const bs = 200 + Object.keys(BOOKINGS).indexOf(String(day)) * 9;
          const p = b ? pop(f, bs) : 0;
          return (
            <div key={k} style={{ position: "absolute", left: col * cw, top: row * ch, width: cw, height: ch, borderRight: col < 6 ? `1.5px solid ${C.line}` : undefined, borderBottom: row < 4 ? `1.5px solid ${C.line}` : undefined, padding: "8px 10px", background: day > 30 ? "#f3f0e8" : b?.ours ? "#fff3ee" : "#fff" }}>
              {day <= 30 && <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: b?.ours ? C.tomatoInk : C.muted }}>{day}</span>}
              {b && (
                <div style={{ marginTop: 6, background: b.bg, border: border(1.5), borderRadius: 8, padding: "4px 8px", fontSize: 14.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", transform: `scale(${p})`, transformOrigin: "left center", boxShadow: b.ours ? hard(2) : undefined }}>{b.t}</div>
              )}
              {b?.ours && (
                <div style={{ position: "absolute", right: 8, top: 4 }}>
                  <Stamp f={f} start={236} color={C.tomatoInk} size={13} rotate={8}>Held</Stamp>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function S6Venues() {
  const f = useCurrentFrame();
  const head = soft(f, 4);
  const fly = lerp(f, FLY[0], FLY[1], 0, 1, EIO);
  const gridFade = 1 - lerp(f, CLICK + 2, CLICK + 16);
  const page = lerp(f, FLY[0] + 6, FLY[1]);
  const scroll = f < 290 ? lerp(f, 160, 205, 0, CAL_Y - 10, EIO) : lerp(f, 290, 340, CAL_Y - 10, PLAN_Y - 10, EIO);
  const r0 = { x: tileX(1), y: tileY(1), w: TILE_W, h: PHOTO_H };
  const rect = { x: mix(r0.x, HERO.x, fly), y: mix(r0.y, HERO.y, fly), w: mix(r0.w, HERO.w, fly), h: mix(r0.h, HERO.h, fly) };
  const counts = planCounts(f, PLAN_START);
  const hl = f > 470 ? CLUSTERS[Math.floor((f - 470) / 8) % CLUSTERS.length].id : undefined;
  const onPage = f >= FLY[0];
  return (
    <AbsoluteFill>
      <Camera
        keys={[
          { f: 0, s: 1, x: 960, y: 540 },
          { f: 20, s: 1, x: 960, y: 540 },
          { f: 80, s: 1.05, x: 1020, y: 560 },
          { f: 110, s: 1.05, x: 1020, y: 560 },
          { f: 150, s: 1, x: 960, y: 540 },
          { f: 340, s: 1, x: 960, y: 540 },
          { f: 380, s: 1.1, x: 870, y: 500 },
          { f: SCENES.venues, s: 1.1, x: 870, y: 500 },
        ]}
      >
        <AppFrame crumbs={onPage ? ["Movents", "Sunway University", "Venues", "Rooftop Terrace"] : ["Movents", "Universities", "Sunway University", "Venues"]} f={f} sidebar={{ active: "u:Venues", openUni: true, backstage: 2 }}>
          {/* grid page */}
          {gridFade > 0 && (
            <div style={{ position: "absolute", inset: 0 }}>
              <div style={{ opacity: head * gridFade, transform: `translateY(${(1 - head) * 20}px)` }}>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 46, lineHeight: 1.05 }}>Venues</div>
                <div style={{ fontSize: 18, color: C.muted, marginTop: 4 }}>Sunway University · 6 bookable spaces with live availability</div>
              </div>
              <div style={{ position: "absolute", top: 98, left: 0, right: 0, height: 48, borderBottom: `2px solid ${C.ink}`, display: "flex", gap: 30, opacity: soft(f, 10) * gridFade }}>
                {UNI_PAGES.map((p, i) => (
                  <div key={p.label} style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, fontSize: 17.5, fontWeight: i === 1 ? 700 : 500, color: i === 1 ? C.ink : C.muted }}>
                    <Icon name={p.icon} size={18} color={i === 1 ? C.tomato : C.muted} />
                    {p.label}
                    {i === 1 && <div style={{ position: "absolute", left: 0, right: 0, bottom: -3, height: 4, background: C.tomato }} />}
                  </div>
                ))}
              </div>
              <Tiles f={f} fade={gridFade} />
            </div>
          )}

          {/* venue page */}
          {onPage && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, transform: `translateY(${-scroll}px)` }}>
              <div style={{ opacity: page, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="arrowLeft" size={17} color={C.muted} />
                <Mono size={12.5}>All venues</Mono>
              </div>
              <div style={{ position: "absolute", left: HERO.x, top: HERO.y, width: HERO.w, height: HERO.h, borderRadius: 18, border: border(2.5), overflow: "hidden", boxShadow: hard(6), opacity: fly >= 1 ? 1 : 0 }}>
                <Img src={staticFile("rooftop-terrace.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.08 - 0.08 * lerp(f, FLY[1], FLY[1] + 120)})` }} />
              </div>
              <div style={{ position: "absolute", top: 460, left: 0, right: 0, display: "flex", alignItems: "flex-end", justifyContent: "space-between", opacity: page, transform: `translateY(${(1 - page) * 20}px)` }}>
                <div>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 54, lineHeight: 1.05 }}>Rooftop Terrace</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <Chip><Icon name="seat" size={16} />78 seats</Chip>
                    <Chip><Icon name="pin" size={16} />Sunway University, rooftop</Chip>
                    <Chip bg={C.mint}><Icon name="check" size={16} />Free on 15 Nov</Chip>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.ink, color: "#fff", borderRadius: 12, padding: "12px 20px", boxShadow: hard(3, C.tomato), fontWeight: 700, fontSize: 17 }}>
                  <Icon name="calendar" size={18} color="#fff" />
                  Hold for AI Talk
                </div>
              </div>
              <div style={{ position: "absolute", top: 600, left: 0, right: 0, display: "flex", gap: 18 }}>
                {[
                  { k: "Seats", v: "78" },
                  { k: "Tables", v: "19" },
                  { k: "AV", v: "TV + 2 speakers" },
                  { k: "Washroom", v: "Next floor" },
                ].map((x, i) => (
                  <div key={x.k} style={{ flex: 1, ...card(3), padding: "10px 16px", opacity: soft(f, FLY[1] + 4 + i * 4) }}>
                    <Mono size={11}>{x.k}</Mono>
                    <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24 }}>{x.v}</div>
                  </div>
                ))}
              </div>

              <div style={{ position: "absolute", top: CAL_Y, left: 0, right: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <Mono color={C.ink}>Availability · November 2026</Mono>
                  <Mono size={11}>Synced with the Student LIFE booking sheet</Mono>
                </div>
                <Calendar f={f} />
              </div>

              <div style={{ position: "absolute", top: PLAN_Y, left: 0, right: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <Mono color={C.ink}>Floor plan</Mono>
                  <Mono size={11}>Submitted with the booking</Mono>
                </div>
                <div style={{ display: "flex", gap: 36 }}>
                  <div style={{ border: border(2), borderRadius: 16, boxShadow: hard(5), overflow: "hidden" }}>
                    <FloorPlan f={f} start={PLAN_START} height={600} highlight={hl} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 380, paddingTop: 10 }}>
                    <div style={{ display: "flex", gap: 16 }}>
                      {[
                        { k: "Tables", v: counts.tables, of: PLAN_TABLES, bg: C.sun },
                        { k: "Chairs", v: counts.chairs, of: PLAN_CHAIRS, bg: C.peach },
                      ].map((x) => (
                        <div key={x.k} style={{ flex: 1, ...card(4), background: x.bg, padding: "12px 16px" }}>
                          <Mono size={11} color={C.ink}>{x.k}</Mono>
                          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 48, lineHeight: 1 }}>{x.v}</div>
                          <Mono size={10.5} color={C.ink}>of {x.of}</Mono>
                        </div>
                      ))}
                    </div>
                    <div style={{ ...card(4), padding: "14px 18px" }}>
                      <Mono color={C.ink}>Layout</Mono>
                      {CLUSTERS.map((c, i) => (
                        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, opacity: lerp(f, PLAN_START + 46 + i * 12, PLAN_START + 54 + i * 12), fontWeight: hl === c.id ? 700 : 500 }}>
                          <span style={{ width: 14, height: 14, borderRadius: 4, border: border(1.5), background: hl === c.id ? C.tomato : c.id === "buffet" ? C.mint : "#fff" }} />
                          <span style={{ fontSize: 16.5, flex: 1 }}>{c.label}</span>
                          <Mono size={11}>{c.tables.length} T · {c.chairs.length} C</Mono>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* flying photo */}
          {f >= FLY[0] && fly < 1 && (
            <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: mix(14, 18, fly), border: border(2.5), overflow: "hidden", boxShadow: hard(6), zIndex: 10 }}>
              <Img src={staticFile("rooftop-terrace.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.08)" }} />
            </div>
          )}
        </AppFrame>
        <Note f={f} start={PLAN_START + 125} x={CONTENT.x + 560} y={CONTENT.y + PLAN_Y - 1240 + 540} rotate={-4} size={40}>
          seats 78, exactly
        </Note>
        <Cursor
          f={f}
          keys={[
            { f: 50, x: 1720, y: 960 },
            { f: 92, x: CONTENT.x + tileX(1) + 260, y: CONTENT.y + tileY(1) + 140 },
            { f: CLICK, x: CONTENT.x + tileX(1) + 260, y: CONTENT.y + tileY(1) + 140, click: true },
            { f: CLICK + 30, x: CONTENT.x + 900, y: CONTENT.y + 300 },
          ]}
          hideAfter={CLICK + 26}
        />
      </Camera>
      <Kicker n="06" label="Venues with live availability" f={f} x={1110} y={14} dur={SCENES.venues} />
    </AbsoluteFill>
  );
}
