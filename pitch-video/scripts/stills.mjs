// Render a handful of stills in one bundle: node scripts/stills.mjs 120 400 900 ...
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const frames = process.argv.slice(2).map(Number).filter((n) => Number.isFinite(n));
const scale = Number(process.env.SCALE ?? 0.5);
const root = path.resolve(import.meta.dirname, "..");
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "MoventsPitch" });
for (const frame of frames) {
  const output = path.join(root, "out", "stills", `f${String(frame).padStart(4, "0")}.png`);
  await renderStill({ serveUrl, composition, frame, output, scale });
  console.log("wrote", output);
}
