import { Composition } from "remotion";
import { Main } from "./Main";
import { FPS, H, TOTAL, W } from "./theme";

export function RemotionRoot() {
  return <Composition id="MoventsPitch" component={Main} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />;
}
