import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { APP, C, border, hard } from "../theme";
import { F } from "./fonts";
import { Icon, type IconName } from "./Icon";
import { Avatar, Bunting, Logo, Mono, Wristband } from "./kit";
import { mix } from "./anim";

export const EVENT_PAGES: { label: string; icon: IconName }[] = [
  { label: "Overview", icon: "dashboard" },
  { label: "Tasks", icon: "tasks" },
  { label: "Risks", icon: "shield" },
  { label: "Budget", icon: "wallet" },
  { label: "Speakers", icon: "mic" },
  { label: "Suppliers", icon: "store" },
  { label: "Marketing", icon: "megaphone" },
  { label: "Inbox", icon: "inbox" },
  { label: "Run of show", icon: "clock" },
  { label: "Files", icon: "folder" },
];

export const UNI_PAGES: { label: string; icon: IconName }[] = [
  { label: "SOP library", icon: "book" },
  { label: "Venues", icon: "building" },
  { label: "Vendors", icon: "store" },
];

export const PROJECTS = [
  { title: "AI Talk @ Sunway", date: "15 NOV", dot: C.green },
  { title: "Hackathon 2026", date: "22 NOV", dot: C.tomato },
  { title: "Career Fair", date: "29 NOV", dot: C.sun },
  { title: "Cultural Night", date: "6 DEC", dot: C.blue },
];

type Row = { key: string; label: string; icon?: IconName; depth: number; kind: "nav" | "head" | "proj" | "sub" | "uni"; dot?: string; date?: string; h: number; o: number; badge?: number };

export type SidebarProps = {
  /** key of active row: "nav:Box office", "p:Tasks", "u:Venues" */
  active?: string;
  activeFrom?: string;
  activeT?: number;
  /** 0..1 appear amount per project (defaults to 1) */
  projectAppear?: number[];
  openProject?: boolean;
  openUni?: boolean;
  backstage?: number;
};

function buildRows(p: SidebarProps): Row[] {
  const rows: Row[] = [];
  const nav: [string, IconName][] = [["Box office", "dashboard"], ["New event", "ticket"], ["Backstage", "inbox"], ["Door check-in", "scan"]];
  nav.forEach(([l, i]) => rows.push({ key: `nav:${l}`, label: l, icon: i, depth: 0, kind: "nav", h: 38, o: 1, badge: l === "Backstage" ? p.backstage : undefined }));
  rows.push({ key: "h:p", label: "Projects", depth: 0, kind: "head", h: 44, o: 1 });
  PROJECTS.forEach((pr, i) => {
    const a = p.projectAppear ? p.projectAppear[i] ?? 0 : 1;
    rows.push({ key: `proj:${i}`, label: pr.title, depth: 0, kind: "proj", dot: pr.dot, date: pr.date, h: 36 * a, o: a });
    if (i === 0 && p.openProject) EVENT_PAGES.forEach((pg) => rows.push({ key: `p:${pg.label}`, label: pg.label, icon: pg.icon, depth: 1, kind: "sub", h: 34, o: 1 }));
  });
  rows.push({ key: "h:u", label: "Universities", depth: 0, kind: "head", h: 44, o: 1 });
  rows.push({ key: "uni", label: "Sunway University", icon: "landmark", depth: 0, kind: "uni", h: 36, o: 1 });
  if (p.openUni) UNI_PAGES.forEach((pg) => rows.push({ key: `u:${pg.label}`, label: pg.label, icon: pg.icon, depth: 1, kind: "sub", h: 34, o: 1 }));
  rows.push({ key: "h:a", label: "Admin", depth: 0, kind: "head", h: 44, o: 1 });
  rows.push({ key: "nav:Settings", label: "Settings", icon: "settings", depth: 0, kind: "nav", h: 38, o: 1 });
  return rows;
}

