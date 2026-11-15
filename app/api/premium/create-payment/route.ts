"use server";
import { NextResponse } from "next/server";
import { createMollieClient } from "@mollie/api-client";
import { prisma } from "@/lib/prisma";
import { validatePublicScanUrl } from "@/lib/scan-guard";
import { calculateVatInclusiveQuote, VatQuoteError } from "@/lib/vat";
import { getMollieApiKey } from "@/lib/mollie";
import { parseBusinessInvoiceDetails } from "@/lib/invoice-details";
import { getMollieWebhookUrl, getPsaAppUrl } from "@/lib/psa-urls";

export async function POST(request: Request) {
  try {
    const { tier, email, scanMode, scanUrl, countryCode, customerType, vatNumber, companyName, companyAddress } = await request.json();
    if ((tier !== "RE_SCAN" && tier !== "RE_SCAN_ADV") || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "A valid premium tier and email address are required" }, { status: 400 });
    }

    const taxDetails = await calculateVatInclusiveQuote({
      product: tier,
      countryCode,
      ipCountryCode: request.headers.get("x-vercel-ip-country"),
      customerType,
      vatNumber,
    });
    const invoiceDetails = parseBusinessInvoiceDetails(customerType, companyName, companyAddress);

    const validScanMode = scanMode === "seo" || scanMode === "geo";
    if (scanMode !== undefined && !validScanMode) {
      return NextResponse.json({ error: "Invalid scan mode" }, { status: 400 });
    }
    if (validScanMode && (typeof scanUrl !== "string" || !scanUrl.trim() || await validatePublicScanUrl(scanUrl))) {
      return NextResponse.json({ error: "A valid public scan URL is required" }, { status: 400 });
    }

    // Create a pending order in the DB (price in cents)
    const order = await prisma.premiumOrder.create({
      data: {
        email: email.trim(),
        tier,
        paymentId: "pending",
        priceCents: taxDetails.grossAmountCents,
        taxDetails: { ...taxDetails, ...invoiceDetails },
        scanUrl: validScanMode ? scanUrl.trim().toLowerCase().replace(/\/$/, "") : null,
        scanMode: validScanMode ? scanMode : null,
      },
    });

    const mollieKey = getMollieApiKey();
    if (!mollieKey) {
      return NextResponse.json({ error: "Mollie API key missing" }, { status: 500 });
    }

    const baseUrl = getPsaAppUrl(request.url);
    const metadata: Record<string, string> = {
      orderId: order.id,
    };
    if (validScanMode && scanMode) {
      metadata.scanMode = scanMode;
    }
    if (validScanMode && scanUrl) {
      metadata.scanUrl = scanUrl.trim().toLowerCase().replace(/\/$/, "");
    }

    const mollieClient = createMollieClient({ apiKey: mollieKey });
    const payment = await mollieClient.payments.create({
      amount: {
        currency: "EUR",
        value: (taxDetails.grossAmountCents / 100).toFixed(2),
      },
      description: `${tier} ${validScanMode ? scanMode.toUpperCase() : "SEO"} re-scan for ${email.trim()}`,
      redirectUrl: `${baseUrl}/premium/success?orderId=${encodeURIComponent(order.id)}`,
      webhookUrl: getMollieWebhookUrl(baseUrl),
      metadata,
    });

    const checkoutUrl = payment.getCheckoutUrl();
    const paymentId = payment.id;
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
    if (e instanceof VatQuoteError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}
