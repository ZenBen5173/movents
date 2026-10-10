import type { CSSProperties, ReactNode } from "react";
import { Img, random, staticFile } from "remotion";
import { C, border, hard } from "../theme";
import { F } from "./fonts";
import { lerp, pop } from "./anim";

export const card = (shadow = 4): CSSProperties => ({
  background: C.card,
  border: border(2),
  borderRadius: 16,
  boxShadow: hard(shadow),
});

export function Mono({ children, size = 13, color = C.muted, style }: { children: ReactNode; size?: number; color?: string; style?: CSSProperties }) {
  return (
    <span style={{ fontFamily: F.mono, fontSize: size, letterSpacing: "0.12em", textTransform: "uppercase", color, fontWeight: 700, whiteSpace: "nowrap", ...style }}>
      {children}
    </span>
  );
}

/** Movents logo: tomato ticket with side notches. */
export function Logo({ size = 40, notch = C.side }: { size?: number; notch?: string }) {
  const w = size * 1.22;
  const n = size * 0.28;
  return (
    <div style={{ position: "relative", width: w, height: size, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: C.tomato, border: border(Math.max(1.5, size / 22)), borderRadius: size * 0.2, display: "grid", placeItems: "center", fontFamily: F.display, fontWeight: 700, fontSize: size * 0.45, color: C.ink }}>M</div>
      {[-1, 1].map((s) => (
        <div key={s} style={{ position: "absolute", top: "50%", [s < 0 ? "left" : "right"]: -n / 2, width: n, height: n, marginTop: -n / 2, borderRadius: "50%", background: notch, border: border(Math.max(1.5, size / 22)) }} />
      ))}
    </div>
  );
}

const AV_COLORS = [C.peach, C.sky, C.mint, C.sun];
export function Avatar({ name, size = 36, i = 0, photo, style }: { name: string; size?: number; i?: number; photo?: string; style?: CSSProperties }) {
  const ini = name.replace(/^Dr\.\s*/, "").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: border(2), background: AV_COLORS[i % 4], display: "grid", placeItems: "center", fontFamily: F.body, fontWeight: 700, fontSize: size * 0.36, overflow: "hidden", flexShrink: 0, ...style }}>
      {photo ? <Img src={staticFile(photo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ini}
    </div>
  );
}

export function Bar({ value, color = C.tomato, height = 12, bg = C.sand, style }: { value: number; color?: string; height?: number; bg?: string; style?: CSSProperties }) {
  return (
    <div style={{ height, borderRadius: height, background: bg, border: border(1.5), overflow: "hidden", ...style }}>
      <div style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: "100%", background: color, borderRight: value > 0.01 && value < 0.99 ? border(1.5) : undefined }} />
    </div>
  );
}

export function Ring({ value, size = 84, stroke = 11, color = C.tomato, children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.sand} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - value)} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={r + stroke / 2} fill="none" stroke={C.ink} strokeWidth={1.5} />
        <circle cx={size / 2} cy={size / 2} r={r - stroke / 2} fill="none" stroke={C.ink} strokeWidth={1.5} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>{children}</div>
    </div>
  );
}

/** Shimmering placeholder block. */
export function Skel({ w, h = 14, f, r = 7, style }: { w: number | string; h?: number; f: number; r?: number; style?: CSSProperties }) {
  const x = ((f * 9) % 600) - 200;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: `linear-gradient(100deg, #e9e4d8 0%, #e9e4d8 40%, #f6f2ea 50%, #e9e4d8 60%, #e9e4d8 100%)`,
        backgroundSize: "600px 100%",
        backgroundPosition: `${x}px 0`,
        ...style,
      }}
    />
  );
}

export function Stamp({ children, f, start, color = C.green, size = 22, rotate = -10, style }: { children: ReactNode; f: number; start: number; color?: string; size?: number; rotate?: number; style?: CSSProperties }) {
  const p = pop(f, start, { damping: 10, stiffness: 220 });
  if (f < start) return null;
  const s = 2.2 - 1.2 * p;
  return (
    <div style={{ display: "inline-block", fontFamily: F.mono, fontWeight: 700, fontSize: size, letterSpacing: "0.14em", textTransform: "uppercase", color, border: `3px solid ${color}`, borderRadius: 8, padding: "4px 12px", transform: `rotate(${rotate}deg) scale(${s})`, opacity: Math.min(1, p * 1.5), background: "rgba(255,255,255,.75)", ...style }}>
      {children}
    </div>
  );
}

