import "server-only";
import { lookup } from "node:dns/promises";
import net from "node:net";

/** Media types we store and serve. SVG and HTML are never accepted (script risk). */
const SIGNATURES: { mime: string; test: (b: Buffer) => boolean }[] = [
  { mime: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/gif", test: (b) => b.subarray(0, 4).toString("ascii") === "GIF8" },
  { mime: "image/webp", test: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
  { mime: "video/webm", test: (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
  { mime: "video/mp4", test: (b) => b.subarray(4, 8).toString("ascii") === "ftyp" && !/^qt/.test(b.subarray(8, 12).toString("ascii")) },
  { mime: "video/quicktime", test: (b) => b.subarray(4, 8).toString("ascii") === "ftyp" && /^qt/.test(b.subarray(8, 12).toString("ascii")) },
];

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

/** The real type from the file's first bytes, or null if it isn't allowed. */
export function sniff(buf: Buffer) {
  return SIGNATURES.find((s) => s.test(buf))?.mime ?? null;
}

/** Validate bytes and return a data: URL for storage. */
export function toMedia(buf: Buffer) {
  const mime = sniff(buf);
  if (!mime) throw new Error("Unsupported file. Use PNG, JPEG, WebP, GIF, MP4, WebM or MOV.");
  const max = mime.startsWith("video/") ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (buf.length > max) throw new Error(`File too large (max ${Math.round(max / 1024 / 1024)} MB).`);
  return { mime, dataUrl: `data:${mime};base64,${buf.toString("base64")}` };
}

/** Decode a data: URL and validate what is really inside it. */
export function fromDataUrl(dataUrl: string) {
  const m = /^data:[^;,]*;base64,(.*)$/s.exec(dataUrl);
  if (!m) throw new Error("Expected a base64 data: URL");
  if (m[1].length > MAX_VIDEO_BYTES * 1.4) throw new Error("File too large");
  return toMedia(Buffer.from(m[1], "base64"));
}

function privateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return privateIp(v.slice(7));
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

/**
 * Download media from a public https URL: no private/internal hosts, at most
 * 3 redirects (each re-checked), a timeout and a size cap.
 */
export async function fetchMedia(url: string) {
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    const u = new URL(current);
    if (u.protocol !== "https:") throw new Error("Media URL must use https");
    const { address } = await lookup(u.hostname);
    if (privateIp(address)) throw new Error("Media URL points to a private address");
    const res = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(20_000) });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location")!, u).toString();
      continue;
    }
    if (!res.ok || !res.body) throw new Error(`Could not download media (${res.status})`);
    const chunks: Buffer[] = [];
    let size = 0;
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_VIDEO_BYTES) {
        await reader.cancel();
        throw new Error("Media file too large");
      }
      chunks.push(Buffer.from(value));
    }
    return toMedia(Buffer.concat(chunks));
  }
  throw new Error("Too many redirects");
}
