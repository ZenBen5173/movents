/**
 * WorkBuddyWindow: a simplified recreation of the Tencent WorkBuddy macOS app
 * (light theme), used in scenes 1 and 2.
 *
 * Self-contained on purpose: all colours, sizes and copy live in the WB
 * object below so the look can be tuned without touching the scenes.
 * Empty state (layout 0): heading, Working/Coding toggle, chips and the big
 * input card. Task view (layout 1): user bubble, WorkBuddy step rows and a
 * docked input card.
 */
import { F } from "./fonts";
import { Logo } from "./kit";
import { mix } from "./anim";

export const WB = {
  bg: "#ffffff",
  side: "#f2f2f2",
  pill: "#e4e4e4",
  line: "#e6e6e6",
  text: "#111111",
  sub: "#8a8a8a",
  faint: "#b5b5b5",
  bubble: "#f2f2f2",
  strip: "#f5f5f5",
  teal: "#13b5a6",
  font: F.body,
  name: "WorkBuddy AI",
  version: "5.7.6",
  user: "weiling@sunwayaitech.example",
  model: "GPT-6.1-Sol",
  heading: "WorkBuddy, Ideas into reality",
  placeholder: "What can I help you with today? @ add context, / enable skills and commands",
};

export type WBStep = { label: string; state: "run" | "done" | "wait" };
export type WBMsg = { role: "user" | "assistant"; text: string; appear: number; steps?: WBStep[]; thinking?: boolean; final?: number };

export type WorkBuddyProps = {
  f: number;
  width?: number;
  height?: number;
  /** sidebar task list (newest first) */
  tasks: { title: string; time: string }[];
  /** index of the selected task, or -1 when "New Task" is selected */
  activeTask: number;
  chatTitle: string;
  /** 0 = new task screen, 1 = task conversation */
  layout: number;
  input: string;
  caret: boolean;
  sendPress?: number;
  messages: WBMsg[];
};

// ------------------------------------------------------------------ icons (thin line, 24 grid)

const LI: Record<string, string> = {
  sidebar: "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M9 4v16",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-4-4",
  filter: "M4 5h16l-6 8v5l-4 2v-7z",
  newtask: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 8v8 M8 12h8",
  assistant: "M8 3h8a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z M9.5 10h.01 M14.5 10h.01 M9 15c1.7 1.3 4.3 1.3 6 0",
  experts: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20a6 6 0 0 1 12 0 M16 4a3 3 0 0 1 0 6 M18 14a5 5 0 0 1 3 6",
  scheduled: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M12 9v4l2 2 M5 3L2 6 M19 3l3 3",
  library: "M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2z M20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z",
  cup: "M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z M16 11h1.5a2.5 2.5 0 0 1 0 5H16 M8 3v3 M12 3v3",
  code: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M10 9l-3 3 3 3 M14 9l3 3-3 3",
  doc: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M9 13h6 M9 17h4",
  wallet: "M4 7h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z M4 7l11-3v3 M16 13h1",
  chart: "M12 3a9 9 0 1 0 9 9h-9z M14 3.2A9 9 0 0 1 20.8 10H14z",
  grid: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  chevR: "M10 7l5 5-5 5",
  chevD: "M7 10l5 5 5-5",
  plus: "M12 5v14 M5 12h14",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M8.5 12l2.5 2.5 4.5-4.5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0",
  more: "M5 12h.01 M12 12h.01 M19 12h.01",
  share: "M12 3v12 M7 8l5-5 5 5 M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5",
};

function LIcon({ n, size = 20, color = WB.text, stroke = 1.6 }: { n: keyof typeof LI; size?: number; color?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
      <path d={LI[n]} />
    </svg>
  );
}

function Knot({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={WB.text} strokeWidth={1.5} style={{ display: "block" }}>
      {[0, 60, 120].map((r) => (
        <ellipse key={r} cx="12" cy="12" rx="9" ry="4.2" transform={`rotate(${r} 12 12)`} />
      ))}
    </svg>
  );
}