export function Wristband({ label, bg = C.sun, color = C.ink, size = 12 }: { label: string; bg?: string; color?: string; size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: bg, color, border: border(1.5), borderRadius: 99, padding: `3px ${size}px 3px 5px` }}>
      <span style={{ width: size - 1, height: size - 1, borderRadius: "50%", background: "#fff", border: border(1.5) }} />
      <Mono size={size} color={color}>{label}</Mono>
    </span>
  );
}

export function Chip({ children, bg = "#fff", style }: { children: ReactNode; bg?: string; style?: CSSProperties }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: bg, border: border(1.5), borderRadius: 10, padding: "5px 11px", fontFamily: F.body, fontSize: 16, fontWeight: 500, whiteSpace: "nowrap", ...style }}>
      {children}
    </span>
  );
}

const FLAGS = [C.tomato, C.sun, C.blue, C.mint, C.peach];
export function Bunting({ width, f, count = 22, y = 0 }: { width: number; f: number; count?: number; y?: number }) {
  return (
    <div style={{ position: "relative", width, height: 30, marginTop: y }}>
      <svg width={width} height={14} style={{ position: "absolute", top: 0, left: 0 }} viewBox={`0 0 ${width} 14`} preserveAspectRatio="none">
        <path d={`M0 2 Q ${width / 2} 13 ${width} 2`} fill="none" stroke={C.ink} strokeWidth={1.4} />
      </svg>
      {Array.from({ length: count }).map((_, i) => {
        const t = i / (count - 1);
        const x = 14 + t * (width - 28);
        const sag = Math.sin(t * Math.PI) * 9;
        const sway = Math.sin(f / 12 + i * 0.7) * 6;
        return (
          <svg key={i} width={16} height={19} viewBox="0 0 16 19" style={{ position: "absolute", left: x - 8, top: 1 + sag, transformOrigin: "8px 0", transform: `rotate(${sway}deg)` }}>
            <path d="M0 0 H16 L8 19 Z" fill={FLAGS[i % 5]} stroke={C.ink} strokeWidth={1.4} strokeLinejoin="round" />
          </svg>
        );
      })}
    </div>
  );
}

/** Deterministic confetti burst centred on (x, y). */
export function Confetti({ f, start, x, y, n = 70, spread = 700, seed = "c" }: { f: number; start: number; x: number; y: number; n?: number; spread?: number; seed?: string }) {
  const t = f - start;
  if (t < 0 || t > 90) return null;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const v = 0.35 + random(`${seed}v${i}`) * 0.65;
        const dist = lerp(t, 0, 40) * spread * v * 0.5;
        const px = x + Math.cos(a) * dist;
        const py = y + Math.sin(a) * dist * 0.7 + t * t * 0.06;
        const rot = t * (8 + random(`${seed}r${i}`) * 14) * (i % 2 ? 1 : -1);
        const col = FLAGS[i % 5];
        const o = lerp(t, 60, 90, 1, 0);
        const sz = 10 + random(`${seed}s${i}`) * 10;
        return <div key={i} style={{ position: "absolute", left: px, top: py, width: sz, height: sz * 0.55, background: col, border: border(1.2), transform: `rotate(${rot}deg)`, opacity: o, borderRadius: 2 }} />;
      })}
    </>
  );
}

