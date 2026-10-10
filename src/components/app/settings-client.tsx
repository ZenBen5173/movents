"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Eye, EyeOff, Play, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { resetDemo, rotateApiKey, runSchedulerNow } from "@/app/actions";
import { cn } from "@/lib/utils";

export type Integration = { name: string; mark: string; tone: string; live: boolean; mode: string; why: string; env: string };

function useCopy() {
  const [done, setDone] = useState(false);
  return {
    done,
    copy: (text: string) => {
      navigator.clipboard.writeText(text).then(
        () => {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        },
        () => toast.error("Copy failed"),
      );
    },
  };
}

function CopyIcon({ text, label }: { text: string; label: string }) {
  const { done, copy } = useCopy();
  return (
    <motion.button whileTap={{ scale: 0.88 }} onClick={() => copy(text)} aria-label={label} title={label} className="grid size-8 shrink-0 place-items-center rounded-lg border-[1.5px] border-ink bg-card transition-colors hover:bg-sand/60">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={done ? "y" : "n"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.12 }}>
          {done ? <Check className="size-3.5 text-[#2a7e3b]" /> : <Copy className="size-3.5" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

const Surface = ({ title, right, children, className }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <section className={cn("rounded-xl border-[1.5px] border-ink bg-card p-5", className)}>
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="mono-label font-bold text-ink">{title}</h2>
      {right}
    </div>
    {children}
  </section>
);

export function SettingsClient({ apiKey, mcpConfig, mcpUrl, integrations, isFinal }: { apiKey: string; mcpConfig: string; mcpUrl: string; integrations: Integration[]; isFinal: boolean }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
        <WorkBuddy apiKey={apiKey} mcpConfig={mcpConfig} mcpUrl={mcpUrl} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}>
        <Integrations items={integrations} />
      </motion.div>
      {isFinal && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12, ease: [0.16, 1, 0.3, 1] }} className="lg:col-span-2">
          <Admin />
        </motion.div>
      )}
    </div>
  );
}

function WorkBuddy({ apiKey, mcpConfig, mcpUrl }: { apiKey: string; mcpConfig: string; mcpUrl: string }) {
  const [show, setShow] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const cfg = useCopy();
  const rotate = () => {
    if (!window.confirm("Make a new key? The old one stops working.")) return;
    start(async () => {
      const r = await rotateApiKey();
      if (!r.ok) return void toast.error(r.error);
      toast.success("New key ready");
      router.refresh();
    });
  };
  const field = "flex h-8 min-w-0 flex-1 items-center overflow-hidden rounded-lg border-[1.5px] border-ink bg-background px-2.5 font-mono text-xs";
  return (
    <Surface
      title="WorkBuddy"
      right={
        <span className="mono-label inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#46a758] opacity-60" />
            <span className="relative size-2 rounded-full bg-[#46a758]" />
          </span>
          MCP ready
        </span>
      }
    >
      <div className="space-y-3">
        <div>
          <p className="mono-label mb-1 text-[10px] text-muted-foreground">MCP URL</p>
          <div className="flex gap-1.5">
            <code className={field}>{mcpUrl}</code>
            <CopyIcon text={mcpUrl} label="Copy URL" />
          </div>
        </div>
        <div>
          <p className="mono-label mb-1 text-[10px] text-muted-foreground">API key</p>
          <div className="flex gap-1.5">
            <code className={field}>{show ? apiKey : "•".repeat(Math.min(apiKey.length, 32))}</code>
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShow((s) => !s)} aria-label={show ? "Hide" : "Show"} className="grid size-8 shrink-0 place-items-center rounded-lg border-[1.5px] border-ink bg-card hover:bg-sand/60">
              {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </motion.button>
            <CopyIcon text={apiKey} label="Copy key" />
            <motion.button whileTap={{ scale: 0.88 }} onClick={rotate} disabled={pending} aria-label="Rotate key" title="Rotate key" className="group grid size-8 shrink-0 place-items-center rounded-lg border-[1.5px] border-ink bg-card hover:bg-peach disabled:opacity-50">
              <RefreshCw className={cn("size-3.5 transition-transform duration-500 group-hover:rotate-180", pending && "animate-spin")} />
            </motion.button>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -1 }}
          onClick={() => cfg.copy(mcpConfig)}
          className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-medium text-white shadow-[2px_2px_0_0_#ff5a36] transition-shadow hover:shadow-[3px_3px_0_0_#ff5a36]"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={cfg.done ? "y" : "n"} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -6, opacity: 0 }} transition={{ duration: 0.15 }} className="inline-flex items-center gap-2">
              {cfg.done ? <Check className="size-4" /> : <Copy className="size-4" />}
              {cfg.done ? "Copied" : "Copy MCP config"}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </Surface>
  );
}