export function Sidebar(p: SidebarProps) {
  const rows = buildRows(p);
  const ys: Record<string, { y: number; h: number }> = {};
  let y = 0;
  rows.forEach((r) => {
    ys[r.key] = { y, h: r.h };
    y += r.h;
  });
  const act = p.active ? ys[p.active] : undefined;
  const from = p.activeFrom ? ys[p.activeFrom] : undefined;
  const t = p.activeT ?? 1;
  const hy = act ? (from ? mix(from.y, act.y, t) : act.y) : 0;
  const activeDepth = p.active?.startsWith("p:") || p.active?.startsWith("u:") ? 1 : 0;
  return (
    <div style={{ width: APP.side, height: "100%", background: C.side, borderRight: `1.5px solid ${C.line}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "22px 20px 16px" }}>
        <Logo size={38} />
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 21 }}>Movents</div>
          <div style={{ fontFamily: F.body, fontSize: 13.5, color: C.muted }}>AI &amp; Tech Society · Sunway</div>
        </div>
      </div>
      <div style={{ position: "relative", flex: 1, padding: "0 12px", overflow: "hidden" }}>
        {act && (
          <div style={{ position: "absolute", left: 12 + activeDepth * 20, right: 12, top: hy + 2, height: 32, background: "#fff", border: border(1.5), borderRadius: 9, boxShadow: hard(2) }} />
        )}
        {rows.map((r) => {
          const isAct = p.active === r.key;
          if (r.kind === "head")
            return (
              <div key={r.key} style={{ height: r.h, display: "flex", alignItems: "flex-end", paddingLeft: 12, paddingBottom: 9, justifyContent: "space-between", paddingRight: 10 }}>
                <Mono size={11.5}>{r.label}</Mono>
                {r.label !== "Admin" && <span style={{ fontFamily: F.body, fontSize: 16, color: C.muted }}>+</span>}
              </div>
            );
          return (
            <div key={r.key} style={{ position: "relative", height: r.h, opacity: r.o, overflow: "hidden", display: "flex", alignItems: "center", gap: 11, paddingLeft: 12 + r.depth * 22, paddingRight: 10, fontFamily: F.body, fontSize: 16, fontWeight: isAct || (r.kind === "proj" && p.openProject && r.key === "proj:0") || (r.kind === "uni" && p.openUni) ? 700 : 500, color: isAct ? C.ink : "rgba(22,21,20,.78)" }}>
              {r.depth === 1 && <div style={{ position: "absolute", left: 20, top: 0, bottom: 0, width: 1.5, background: C.line }} />}
              {(r.kind === "proj" || r.kind === "uni") && <Icon name={(r.kind === "proj" && p.openProject && r.key === "proj:0") || (r.kind === "uni" && p.openUni) ? "down" : "chevron"} size={14} color={C.muted} />}
              {r.kind === "proj" ? <span style={{ width: 10, height: 10, borderRadius: 9, background: r.dot, border: border(1.5), flexShrink: 0 }} /> : r.icon && <Icon name={r.icon} size={18} color={isAct ? C.tomato : C.ink} />}
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{r.label}</span>
              {r.date && <Mono size={10.5}>{r.date}</Mono>}
              {!!r.badge && <span style={{ minWidth: 22, height: 22, borderRadius: 11, background: C.tomato, fontSize: 12, fontWeight: 700, display: "grid", placeItems: "center", border: border(1.5) }}>{r.badge}</span>}
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: `1.5px solid ${C.line}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name="Wei Ling Chong" size={38} i={0} />
        <div>
          <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 15 }}>Wei Ling Chong</div>
          <div style={{ marginTop: 3 }}>
            <Wristband label="Lead" bg={C.tomato} size={10} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TopBar({ crumbs, f }: { crumbs: string[]; f: number }) {
  return (
    <div style={{ height: APP.top, display: "flex", alignItems: "center", padding: "0 30px", borderBottom: `1.5px solid ${C.line}`, gap: 10, background: "rgba(247,245,239,.9)", flexShrink: 0 }}>
      {crumbs.map((c, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {i > 0 && <Icon name="chevron" size={15} color={C.muted} />}
          <span style={{ fontFamily: F.body, fontSize: 16.5, fontWeight: i === crumbs.length - 1 ? 700 : 500, color: i === crumbs.length - 1 ? C.ink : C.muted }}>{c}</span>
        </div>
      ))}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.line}`, borderRadius: 11, padding: "7px 14px", width: 240, background: "#fff" }}>
          <Icon name="search" size={16} color={C.muted} />
          <span style={{ fontFamily: F.body, fontSize: 15, color: C.muted }}>Search</span>
          <Mono size={11} style={{ marginLeft: "auto" }}>Ctrl K</Mono>
        </div>
        <div style={{ position: "relative" }}>
          <Icon name="bell" size={21} />
          <span style={{ position: "absolute", right: -5, top: -5, width: 16, height: 16, borderRadius: 9, background: C.tomato, fontSize: 10, fontWeight: 700, display: "grid", placeItems: "center", fontFamily: F.body, transform: `scale(${1 + Math.max(0, Math.sin(f / 8)) * 0.12})` }}>3</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.ink, color: "#fff", borderRadius: 12, padding: "9px 16px", boxShadow: hard(3, C.tomato), fontFamily: F.body, fontWeight: 700, fontSize: 15.5 }}>
          <Icon name="sparkles" size={17} color="#fff" />
          New event
        </div>
      </div>
    </div>
  );
}

/** The whole Movents window on a stage backdrop. Children render in the page area (absolute, origin at content top-left). */
export function AppFrame({ crumbs, sidebar, f, children, contentOverlay }: { crumbs: string[]; sidebar: SidebarProps; f: number; children: ReactNode; contentOverlay?: ReactNode }) {
  return (
    <AbsoluteFill style={{ background: C.stage }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(rgba(22,21,20,.13) 1.4px, transparent 1.6px)`, backgroundSize: "26px 26px" }} />
      <div style={{ position: "absolute", left: APP.x, top: APP.y, width: APP.w, height: APP.h, background: C.bg, border: border(2), borderRadius: 22, boxShadow: hard(8), overflow: "hidden", display: "flex" }}>
        <Sidebar {...sidebar} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
          <TopBar crumbs={crumbs} f={f} />
          <div style={{ padding: "0 30px" }}>
            <Bunting width={APP.w - APP.side - 60} f={f} count={24} />
          </div>
          <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 44, top: 18, right: 44, bottom: 0 }}>{children}</div>
          </div>
          {contentOverlay}
        </div>
      </div>
    </AbsoluteFill>
  );
}
