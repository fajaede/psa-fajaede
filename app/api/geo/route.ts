import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const url = body?.url as string | undefined;

    if (!url || typeof url !== "string" || !/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const cleanUrl = url.toLowerCase().replace(/\/$/, "");

    // 1. Check de Prisma Database Cache (Permanent bewaard, tot na de betaling)
    const cachedScan = await prisma.geoScan.findUnique({
      where: { url: cleanUrl }
    });

    if (cachedScan) {
      return NextResponse.json({
        trustScore: cachedScan.trustScore,
        criticalIssues: cachedScan.criticalIssues,
        fromCache: true,
        cachedAt: cachedScan.createdAt.toISOString(),
      });
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
      score -= 20;
      issues.push("Kritiek: Geen 'LocalBusiness' of 'Organization' Schema.org markup gevonden. Zoekmachines begrijpen hierdoor je bedrijfsgegevens minder goed.");
    }

    // 2. Google Maps Embed of API Link
    const mapsRegex = /(maps\.google\.com|google\.com\/maps|g\.page|maps\.app\.goo\.gl)/i;
    if (!mapsRegex.test(lowerHtml)) {
      score -= 15;
      issues.push("Geen Google Maps integratie of (korte) link gedetecteerd. Dit is belangrijk voor je lokale vindbaarheid en autoriteit.");
    }

    // 3. Telefoonnummer / NAP check (Simpele check op tel: links)
    if (!lowerHtml.includes('href="tel:')) {
      score -= 15;
      issues.push("Geen klikbaar telefoonnummer (tel: link) gevonden. Dit verlaagt je NAP (Name, Address, Phone) score en kost je mobiele conversies.");
    }

    // 4. E-mailadres / NAP check
    if (!lowerHtml.includes('href="mailto:')) {
      score -= 5;
      issues.push("Geen klikbaar e-mailadres (mailto: link) gevonden. Dit vermindert het contactgemak voor lokale klanten.");
    }

    // 5. Adres Tag Check (NAP)
    if (!lowerHtml.includes('<address')) {
      score -= 10;
      issues.push("Geen HTML <address> tag gevonden. Gebruik deze tag om je fysieke locatie semantisch aan te geven aan Google.");
    }

    // 6. Geo Meta Tags
    if (!lowerHtml.includes('name="geo.region"') && !lowerHtml.includes('name="geo.placename"')) {
      score -= 10;
      issues.push("Geen specifieke GEO meta tags (geo.region of geo.placename) gevonden. Deze tags helpen enorm bij hyper-lokale zoekopdrachten.");
    }

    // 7. Review / Rating Schema
    if (!lowerHtml.includes('aggregaterating') && !lowerHtml.includes('review')) {
      score -= 10;
      issues.push("Geen 'AggregateRating' of 'Review' schema gedetecteerd. Social proof is cruciaal voor Local SEO; zonder dit mis je de 'sterretjes' in de zoekresultaten.");
    }

    // 8. Laadsnelheid (Mobiel lokaal zoeken)
    if (fetchTime > 1200) {
      score -= 15;
      issues.push(`Trage server response (${fetchTime}ms). Lokale mobiele zoekers (on-the-go) verlaten trage websites direct.`);
    }

    const responseData = {
      trustScore: Math.max(12, score), // Zorg dat de score nooit onder de 12 zakt
      criticalIssues: issues.length > 0 ? issues : ["Geen kritieke fouten. Je lokale SEO basis staat als een huis!"],
    };

    // 3. Sla het resultaat permanent op in de database
    await prisma.geoScan.upsert({
      where: { url: cleanUrl },
      update: {
        trustScore: responseData.trustScore,
        criticalIssues: responseData.criticalIssues,
        createdAt: new Date(),
      },
      create: {
        url: cleanUrl,
        trustScore: responseData.trustScore,
        criticalIssues: responseData.criticalIssues,
      }
    });

    return NextResponse.json(responseData);
  } catch (e: unknown) {
    console.error("GEO scan error:", e);
    return NextResponse.json({ error: "GEO scan failed" }, { status: 500 });
  }
}