import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildReportPath, buildVerifyPath, generateReportId, normalizeReportId } from "@/lib/report-id";
import { checkScanRateLimit, fetchPublicResource, validatePublicScanUrl } from "@/lib/scan-guard";
import { verifyTurnstile } from "@/lib/turnstile";
import { isTrustedInternalRequest } from "@/lib/internal-request";
import { recordScanSnapshot } from "@/lib/scan-history";
import { psaTrustScore } from "@/lib/psa-score";
import { checkUrlReputation } from "@/lib/url-reputation";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let retryAfter: number | null;
    try {
      retryAfter = await checkScanRateLimit(request);
    } catch {
      return NextResponse.json({ error: "Scanservice tijdelijk niet beschikbaar." }, { status: 503 });
    }
    if (retryAfter !== null) {
      return NextResponse.json({ error: "Te veel scans aangevraagd. Probeer het later opnieuw." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
    }

    const body = await request.json();
    if (!isTrustedInternalRequest(request) && !(await verifyTurnstile(body?.turnstileToken, request))) {
      return NextResponse.json({ error: "Bevestig eerst dat je een mens bent." }, { status: 403 });
    }
    const url = body?.url as string | undefined;

    if (!url || typeof url !== "string" || !/^https?:\/\//.test(url)) {
      return NextResponse.json(
        { error: "Invalid or missing URL. Use http(s)://…" },
        { status: 400 }
      );
    }

    const urlError = await validatePublicScanUrl(url);
    if (urlError) return NextResponse.json({ error: urlError }, { status: 400 });
    const urlReputation = await checkUrlReputation(url);
    if (urlReputation.status === "unsafe") {
      return NextResponse.json({ error: "Deze website staat op een phishing- of malwareblokkeerlijst.", urlReputation }, { status: 403 });
    }

    const resp = await fetchPublicResource(url, { timeoutMs: 8500, maxBytes: 1_500_000 });

    if (resp.status < 200 || resp.status >= 300) {
      if (resp.status === 525) {
        return NextResponse.json(
          { error: "Cloudflare meldt status 525: de TLS-handshake tussen Cloudflare en de originserver van deze website mislukt. Controleer het origin-certificaat en de SSL/TLS-modus; dit is een configuratieprobleem aan de website." },
          { status: 502 }
        );
      }
      if (resp.status === 403 || resp.status === 503) {
        return NextResponse.json(
          { error: "Scan geblokkeerd: Deze website gebruikt een strikte firewall (zoals Cloudflare) die automatische scans weigert." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: `Could not fetch URL (status ${resp.status}).` },
        { status: 502 }
      );
    }

    const html = resp.text;
    const lower = html.toLowerCase();

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "No <title> found";

    // --- 1. PRIVACY (GDPR / AVG) ---
    const hasTrackers = lower.includes('google-analytics') || lower.includes('gtag(') || lower.includes('fbq(') || lower.includes('hotjar');
    const hasCookieBanner = lower.includes('cookiebot') || lower.includes('complianz') || lower.includes('borlabs') || lower.includes('cookieyes');
    // Semantisch zoeken naar een privacy of voorwaarden link (meestal in footer)
    const hasPrivacyLink = /<a[^>]*href=[^>]*>([^<]*(privacy|cookie|voorwaarden|gdpr|avg|policy)[^<]*)<\/a>/i.test(html) || /href=["'][^"']*(privacy|cookie|voorwaarden|gdpr|avg|policy)["']/i.test(html);

    let privacyScore = "P2 / 3";
    let privacyNote = "Basis privacy informatie aanwezig.";
    
    if (hasTrackers && !hasCookieBanner) {
      privacyScore = "P1 / 3";
      privacyNote = "Kritiek: Marketing trackers gedetecteerd, maar geen bekende cookie banner (Mogelijk AVG risico).";
    } else if (!hasPrivacyLink) {
      privacyScore = "P1 / 3";
      privacyNote = "Geen duidelijke link naar een privacy policy of algemene voorwaarden gevonden.";
    } else if (hasPrivacyLink && hasCookieBanner) {
      privacyScore = "P3 / 3";
      privacyNote = "Uitstekend: Privacy policy én automatische cookie consent software (GDPR compliant) gedetecteerd.";
    }

    // --- 2. SECURITY (Technische Beveiliging) ---
    // Check of de originele URL https is, of dat de server ons veilig heeft geredirect naar een https:// link
    const isHttps = url.startsWith("https://") || resp.url.startsWith("https://");
    // We checken de headers die we van de server kregen op moderne beveiligingsstandaarden
    const headers = resp.headers;
    const hasHsts = headers.get('strict-transport-security') !== null;
    const hasXFrame = headers.get('x-frame-options') !== null;
    // Detectie of de website de CMS versie (bijv. WordPress versie) lekt in de code
    const generatorMatch = html.match(/<meta[^>]*name="generator"[^>]*content="([^"]*)"/i);
    const hasCmsLeak = generatorMatch !== null;

    let securityScore = "S2 / 3";
    let securityNote = "Standaard HTTPS verbinding actief.";

    if (!isHttps) {
      securityScore = "S1 / 3";
      securityNote = "Kritiek: Website forceert geen HTTPS. Onveilige verbinding.";
    } else if (hasCmsLeak) {
      securityScore = "S1 / 3";
      securityNote = `Beveiligingsrisico: CMS of framework versie wordt publiekelijk gelekt (${generatorMatch![1]}). Hackers kunnen dit misbruiken.`;
    } else if (hasHsts && hasXFrame) {
      securityScore = "S3 / 3";
      securityNote = "Uitstekend: HSTS (Strict-Transport-Security) en Anti-Clickjacking headers zijn actief.";
    }

    // --- 3. AGE (Content & Brand Safety) ---
    const hasAdultMeta = lower.includes('name="rating" content="adult"') || lower.includes('name="rating" content="rta');
    const adultKeywords = ['gokken', 'casino', 'porn', 'xxx', 'escort', '18+', 'betting', 'onlyfans'];
    const adultKeywordCount = adultKeywords.filter(kw => lower.includes(kw)).length;

    let ageScore = "A1 / 3";
    let ageNote = "Veilige content. Geen risicovolle of 18+ content gedetecteerd.";

    if (hasAdultMeta || adultKeywordCount >= 2) {
      ageScore = "A3 / 3";
      ageNote = "Kritiek: Website bevat expliciete adult, gok- of 18+ gerelateerde content.";
    } else if (adultKeywordCount === 1) {
      ageScore = "A2 / 3";
      ageNote = "Let op: Enkele risicewoorden gedetecteerd, vereist mogelijk handmatige controle.";
    }

    const existing = await prisma.psaScan.findUnique({ where: { url } }).catch(() => null);
    let urlHash = existing?.urlHash ?? normalizeReportId(generateReportId());

    while (!existing && (await prisma.psaScan.findUnique({ where: { urlHash } }).catch(() => null))) {
      urlHash = normalizeReportId(generateReportId());
    }

    // Calculate expiry: 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Save to database
    await prisma.psaScan.upsert({
      where: { url },
      update: {
        urlHash,
        pageTitle: title,
        privacyScore,
        privacyNote,
        securityScore,
        securityNote,
        ageScore,
        ageNote,
        expiresAt,
      },
      create: {
        url,
        urlHash,
        pageTitle: title,
        privacyScore,
        privacyNote,
        securityScore,
        securityNote,
        ageScore,
        ageNote,
        expiresAt,
      },
    });

    await recordScanSnapshot(url, "psa", psaTrustScore({ securityScore, privacyScore, ageScore }), {
      pageTitle: title,
      privacy: { score: privacyScore, note: privacyNote },
      security: { score: securityScore, note: securityNote },
      age: { score: ageScore, note: ageNote },
      reportId: urlHash,
    });

    return NextResponse.json({
      url,
      status: "ok",
      pageTitle: title,
      privacy: { score: privacyScore, note: privacyNote },
      security: { score: securityScore, note: securityNote },
      age: { score: ageScore, note: ageNote },
      reportUrl: buildReportPath(urlHash),
      verifyUrl: buildVerifyPath(urlHash),
      urlReputation,
      expiresAt: expiresAt.toISOString(),
      fromCache: false,
    });
  } catch (e: unknown) {
    console.error("PSA scan error:", e);
    
    const isTimeout = e instanceof Error && (e.name === "TimeoutError" || e.message.includes("timeout"));
    const isNotFound = e instanceof Error && (e.message.includes("ENOTFOUND") || e.message.includes("getaddrinfo") || e.message.includes("fetch failed"));

    let friendlyError = "De scan is mislukt door een onverwachte server fout.";
    let statusCode = 500;

    if (e instanceof Error && e.message.includes("Cloudflare beschermt")) {
      friendlyError = "Scan geblokkeerd: Deze website gebruikt een Cloudflare-botbescherming die automatische scans blokkeert. Gebruik een browser of zet de botbescherming voor de scanner uit.";
      statusCode = 403;
    } else if (isTimeout) {
      friendlyError = "Scan timeout: De website reageert te traag (> 8.5s). Probeer het later nog eens.";
      statusCode = 504;
    } else if (isNotFound) {
      friendlyError = "Kan de website niet bereiken. Controleer of er geen typfout in de URL staat.";
      statusCode = 400;
    }

    return NextResponse.json(
      { error: friendlyError },
      { status: statusCode }
    );
  }
}
