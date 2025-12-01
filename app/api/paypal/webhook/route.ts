import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { prisma } from "@/lib/prisma";

// NOTE: For production you must verify webhook signatures with PayPal.
// This endpoint will accept PayPal subscription webhook events and
// update the corresponding psaScan.expiresAt when a payment occurs.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const eventType = body.event_type;
    // For subscription payment completed events you may get: PAYMENT.SALE.COMPLETED
    // For subscriptions: BILLING.SUBSCRIPTION.ACTIVATED / PAYMENT.SALE.COMPLETED
    if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED" || eventType === "PAYMENT.SALE.COMPLETED") {
      const custom_id = body.resource?.custom_id || body.resource?.customId || null;
      const billingTime = body.resource?.billing_time || body.resource?.create_time || new Date().toISOString();

      if (custom_id) {
        // custom_id was set to the URL when creating the subscription
        const url = custom_id;
        // extend expiry by one year from now
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);

        await prisma.psaScan.updateMany({ where: { url }, data: { expiresAt: expires } });
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("PayPal webhook handling error", err);
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 });
  }
}
