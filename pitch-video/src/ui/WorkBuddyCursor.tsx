/**
 * WorkBuddy's own cursor: a Tencent-blue pointer with a name tag, moving on
 * smooth bezier arcs (spring timed), with click ripples and an optional
 * status chip ("calculating budget…").
 */
import type { ReactNode } from "react";
import { interpolate, random, spring } from "remotion";
import { C, border, hard } from "../theme";
import { lerp, pop } from "./anim";
import { F } from "./fonts";

export const WB_BLUE = C.wb;

export type WBKey = { f: number; x: number; y: number; click?: boolean };
export type WBChip = { from: number; to: number; text: string };

/** Position of the WorkBuddy cursor at frame f: spring-timed quadratic bezier between keys. */
export function wbAt(keys: WBKey[], f: number, seed = "wb") {
  if (f <= keys[0].f) return { x: keys[0].x, y: keys[0].y };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.f) {
      const dur = Math.max(1, b.f - a.f);
      const t = spring({ frame: f - a.f, fps: 30, durationInFrames: dur, config: { damping: 15, stiffness: 140, mass: 0.7 } });
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d < 1) return { x: a.x, y: a.y };
      // control point: off to one side of the straight line, side picked by seed
      const side = random(`${seed}-${i}`) > 0.5 ? 1 : -1;
      const bend = Math.min(140, d * 0.28) * side;
      const cx = a.x + dx / 2 + (-dy / d) * bend;
      const cy = a.y + dy / 2 + (dx / d) * bend;
      const u = 1 - t;
      return { x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l.x, y: l.y };
}

/** Tiny robot-cat face for the name tag (simplified WorkBuddy mascot). */
export function MascotFace({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.86} viewBox="0 0 44 38" style={{ display: "block", flexShrink: 0 }}>
      <path d="M8 16 L7 2 L17 10 Z" fill="#fff" />
      <path d="M36 16 L37 2 L27 10 Z" fill="#fff" />
      <rect x="4" y="7" width="36" height="30" rx="13" fill="#fff" />
      <rect x="10" y="15" width="24" height="14" rx="7" fill="#262a31" />
      <path d="M16 19 L17.6 22 L16 25 L14.4 22 Z" fill="#19d3c5" />
      <path d="M28 19 L29.6 22 L28 25 L26.4 22 Z" fill="#19d3c5" />
    </svg>
  );
}

function Spin({ f }: { f: number }) {
  return (
    <svg width={13} height={13} viewBox="0 0 20 20" style={{ transform: `rotate(${f * 16}deg)`, flexShrink: 0, display: "block" }}>
      <circle cx="10" cy="10" r="7" fill="none" stroke="#cfdcf7" strokeWidth="3.2" />
      <path d="M10 3 A7 7 0 0 1 17 10" fill="none" stroke={WB_BLUE} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function WorkBuddyCursor({ keys, f, chips = [], showFrom, hideAfter, seed = "wb", flipX = 1480 }: { keys: WBKey[]; f: number; chips?: WBChip[]; showFrom?: number; hideAfter?: number; seed?: string; flipX?: number }) {
  const from = showFrom ?? keys[0].f;
  const show = lerp(f, from - 8, from) * (hideAfter !== undefined ? lerp(f, hideAfter, hideAfter + 8, 1, 0) : 1);
  if (show <= 0) return null;
  const p = wbAt(keys, f, seed);
  // idle drift so the cursor never looks frozen
  const x = p.x + Math.sin(f / 13) * 1.6;
  const y = p.y + Math.cos(f / 17) * 1.6;

  let press = 1;
  const ripples: ReactNode[] = [];
  keys.forEach((k, i) => {
    if (!k.click) return;
    const t = f - k.f;
    if (t >= 0 && t < 8) press = Math.min(press, interpolate(t, [0, 3, 8], [1, 0.78, 1]));
    if (t >= 0 && t < 24) {
      const r = lerp(t, 0, 24, 6, 50);
      const r2 = lerp(t, 4, 24, 2, 30);
      ripples.push(
        <div key={i}>
          <div style={{ position: "absolute", left: k.x - r, top: k.y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `3px solid ${WB_BLUE}`, opacity: lerp(t, 6, 24, 1, 0), background: "rgba(0,82,217,.10)" }} />
          {t >= 4 && <div style={{ position: "absolute", left: k.x - r2, top: k.y - r2, width: r2 * 2, height: r2 * 2, borderRadius: "50%", border: `2px solid ${WB_BLUE}`, opacity: lerp(t, 10, 24, 0.8, 0) }} />}
        </div>,
      );
    }
  });

  const live = chips.filter((c) => f >= c.from && f < c.to + 8);
  const chip = live.length ? live[live.length - 1] : undefined;
  const chipIn = chip ? pop(f, chip.from, { damping: 15 }) * lerp(f, chip.to, chip.to + 8, 1, 0) : 0;
  const flip = x > flipX;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 190, opacity: show }}>
      {ripples}
      <div style={{ position: "absolute", left: x, top: y }}>
        <svg width={34} height={42} viewBox="0 0 38 46" style={{ position: "absolute", left: -4, top: -2, transform: `scale(${press})`, transformOrigin: "4px 2px", filter: "drop-shadow(3px 4px 0 rgba(22,21,20,.85))" }}>
          <path d="M4 2 L4 36 L13 28 L19 42 L26 39 L20 25 L32 25 Z" fill={WB_BLUE} stroke="#fff" strokeWidth={2.6} strokeLinejoin="round" />
        </svg>
        <div style={{ position: "absolute", top: 34, ...(flip ? { right: 4 } : { left: 18 }), display: "flex", flexDirection: "column", alignItems: flip ? "flex-end" : "flex-start", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: WB_BLUE, color: "#fff", border: border(1.5), borderRadius: 9, padding: "3px 10px 3px 5px", boxShadow: hard(2), whiteSpace: "nowrap" }}>
            <MascotFace size={21} />
            <span style={{ fontFamily: F.body, fontWeight: 700, fontSize: 15 }}>WorkBuddy</span>
          </div>
          {chip && chipIn > 0.01 && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#fff", border: `1.5px solid ${WB_BLUE}`, borderRadius: 99, padding: "3px 11px 3px 7px", whiteSpace: "nowrap", opacity: Math.min(1, chipIn * 1.4), transform: `translateY(${(1 - chipIn) * -8}px) scale(${0.85 + 0.15 * chipIn})`, transformOrigin: flip ? "right top" : "left top", boxShadow: "2px 2px 0 rgba(0,82,217,.35)" }}>
              <Spin f={f} />
              <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12.5, color: WB_BLUE, letterSpacing: "0.02em" }}>{chip.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Build cursor keys from click targets: glide in, settle, click. */
export function keysFromTargets(targets: { at: number; x: number; y: number }[], settle = 4): WBKey[] {
  const out: WBKey[] = [];
  targets.forEach((t) => {
    out.push({ f: t.at - settle, x: t.x, y: t.y });
    out.push({ f: t.at, x: t.x, y: t.y, click: true });
  });
  return out;
}
