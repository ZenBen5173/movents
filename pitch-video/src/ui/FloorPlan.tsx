import { C } from "../theme";
import { F } from "./fonts";
import { lerp, pop } from "./anim";

/** Rooftop Terrace floor plan (19 tables, 78 chairs), redrawn from the society's sketch. */

type Pt = { x: number; y: number };
const T = 44;

function row(x0: number, y: number, n: number, o: { top?: number; bottom?: number; ends?: number }) {
  const tables: Pt[] = [];
  const chairs: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (T + 12);
    tables.push({ x, y });
    const per = (k: number) => Array.from({ length: k }, (_, j) => x + ((j + 1) * T) / (k + 1));
    for (const cx of per(o.top ?? 0)) chairs.push({ x: cx, y: y - 13 });
    for (const cx of per(o.bottom ?? 0)) chairs.push({ x: cx, y: y + T + 13 });
  }
  const ends = o.ends ?? 0;
  const xr = x0 + n * (T + 12) - 12;
  for (let j = 0; j < ends; j++) {
    const cy = y + ((j + 1) * T) / (ends + 1);
    chairs.push({ x: x0 - 13, y: cy }, { x: xr + 13, y: cy });
  }
  return { tables, chairs };
}

function column(x: number, y0: number, n: number, sides: number) {
  const tables: Pt[] = [];
  const chairs: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const y = y0 + i * (T + 12);
    tables.push({ x, y });
    for (let j = 0; j < sides; j++) {
      const cy = y + ((j + 1) * T) / (sides + 1);
      chairs.push({ x: x - 13, y: cy }, { x: x + T + 13, y: cy });
    }
  }
  chairs.push({ x: x + T / 3, y: y0 - 14 }, { x: x + (2 * T) / 3, y: y0 - 14 });
  const yb = y0 + n * (T + 12) - 12;
  chairs.push({ x: x + T / 3, y: yb + 14 }, { x: x + (2 * T) / 3, y: yb + 14 });
  return { tables, chairs };
}

const r1 = row(290, 205, 4, { top: 2, bottom: 2, ends: 2 });
r1.chairs.push({ x: 396, y: 192 });
const r2 = row(290, 325, 4, { top: 2, bottom: 2, ends: 2 });
r2.chairs.push({ x: 396, y: 312 });

export const CLUSTERS: { id: string; label: string; tables: Pt[]; chairs: Pt[] }[] = [
  { id: "top", label: "Lounge pair", tables: [{ x: 245, y: 40 }, { x: 295, y: 40 }], chairs: [{ x: 255, y: 27 }, { x: 278, y: 27 }, { x: 305, y: 27 }, { x: 328, y: 27 }] },
  { id: "left", label: "West banquet", ...column(118, 130, 4, 2) },
  { id: "r1", label: "Centre row A", ...r1 },
  { id: "r2", label: "Centre row B", ...r2 },
  { id: "lower", label: "Lower banquet", ...column(210, 450, 2, 2) },
  { id: "buffet", label: "Buffet", tables: [{ x: 402, y: 455 }, { x: 402, y: 502 }, { x: 402, y: 549 }], chairs: [] },
];

export const PLAN_TABLES = CLUSTERS.reduce((n, c) => n + c.tables.length, 0);
export const PLAN_CHAIRS = CLUSTERS.reduce((n, c) => n + c.chairs.length, 0);

const FIXTURES = [
  { x: 524, y: 26, w: 46, h: 30, label: "Speaker" },
  { x: 374, y: 54, w: 122, h: 24, label: "Portable TV" },
  { x: 524, y: 400, w: 46, h: 30, label: "Speaker" },
];

/** Animated plan. `f` is local; walls draw from `start`, then fixtures and clusters pop in. Returns how many tables/chairs are visible via callback-free counters (see helpers below). */
export function FloorPlan({ f, start, height = 600, highlight }: { f: number; start: number; height?: number; highlight?: string }) {
  const wall = lerp(f, start, start + 40);
  return (
    <svg viewBox="0 0 600 690" height={height} width={(height * 600) / 690} style={{ display: "block", background: "#fbf8f1", borderRadius: 14 }}>
      <defs>
        <pattern id="fp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#161514" strokeOpacity=".06" />
        </pattern>
        <marker id="fp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10z" fill={C.ink} />
        </marker>
      </defs>
      <rect width="600" height="690" fill="url(#fp-grid)" />
      <path d="M148 10 H575 V432 H465 V676 H170 V405 H85 V75 H148 V10" fill="#fff" fillOpacity={lerp(f, start + 25, start + 40)} stroke="none" />
      <path d="M148 10 H575 V432 H465 V676 H170 M170 620 V405 H85 V75 H148 V10" fill="none" stroke={C.ink} strokeWidth="4" strokeLinejoin="round" strokeDasharray="2600" strokeDashoffset={2600 * (1 - wall)} />
      <g opacity={lerp(f, start + 30, start + 40)} style={{ fontFamily: F.mono }}>
        <rect x="128" y="34" width="10" height="28" fill={C.tomato} stroke={C.ink} strokeWidth="1.5" />
        <text x="12" y="36" fontSize="13" fontWeight="700" fill={C.ink}>Rooftop</text>
        <text x="12" y="52" fontSize="13" fontWeight="700" fill={C.ink}>entrance</text>
        <path d="M84 46 H120" stroke={C.ink} strokeWidth="2" markerEnd="url(#fp-arrow)" />
        <path d="M206 640 H156" stroke={C.ink} strokeWidth="2" markerEnd="url(#fp-arrow)" />
        <text x="212" y="645" fontSize="13" fontWeight="700" fill={C.ink}>To washroom</text>
      </g>
      {FIXTURES.map((x, i) => {
        const p = pop(f, start + 34 + i * 4);
        return (
          <g key={i} transform={`translate(${x.x + x.w / 2} ${x.y + x.h / 2}) scale(${p}) translate(${-x.w / 2} ${-x.h / 2})`}>
            <rect width={x.w} height={x.h} rx="3" fill={C.sky} stroke={C.ink} strokeWidth="1.8" />
            <text x={x.w / 2} y={x.h / 2 + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill={C.ink} style={{ fontFamily: F.mono }}>{x.label}</text>
          </g>
        );
      })}
      {CLUSTERS.map((c, ci) => {
        const cs = start + 46 + ci * 12;
        const hl = highlight === c.id;
        return (
          <g key={c.id}>
            {c.chairs.map((ch, i) => {
              const p = pop(f, cs + 4 + i * 0.6, { damping: 10 });
              return <circle key={i} cx={ch.x} cy={ch.y} r={6.5 * p} fill={hl ? C.tomato : "#fff"} stroke={C.ink} strokeWidth="1.6" />;
            })}
            {c.tables.map((t, i) => {
              const p = pop(f, cs + i * 2, { damping: 11 });
              return <rect key={i} x={t.x + (T / 2) * (1 - p)} y={t.y + (T / 2) * (1 - p)} width={T * p} height={T * p} rx="3" fill={c.id === "buffet" ? C.mint : hl ? C.sun : "#fff"} stroke={C.ink} strokeWidth="2.2" />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

/** Visible counts at frame f, for live counters next to the plan. */
export function planCounts(f: number, start: number) {
  let tables = 0;
  let chairs = 0;
  CLUSTERS.forEach((c, ci) => {
    const cs = start + 46 + ci * 12;
    c.tables.forEach((_, i) => {
      if (f >= cs + i * 2 + 3) tables++;
    });
    c.chairs.forEach((_, i) => {
      if (f >= cs + 4 + i * 0.6 + 3) chairs++;
    });
  });
  return { tables, chairs };
}
