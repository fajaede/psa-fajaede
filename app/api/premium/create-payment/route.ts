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
    if (price === null) {
      // No payment needed (e.g., FREE tier) – just return a dummy URL
      return NextResponse.json({ checkoutUrl: "/premium/success?free=1" });
    }

    // Create a pending order in the DB (price in cents)
    const order = await prisma.premiumOrder.create({
      data: {
        email: email ?? "",
        tier,
        paymentId: "pending",
        priceCents: Math.round(price * 100),
      },
    });

    // Mollie payment request
     const mollieKey = process.env.MOLLIE_TEST_KEY || "test_5dxfedaARztkwUEw3hEheQhFr47Brb";
     if (!mollieKey) {
       console.error("Mollie API key missing in environment variables");
       return NextResponse.json({ error: "Mollie API key missing" }, { status: 500 });
     }

     const mollieRes = await fetch("https://api.mollie.com/v2/payments", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${mollieKey}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
        amount: { currency: "EUR", value: price.toFixed(2) },
        description: `${tier} SEO re‑scan for ${email || "anonymous"}`,
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://psa-fajaede.vercel.app"}/premium/success?orderId=${order.id}`,
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://psa-fajaede.vercel.app"}/api/premium/webhook`,
        metadata: { orderId: order.id },
      }),
    });

    if (!mollieRes.ok) {
      const err = await mollieRes.text();
      throw new Error(`Mollie error: ${err}`);
    }
    const { checkoutUrl, id: paymentId } = await mollieRes.json();

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
