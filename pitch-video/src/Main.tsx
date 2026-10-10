import { AbsoluteFill, Sequence, Series } from "remotion";
import { C, SCENES } from "./theme";
import { Wipe } from "./ui/motion";
import { F } from "./ui/fonts";
import { S1Prompt } from "./scenes/S1Prompt";
import { S2Parallel } from "./scenes/S2Parallel";
import { S3BoxOffice } from "./scenes/S3BoxOffice";
import { S4Event } from "./scenes/S4Event";
import { S5Sop } from "./scenes/S5Sop";
import { S6Venues } from "./scenes/S6Venues";
import { S7Vendors } from "./scenes/S7Vendors";
import { S8End } from "./scenes/S8End";

const ORDER = [
  { key: "prompt", C: S1Prompt },
  { key: "parallel", C: S2Parallel },
  { key: "boxOffice", C: S3BoxOffice },
  { key: "event", C: S4Event },
  { key: "sop", C: S5Sop },
  { key: "venues", C: S6Venues },
  { key: "vendors", C: S7Vendors },
  { key: "end", C: S8End },
] as const;

/** Scene start frames, for wipes and for the report. */
export const STARTS = ORDER.reduce<number[]>((acc, s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SCENES[ORDER[i - 1].key]);
  return acc;
}, []);

const WIPES: { at: number; colors: string[]; dir: 1 | -1 }[] = [
  { at: STARTS[2], colors: [C.tomato, C.sun, C.blue, C.ink], dir: 1 },
  { at: STARTS[3], colors: [C.sun, C.tomato, C.mint, C.ink], dir: -1 },
  { at: STARTS[4], colors: [C.blue, C.sky, C.sun, C.ink], dir: 1 },
  { at: STARTS[5], colors: [C.mint, C.green, C.sun, C.ink], dir: -1 },
  { at: STARTS[6], colors: [C.peach, C.tomato, C.sun, C.ink], dir: 1 },
  { at: STARTS[7], colors: [C.ink, C.tomato, C.sun, C.blue], dir: -1 },
];

export function Main() {
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: F.body, color: C.ink }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <Series>
        {ORDER.map(({ key, C: Scene }) => (
          <Series.Sequence key={key} durationInFrames={SCENES[key]} name={key}>
            <Scene />
          </Series.Sequence>
        ))}
      </Series>
      {WIPES.map((w) => (
        <Sequence key={w.at} from={w.at - 15} durationInFrames={30} name="wipe">
          <Wipe colors={w.colors} dir={w.dir} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
