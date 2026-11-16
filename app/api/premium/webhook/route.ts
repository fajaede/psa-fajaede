import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMollieApiKey } from "@/lib/mollie";
import { issueInvoice, isPeppolInvoice } from "@/lib/invoices";
import { notifyPeppolInvoice, sendPurchaseConfirmation } from "@/lib/purchase-mail";
import type { Prisma } from "@prisma/client";

// Invoice once per paid payment; mail the customer (and the owner for Peppol) only the first time.
// Invoice errors propagate (Mollie retries the webhook); mail errors are logged only.
async function invoiceAndConfirm(
  payment: MolliePayment,
  paymentId: string,
  sale: { description: string; email: string | null; taxDetails: Prisma.JsonValue | null },
) {
  const { invoice, created } = await issueInvoice({
    paymentId,
    mode: payment?.mode === "live" ? "live" : "test",
    description: sale.description,
    email: sale.email,
    taxDetails: sale.taxDetails,
    paidAmountCents: Math.round(Number(payment?.amount?.value ?? 0) * 100),
  });
  if (!created) return;
  try {
    await sendPurchaseConfirmation(invoice);
  } catch (error) {
    console.error("Purchase confirmation mail failed:", error);
  }
  if (isPeppolInvoice(invoice)) {
    try {
      await notifyPeppolInvoice(invoice);
    } catch (error) {
      console.error("Peppol invoice notification failed:", error);
    }
  }
}

type MolliePayment = {
  mode?: unknown;
  paidAt?: unknown;
  amount?: { value?: unknown };
};

// Store each paid payment once (keyed by Mollie id) for the weekly accounting report.
async function recordSale(
  payment: MolliePayment,
  paymentId: string,
  sale: { product: string; email: string | null; taxDetails: Prisma.JsonValue | null },
) {
  const amountCents = Math.round(Number(payment?.amount?.value ?? 0) * 100);
  const paidAt = typeof payment?.paidAt === "string" ? new Date(payment.paidAt) : new Date();
  const mode = payment?.mode === "live" ? "live" : "test";
  await prisma.sale.upsert({
    where: { paymentId },
    update: {},
    create: {
      paymentId,
      mode,
      product: sale.product,
      email: sale.email,
      amountCents: Number.isFinite(amountCents) ? amountCents : 0,
      taxDetails: sale.taxDetails ?? undefined,
      paidAt: Number.isNaN(paidAt.getTime()) ? new Date() : paidAt,
    },
  });
}

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

    const apiKey = getMollieApiKey();
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
    const urlHash = payment?.metadata?.urlHash;

    // Store only what is needed for bookkeeping/debugging: not Mollie's "details"
    // (which can hold the payer's name, IBAN or card data).
    await prisma.webhookEvent.create({
      data: {
        type: "payment.updated",
        payload: {
          id: payment?.id ?? null,
          status,
          mode: payment?.mode ?? null,
          method: payment?.method ?? null,
          amount: payment?.amount ?? null,
          createdAt: payment?.createdAt ?? null,
          paidAt: payment?.paidAt ?? null,
          metadata: payment?.metadata ?? null,
        },
      },
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
      if (status === "paid") {
        const tierLabel = order.tier === "RE_SCAN_ADV" ? "Re-scan Advanced" : "Re-scan";
        const product = `${tierLabel} ${(order.scanMode ?? "seo").toUpperCase()}`;
        await recordSale(payment, paymentId, {
          product,
          email: order.email,
          taxDetails: order.taxDetails,
        });
        await invoiceAndConfirm(payment, paymentId, {
          description: `FajaedeAI ${product}${order.scanUrl ? ` voor ${order.scanUrl}` : ""}`,
          email: order.email,
          taxDetails: order.taxDetails,
        });
      }
    } else if (typeof urlHash === "string" && status === "paid") {
      const scan = await prisma.psaScan.update({
        where: { urlHash },
        data: { isPaid: true },
      });
      await recordSale(payment, paymentId, {
        product: `PSA-licentie: ${scan.url}`,
        email: scan.email,
        taxDetails: scan.taxDetails,
      });
      await invoiceAndConfirm(payment, paymentId, {
        description: `FajaedeAI PSA-licentie voor ${scan.url}`,
        email: scan.email,
        taxDetails: scan.taxDetails,
      });
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




