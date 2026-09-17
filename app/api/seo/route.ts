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
    const cachedScan = await prisma.seoScan.findUnique({
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
      signal: AbortSignal.timeout(8500), // Voorkom 502 Bad Gateway door Vercel timeout
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
    const fetchTime = Date.now() - startTime;

    if (!res.ok) {
      if (res.status === 403 || res.status === 503) {
        return NextResponse.json({ error: "Scan geblokkeerd: Deze website gebruikt een strikte firewall (zoals Cloudflare) die automatische scans weigert." }, { status: 403 });
      }
      throw new Error("Could not fetch URL");
    }

    const html = await res.text();
    const lowerHtml = html.toLowerCase();

    let score = 100;
    const issues: string[] = [];

    // 1. Title Tag Check
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (!titleMatch) {
      score -= 10;
      issues.push("Geen <title> tag gevonden. Dit is cruciaal voor SEO.");
    } else {
      const titleText = titleMatch[1].trim();
      if (titleText.length < 10) {
        score -= 5;
        issues.push("De <title> tag is erg kort (minder dan 10 karakters). Zorg voor een beschrijvende titel.");
      } else if (titleText.length > 65) {
        score -= 5;
        issues.push("De <title> tag is aan de lange kant (> 65 karakters) en kan worden afgekapt in Google.");
      }
    }

    // 2. Meta Description Check
    if (!lowerHtml.includes('name="description"')) {
      score -= 15;
      issues.push("Geen meta description tag gevonden. Voeg een wervende beschrijving toe voor hogere CTR in Google.");
    }

    // 2. H1 Check
    const h1Count = (lowerHtml.match(/<h1/g) || []).length;
    if (h1Count === 0) {
      score -= 15;
      issues.push("Geen H1 (hoofdkop) gevonden op de pagina.");
    } else if (h1Count > 1) {
      score -= 5;
      issues.push(`Meerdere H1 tags gevonden (${h1Count}). Het is een best practice om slechts één unieke H1 per pagina te gebruiken.`);
    }

    // 4. H2 Check
    if (!lowerHtml.includes('<h2')) {
      score -= 5;
      issues.push("Geen H2 (tussenkopjes) gevonden. Gebruik H2 tags om lange lappen tekst te structureren.");
    }

    // 5. Schema.org / Structured Data (De specialiteit van Fajaede AI!)
    if (!lowerHtml.includes('application/ld+json') && !lowerHtml.includes('itemtype')) {
      score -= 15;
      issues.push("Geen AI Dynamic Schema Markup of Structured Data gedetecteerd. Google begrijpt je data hierdoor minder goed.");
    }

    // 6. Content Lengte (Slimmere schatting via text-only extractie)
    const textOnly = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                         .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                         .replace(/<[^>]+>/g, '')
                         .replace(/\s+/g, ' ')
                         .trim();
                         
    if (textOnly.length < 1500) { // Ongeveer 200 tot 250 woorden afhankelijk van opmaak
      score -= 10;
      issues.push("Er is zeer weinig leesbare tekst (content) gevonden op deze pagina (Thin Content).");
    }

    // 7. Laadsnelheid (Server Response Time)
    if (fetchTime > 1200) {
      score -= 10;
      issues.push(`Trage responstijd gedetecteerd (${fetchTime}ms). Trage websites verliezen posities in Google (Core Web Vitals).`);
    }

    // 8. Afbeeldingen Alt-tags Check
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    const missingAlt = imgTags.filter(img => !img.toLowerCase().includes('alt='));
    if (missingAlt.length > 0) {
      score -= 10;
      issues.push(`${missingAlt.length} afbeelding(en) gevonden zonder verplichte 'alt' beschrijving voor zoekmachines.`);
    }

    // 9. Viewport Meta Tag (Mobielvriendelijkheid)
    if (!lowerHtml.includes('name="viewport"')) {
      score -= 10;
      issues.push("Geen viewport meta tag gevonden. De pagina is mogelijk niet geoptimaliseerd voor mobiele weergave.");
    }

    // 10. Robots Meta Tag Check
    if (lowerHtml.includes('name="robots"') && (lowerHtml.includes('content="noindex') || lowerHtml.includes('content="none"'))) {
      score -= 40; // Dit is een enorme red flag voor SEO
      issues.push("🚨 De pagina is geblokkeerd voor zoekmachines door een 'noindex' of 'none' robots meta tag!");
    }

    // 11. Canonical Tag
    if (!lowerHtml.includes('rel="canonical"')) {
      score -= 5;
      issues.push("Geen canonical link gevonden. Dit helpt zoekmachines om duplicate content problemen te voorkomen.");
    }

    // 12. Open Graph (Social Media)
    if (!lowerHtml.includes('property="og:')) {
      score -= 5;
      issues.push("Geen Open Graph (OG) meta tags gevonden. Hierdoor ziet je link er op social media (bijv. LinkedIn, WhatsApp) niet altijd mooi uit met een afbeelding.");
    }

    // 13. HTML Taal attribuut
    if (!lowerHtml.includes('<html') || (!lowerHtml.includes('lang=') && !lowerHtml.includes('xml:lang='))) {
      score -= 5;
      issues.push("De HTML tag heeft geen 'lang' (taal) attribuut. Dit helpt zoekmachines te bepalen in welke taal je content is geschreven.");
    }

    const checks = [];

    // Core Web Vitals placeholder (using fetch time as proxy)
    checks.push({ name: 'Load Time', passed: fetchTime <= 1200, score: Math.max(0, 100 - (fetchTime - 1200)), message: `Fetch time: ${fetchTime}ms` });

    // robots.txt check
    try {
      const robotsRes = await fetch(`${url.replace(/\/[^/]*$/, '')}/robots.txt`);
      if (robotsRes.ok) {
        checks.push({ name: 'robots.txt exists', passed: true, score: 100, message: 'Found robots.txt' });
      } else {
        checks.push({ name: 'robots.txt exists', passed: false, score: 0, message: 'Missing robots.txt' });
      }
    } catch (e) {
      checks.push({ name: 'robots.txt exists', passed: false, score: 0, message: 'Error checking robots.txt' });
    }

    // sitemap.xml check
    try {
      const sitemapRes = await fetch(`${url.replace(/\/[^/]*$/, '')}/sitemap.xml`);
      if (sitemapRes.ok) {
        checks.push({ name: 'sitemap.xml exists', passed: true, score: 100, message: 'Found sitemap.xml' });
      } else {
        checks.push({ name: 'sitemap.xml exists', passed: false, score: 0, message: 'Missing sitemap.xml' });
      }
    } catch (e) {
      checks.push({ name: 'sitemap.xml exists', passed: false, score: 0, message: 'Error checking sitemap.xml' });
    }

    // hreflang tag check
    const hasHreflang = lowerHtml.includes('hreflang=');
    checks.push({ name: 'hreflang tags', passed: hasHreflang, score: hasHreflang ? 100 : 0, message: hasHreflang ? 'Found hreflang tags' : 'Missing hreflang tags' });

    // duplicate content naive check (same title occurrence)
    const titleOccurrences = (html.match(/<title[^>]*>/gi) || []).length;
    checks.push({ name: 'Duplicate title tags', passed: titleOccurrences <= 1, score: titleOccurrences <= 1 ? 100 : 0, message: `${titleOccurrences} title tags found` });

    // broken links check (simple regex for href)
    const linkHrefs = html.match(/href\s*=\s*"([^\"]*)"/gi) || [];
    let brokenCount = 0;
    for (const link of linkHrefs) {
      const urlMatch = link.match(/href\s*=\s*"([^\"]*)"/i);
      if (urlMatch && urlMatch[1]) {
        const linkUrl = urlMatch[1];
        if (!linkUrl.startsWith('http')) continue; // ignore relative
        try {
          const resLink = await fetch(linkUrl, { method: 'HEAD', timeout: 3000 });
          if (!resLink.ok) brokenCount++;
        } catch (e) {
          brokenCount++;
        }
      }
    }
    checks.push({ name: 'Broken links', passed: brokenCount === 0, score: brokenCount === 0 ? 100 : Math.max(0, 100 - brokenCount * 5), message: `${brokenCount} broken links detected` });

    // keyword density placeholder (check for word "privacy")
    const keyword = 'privacy';
    const keywordCount = (lowerHtml.match(new RegExp(keyword, 'g')) || []).length;
    checks.push({ name: 'Keyword "privacy" density', passed: keywordCount >= 2, score: Math.min(100, keywordCount * 10), message: `${keywordCount} occurrences of "${keyword}"` });

    // Build response data including checks
    const responseData = {
      trustScore: Math.max(12, score),
      criticalIssues: issues.length > 0 ? issues : ["Geen kritieke fouten. Je SEO basis staat goed!"],
      checks,
    };

    // Persist with checks
    await prisma.seoScan.upsert({
      where: { url: cleanUrl },
      update: { trustScore: responseData.trustScore, criticalIssues: responseData.criticalIssues, checks: responseData.checks, createdAt: new Date() },
      create: { url: cleanUrl, trustScore: responseData.trustScore, criticalIssues: responseData.criticalIssues, checks: responseData.checks },
    });

    return NextResponse.json(responseData);
  } catch (e: unknown) {
    console.error("SEO scan error:", e);
    return NextResponse.json({ error: "SEO scan failed" }, { status: 500 });
  }
}
