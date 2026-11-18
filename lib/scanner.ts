// Honest bot identities, one brand with two names (same as fajaede.eu backend/seo_geo_audit.py).
// Pretending to be Chrome from a datacenter is exactly what bot protection (Cloudflare) blocks,
// and owners cannot allow a fake browser. Named bots can be allowed with one rule; see /bot.
//
// - FajaedeScan: checks one site on request of a user (psa scans, the SEO/GEO audit).
// - FajaedeBot: crawls on its own (search index, benchmark); always follows robots.txt.
export const SCANNER_NAME = "FajaedeScan";
export const SCANNER_USER_AGENT = `Mozilla/5.0 (compatible; ${SCANNER_NAME}/1.0; +https://psa.fajaede.nl/bot)`;
export const CRAWLER_NAME = "FajaedeBot";
export const CRAWLER_USER_AGENT = `Mozilla/5.0 (compatible; ${CRAWLER_NAME}/1.0; +https://psa.fajaede.nl/bot)`;
