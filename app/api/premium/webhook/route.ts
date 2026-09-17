import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Mollie webhook endpoint.
 * Handles GET health‑check and POST events.
 */

// ---------------------------------------------------------------------
// GET – simple health‑check (useful for Mollie’s “Test webhook” button)
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

// ---------------------------------------------------------------------
// List of Mollie event types we care about (snapshot‑only)
const ALLOWED_EVENT_TYPES = [
  "balance.transaction",
  "payouts",
  "payment.links",
  "sales.invoices",
];

// ---------------------------------------------------------------------
// POST – store full payload for allowed types and update order/payment status
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const eventType = payload?.type as string | undefined;

    // Store snapshot if the event type is allowed
    if (eventType && ALLOWED_EVENT_TYPES.includes(eventType)) {
      await prisma.webhookEvent.create({
        data: {
          type: eventType,
          payload: payload as any,
        },
      });
    }

    // Extract common fields (Mollie ID, status, optional orderId)
    const { id: mollieId, status, metadata } = payload as {
      id: string;
      status: string;
      metadata?: { orderId?: string };
    };
    const orderId = metadata?.orderId;

    // Update (or create) payment record
    if (mollieId) {
      await prisma.payment.upsert({
        where: { mollieId },
        update: { status },
        create: { mollieId, status },
      });
    }

    // If we have an orderId, mark the premium order as paid
    if (orderId) {
      await prisma.premiumOrder.update({
        where: { id: orderId },
        data: { status, paymentId: mollieId },
      });
    }

    // Mollie expects a 2xx response
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mollie webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}




