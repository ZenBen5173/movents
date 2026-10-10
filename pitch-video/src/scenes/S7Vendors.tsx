import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { VENDOR_TABS, type Vendor } from "../data";
import { C, CONTENT, SCENES, border, hard } from "../theme";
import { lerp, mix, pop, soft } from "../ui/anim";
import { AppFrame, UNI_PAGES } from "../ui/AppFrame";
import { F } from "../ui/fonts";
import { Icon, Star } from "../ui/Icon";
import { Kicker, Mono, card } from "../ui/kit";
import { Camera, Cursor, type CurKey } from "../ui/motion";

const SWITCH = [0, 82, 156, 230];
const TILE_W = 448;
const GAP = 28;
const PHOTO_H = 336;
const GRID_Y = 238;
const CAT_Y = 166;

const catW = (i: number) => 34 + (VENDOR_TABS[i].label.length + 2) * 10.4;
const CAT_X: number[] = [];
VENDOR_TABS.reduce((x, _, i) => {
  CAT_X[i] = x;
  return x + catW(i) + 26;
}, 0);

function Tile({ v, f, enterAt, leaveAt, i }: { v: Vendor; f: number; enterAt: number; leaveAt?: number; i: number }) {
  const p = pop(f, enterAt + i * 5, { damping: 13 });
  const out = leaveAt !== undefined ? lerp(f, leaveAt + i * 2, leaveAt + 10 + i * 2) : 0;
  if (p <= 0 || out >= 1) return null;
  const x = (i % 3) * (TILE_W + GAP);
  const y = GRID_Y + Math.floor(i / 3) * (PHOTO_H + 80 + 26);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: TILE_W, opacity: Math.min(1, p * 1.4) * (1 - out), transform: `translateY(${(1 - p) * 70 + out * 60}px) rotate(${(1 - p) * (i % 2 ? 4 : -4) + out * (i % 2 ? -6 : 6)}deg)` }}>
      <div style={{ ...card(5), overflow: "hidden" }}>
        <div style={{ position: "relative", height: PHOTO_H, borderBottom: border(2), overflow: "hidden" }}>
          <Img src={staticFile(v.img)} style={{ width: "100%", height: "100%", objectFit: "cover", transformOrigin: v.crop ? `${v.crop.x} ${v.crop.y}` : "50% 50%", transform: `scale(${(v.crop?.s ?? 1) * (1.06 - 0.06 * lerp(f, enterAt, enterAt + 60))})` }} />
          <div style={{ position: "absolute", left: 14, top: 14, background: "#fff", border: border(2), borderRadius: 9, padding: "5px 11px", fontFamily: F.mono, fontWeight: 700, fontSize: 16, boxShadow: hard(2) }}>{v.price}</div>
          {v.used && (
            <div style={{ position: "absolute", right: 14, top: 16, background: C.sun, border: border(2), borderRadius: 7, padding: "4px 10px", fontFamily: F.mono, fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", transform: `rotate(${6}deg) scale(${pop(f, enterAt + i * 5 + 14)})`, boxShadow: hard(2) }}>USED {v.used}X</div>
          )}
        </div>
        <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", height: 80 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 23, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.name}</div>
            <div style={{ fontSize: 15, color: C.muted }}>{v.sub}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {[0, 1, 2, 3, 4].map((s) => (
              <div key={s} style={{ transform: `scale(${pop(f, enterAt + i * 5 + 8 + s * 2)})` }}>
                <Star size={17} fill={s < Math.round(v.rating) ? C.sun : "#fff"} />
              </div>
            ))}
            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 15, marginLeft: 6 }}>{v.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function S7Vendors() {
  const f = useCurrentFrame();
  let cur = 0;
  SWITCH.forEach((s, i) => {
    if (f >= s) cur = i;
  });
  const prev = Math.max(0, cur - 1);
  const slide = cur === 0 ? 1 : lerp(f, SWITCH[cur], SWITCH[cur] + 12);
  const ux = mix(CAT_X[prev], CAT_X[cur], slide);
  const uw = mix(catW(prev), catW(cur), slide);
  const head = soft(f, 4);
  const tabCY = CONTENT.y + CAT_Y + 24;
  const keys: CurKey[] = [{ f: 40, x: 1700, y: 940 }];
  for (let i = 1; i < 4; i++) {
    const cx = CONTENT.x + CAT_X[i] + catW(i) / 2;
    keys.push({ f: SWITCH[i] - 16, x: cx, y: tabCY + 4 });
    keys.push({ f: SWITCH[i], x: cx, y: tabCY + 4, click: true });
    keys.push({ f: SWITCH[i] + 30, x: cx + 50, y: tabCY + 170 });
  }
  return (
    <AbsoluteFill>
      <Camera
        keys={[
          { f: 0, s: 1, x: 960, y: 540 },
          { f: 20, s: 1, x: 960, y: 540 },
          { f: 70, s: 1.04, x: 1010, y: 560 },
          { f: SCENES.vendors, s: 1.06, x: 1020, y: 570 },
        ]}
      >
        <AppFrame crumbs={["Movents", "Universities", "Sunway University", "Vendors"]} f={f} sidebar={{ active: "u:Vendors", openUni: true, backstage: 2 }}>
          <div style={{ opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 46, lineHeight: 1.05 }}>Vendors</div>
            <div style={{ fontSize: 18, color: C.muted, marginTop: 4 }}>Sunway University · suppliers societies have used, priced and rated</div>
          </div>
          <div style={{ position: "absolute", top: 98, left: 0, right: 0, height: 48, borderBottom: `1.5px solid ${C.line}`, display: "flex", gap: 30, opacity: soft(f, 8) }}>
            {UNI_PAGES.map((p, i) => (
              <div key={p.label} style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, fontSize: 17.5, fontWeight: i === 2 ? 700 : 500, color: i === 2 ? C.ink : C.muted }}>
                <Icon name={p.icon} size={18} color={i === 2 ? C.tomato : C.muted} />
                {p.label}
                {i === 2 && <div style={{ position: "absolute", left: 0, right: 0, bottom: -2, height: 3, background: C.ink }} />}
              </div>
            ))}
          </div>
          {/* category underline tabs */}
          <div style={{ position: "absolute", top: CAT_Y, left: 0, right: 0, height: 50, borderBottom: `2px solid ${C.ink}`, opacity: soft(f, 12) }}>
            {VENDOR_TABS.map((t, i) => (
              <div key={t.label} style={{ position: "absolute", left: CAT_X[i], width: catW(i), top: 0, height: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: F.body, fontSize: 19, fontWeight: i === cur ? 700 : 500, color: i === cur ? C.ink : C.muted, whiteSpace: "nowrap" }}>
                {t.label}
                <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: i === cur ? C.tomatoInk : C.muted }}>{t.items.length}</span>
              </div>
            ))}
            <div style={{ position: "absolute", left: ux, width: uw, bottom: -3, height: 5, background: C.tomato, borderRadius: 3 }} />
          </div>
          {VENDOR_TABS.map((t, ti) =>
            t.items.map((v, i) => <Tile key={`${ti}-${i}`} v={v} i={i} f={f} enterAt={SWITCH[ti] + (ti === 0 ? 14 : 8)} leaveAt={SWITCH[ti + 1]} />),
          )}
        </AppFrame>
        <Cursor f={f} keys={keys} />
      </Camera>
      <Kicker n="07" label="Vendors, priced and rated" f={f} x={1110} y={14} dur={SCENES.vendors} />
    </AbsoluteFill>
  );
}
