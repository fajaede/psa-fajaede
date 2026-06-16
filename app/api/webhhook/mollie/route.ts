import { NextRequest, NextResponse } from "next/server";
import { createMollieClient } from "@mollie/api-client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (!process.env.MOLLIE_API_KEY) {
    return new NextResponse("Mollie API key missing", { status: 500 });
  }

  const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

  try {
    // Mollie stuurt de data als Form Data
    const formData = await request.formData();
    const id = formData.get("id") as string;

    if (!id) return new NextResponse("Missing payment id", { status: 400 });

    // Haal de officiële betaalstatus live op bij Mollie om hacks te voorkomen
    const payment = await mollieClient.payments.get(id);

    if (payment.status === "paid") {
      const metadata = payment.metadata as Record<string, unknown>;
      const urlHash = metadata?.urlHash as string;
      // Werk de database bij: Klant is nu officieel Certified!
      await prisma.psaScan.update({ where: { urlHash }, data: { isPaid: true } });
    }

    return new NextResponse("OK", { status: 200 }); // Vertel Mollie dat we het begrepen hebben
  } catch (error) {
    console.error("Mollie Webhook Error:", error);
    return new NextResponse("Webhook error", { status: 500 });
  }
}
