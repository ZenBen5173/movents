import { loadFont as loadGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadDM } from "@remotion/google-fonts/DMSans";
import { loadFont as loadMono } from "@remotion/google-fonts/SpaceMono";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";

const display = loadGrotesk("normal", { weights: ["500", "700"], subsets: ["latin"] });
const body = loadDM("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400", "700"], subsets: ["latin"] });
const hand = loadCaveat("normal", { weights: ["600", "700"], subsets: ["latin"] });

export const F = {
  display: display.fontFamily,
  body: body.fontFamily,
  mono: mono.fontFamily,
  hand: hand.fontFamily,
};
