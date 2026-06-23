import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Mollie webhook endpoint.
 * Mollie will POST the payment status to this URL after the payment process.
 * It expects a 2xx response; otherwise Mollie will retry.
 */

// ---------------------------------------------------------------------
// GET – simple health‑check (useful for Mollie’s “Test webhook” button)
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

// ---------------------------------------------------------------------
// Helper: list of Mollie event types we care about (snapshot‑only)
const ALLOWED_EVENT_TYPES = [
  "balance.transaction",
  "payouts",
  "payment.links",
  "sales.invoices",
];

// ---------------------------------------------------------------------
// Updated POST – store full payload for allowed types, and optionally update order
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const eventType = payload?.type as string | undefined;

    // Always store the full snapshot (if type is allowed)
    if (eventType && ALLOWED_EVENT_TYPES.includes(eventType)) {
      await prisma.webhookEvent.create({
        data: {
          type: eventType,
          payload: payload as any,
        },
      });
    }

    // Existing payment‑order handling (orderId may be inside metadata)
    const { id: mollieId, status, metadata } = payload as {
      id: string;
      status: string;
      metadata?: { orderId?: string };
    };
    const orderId = metadata?.orderId;

    if (orderId) {
      // Update (or create) the payment record in the SQLite database
      await prisma.payment.upsert({
        where: { mollieId },
        update: { status },
        create: { mollieId, status },
      });

      // Optionally, mark the order as paid in your premiumOrder table
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

  try {
    const payload = await req.json();
    const { id: mollieId, status, metadata } = payload as {
      id: string;
      status: string;
      metadata?: { orderId?: string };
    };

    const orderId = metadata?.orderId;
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // Update (or create) the payment record in the SQLite database
    await prisma.payment.upsert({
      where: { mollieId },
      update: { status },
      create: { mollieId, status },
    });

    // Optionally, mark the order as paid in your premiumOrder table
    await prisma.premiumOrder.update({
      where: { id: orderId },
      data: { status, paymentId: mollieId },
    });

    // Mollie expects a 200 response
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mollie webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: true,
    sizeLimit: "1mb",
  },
};
