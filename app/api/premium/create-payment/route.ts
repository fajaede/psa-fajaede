"use server";
import { NextResponse } from "next/server";
import { createMollieClient } from "@mollie/api-client";
import { prisma } from "@/lib/prisma";
import { validatePublicScanUrl } from "@/lib/scan-guard";
import { calculateVatInclusiveQuote, VatQuoteError } from "@/lib/vat";
import { getMollieApiKey } from "@/lib/mollie";
import { parseBusinessInvoiceDetails } from "@/lib/invoice-details";
import { requireCheckoutConsent } from "@/lib/consent";
import { getMollieWebhookUrl, getPsaAppUrl } from "@/lib/psa-urls";

export async function POST(request: Request) {
  try {
    const { tier, email, scanMode, scanUrl, countryCode, customerType, vatNumber, companyName, companyAddress, acceptTerms } = await request.json();
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
    const consentDetails = requireCheckoutConsent(acceptTerms);

    // A re-scan is always for one website: it includes the site audit, so the URL is required.
    const mode = scanMode === undefined || scanMode === null || scanMode === "" ? "seo" : scanMode;
    if (mode !== "seo" && mode !== "geo") {
      return NextResponse.json({ error: "Invalid scan mode" }, { status: 400 });
    }
    const rawUrl = typeof scanUrl === "string" ? scanUrl.trim() : "";
    const siteUrl = rawUrl && !/^https?:\/\//i.test(rawUrl) ? `https://${rawUrl}` : rawUrl;
    if (!siteUrl || await validatePublicScanUrl(siteUrl)) {
      return NextResponse.json({ error: "Vul een geldige, openbare website in (bijvoorbeeld https://jouwsite.nl)." }, { status: 400 });
    }

    // Create a pending order in the DB (price in cents)
    const order = await prisma.premiumOrder.create({
      data: {
        email: email.trim(),
        tier,
        paymentId: "pending",
        priceCents: taxDetails.grossAmountCents,
        taxDetails: { ...taxDetails, ...invoiceDetails, ...consentDetails },
        scanUrl: siteUrl.toLowerCase().replace(/\/$/, ""),
        scanMode: mode,
      },
    });

    const mollieKey = getMollieApiKey();
    if (!mollieKey) {
      return NextResponse.json({ error: "Mollie API key missing" }, { status: 500 });
    }

    const baseUrl = getPsaAppUrl(request.url);
    const metadata: Record<string, string> = {
      orderId: order.id,
      scanMode: mode,
      scanUrl: order.scanUrl ?? "",
    };

    const mollieClient = createMollieClient({ apiKey: mollieKey });
    const payment = await mollieClient.payments.create({
      amount: {
        currency: "EUR",
        value: (taxDetails.grossAmountCents / 100).toFixed(2),
      },
      description: `${tier} ${mode.toUpperCase()} re-scan for ${email.trim()}`,
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
