import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, H, W, border } from "../theme";
import { EIO, lerp } from "./anim";

// ------------------------------------------------------------------ camera

/** s = scale, (x, y) = stage point shown at the centre of the frame. */
export type CamKey = { f: number; s: number; x: number; y: number };

export function camAt(keys: CamKey[], f: number) {
  if (f <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const t = lerp(f, a.f, b.f, 0, 1, EIO);
      return { f, s: a.s + (b.s - a.s) * t, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return keys[keys.length - 1];
}

export function Camera({ keys, children }: { keys: CamKey[]; children: ReactNode }) {
  const f = useCurrentFrame();
  const { s, x, y } = camAt(keys, f);
  return (
    <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${W / 2 - x * s}px, ${H / 2 - y * s}px) scale(${s})` }}>
      {children}
    </AbsoluteFill>
  );
}

export const CAM_HOME: CamKey = { f: 0, s: 1, x: W / 2, y: H / 2 };

// ------------------------------------------------------------------ cursor

export type CurKey = { f: number; x: number; y: number; click?: boolean };

export function cursorAt(keys: CurKey[], f: number) {
  if (f <= keys[0].f) return { x: keys[0].x, y: keys[0].y };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const t = lerp(f, a.f, b.f, 0, 1, EIO);
      // slight arc so moves feel hand-made
      const arc = Math.sin(t * Math.PI) * Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.08);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - arc };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l.x, y: l.y };
}

export function Cursor({ keys, f, hideAfter, scale = 1 }: { keys: CurKey[]; f: number; hideAfter?: number; scale?: number }) {
  const { x, y } = cursorAt(keys, f);
  const show = lerp(f, keys[0].f - 8, keys[0].f) * (hideAfter !== undefined ? lerp(f, hideAfter, hideAfter + 8, 1, 0) : 1);
  if (show <= 0) return null;
  let press = 1;
  const ripples: ReactNode[] = [];
  keys.forEach((k, i) => {
    if (!k.click) return;
    const t = f - k.f;
    if (t >= 0 && t < 8) press = Math.min(press, interpolate(t, [0, 3, 8], [1, 0.8, 1]));
    if (t >= 0 && t < 22) {
      const r = lerp(t, 0, 22, 6, 46);
      ripples.push(<div key={i} style={{ position: "absolute", left: k.x - r, top: k.y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `3px solid ${C.tomato}`, opacity: lerp(t, 6, 22, 1, 0), background: "rgba(255,90,54,.12)" }} />);
    }
  });
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 200 }}>
      {ripples}
      <svg width={38} height={46} viewBox="0 0 38 46" style={{ position: "absolute", left: x - 4, top: y - 2, opacity: show, transform: `scale(${press * scale})`, transformOrigin: "4px 2px", filter: "drop-shadow(3px 4px 0 rgba(22,21,20,.9))" }}>
        <path d="M4 2 L4 36 L13 28 L19 42 L26 39 L20 25 L32 25 Z" fill="#fff" stroke={C.ink} strokeWidth={2.6} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ------------------------------------------------------------------ wipe

/** Diagonal brand-colour bands sweeping across; full cover at frame 15 of 30. */
export function Wipe({ colors, dir = 1 }: { colors: string[]; dir?: 1 | -1 }) {
  const f = useCurrentFrame();
  const band = 2700 / colors.length;
  const left = interpolate(f, [0, 30], [-2700 - 340, W + 340], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EIO });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", transform: dir < 0 ? "scaleX(-1)" : undefined, zIndex: 1000 }}>
      <div style={{ position: "absolute", top: -40, height: H + 80, left, width: 2700, display: "flex", transform: "skewX(-14deg)" }}>
        {colors.map((c, i) => (
          <div key={i} style={{ width: band, height: "100%", background: c, borderLeft: i ? border(3) : undefined }} />
        ))}
      </div>
    </AbsoluteFill>
  );
}
