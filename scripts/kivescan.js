#!/usr/bin/env node
const url = process.argv[2] || 'https://fajaede.nl';
(async () => {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; fajaedeAI-PSA/1.0; +https://fajaede.nl)',
      },
    });

    if (!resp.ok) {
      console.error(`Could not fetch URL (status ${resp.status}).`);
      process.exit(2);
    }

    const html = await resp.text();
    const lower = html.toLowerCase();

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No <title> found';

    const hasPrivacy =
      lower.includes('privacy') ||
      lower.includes('cookie') ||
      lower.includes('gdpr') ||
      lower.includes('avg');

    const isHttps = url.startsWith('https://');
    const isAdult =
      lower.includes('18+') ||
      lower.includes('adult') ||
      lower.includes('porn') ||
      lower.includes('xxx');

    const privacyScore = hasPrivacy ? 'P2 / 3' : 'P1 / 3';
    const privacyNote = hasPrivacy
      ? 'Basic privacy / cookie information detected.'
      : 'No clear privacy or cookie information detected.';

    const securityScore = isHttps ? 'S2 / 3' : 'S1 / 3';
    const securityNote = isHttps ? 'Site uses HTTPS.' : 'Site does not use HTTPS.';

    const ageScore = isAdult ? 'A3 / 3' : 'A1 / 3';
    const ageNote = isAdult
      ? 'Adult content keywords detected (18+).'
      : 'No obvious adult content; general audience.';

    const urlHash = Buffer.from(url).toString('base64url');
    const reportUrl = `https://psa.fajaede.nl/report/${urlHash}`;

    const out = {
      url,
      status: 'ok',
      pageTitle: title,
      privacy: { score: privacyScore, note: privacyNote },
      security: { score: securityScore, note: securityNote },
      age: { score: ageScore, note: ageNote },
      reportUrl,
      fromCache: false,
    };

    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error('PSA scan error:', e);
    process.exit(1);
  }
})();
