import { Easing, interpolate, spring } from "remotion";

export const EO = Easing.bezier(0.22, 1, 0.36, 1);
export const EIO = Easing.bezier(0.65, 0, 0.35, 1);

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Eased 0..1 (or from..to) between frames a and b. */
export function lerp(f: number, a: number, b: number, from = 0, to = 1, easing: (t: number) => number = EO) {
  if (b <= a) return f >= a ? to : from;
  return interpolate(f, [a, b], [from, to], { ...CLAMP, easing });
}

/** Bouncy spring from 0 to 1 starting at `start`. */
export function pop(f: number, start: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) {
  if (f < start) return 0;
  return spring({ frame: f - start, fps: 30, config: { damping: 13, stiffness: 170, mass: 0.8, ...cfg } });
}

/** Smooth, non-overshooting spring. */
export function soft(f: number, start: number, damping = 200) {
  if (f < start) return 0;
  return spring({ frame: f - start, fps: 30, config: { damping } });
}

/** Typewriter: the visible part of `text` at frame f. */
export function typed(text: string, f: number, start: number, perFrame = 1.2) {
  const n = Math.floor((f - start) * perFrame);
  return text.slice(0, Math.max(0, Math.min(text.length, n)));
}

export function typingDone(text: string, start: number, perFrame = 1.2) {
  return start + Math.ceil(text.length / perFrame);
}

export function count(f: number, start: number, dur: number, to: number, decimals = 0) {
  const v = lerp(f, start, start + dur) * to;
  const m = Math.pow(10, decimals);
  return Math.round(v * m) / m;
}

export const blink = (f: number) => Math.floor(f / 14) % 2 === 0;

export const money = (n: number) => `RM${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
