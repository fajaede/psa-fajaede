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

    // 1. Meta Description Check
    if (!lowerHtml.includes('name="description"')) {
      score -= 20;
      issues.push("Geen meta description tag gevonden");
    }

    // 2. H1 Check
    if (!lowerHtml.includes('<h1')) {
      score -= 15;
      issues.push("Geen H1 (hoofdkop) gevonden op de pagina");
    }

    // 3. Schema.org / Structured Data (De specialiteit van Fajaede AI!)
    if (!lowerHtml.includes('application/ld+json') && !lowerHtml.includes('itemtype')) {
      score -= 25;
      issues.push("Geen AI Dynamic Schema Markup of Structured Data gedetecteerd");
    }

    // 4. Content Lengte (Simpele schatting)
    if (html.length < 5000) {
      score -= 15;
      issues.push("Zeer weinig tekst/content op de homepage (Thin Content)");
    }

    // 5. Laadsnelheid (Server Response Time)
    if (fetchTime > 1200) {
      score -= 15;
      issues.push(`Trage responstijd gedetecteerd (${fetchTime}ms). Trage websites verliezen posities in Google (Core Web Vitals).`);
    }

    // 6. Afbeeldingen Alt-tags Check
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    const missingAlt = imgTags.filter(img => !img.toLowerCase().includes('alt='));
    if (missingAlt.length > 0) {
      score -= 10;
      issues.push(`${missingAlt.length} afbeelding(en) gevonden zonder verplichte 'alt' beschrijving voor zoekmachines.`);
    }

    return NextResponse.json({
      trustScore: Math.max(12, score), // Zorg dat de score nooit onder de 12 zakt
      criticalIssues: issues.length > 0 ? issues : ["Geen kritieke fouten. Je SEO basis staat goed!"],
    });
  } catch (e: unknown) {
    console.error("SEO scan error:", e);
    return NextResponse.json({ error: "SEO scan failed" }, { status: 500 });
  }
}