/** White robot-cat mascot with headphones and teal eyes. */
export function Mascot({ size = 92, f = 0 }: { size?: number; f?: number }) {
  const blinkOn = f % 90 > 84;
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 100 82" style={{ display: "block", overflow: "visible" }}>
      <path d="M22 34 L20 6 L40 22 Z" fill="#fff" stroke="#d9dce1" strokeWidth="2" strokeLinejoin="round" />
      <path d="M78 34 L80 6 L60 22 Z" fill="#fff" stroke="#d9dce1" strokeWidth="2" strokeLinejoin="round" />
      <path d="M25 13 L36 22 L27 27 Z" fill="#f2c7cf" />
      <path d="M75 13 L64 22 L73 27 Z" fill="#f2c7cf" />
      <rect x="14" y="18" width="72" height="64" rx="28" fill="#fff" stroke="#d9dce1" strokeWidth="2" />
      <rect x="6" y="40" width="14" height="28" rx="7" fill="#5b6270" />
      <rect x="80" y="40" width="14" height="28" rx="7" fill="#5b6270" />
      <path d="M13 42 C 13 10, 87 10, 87 42" fill="none" stroke="#5b6270" strokeWidth="4" />
      <rect x="24" y="36" width="52" height="30" rx="14" fill="#262a31" />
      {blinkOn ? (
        <>
          <path d="M34 52 h10" stroke="#19d3c5" strokeWidth="3" strokeLinecap="round" />
          <path d="M56 52 h10" stroke="#19d3c5" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M39 44 L42 51 L39 58 L36 51 Z" fill="#19d3c5" />
          <path d="M61 44 L64 51 L61 58 L58 51 Z" fill="#19d3c5" />
          <path d="M32 51 L46 51 M54 51 L68 51" stroke="#19d3c5" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function Spinner({ f, size = 16 }: { f: number; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ transform: `rotate(${f * 15}deg)`, flexShrink: 0, display: "block" }}>
      <circle cx="10" cy="10" r="7.5" fill="none" stroke={WB.line} strokeWidth="2.6" />
      <path d="M10 2.5 A7.5 7.5 0 0 1 17.5 10" fill="none" stroke={WB.text} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function StepIcon({ state, f }: { state: WBStep["state"]; f: number }) {
  if (state === "run") return <Spinner f={f} />;
  if (state === "wait")
    return (
      <span style={{ width: 16, height: 16, borderRadius: 8, border: "2px solid #f0a020", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: "#f0a020" }} />
      </span>
    );
  return (
    <span style={{ width: 16, height: 16, borderRadius: 8, background: WB.teal, display: "grid", placeItems: "center", flexShrink: 0 }}>
      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  );
}

// ------------------------------------------------------------------ window

export function WorkBuddyWindow({ f, width = 1560, height = 880, tasks, activeTask, chatTitle, layout, input, caret, sendPress = 0, messages }: WorkBuddyProps) {
  const sideW = 300;
  const mainW = width - sideW;
  const cardW = 900;
  const cardX = (mainW - cardW) / 2;
  const cardH = mix(160, 118, layout);
  const stripH = 46;
  const cardY = mix(360, height - 24 - stripH - cardH, layout);
  const hasText = input.length > 0;
  const fade = Math.max(0, 1 - layout * 1.8);
  const colX = cardX;
  const sendOn = hasText || (sendPress > 0 && sendPress < 1);

  const nav: { n: keyof typeof LI; l: string; beta?: boolean }[] = [
    { n: "newtask", l: "New Task" },
    { n: "assistant", l: "Assistant", beta: true },
    { n: "experts", l: "Experts · Skills · Connectors" },
    { n: "scheduled", l: "Scheduled" },
    { n: "library", l: "Library" },
  ];

  return (
    <div style={{ width, height, background: WB.bg, borderRadius: 14, border: "1px solid #d6d6d6", boxShadow: "0 40px 80px -24px rgba(0,0,0,.35), 0 0 0 0.5px rgba(0,0,0,.08)", overflow: "hidden", display: "flex", fontFamily: WB.font, color: WB.text, position: "relative" }}>
      {/* ---------------- sidebar */}
      <div style={{ width: sideW, background: WB.side, borderRight: `1px solid ${WB.line}`, display: "flex", flexDirection: "column", padding: "0 12px", flexShrink: 0 }}>
        <div style={{ height: 52, display: "flex", alignItems: "center", padding: "0 8px" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c, marginRight: 8 }} />
          ))}
          <span style={{ marginLeft: "auto", display: "flex", gap: 18 }}>
            <LIcon n="sidebar" size={19} color="#555" />
            <LIcon n="search" size={19} color="#555" />
            <LIcon n="filter" size={19} color="#555" />
          </span>
        </div>
        <div style={{ padding: "8px 12px 14px" }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{WB.name}</div>
          <div style={{ fontSize: 12, color: WB.sub }}>{WB.version}</div>
        </div>
        {nav.map((r, i) => {
          const sel = i === 0 && activeTask < 0;
          return (
            <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 11, height: 38, padding: "0 13px", borderRadius: 9, background: sel ? WB.pill : "transparent", fontSize: 16, fontWeight: sel ? 700 : 400 }}>
              <LIcon n={r.n} size={19} />
              {r.l}
              {r.beta && <span style={{ fontSize: 10.5, color: WB.sub, border: `1px solid ${WB.faint}`, borderRadius: 5, padding: "0 5px", letterSpacing: "0.04em" }}>BETA</span>}
            </div>
          );
        })}
        <div style={{ fontSize: 13.5, color: WB.sub, padding: "22px 13px 8px", fontWeight: 500 }}>Tasks ({tasks.length})</div>
        {tasks.map((t, i) => (
          <div key={t.title + i} style={{ display: "flex", alignItems: "center", gap: 8, height: 37, padding: "0 13px", borderRadius: 9, background: i === activeTask ? WB.pill : "transparent", fontSize: 15.5, fontWeight: i === activeTask ? 600 : 400 }}>
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
            <span style={{ fontSize: 12.5, color: WB.sub }}>{t.time}</span>
          </div>
        ))}
        <div style={{ fontSize: 13.5, color: WB.sub, padding: "20px 13px 8px", fontWeight: 500 }}>Workspaces (0)</div>
        <div style={{ fontSize: 15, color: WB.sub, padding: "2px 38px" }}>No tasks</div>
        <div style={{ marginTop: "auto", background: "#fff", border: `1px solid ${WB.line}`, borderRadius: 14, padding: "13px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15.5 }}>
            <LIcon n="user" size={17} />
            Friends In, Credits Up
            <span style={{ marginLeft: "auto" }}>
              <LIcon n="chevR" size={16} color={WB.sub} />
            </span>
          </div>
          <div style={{ fontSize: 13.5, color: "#666", marginTop: 4 }}>
            Invite a friend and earn <span style={{ color: WB.teal, fontWeight: 700 }}>100</span> credits
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 6px 16px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 17, background: "#2fb57c", border: "2px solid #fff", display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>WL</div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{WB.user}</span>
        </div>
      </div>

      {/* ---------------- main */}
      <div style={{ position: "relative", width: mainW, height: "100%", background: WB.bg }}>
        {/* task header (conversation view) */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 52, borderBottom: `1px solid ${WB.line}`, display: "flex", alignItems: "center", padding: "0 26px", gap: 10, opacity: layout }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{chatTitle}</span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 18 }}>
            <LIcon n="share" size={18} color="#555" />
            <LIcon n="more" size={18} color="#555" stroke={3} />
          </span>
        </div>

        {/* new task screen */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, opacity: fade, transform: `translateY(${-layout * 60}px)` }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 128, textAlign: "center", fontWeight: 700, fontSize: 40, letterSpacing: "0.01em" }}>{WB.heading}</div>
          <div style={{ position: "absolute", left: mainW / 2 - 112, top: 196, width: 224, height: 42, borderRadius: 21, background: "#ececec", display: "flex", padding: 3 }}>
            <div style={{ flex: 1, borderRadius: 18, background: "#2a2a2a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontWeight: 700, fontSize: 16 }}>
              <LIcon n="cup" size={17} color="#fff" />
              Working
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontWeight: 600, fontSize: 16, color: "#444" }}>
              <LIcon n="code" size={17} color="#444" />
              Coding
            </div>
          </div>
          <div style={{ position: "absolute", left: cardX, top: 296, display: "flex", gap: 10, alignItems: "center" }}>
            {(
              [
                ["doc", "Documentation"],
                ["wallet", "Financial Services"],
                ["chart", "Visualization"],
                ["grid", "Personal Workspace"],
              ] as const
            ).map(([n, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 7, border: `1px solid ${WB.line}`, borderRadius: 18, padding: "6px 15px", fontSize: 15.5, background: "#fff", whiteSpace: "nowrap" }}>
                <LIcon n={n} size={16} />
                {l}
              </div>
            ))}
            <div style={{ width: 30, height: 30, borderRadius: 15, border: `1px solid ${WB.line}`, display: "grid", placeItems: "center", background: "#fff" }}>
              <LIcon n="chevR" size={15} />
            </div>
          </div>
        </div>

        {/* conversation */}
        <div style={{ position: "absolute", left: colX, width: cardW, top: 82, display: "flex", flexDirection: "column", gap: 18 }}>
          {messages.map((m, i) =>
            m.appear <= 0 ? null : m.role === "user" ? (
              <div key={i} style={{ alignSelf: "flex-end", maxWidth: cardW * 0.74, background: WB.bubble, borderRadius: 16, padding: "13px 18px", fontSize: 17.5, lineHeight: 1.45, opacity: m.appear, transform: `translateY(${(1 - m.appear) * 20}px)` }}>
                {m.text}
              </div>
            ) : (
              <div key={i} style={{ opacity: m.appear, transform: `translateY(${(1 - m.appear) * 20}px)` }}>
                {m.thinking && !m.text ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: WB.sub, fontSize: 16.5 }}>
                    <Spinner f={f} />
                    Thinking
                  </div>
                ) : (
                  <div style={{ fontSize: 17.5, lineHeight: 1.5 }}>{m.text}</div>
                )}
                {m.steps && m.steps.length > 0 && (
                  <div style={{ marginTop: 10, borderLeft: `2px solid ${WB.line}`, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 2 }}>
                    {m.steps.map((s, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 11, height: 32, fontSize: 15.5, color: s.state === "run" ? WB.text : "#3a3a3a" }}>
                        <StepIcon state={s.state} f={f} />
                        <span style={{ fontWeight: s.state === "run" ? 600 : 400 }}>{s.label}</span>
                        {s.state === "wait" && <span style={{ fontSize: 12, color: "#b06c00", background: "#fff3dc", borderRadius: 6, padding: "1px 7px" }}>needs approval</span>}
                      </div>
                    ))}
                  </div>
                )}
                {m.final !== undefined && m.final > 0 && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, opacity: m.final, transform: `translateX(${(1 - m.final) * -14}px)` }}>
                    <Logo size={20} notch="#fff" />
                    <span style={{ fontSize: 17, fontWeight: 600 }}>Planned.</span>
                    <span style={{ fontSize: 17, fontWeight: 600, color: "#1f6feb", borderBottom: "1.5px solid #1f6feb" }}>Open in Movents ↗</span>
                  </div>
                )}
              </div>
            ),
          )}
        </div>

        {/* input card */}
        <div style={{ position: "absolute", left: cardX, top: cardY + 20, width: cardW, height: cardH - 20 + stripH, background: WB.strip, borderRadius: 18 }}>
          <div style={{ position: "absolute", left: 20, bottom: 12, display: "flex", gap: 26, fontSize: 15, color: "#555" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <LIcon n="folder" size={17} color="#555" />
              Select Workspace
              <LIcon n="chevD" size={14} color="#555" />
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <LIcon n="shield" size={17} color="#555" />
              Default Permissions
              <LIcon n="chevD" size={14} color="#555" />
            </span>
          </div>
        </div>
        <div style={{ position: "absolute", left: cardX + cardW - 118, top: cardY - 62 }}>
          <Mascot size={88} f={f} />
        </div>
        <div style={{ position: "absolute", left: cardX, top: cardY, width: cardW, height: cardH, background: "#fff", borderRadius: 16, border: `1px solid ${WB.line}`, boxShadow: "0 6px 24px -8px rgba(0,0,0,.14)", padding: "16px 20px" }}>
          <div style={{ fontSize: 17.5, lineHeight: 1.45, color: hasText ? WB.text : WB.faint, height: cardH - 70, overflow: "hidden" }}>
            {hasText ? input : WB.placeholder}
            {caret && <span style={{ display: "inline-block", width: 2, height: 21, background: WB.text, marginLeft: 2, verticalAlign: "text-bottom" }} />}
          </div>
          <div style={{ position: "absolute", left: 20, right: 18, bottom: 14, display: "flex", alignItems: "center" }}>
            <LIcon n="plus" size={22} color="#333" stroke={1.8} />
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 15, marginRight: 16 }}>
              <Knot size={17} />
              {WB.model}
              <LIcon n="chevD" size={13} />
            </span>
            <span style={{ width: 38, height: 38, borderRadius: 19, background: sendOn ? "#111" : "#c9c9c9", display: "grid", placeItems: "center", transform: `scale(${1 - 0.16 * Math.sin(Math.min(1, sendPress) * Math.PI)})` }}>
              <svg width={18} height={18} viewBox="0 0 24 24">
                <path d="M12 4 L20 18 L12 15 L4 18 Z" fill="#fff" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