function Integrations({ items }: { items: Integration[] }) {
  const live = items.filter((i) => i.live).length;
  return (
    <Surface title="Integrations" right={<span className="mono-label text-[10px] text-muted-foreground">{live}/{items.length} live</span>}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((it, i) => (
          <Tile key={it.name} it={it} i={i} />
        ))}
      </div>
      <div className="mt-3 flex gap-4 font-mono text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#46a758]" />Live</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-sun" />Demo</span>
      </div>
    </Surface>
  );
}

function Tile({ it, i }: { it: Integration; i: number }) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 + i * 0.035, duration: 0.25 }}
      whileHover={{ y: -2 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      tabIndex={0}
      className="group relative flex flex-col items-center gap-2 rounded-lg border-[1.5px] border-ink bg-background px-2 pb-2.5 pt-3 outline-none transition-shadow hover:shadow-[2px_2px_0_0_#161514] focus-visible:shadow-[2px_2px_0_0_#161514]"
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100" style={{ background: `radial-gradient(120px circle at ${pos.x}% ${pos.y}%, rgba(255,216,77,.35), transparent 60%)` }} />
      <span className={cn("absolute right-1.5 top-1.5 size-2 rounded-full border border-ink/40", it.live ? "bg-[#46a758]" : "bg-sun")} />
      <span className={cn("relative grid size-10 place-items-center rounded-lg border-[1.5px] border-ink font-display text-sm font-bold transition-transform duration-200 group-hover:-rotate-6", it.tone)}>{it.mark}</span>
      <span className="relative text-xs font-medium">{it.name}</span>
      <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 translate-y-1 rounded-lg border-[1.5px] border-ink bg-card p-3 text-left text-xs opacity-0 shadow-[2px_2px_0_0_#161514] transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        <p className="flex items-center gap-1.5 font-semibold">
          <span className={cn("size-2 rounded-full", it.live ? "bg-[#46a758]" : "bg-sun")} />
          {it.mode}
        </p>
        <p className="mt-1 text-muted-foreground">{it.why}</p>
        <p className="mt-2 break-all font-mono text-[10px] text-ink/70">{it.env}</p>
      </div>
    </motion.div>
  );
}

function Admin() {
  const [date, setDate] = useState("");
  const [log, setLog] = useState<string[] | null>(null);
  const [pending, start] = useTransition();
  const [resetting, startReset] = useTransition();
  const router = useRouter();
  const run = () =>
    start(async () => {
      const r = await runSchedulerNow(date || undefined);
      if (!r.ok) return void toast.error(r.error);
      const actions = (r.data as { actions?: string[] } | undefined)?.actions ?? [];
      toast.success("Scheduler ran");
      setLog(actions.length ? actions : ["Nothing due"]);
      router.refresh();
    });
  const reset = () => {
    if (!window.confirm("Delete everything and restore the seed data?")) return;
    startReset(async () => {
      const r = await resetDemo();
      if (!r.ok) return void toast.error(r.error);
      toast.success("Demo data restored");
      router.refresh();
    });
  };
  const btn = "inline-flex h-8 items-center gap-1.5 rounded-lg border-[1.5px] border-ink px-3 text-sm font-medium transition-shadow hover:shadow-[2px_2px_0_0_#161514] disabled:opacity-50";
  return (
    <Surface title="Admin">
      <div className="flex flex-wrap items-center gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} title="Pretend today is" className="h-8 rounded-lg border-[1.5px] border-ink bg-background px-2 font-mono text-xs" />
        <motion.button whileTap={{ scale: 0.95 }} onClick={run} disabled={pending} className={cn(btn, "bg-sun")}>
          <Play className="size-3.5" />
          {pending ? "Running" : "Run scheduler"}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={reset} disabled={resetting} className={cn(btn, "ml-auto bg-card text-tomato-ink hover:bg-peach")}>
          <RotateCcw className={cn("size-3.5", resetting && "animate-spin")} />
          Reset demo
        </motion.button>
      </div>
      <AnimatePresence>
        {log && (
          <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-1 overflow-hidden rounded-lg bg-sand/50 p-3 font-mono text-[11px]">
            {log.map((l, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                {l}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </Surface>
  );
}
