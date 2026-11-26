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
    const { tier, email, scanMode, scanUrl, auditToken, countryCode, customerType, vatNumber, companyName, companyAddress, acceptTerms } = await request.json();
    if ((tier !== "RE_SCAN" && tier !== "RE_SCAN_ADV" && tier !== "SITE_AUDIT") || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "A valid premium tier and email address are required" }, { status: 400 });
    }

    const taxDetails = await calculateVatInclusiveQuote({
      product: tier,
      countryCode,
      customerType,
      vatNumber,
    });
    const invoiceDetails = parseBusinessInvoiceDetails(customerType, companyName, companyAddress);
    const consentDetails = requireCheckoutConsent(acceptTerms);

    // Unlocking a free Site-audit: the payment goes on that order, so paying opens the same report at once.
    const freeOrder = tier === "SITE_AUDIT" && typeof auditToken === "string" && /^[a-f0-9]{32}$/.test(auditToken)
      ? await prisma.premiumOrder.findUnique({ where: { auditToken } })
      : null;
    if (freeOrder && (freeOrder.tier !== "SITE_AUDIT" || freeOrder.status === "paid")) {
      return NextResponse.json({ error: "Deze site-audit is al volledig ontgrendeld." }, { status: 409 });
    }

    // A re-scan is always for one website: it includes the site audit, so the URL is required.
    // A Site-audit has no SEO/GEO re-scan, so no scan mode (no scan gets marked as paid).
    const mode = tier === "SITE_AUDIT" ? null : scanMode === undefined || scanMode === null || scanMode === "" ? "seo" : scanMode;
    if (mode !== null && mode !== "seo" && mode !== "geo") {
      return NextResponse.json({ error: "Invalid scan mode" }, { status: 400 });
    }
    const rawUrl = freeOrder?.scanUrl ?? (typeof scanUrl === "string" ? scanUrl.trim() : "");
    const siteUrl = rawUrl && !/^https?:\/\//i.test(rawUrl) ? `https://${rawUrl}` : rawUrl;
    if (!siteUrl || await validatePublicScanUrl(siteUrl)) {
      return NextResponse.json({ error: "Vul een geldige, openbare website in (bijvoorbeeld https://jouwsite.nl)." }, { status: 400 });
    }

    // Create a pending order in the DB (price in cents); a free Site-audit keeps its order and stays
    // "free" until Mollie reports the payment as paid.
    const orderData = {
      email: email.trim(),
      priceCents: taxDetails.grossAmountCents,
      taxDetails: { ...taxDetails, ...invoiceDetails, ...consentDetails },
    };
    const order = freeOrder
      ? await prisma.premiumOrder.update({ where: { id: freeOrder.id }, data: orderData })
      : await prisma.premiumOrder.create({
        data: {
          ...orderData,
          tier,
          paymentId: "pending",
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
      scanMode: mode ?? "",
      scanUrl: order.scanUrl ?? "",
    };

    const mollieClient = createMollieClient({ apiKey: mollieKey });
    const payment = await mollieClient.payments.create({
      amount: {
        currency: "EUR",
        value: (taxDetails.grossAmountCents / 100).toFixed(2),
      },
      description: tier === "SITE_AUDIT" ? `Site-audit for ${order.scanUrl ?? siteUrl}` : `${tier} ${(mode ?? "seo").toUpperCase()} re-scan for ${email.trim()}`,
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
