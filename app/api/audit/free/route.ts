import { NextResponse } from "next/server";
import { requireCheckoutConsent } from "@/lib/consent";
import { VatQuoteError } from "@/lib/vat";
import { clientIpFromHeaders, SharedScanRateLimitUnavailableError } from "@/lib/scan-guard";
import { startFreeAudit } from "@/lib/site-audit-api";

/** Free Site-audit: crawls up to 50 pages, shows the first 10 in full; the private link is also mailed. */
export async function POST(request: Request) {
  try {
    const { url, email, acceptTerms } = (await request.json().catch(() => ({}))) as {
      url?: unknown; email?: unknown; acceptTerms?: unknown;
    };
    const consent = requireCheckoutConsent(acceptTerms);
    const result = await startFreeAudit(String(url ?? ""), String(email ?? ""), clientIpFromHeaders(request.headers), consent);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ token: result.token });
  } catch (error) {
    if (error instanceof VatQuoteError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof SharedScanRateLimitUnavailableError) {
      return NextResponse.json({ error: "De gratis audit is even niet beschikbaar. Probeer het over een paar minuten opnieuw." }, { status: 503 });
    }
    console.error("Free site audit failed:", error);
    return NextResponse.json({ error: "De audit kon niet worden gestart." }, { status: 500 });
  }
}
