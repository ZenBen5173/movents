/**
 * Skeleton-to-content: a block shows a shimmering skeleton until WorkBuddy's
 * cursor clicks it at frame `at`, then it resolves into the real content with
 * a blue flash and a few brand-colour sparkles.
 *
 * The real content is always laid out (invisible before `at`), so the
 * skeleton overlay is exactly the size of what it becomes.
 */
import type { CSSProperties, ReactNode } from "react";
import { random } from "remotion";
import { C, border } from "../theme";
import { lerp } from "./anim";
import { Skel } from "./kit";
import { WB_BLUE } from "./WorkBuddyCursor";

/** A click target WorkBuddy visits, in tab-content coordinates, local tab frames. */
export type GenTarget = { at: number; x: number; y: number; chip?: string };

const SPARK = [C.tomato, C.sun, WB_BLUE, C.green, C.blue, C.peach];

/** Deterministic flecks over a w x h box, bursting at frame `at`. */
export function Sparkles({ f, at, w, h, n = 16, seed = "s", style }: { f: number; at: number; w: number | string; h: number | string; n?: number; seed?: string; style?: CSSProperties }) {
  const t = f - at;
  if (t < 0 || t > 30) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, pointerEvents: "none", zIndex: 20, ...style }}>
      {Array.from({ length: n }).map((_, i) => {
        const px = random(`${seed}x${i}`);
        const py = random(`${seed}y${i}`);
        const delay = random(`${seed}d${i}`) * 8;
        const lt = t - delay;
        if (lt < 0 || lt > 22) return null;
        const drift = lerp(lt, 0, 22) * (14 + random(`${seed}v${i}`) * 22);
        const ang = random(`${seed}a${i}`) * Math.PI * 2;
        const s = Math.sin(lerp(lt, 0, 22, 0, Math.PI, (q) => q)) * (0.7 + random(`${seed}s${i}`) * 0.7);
        const col = SPARK[i % SPARK.length];
        const star = i % 3 !== 2;
        return (
          <div key={i} style={{ position: "absolute", left: `calc(${px * 100}% + ${Math.cos(ang) * drift}px)`, top: `calc(${py * 100}% + ${Math.sin(ang) * drift - lt * 0.5}px)`, transform: `translate(-50%, -50%) scale(${s}) rotate(${lt * 9}deg)` }}>
            {star ? (
              <svg width={18} height={18} viewBox="0 0 20 20" style={{ display: "block" }}>
                <path d="M10 0 L12.4 7.6 L20 10 L12.4 12.4 L10 20 L7.6 12.4 L0 10 L7.6 7.6 Z" fill={col} stroke={C.ink} strokeWidth={1.2} strokeLinejoin="round" />
              </svg>
            ) : (
              <div style={{ width: 9, height: 9, borderRadius: 5, background: col, border: border(1.2) }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Wrap a block. Before `at` the skeleton (`skel`) shows; from `at` the children fade in.
 * `frame` draws a card-like skeleton frame around `skel`; set false for bare skeletons.
 */
export function Generate({ f, at, skel, children, style, radius = 16, frame = true, pad = "18px 22px", seed, sparks = 16, aim = 12, wipe }: { f: number; at: number; skel: ReactNode; children: ReactNode; style?: CSSProperties; radius?: number; frame?: boolean; pad?: string; seed?: string; sparks?: number; aim?: number; wipe?: number }) {
  const done = lerp(f, at, at + 6);
  // wipe: the skeleton is scanned away top to bottom over `wipe` frames, so rows turn real one by one
  const scan = wipe ? lerp(f, at, at + wipe, 0, 1, (q) => q) : 0;
  const gone = wipe ? (scan >= 1 ? 1 : 0) : lerp(f, at, at + 10);
  const target = f < at ? lerp(f, at - aim, at - aim + 6) : 0;
  const flash = f >= at && f < at + 16 ? lerp(f, at, at + 16) : -1;
  return (
    <div style={{ position: "relative", ...style }}>
      <div style={{ opacity: done, height: "100%", clipPath: wipe && scan < 1 ? `inset(-20px -20px ${(1 - scan) * 100}% -20px)` : undefined }}>{children}</div>
      {wipe && scan > 0 && scan < 1 && (
        <div style={{ position: "absolute", left: -6, right: -6, top: `${scan * 100}%`, height: 3, marginTop: -1.5, background: WB_BLUE, borderRadius: 2, boxShadow: "0 0 12px 3px rgba(0,82,217,.45)", zIndex: 21, pointerEvents: "none" }} />
      )}
      {gone < 1 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            padding: frame ? pad : 0,
            background: frame ? "#fbf9f4" : "transparent",
            border: frame ? `2px ${target > 0 ? "dashed" : "solid"} ${target > 0 ? WB_BLUE : C.line}` : undefined,
            outline: !frame && target > 0 ? `2px dashed ${WB_BLUE}` : undefined,
            outlineOffset: 4,
            boxShadow: target > 0 ? `0 0 0 ${3 + 3 * target}px rgba(0,82,217,${0.14 * target})` : undefined,
            opacity: 1 - gone,
            transform: wipe ? undefined : `scale(${1 + gone * 0.02})`,
            clipPath: wipe ? `inset(${scan * 100}% -12px -12px -12px)` : undefined,
            overflow: "hidden",
          }}
        >
          {skel}
        </div>
      )}
      {flash >= 0 && <div style={{ position: "absolute", inset: -4 - flash * 12, borderRadius: radius + 4 + flash * 12, border: `3px solid ${WB_BLUE}`, opacity: 1 - flash, pointerEvents: "none" }} />}
      {sparks > 0 && <Sparkles f={f} at={at} w="100%" h="100%" n={sparks} seed={seed ?? `g${at}`} />}
    </div>
  );
}

// ------------------------------------------------------------------ skeleton shapes

/** A row of bars: widths are px or % strings. */
export function SkLine({ f, ws, h = 14, gap = 14, style }: { f: number; ws: (number | string)[]; h?: number; gap?: number; style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap, ...style }}>
      {ws.map((w, i) => (
        <Skel key={i} w={w} h={h} f={f} />
      ))}
    </div>
  );
}

export function SkCircle({ f, size, style }: { f: number; size: number; style?: CSSProperties }) {
  return <Skel w={size} h={size} r={size / 2} f={f} style={{ flexShrink: 0, ...style }} />;
}

/** Shimmering donut ring. */
export function SkRing({ f, size, stroke }: { f: number; size: number; stroke: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <Skel w={size} h={size} r={size / 2} f={f} />
      <div style={{ position: "absolute", left: stroke, top: stroke, width: size - stroke * 2, height: size - stroke * 2, borderRadius: "50%", background: "#fbf9f4" }} />
    </div>
  );
}

/** Table skeleton: header bar plus n rows of bars. Use with Generate pad="0". */
export function SkTable({ f, rows, rowH, cols, lead, head = true, headH = 44 }: { f: number; rows: number; rowH: number; cols: (number | string)[]; lead?: number; head?: boolean; headH?: number }) {
  return (
    <div>
      {head && (
        <div style={{ height: headH, background: "#f1ede4", borderBottom: `2px solid ${C.line}`, display: "flex", alignItems: "center", padding: "0 20px" }}>
          <Skel w={120} h={10} f={f} />
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ height: rowH, display: "flex", alignItems: "center", gap: 18, padding: "0 20px", borderTop: i ? `1.5px solid ${C.line}` : undefined }}>
          {lead !== undefined && <SkCircle f={f} size={lead} />}
          {cols.map((w, k) => (
            <Skel key={k} w={typeof w === "number" ? w * (0.8 + 0.2 * ((i * 7 + k * 3) % 5) / 4) : w} h={k === 0 ? 14 : 11} f={f} />
          ))}
        </div>
      ))}
    </div>
  );
}
