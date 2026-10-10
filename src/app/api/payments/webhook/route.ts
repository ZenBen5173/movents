import { NextResponse } from "next/server";
import { one, update } from "@/lib/db";
import { audit } from "@/lib/audit";
import { verifyStripeSignature } from "@/lib/integrations/payments";

/** Stripe webhook: marks a vendor deposit paid when Checkout completes. */
export async function POST(req: Request) {
  const payload = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }
  const event = JSON.parse(payload) as { type: string; data: { object: { client_reference_id?: string; metadata?: { payment_id?: string } } } };
  if (event.type === "checkout.session.completed") {
    const pid = event.data.object.metadata?.payment_id ?? event.data.object.client_reference_id;
    const pay = pid ? await one<{ id: string; vendor_id: string; event_id: string; amount: number }>("SELECT * FROM payments WHERE id = $1", [pid]) : null;
    if (pay) {
      await update("payments", pay.id, { status: "paid", paid_at: new Date() });
      await update("vendors", pay.vendor_id, { deposit_status: "paid" });
      await audit({ id: null, name: "Stripe" }, "payment.deposit_paid", { payment_id: pay.id, amount: pay.amount }, { eventId: pay.event_id });
    }
  }
  return NextResponse.json({ received: true });
}
