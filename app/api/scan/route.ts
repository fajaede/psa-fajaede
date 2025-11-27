import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const url = body?.url as string | undefined;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "Invalid or missing URL. Use http(s)://…" },
        { status: 400 }
      );
    }

    //  hier echte PSA-analyse (crawler + AI)
    // 1. HTML van de site ophalen
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; fajaedeAI-PSA/1.0; +https://fajaede.nl)",
      },
    });

    if (!resp.ok) {
      return NextResponse.json(
        {
          error: `Could not fetch URL (status ${resp.status}).`,
        },
        { status: 502 }
      );
    }

    const html = await resp.text();

    // 2. Heel simpele analyse: title & paar signalen
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Privacy score: heel grof kijken naar woorden als "cookie" / "privacy"
    const lower = html.toLowerCase();
    const hasPrivacy =
      lower.includes("privacy") || lower.includes("cookie") || lower.includes("gdpr");

    // Security score: https en geen http-only
    const isHttps = url.startsWith("https://");

    // Age score: check op woorden 18+ / adult (in echte versie complexer)
    const isAdult =
      lower.includes("18+") ||
      lower.includes("adult only") ||
      lower.includes("porn") ||
      lower.includes("xxx");

    const privacyScore = hasPrivacy ? "P2 / 3" : "P1 / 3";
    const privacyNote = hasPrivacy
      ? "Basic privacy / cookie information detected on the page."
      : "No clear privacy or cookie information found in the HTML.";

    const securityScore = isHttps ? "S2 / 3" : "S1 / 3";
    const securityNote = isHttps
      ? "Site uses HTTPS. Further security checks recommended."
      : "Site does not use HTTPS. Connection may not be secure.";

    const ageScore = isAdult ? "A3 / 3" : "A1 / 3";
    const ageNote = isAdult
      ? "Content appears to be adult‑oriented (18+)."
      : "No obvious adult keywords detected; appears general audience.";

    const result = {
      url,
      status: "ok",
      pageTitle: title || "(no <title> found)",
      privacy: {
        score: privacyScore,
        note: privacyNote,
      },
      security: {
        score: securityScore,
        note: securityNote,
      },
      age: {
        score: ageScore,
        note: ageNote,
      },
      reportUrl: `https://psa.fajaede.nl/report/${encodeURIComponent(
        Buffer.from(url).toString("base64url")
      )}`,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("PSA scan error:", err);
    return NextResponse.json(
      { error: "Internal PSA scan error. Please try again later." },
      { status: 500 }
    );
  }
}
