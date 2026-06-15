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
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7"
      },
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: `Could not fetch URL (status ${resp.status}).` },
        { status: 502 }
      );
    }

    const html = await resp.text();
    const lower = html.toLowerCase();

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "No <title> found";

    const hasPrivacy =
      lower.includes("privacy") ||
      lower.includes("cookie") ||
      lower.includes("gdpr") ||
      lower.includes("avg");

    const isHttps = url.startsWith("https://");
    const isAdult =
      lower.includes("18+") ||
      lower.includes("adult") ||
      lower.includes("porn") ||
      lower.includes("xxx");

    const privacyScore = hasPrivacy ? "P2 / 3" : "P1 / 3";
    const privacyNote = hasPrivacy
      ? "Basic privacy / cookie information detected."
      : "No clear privacy or cookie information detected.";

    const securityScore = isHttps ? "S2 / 3" : "S1 / 3";
    const securityNote = isHttps
      ? "Site uses HTTPS."
      : "Site does not use HTTPS.";

    const ageScore = isAdult ? "A3 / 3" : "A1 / 3";
    const ageNote = isAdult
      ? "Adult content keywords detected (18+)."
      : "No obvious adult content; general audience.";

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
    return NextResponse.json(
      { error: "Internal PSA scan error." },
      { status: 500 }
    );
  }
}
