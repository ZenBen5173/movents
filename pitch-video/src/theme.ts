export const W = 1920;
export const H = 1080;
export const FPS = 30;

export const C = {
  bg: "#f7f5ef",
  stage: "#ebe6da",
  ink: "#161514",
  tomato: "#ff5a36",
  tomatoInk: "#c8381a",
  sun: "#ffd84d",
  sky: "#cfe3ff",
  mint: "#d8f3dc",
  sand: "#ece7dc",
  peach: "#ffd7c7",
  blue: "#3b6cf6",
  green: "#46a758",
  card: "#ffffff",
  side: "#f1eee6",
  muted: "#6f6a60",
  line: "#ddd7ca",
  wb: "#0052D9",
};

/** Scene lengths in frames (30 fps). Sum must be 3600. */
export const SCENES = {
  prompt: 270,
  parallel: 330,
  boxOffice: 420,
  event: 1260,
  sop: 360,
  venues: 480,
  vendors: 300,
  end: 180,
} as const;

export const TOTAL = Object.values(SCENES).reduce((a, b) => a + b, 0);

export const border = (w = 2) => `${w}px solid ${C.ink}`;
export const hard = (n = 4, color: string = C.ink) => `${n}px ${n}px 0 ${color}`;

/** The Movents app window on the stage, in stage pixels. */
export const APP = { x: 64, y: 40, w: 1792, h: 1000, side: 300, top: 64, bunting: 30 };
/** Where page content starts on the stage (inside the app window). */
export const CONTENT = { x: APP.x + 2 + APP.side + 44, y: APP.y + 2 + APP.top + APP.bunting + 18, w: APP.w - 4 - APP.side - 88, h: 864 };
