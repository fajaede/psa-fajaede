import { NextRequest, NextResponse } from "next/server";
import "server-only";
import fetch from "node-fetch";
import { prisma } from "@/lib/prisma";

const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox"; // sandbox or live
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

function paypalBase() {
  return PAYPAL_MODE === "live"
    ? "https://api.paypal.com"
    : "https://api.sandbox.paypal.com";
}

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("Failed to get PayPal access token");
  return res.json();
}

export async function GET(req: NextRequest) {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    return NextResponse.json({ error: "PayPal not configured" }, { status: 500 });
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });

  try {
    const tokenRes = await getAccessToken();
    const accessToken = tokenRes.access_token;

    // Create or reuse a product (for simplicity create a new product)
    const productRes = await fetch(`${paypalBase()}/v1/catalogs/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "PSA Certificate",
        description: "Annual PSA certificate for a scanned URL",
        type: "SERVICE",
        category: "SOFTWARE",
      }),
    });
    const product = await productRes.json();

    // Create a billing plan (yearly €1)
    const planRes = await fetch(`${paypalBase()}/v1/billing/plans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: product.id,
        name: "PSA Certificate - Yearly",
        billing_cycles: [
          {
            frequency: { interval_unit: "YEAR", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: { fixed_price: { value: "1.00", currency_code: "EUR" } },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 1,
        },
      }),
    });
    const plan = await planRes.json();

    // Create subscription for buyer to approve
    const returnUrl = `${req.nextUrl.origin}/report/${Buffer.from(url).toString("base64url")}`;
    const cancelUrl = `${req.nextUrl.origin}/report/${Buffer.from(url).toString("base64url")}`;

    const subRes = await fetch(`${paypalBase()}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: plan.id,
        application_context: {
          brand_name: "fajaede PSA",
          user_action: "SUBSCRIBE_NOW",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
        custom_id: url,
      }),
    });

    const subscription = await subRes.json();

    const approveLink = (subscription.links || []).find((l: any) => l.rel === "approve")?.href;
    if (!approveLink) return NextResponse.json({ error: "No approval link from PayPal", subscription }, { status: 500 });

    // Optionally create a local record tracking this subscription attempt
    await prisma.psaScan.updateMany({ where: { url }, data: { updatedAt: new Date() } }).catch(() => null);

    return NextResponse.redirect(approveLink);
  } catch (err: any) {
    console.error("PayPal error", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
