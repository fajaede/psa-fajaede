"use server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to map tier to price (in euros)
function getPrice(tier: string): number | null {
  switch (tier) {
    case "RE_SCAN":
      return Number(process.env.PREMIUM_PRICE_RESCAN ?? "149");
    case "RE_SCAN_ADV":
      return Number(process.env.PREMIUM_PRICE_RESCAN_ADV ?? "249");
    default:
      return null;
  }
}

export async function POST(request: Request) {
  try {
    const { tier, email } = await request.json();
    const price = getPrice(tier);
    if (price === null || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "A valid premium tier and email address are required" }, { status: 400 });
    }

    // Create a pending order in the DB (price in cents)
    const order = await prisma.premiumOrder.create({
      data: {
        email: email.trim(),
        tier,
        paymentId: "pending",
        priceCents: Math.round(price * 100),
      },
    });

    const mollieKey = process.env.MOLLIE_API_KEY || process.env.MOLLIE_TEST_KEY;
    if (!mollieKey) {
      return NextResponse.json({ error: "Mollie API key missing" }, { status: 500 });
    }

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://fajaede.nl").replace(/\/$/, "");
    const mollieRes = await fetch("https://api.mollie.com/v2/payments", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${mollieKey}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
        amount: { currency: "EUR", value: price.toFixed(2) },
        description: `${tier} SEO re-scan for ${email.trim()}`,
        redirectUrl: `${baseUrl}/premium/success?orderId=${encodeURIComponent(order.id)}`,
        webhookUrl: `${baseUrl}/api/premium/webhook`,
        metadata: { orderId: order.id },
      }),
    });

    if (!mollieRes.ok) {
      const err = await mollieRes.text();
      throw new Error(`Mollie error: ${err}`);
    }
    const payment = await mollieRes.json();
    const checkoutUrl = payment?._links?.checkout?.href;
    const paymentId = payment?.id;
    if (!checkoutUrl || !paymentId) {
      throw new Error("Mollie response did not contain a checkout URL or payment id");
    }

    // Update order with actual Mollie payment id
    await prisma.premiumOrder.update({
      where: { id: order.id },
      data: { paymentId },
    });

    return NextResponse.json({ checkoutUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}
