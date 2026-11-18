// Single source for the PSA trust score (0-100), used by the badge, the report,
// the FajaedeSEO sites API and the dashboard history.
export function psaTrustScore(report: {
  securityScore?: string | null;
  privacyScore?: string | null;
  ageScore?: string | null;
}): number {
  let score = 100;
  if (report.securityScore?.includes("S1")) score -= 30;
  if (report.privacyScore?.includes("P1")) score -= 20;
  if (report.ageScore?.includes("A3")) score -= 10;
  return score;
}

/** Markers of consent tools (CMPs) in page HTML, plus the IAB TCF API that every TCF CMP
 * exposes. Lower-case. Keep in sync with COOKIE_BANNERS in fajaede.eu
 * backend/benchmark/signals.py so benchmark percentiles compare like with like. */
export const COOKIE_BANNERS = [
  "cookiebot", "complianz", "cmplz", "borlabs", "cookieyes", "cookie-law-info", "seers-cmp", "seersco",
  "cookie-notice", "onetrust", "optanon", "usercentrics", "iubenda", "didomi", "cookiefirst", "klaro",
  "real-cookie-banner", "moove_gdpr", "moove-gdpr", "termly", "cookie-script", "axeptio", "cookiehub",
  "consentmanager", "__tcfapi",
];

/** CMS products whose exact version is worth hiding (attackers match it against known CVEs). */
const CMS_GENERATOR = /^(wordpress|joomla!?|drupal|typo3|magento|prestashop|shopware|ghost|craft cms|concrete ?cms|concrete5|opencart|umbraco|contao|processwire|october ?cms|woocommerce)\b/i;

/** The first <meta name="generator"> that exposes a CMS *version* (e.g. "WordPress 6.4.2"),
 * or null. Plugin generators ("Site Kit by Google 1.192.0") and versionless names do not count.
 * Keep in sync with cms_version_leak in fajaede.eu backend/benchmark/signals.py. */
export function cmsVersionLeak(html: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/\bname\s*=\s*["']generator["']/i.test(tag)) continue;
    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1]?.trim() ?? "";
    if (CMS_GENERATOR.test(content) && /\d/.test(content)) return content;
  }
  return null;
}

/** The improvement points behind a PSA score: the scan's own (Dutch) note for each weak level. */
export function psaImprovements(report: {
  securityScore?: string | null; securityNote?: string | null;
  privacyScore?: string | null; privacyNote?: string | null;
  ageScore?: string | null; ageNote?: string | null;
}): string[] {
  const items: string[] = [];
  if (report.securityScore?.includes("S1")) items.push(report.securityNote || "Beveiliging: HTTPS of beveiligingsheaders ontbreken.");
  if (report.privacyScore?.includes("P1")) items.push(report.privacyNote || "Privacy: geen duidelijk privacybeleid of cookiebanner gevonden.");
  if (report.ageScore?.includes("A3")) items.push(report.ageNote || "Inhoud: 18+-, gok- of adultcontent gevonden.");
  return items;
}