/** Handwritten annotation with an arrow. */
export function Note({ children, f, start, x, y, rotate = -4, color = C.tomatoInk, size = 40, arrow }: { children: ReactNode; f: number; start: number; x: number; y: number; rotate?: number; color?: string; size?: number; arrow?: "left" | "down" | "right" | "up" }) {
  const p = pop(f, start, { damping: 12 });
  if (f < start) return null;
  const arrows = {
    left: "M60 10 C 40 0, 20 4, 4 18 M4 18 L 16 18 M4 18 L 8 6",
    right: "M4 10 C 24 0, 44 4, 60 18 M60 18 L 48 18 M60 18 L 56 6",
    down: "M10 4 C 0 24, 4 44, 18 60 M18 60 L 18 48 M18 60 L 6 56",
    up: "M18 60 C 4 40, 4 20, 14 4 M14 4 L 4 12 M14 4 L 20 16",
  };
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `rotate(${rotate}deg) scale(${0.6 + 0.4 * p})`, opacity: p, transformOrigin: "left center", display: "flex", alignItems: "center", gap: 6, zIndex: 50 }}>
      {arrow === "left" && (
        <svg width={64} height={24} viewBox="0 0 64 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round">
          <path d={arrows.left} />
        </svg>
      )}
      <span style={{ fontFamily: F.hand, fontWeight: 700, fontSize: size, color, whiteSpace: "nowrap", lineHeight: 1 }}>{children}</span>
      {arrow === "right" && (
        <svg width={64} height={24} viewBox="0 0 64 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round">
          <path d={arrows.right} />
        </svg>
      )}
    </div>
  );
}

/** Lanyard pass with a strap, clip and swinging card. */
export function Pass({ header, tone = C.tomato, children, swing = 0, width = 300, headerColor = C.ink }: { header: string; tone?: string; children: ReactNode; swing?: number; width?: number; headerColor?: string }) {
  return (
    <div style={{ width, display: "flex", flexDirection: "column", alignItems: "center", transformOrigin: "50% 0", transform: `rotate(${swing}deg)` }}>
      <div style={{ display: "flex", gap: 28, height: 70, alignItems: "flex-end" }}>
        <div style={{ width: 16, height: "100%", background: C.tomato, borderRadius: 3, transform: "rotate(-14deg)", border: border(1.5) }} />
        <div style={{ width: 16, height: "100%", background: "#e24a2a", borderRadius: 3, transform: "rotate(14deg)", border: border(1.5) }} />
      </div>
      <div style={{ width: 40, height: 14, borderRadius: 4, background: "#a9a49a", border: border(1.5), marginBottom: -6, zIndex: 2 }} />
      <div style={{ width: "100%", ...card(5), overflow: "hidden" }}>
        <div style={{ background: tone, padding: "20px 14px 12px", textAlign: "center", position: "relative", borderBottom: border(2) }}>
          <div style={{ position: "absolute", left: "50%", top: 8, width: 44, height: 7, marginLeft: -22, borderRadius: 9, background: "rgba(255,255,255,.85)", border: border(1.2) }} />
          <Mono size={14} color={headerColor}>{header}</Mono>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  );
}

/** Chapter tag that drops in at the top of the frame. */
export function Kicker({ n, label, f, x = 1110, y = 14, dur }: { n: string; label: string; f: number; x?: number; y?: number; dur?: number }) {
  const p = pop(f, 14, { damping: 14 });
  // drop in, hold ~3.5 s, then lift away so it never covers the UI for long
  const exitAt = Math.min(dur ? dur - 30 : 120, 120);
  const out = lerp(f, exitAt, exitAt + 12, 0, 1);
  if (out >= 1) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, ${(1 - p) * -60 - out * 60}px) rotate(${(1 - p) * -6}deg)`, display: "flex", alignItems: "stretch", border: border(2), borderRadius: 12, overflow: "hidden", boxShadow: hard(4), zIndex: 300, background: C.ink }}>
      <span style={{ background: C.tomato, padding: "7px 12px", fontFamily: F.mono, fontWeight: 700, fontSize: 17, borderRight: border(2) }}>{n}</span>
      <span style={{ color: "#fff", padding: "7px 16px", fontFamily: F.mono, fontWeight: 700, fontSize: 17, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

export function Barcode({ seed, width = 140, height = 30 }: { seed: string; width?: number; height?: number }) {
  const bars: number[] = [];
  for (let i = 0; i < 34; i++) bars.push(1 + Math.floor(random(`${seed}${i}`) * 3));
  const total = bars.reduce((a, b) => a + b + 1.4, 0);
  let x = 0;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${total} ${height}`} preserveAspectRatio="none">
      {bars.map((b, i) => {
        const r = <rect key={i} x={x} y={0} width={b} height={height} fill={C.ink} />;
        x += b + 1.4;
        return r;
      })}
    </svg>
  );
}
