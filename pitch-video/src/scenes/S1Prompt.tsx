import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BRIEFS } from "../data";
import { C, SCENES } from "../theme";
import { soft } from "../ui/anim";
import { Kicker } from "../ui/kit";
import { CAM_HOME, Camera, Cursor } from "../ui/motion";
import { WorkBuddyWindow } from "../ui/WorkBuddyWindow";
import { chatState, chatTimes, type ChatPlan } from "./chatTimeline";

/** Plans shared with scene 2 so window 1 continues seamlessly. Frames are on scene 1's clock. */
export const PLANS: ChatPlan[] = [
  { typeStart: 24, perFrame: 1.15, stepEvery: 9, stepRun: 14 },
  { typeStart: 30, perFrame: 1.5, stepEvery: 14, stepRun: 20 },
  { typeStart: 42, perFrame: 1.5, stepEvery: 14, stepRun: 20 },
  { typeStart: 54, perFrame: 1.5, stepEvery: 14, stepRun: 20 },
];

export const WB_POS = { x: 180, y: 100 };

/** Backdrop used behind the WorkBuddy windows. */
export function DeskBackdrop() {
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #eef2fb 0%, #f7f5ef 55%, #fbe9e1 100%)" }}>
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(22,21,20,.10) 1.4px, transparent 1.6px)", backgroundSize: "26px 26px" }} />
    </AbsoluteFill>
  );
}

export function S1Prompt() {
  const f = useCurrentFrame();
  const t = chatTimes(BRIEFS[0], PLANS[0]);
  const enter = soft(f, 0, 18);
  const sendX = WB_POS.x + 300 + 180 + 900 - 37;
  const sendY = WB_POS.y + 360 + 160 - 33;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <DeskBackdrop />
      <Camera
        keys={[
          CAM_HOME,
          { ...CAM_HOME, f: 26 },
          { f: 78, s: 1.16, x: 1010, y: 530 },
          { f: t.send - 6, s: 1.16, x: 1010, y: 530 },
          { ...CAM_HOME, f: t.send + 40 },
        ]}
      >
        <div style={{ position: "absolute", left: WB_POS.x, top: WB_POS.y, opacity: enter, transform: `translateY(${(1 - enter) * 40}px) scale(${0.94 + 0.06 * enter})` }}>
          <WorkBuddyWindow {...chatState(BRIEFS[0], PLANS[0], f)} />
        </div>
        <Cursor
          f={f}
          keys={[
            { f: t.send - 30, x: 1720, y: 930 },
            { f: t.send - 4, x: sendX, y: sendY },
            { f: t.send, x: sendX, y: sendY, click: true },
            { f: t.send + 34, x: 1640, y: 820 },
          ]}
          hideAfter={t.send + 36}
        />
      </Camera>
      <Kicker n="01" label="Brief WorkBuddy in one message" f={f} x={960} y={22} dur={SCENES.prompt} />
    </AbsoluteFill>
  );
}
