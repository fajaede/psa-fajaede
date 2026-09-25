import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const mollieApiKey = () => process.env.MOLLIE_API_KEY || process.env.MOLLIE_TEST_KEY;

export async function GET() {
  return NextResponse.json({ status: "ok" });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let paymentId: string | null = null;

    if (contentType.includes("application/json")) {
      const payload = await request.json();
      paymentId = typeof payload?.id === "string" ? payload.id : null;
    } else {
      const formData = await request.formData();
      const id = formData.get("id");
      paymentId = typeof id === "string" ? id : null;
    }

    if (!paymentId) {
      return NextResponse.json({ error: "Missing Mollie payment id" }, { status: 400 });
    }

    const apiKey = mollieApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "Mollie API key missing" }, { status: 500 });
    }

    // Mollie webhooks contain only the payment id. Fetch the official status server-side.
    const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!mollieResponse.ok) {
      throw new Error(`Mollie status lookup failed: ${mollieResponse.status}`);
    }

    const payment = await mollieResponse.json();
    const status = typeof payment?.status === "string" ? payment.status : "unknown";
    const orderId = payment?.metadata?.orderId;

    await prisma.webhookEvent.create({
      data: { type: "payment.updated", payload: payment },
    });

    if (typeof orderId === "string") {
      const order = await prisma.premiumOrder.update({
        where: { id: orderId },
        data: { paymentId, status },
      });

      if (status === "paid" && order.scanUrl && order.scanMode === "seo") {
        await prisma.seoScan.updateMany({ where: { url: order.scanUrl }, data: { isPaid: true } });
      }
      if (status === "paid" && order.scanUrl && order.scanMode === "geo") {
        await prisma.geoScan.updateMany({ where: { url: order.scanUrl }, data: { isPaid: true } });
      }
    } else {
      await prisma.premiumOrder.updateMany({
        where: { paymentId },
        data: { status },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mollie webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}




