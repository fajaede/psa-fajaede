import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const url = body?.url as string | undefined;

    if (!url || typeof url !== "string" || !/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const startTime = Date.now();
    const res = await fetch(url, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7"
      },
    });
    const fetchTime = Date.now() - startTime;

    if (!res.ok) throw new Error("Could not fetch URL");

    const html = await res.text();
    const lowerHtml = html.toLowerCase();

    let score = 100;
    const issues: string[] = [];

    // 1. LocalBusiness / Organization Schema Check (Cruciaal voor Citations)
    if (!lowerHtml.includes('localbusiness') && !lowerHtml.includes('organization')) {
      score -= 30;
      issues.push("Kritiek: Geen AI-leesbare 'LocalBusiness' of 'Organization' Schema.org markup gevonden.");
    }

    // 2. Google Maps Embed of API Link
    if (!lowerHtml.includes('maps.google.com') && !lowerHtml.includes('google.com/maps')) {
      score -= 20;
      issues.push("Geen Google Maps integratie of link gedetecteerd voor geo-spatial autoriteit.");
    }

    // 3. Telefoonnummer / NAP check (Simpele check op tel: links)
    if (!lowerHtml.includes('tel:')) {
      score -= 15;
      issues.push("Geen klikbaar telefoonnummer gevonden. Dit verlaagt je NAP (Name, Address, Phone) score aanzienlijk.");
    }

    // 4. Laadsnelheid (Mobiel lokaal zoeken)
    if (fetchTime > 1200) {
      score -= 10;
      issues.push(`Trage server response (${fetchTime}ms). Lokale mobiele zoekers verlaten trage websites direct.`);
    }

    return NextResponse.json({
      trustScore: Math.max(12, score),
      criticalIssues: issues.length > 0 ? issues : ["Geen kritieke fouten. Je lokale basis staat goed!"],
    });
  } catch (e: unknown) {
    console.error("GEO scan error:", e);
    return NextResponse.json({ error: "GEO scan failed" }, { status: 500 });
  }
}