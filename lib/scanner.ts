// Honest identity of the psa scanner. Pretending to be Chrome from a datacenter is exactly
// what bot protection (Cloudflare) blocks, and owners cannot allow a fake browser. A named
// bot can be allowed with one firewall rule; see /bot for the instructions.
export const SCANNER_NAME = "FajaedePSA";
export const SCANNER_USER_AGENT = `Mozilla/5.0 (compatible; ${SCANNER_NAME}/1.0; +https://psa.fajaede.nl/bot)`;
// The SEO/GEO scoring runs on api.fajaede.eu (fixed server) with its own name.
export const AUDIT_BOT_NAME = "FajaedeAuditBot";
