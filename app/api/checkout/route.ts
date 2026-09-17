import { NextRequest, NextResponse } from "next/server";
import { createMollieClient } from "@mollie/api-client";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const urlHash = searchParams.get("urlHash");
  const email = searchParams.get("email");

  if (!urlHash) return NextResponse.json({ error: "Missing urlHash" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Missing email address" }, { status: 400 });

  if (!process.env.MOLLIE_API_KEY) {
    return NextResponse.json({ error: "Mollie API key missing in environment variables" }, { status: 500 });
  }

  const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

  try {
    const report = await prisma.psaScan.findUnique({ where: { urlHash } });
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    // Sla het e-mailadres van de klant op in de database!
    await prisma.psaScan.update({ where: { urlHash }, data: { email } });

    // Maak de betaling aan
    const payment = await mollieClient.payments.create({
      amount: {
        value: "9.00", // €9.00 - Let op: Mollie vereist ALTIJD 2 decimalen!
        currency: "EUR",
      },
      description: `FajaedeAI PSA Licentie - ${report.url}`,
      redirectUrl: `${origin}/report/${urlHash}?payment=success`, // Hier komen ze terug na de iDeal/Creditcard betaling
      webhookUrl: `${origin}/api/webhook/mollie`, // Mollie roept dit onzichtbaar aan!
      metadata: { urlHash },
    });

    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) {
      throw new Error("Mollie did not return a checkout URL.");
    }
    // Stuur de bezoeker door naar het veilige Mollie scherm
    return NextResponse.redirect(checkoutUrl);
  } catch (error) {
    console.error("Mollie Checkout Error:", error);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}