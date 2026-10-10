import { C, border, hard } from "../theme";
import { F } from "./fonts";
import { Mono } from "./kit";

/** A miniature document page: accent header, title, text lines, optional table or photo block. Lines reveal with `p` (0..1). */
export function DocThumb({ title, kind, accent = C.tomato, w = 220, p = 1, variant = "text" }: { title: string; kind: string; accent?: string; w?: number; p?: number; variant?: "text" | "table" | "profile" }) {
  const h = w * 1.3;
  const lines = 9;
  return (
    <div style={{ width: w, height: h, background: "#fff", border: border(2), borderRadius: 10, boxShadow: hard(4), overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <div style={{ height: w * 0.2, background: accent, borderBottom: border(2), padding: `${w * 0.04}px ${w * 0.06}px`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Mono size={Math.max(8, w * 0.045)} color={C.ink}>{kind}</Mono>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: w * 0.075, lineHeight: 1.1, marginTop: 2 }}>{title}</div>
      </div>
      <div style={{ padding: w * 0.06, display: "flex", flexDirection: "column", gap: w * 0.035 }}>
        {variant === "profile" && (
          <div style={{ display: "flex", gap: w * 0.05, marginBottom: w * 0.02 }}>
            <div style={{ width: w * 0.24, height: w * 0.28, borderRadius: 6, background: C.sky, border: border(1.5) }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: w * 0.03, paddingTop: 4 }}>
              {[0.9, 0.6, 0.75].map((l, i) => (
                <div key={i} style={{ height: w * 0.03, width: `${l * 100 * Math.min(1, p * 3)}%`, background: i === 0 ? C.ink : "#d9d3c6", borderRadius: 4 }} />
              ))}
            </div>
          </div>
        )}
        {variant === "table" && (
          <div style={{ border: border(1.2), borderRadius: 4, overflow: "hidden", marginBottom: w * 0.02 }}>
            {[0, 1, 2, 3].map((r) => (
              <div key={r} style={{ display: "flex", borderTop: r ? `1px solid ${C.line}` : undefined, background: r === 0 ? C.sand : "#fff", height: w * 0.065, opacity: p > r * 0.15 ? 1 : 0 }}>
                {[0, 1, 2].map((c) => (
                  <div key={c} style={{ flex: c === 0 ? 2 : 1, borderLeft: c ? `1px solid ${C.line}` : undefined }} />
                ))}
              </div>
            ))}
          </div>
        )}
        {Array.from({ length: variant === "text" ? lines : 5 }).map((_, i) => {
          const len = [0.95, 0.85, 0.9, 0.6, 0.92, 0.8, 0.88, 0.5, 0.7][i % 9];
          const shown = Math.max(0, Math.min(1, p * (lines + 2) - i));
          return <div key={i} style={{ height: w * 0.028, width: `${len * shown * 100}%`, background: i % 4 === 0 ? "#bdb6a8" : "#e2ddd2", borderRadius: 4 }} />;
        })}
      </div>
    </div>
  );
}
