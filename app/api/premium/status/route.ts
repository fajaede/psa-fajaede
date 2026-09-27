import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const order = await prisma.premiumOrder.findUnique({
    where: { id: orderId },
    select: { id: true, tier: true, status: true, paymentId: true, scanUrl: true, scanMode: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let status = order.status;
  const apiKey = process.env.MOLLIE_API_KEY || process.env.MOLLIE_TEST_KEY;

  if (apiKey && order.paymentId !== "pending" && status !== "paid") {
    try {
      const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(order.paymentId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      });

      if (mollieResponse.ok) {
        const payment = await mollieResponse.json();
        const paymentOrderId = payment?.metadata?.orderId;

        if (paymentOrderId === order.id && typeof payment?.status === "string") {
          status = payment.status;
          await prisma.premiumOrder.update({
            where: { id: order.id },
            data: { status },
          });

          if (status === "paid" && order.scanUrl && order.scanMode === "seo") {
            await prisma.seoScan.updateMany({ where: { url: order.scanUrl }, data: { isPaid: true } });
          }
          if (status === "paid" && order.scanUrl && order.scanMode === "geo") {
            await prisma.geoScan.updateMany({ where: { url: order.scanUrl }, data: { isPaid: true } });
          }
        }
      }
    } catch (error) {
      console.error("Premium payment status lookup failed:", error);
    }
  }

  return NextResponse.json({ id: order.id, tier: order.tier, status });
}