import { NextResponse } from "next/server";
import { createMollieClient } from "@mollie/api-client";
import { prisma } from "@/lib/prisma";
import { calculateVatInclusiveQuote, VatQuoteError } from "@/lib/vat";
import { getMollieApiKey } from "@/lib/mollie";
import { parseBusinessInvoiceDetails } from "@/lib/invoice-details";
import { requireCheckoutConsent } from "@/lib/consent";
import { getMollieWebhookUrl, getPsaAppUrl } from "@/lib/psa-urls";

export async function POST(request: Request) {
  try {
    const { urlHash, email, countryCode, customerType, vatNumber, companyName, companyAddress, acceptTerms } = await request.json();
    if (typeof urlHash !== "string" || !urlHash || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "A report and email address are required." }, { status: 400 });
    }

    const taxDetails = await calculateVatInclusiveQuote({
      product: "PSA_LICENSE",
      countryCode,
      ipCountryCode: request.headers.get("x-vercel-ip-country"),
      customerType,
      vatNumber,
    });
    const invoiceDetails = parseBusinessInvoiceDetails(customerType, companyName, companyAddress);
    const consentDetails = requireCheckoutConsent(acceptTerms);
    const report = await prisma.psaScan.findUnique({ where: { urlHash } });
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const mollieApiKey = getMollieApiKey();
    if (!mollieApiKey) {
      return NextResponse.json({ error: "Mollie API key missing in environment variables" }, { status: 500 });
    }

    const baseUrl = getPsaAppUrl(request.url);
    await prisma.psaScan.update({
      where: { urlHash },
      data: { email: email.trim(), taxDetails: { ...taxDetails, ...invoiceDetails, ...consentDetails } },
    });

    const mollieClient = createMollieClient({ apiKey: mollieApiKey });
    const payment = await mollieClient.payments.create({
      amount: {
        value: (taxDetails.grossAmountCents / 100).toFixed(2),
        currency: "EUR",
      },
      description: `FajaedeAI PSA Licentie - ${report.url}`,
      redirectUrl: `${baseUrl}/report/${urlHash}?payment=success`,
      webhookUrl: getMollieWebhookUrl(baseUrl),
      metadata: { urlHash },
    });

    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) {
      throw new Error("Mollie did not return a checkout URL.");
    }
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    if (error instanceof VatQuoteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Mollie Checkout Error:", error);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}