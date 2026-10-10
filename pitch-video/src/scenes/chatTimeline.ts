import { OLD_TASKS, type Brief } from "../data";
import { blink, lerp, soft, typed, typingDone } from "../ui/anim";
import type { WBStep, WorkBuddyProps } from "../ui/WorkBuddyWindow";

export type ChatPlan = { typeStart: number; perFrame: number; stepEvery: number; stepRun: number };

export function chatTimes(b: Brief, p: ChatPlan) {
  const typeEnd = typingDone(b.prompt, p.typeStart, p.perFrame);
  const send = typeEnd + 10;
  const replyStart = send + 34;
  const stepsStart = typingDone(b.reply, replyStart, 1.8) + 4;
  const finalAt = stepsStart + (b.steps.length - 1) * p.stepEvery + p.stepRun + 8;
  return { typeEnd, send, replyStart, stepsStart, finalAt };
}

/** Full WorkBuddy window state for one brief at frame f (on the brief's own clock). */
export function chatState(b: Brief, p: ChatPlan, f: number): WorkBuddyProps {
  const t = chatTimes(b, p);
  const sent = f >= t.send;
  const steps: WBStep[] = [];
  b.steps.forEach((label, j) => {
    const at = t.stepsStart + j * p.stepEvery;
    if (f < at) return;
    const finished = f >= at + p.stepRun;
    steps.push({ label, state: finished ? (j === b.waitStep ? "wait" : "done") : "run" });
  });
  return {
    f,
    tasks: sent ? [{ title: b.task, time: "now" }, ...OLD_TASKS] : OLD_TASKS,
    activeTask: sent ? 0 : -1,
    chatTitle: b.task,
    layout: soft(f, t.send + 3, 24),
    input: sent ? "" : typed(b.prompt, f, p.typeStart, p.perFrame),
    caret: !sent && (f < t.typeEnd ? f >= p.typeStart : blink(f)),
    sendPress: sent ? lerp(f, t.send, t.send + 14) : 0,
    messages: [
      { role: "user", text: b.prompt, appear: soft(f, t.send + 8) },
      {
        role: "assistant",
        text: typed(b.reply, f, t.replyStart, 1.8),
        thinking: f < t.replyStart,
        appear: soft(f, t.send + 20),
        steps,
        final: lerp(f, t.finalAt, t.finalAt + 10),
      },
    ],
  };
}
