import crypto from "node:crypto";

/** A random secret for cookies, links and API tokens. */
export function randomToken(prefix = "", bytes = 32) {
  return prefix + crypto.randomBytes(bytes).toString("base64url");
}

/** Only hashes are stored, so a database leak does not leak credentials. */
export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Only allow same-site relative redirects after sign-in. */
export function safeNext(next: unknown, fallback = "/") {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
