import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const url = body?.url as string | undefined;

    if (!url || typeof url !== "string" || !/^https?:\/\//.test(url)) {
      return NextResponse.json(
        { error: "Invalid or missing URL. Use http(s)://…" },
        { status: 400 }
      );
    }

    const resp = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(8500), // Vercel timeout is 10s, we stoppen na 8.5s netjes
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Ch-Ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": "\"Windows\"",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
      },
    });

    if (!resp.ok) {
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

    const html = await resp.text();
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

    const urlHash = Buffer.from(url).toString("base64url");

    // Calculate expiry: 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Save to database
    await prisma.psaScan.upsert({
      where: { url },
      update: {
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

    return NextResponse.json({
      url,
      status: "ok",
      pageTitle: title,
      privacy: { score: privacyScore, note: privacyNote },
      security: { score: securityScore, note: securityNote },
      age: { score: ageScore, note: ageNote },
      reportUrl: `/report/${urlHash}`,
      expiresAt: expiresAt.toISOString(),
      fromCache: false,
    });
  } catch (e: unknown) {
    console.error("PSA scan error:", e);
    
    const isTimeout = e instanceof Error && (e.name === "TimeoutError" || e.message.includes("timeout"));
    const friendlyError = isTimeout ? "Scan timeout: De website reageert te traag (> 8.5s). Probeer het later nog eens." : "De scan is mislukt door een onverwachte server fout.";

    return NextResponse.json(
      { error: friendlyError },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
