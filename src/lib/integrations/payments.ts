import "server-only";
import crypto from "node:crypto";

/**
 * Vendor deposits. Stripe Checkout when STRIPE_SECRET_KEY is set (use a test
 * key: sk_test_...), otherwise an in-app mock checkout that records the same
 * state transitions.
 */

export function paymentsMode() {
  return process.env.STRIPE_SECRET_KEY ? "stripe" : "mock";
}

function appUrl() {
  return process.env.APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
}

export async function createCheckout(p: { paymentId: string; amount: number; description: string; currency?: string }) {
  if (paymentsMode() === "mock") {
    return { url: `${appUrl()}/pay/${p.paymentId}`, ref: `mock_${p.paymentId}` };
  }
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${appUrl()}/pay/${p.paymentId}?status=success`,
    cancel_url: `${appUrl()}/pay/${p.paymentId}?status=cancelled`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": p.currency ?? "myr",
    "line_items[0][price_data][unit_amount]": String(Math.round(p.amount * 100)),
    "line_items[0][price_data][product_data][name]": p.description,
    client_reference_id: p.paymentId,
    "metadata[payment_id]": p.paymentId,
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { id: string; url: string };
  return { url: json.url, ref: json.id };
}

export async function retrieveCheckout(ref: string) {
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${ref}`, {
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) throw new Error(`Stripe ${res.status}`);
  return (await res.json()) as { payment_status: string; status: string };
}

/** Verifies a Stripe-Signature header (v1 HMAC-SHA256) without the SDK. */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, toleranceSec = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  return sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}
