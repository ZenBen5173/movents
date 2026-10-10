import crypto from "node:crypto";

export function appUrl() {
  return (
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  );
}

function secret() {
  return process.env.APP_SECRET ?? "movents-dev-secret-change-me";
}

/** Signed token for links that work without a login (faculty approval). */
export function signToken(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url").slice(0, 32);
}

export function verifyToken(value: string, token: string | null | undefined) {
  if (!token) return false;
  const expected = signToken(value);
  return expected.length === token.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export const fmtRM = (n: number | null | undefined) =>
  n == null ? "" : `RM${n.toLocaleString("en-MY", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export function fmtDate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / 86_400_000);
}

/** Today in Malaysia time, as YYYY-MM-DD. DEMO_TODAY overrides for rehearsals. */
export function today() {
  if (process.env.DEMO_TODAY) return process.env.DEMO_TODAY;
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
}
