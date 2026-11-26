// Site audit at api.fajaede.eu (/api/site-audit, same key as the benchmark).
// Paid re-scans get a crawl of up to 50 (Re-scan) or 100 (Re-scan + adviezen) pages.
// The Site-audit on its own crawls 50 pages for free and shows the first 10 until it is paid.
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { appBaseUrl } from "@/lib/login-mail";
import { sendMail } from "@/lib/mailer";
import { checkRateLimit, validatePublicScanUrl } from "@/lib/scan-guard";
import { FREE_VISIBLE_PAGES, isFreeAudit, maxReruns, RERUN_DAYS, rerunsLeft } from "./site-audit-rules";

export type AuditIssue = {
  code: string;
  severity: "kritiek" | "belangrijk" | "tip";
  title: string;
  explanation: string;
  count: number;
  urls: string[];
};

export type AuditPage = {
  url: string;
  status: number | null;
  title: string | null;
  word_count: number | null;
  seo_score: number | null;
  response_ms: number | null;
  issues: string[];
};

export type AuditResult = {
  url: string;
  score: number | null;
  summary: {
    pages_crawled: number;
    pages_ok: number;
    average_response_ms: number | null;
    issues: Record<"kritiek" | "belangrijk" | "tip", number>;
  };
  issues: AuditIssue[];
  pages: AuditPage[];
};

export type SiteAudit = {
  id: string;
  url: string;
  max_pages: number;
  status: "queued" | "running" | "done" | "failed";
  requested_at: string;
  finished_at: string | null;
  error: string | null;
  result: AuditResult | null;
};

export const AUDIT_PAGES: Record<string, number> = { RE_SCAN: 250, RE_SCAN_ADV: 500, SITE_AUDIT: 50 };
export {
  FREE_VISIBLE_PAGES, isFreeAudit, lockAuditResult, maxReruns, orderPaymentUpdate, RERUN_DAYS, rerunsLeft,
  type LockedAuditIssue, type LockedAuditResult,
} from "./site-audit-rules";

function endpoint(path: string): URL {
  return new URL(path, process.env.BENCHMARK_API_URL?.trim() || "https://api.fajaede.eu");
}

function headers(): Record<string, string> | null {
  const key = process.env.BENCHMARK_API_KEY?.trim();
  return key ? { "X-Benchmark-Key": key, "Content-Type": "application/json", Accept: "application/json" } : null;
}

/** Start an audit; returns its id, or null when the audit service is unavailable. */
export async function startSiteAudit(url: string, maxPages: number): Promise<string | null> {
  const h = headers();
  if (!h) return null;
  try {
    const response = await fetch(endpoint("/api/site-audit"), {
      method: "POST",
      headers: h,
      body: JSON.stringify({ url, max_pages: maxPages }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`site audit start returned ${response.status}`);
    const data = (await response.json()) as { id?: unknown };
    return typeof data.id === "string" ? data.id : null;
  } catch (error) {
    console.warn("Site audit could not be started:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getSiteAudit(id: string): Promise<SiteAudit | null> {
  const h = headers();
  if (!h) return null;
  try {
    const response = await fetch(endpoint(`/api/site-audit/${encodeURIComponent(id)}`), {
      headers: h,
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as SiteAudit;
  } catch {
    return null;
  }
}

/**
 * Make sure a paid re-scan order has an audit: creates the secret page token once and starts
 * the audit when it is not running yet. Safe to call repeatedly (Mollie retries, page visits).
 * Returns the token of the results page (/audit/<token>), or null for orders without a URL.
 */
export async function ensureOrderAudit(orderId: string): Promise<string | null> {
  const order = await prisma.premiumOrder.findUnique({ where: { id: orderId } });
  if (!order || !order.scanUrl || !(order.status === "paid" || isFreeAudit(order))) return null;
  let token = order.auditToken;
  if (!token) {
    token = randomBytes(16).toString("hex");
    const updated = await prisma.premiumOrder.updateMany({ where: { id: orderId, auditToken: null }, data: { auditToken: token } });
    if (updated.count === 0) token = (await prisma.premiumOrder.findUnique({ where: { id: orderId } }))?.auditToken ?? token;
  }
  if (!order.siteAuditId) {
    const auditId = await startSiteAudit(order.scanUrl, AUDIT_PAGES[order.tier] ?? 50);
    if (auditId) await prisma.premiumOrder.update({ where: { id: orderId }, data: { siteAuditId: auditId } });
  }
  return token;
}

export function auditPageUrl(token: string): string {
  return `${appBaseUrl()}/audit/${token}`;
}


export type RerunResult = { ok: true } | { ok: false; reason: string };

/** Start a fresh audit for the order behind `token` (after the customer fixed issues). */
export async function rerunOrderAudit(token: string): Promise<RerunResult> {
  const order = await prisma.premiumOrder.findUnique({ where: { auditToken: token } });
  if (!order || order.status !== "paid" || !order.scanUrl) return { ok: false, reason: "Audit niet gevonden." };
  if (rerunsLeft(order) === 0) {
    const max = maxReruns(order.tier);
    return { ok: false, reason: `Opnieuw controleren kan ${max} keer binnen ${RERUN_DAYS} dagen na aankoop; dat is op.` };
  }
  if (order.siteAuditId) {
    const current = await getSiteAudit(order.siteAuditId);
    if (current && (current.status === "queued" || current.status === "running")) {
      return { ok: false, reason: "De audit loopt nog; wacht tot hij klaar is." };
    }
  }
  // Claim the re-run first (atomic), so a double click counts once and never exceeds the limit.
  const claimed = await prisma.premiumOrder.updateMany({
    where: { id: order.id, auditReruns: order.auditReruns },
    data: { auditReruns: { increment: 1 } },
  });
  if (claimed.count === 0) return { ok: false, reason: "Er loopt al een nieuwe controle." };
  const auditId = await startSiteAudit(order.scanUrl, AUDIT_PAGES[order.tier] ?? 50);
  if (!auditId) {
    await prisma.premiumOrder.update({ where: { id: order.id }, data: { auditReruns: { decrement: 1 } } });
    return { ok: false, reason: "De controle kon nu niet worden gestart. Probeer het over een paar minuten opnieuw." };
  }
  await prisma.premiumOrder.update({ where: { id: order.id }, data: { siteAuditId: auditId } });
  return { ok: true };
}

// ---------------------------------------------------------------- free Site-audit



/** Same form as a paid order's scanUrl (lower case, no trailing slash). */
export function auditSiteUrl(input: string): string {
  const raw = input.trim();
  const withScheme = raw && !/^https?:\/\//i.test(raw) ? `https://${raw}` : raw;
  return withScheme.toLowerCase().replace(/\/$/, "");
}

const FREE_REUSE_DAYS = 7;          // same site within a week: the existing crawl is reused
const FREE_PER_EMAIL_PER_DAY = 3;
const FREE_PER_IP_PER_DAY = 10;

export type FreeAuditResult = { ok: true; token: string } | { ok: false; status: number; error: string };

/**
 * Start (or reuse) a free Site-audit for `url`, mail the private link to `email`.
 * The same e-mail address asking for the same site within a week gets its existing report back;
 * someone else gets their own report on the same crawl, so the site is not crawled twice.
 */
export async function startFreeAudit(url: string, email: string, ip: string, consent: object): Promise<FreeAuditResult> {
  const siteUrl = auditSiteUrl(url);
  const mail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return { ok: false, status: 400, error: "Vul een geldig e-mailadres in." };
  if (!siteUrl || await validatePublicScanUrl(siteUrl)) {
    return { ok: false, status: 400, error: "Vul een geldige, openbare website in (bijvoorbeeld https://jouwsite.nl)." };
  }

  const since = new Date(Date.now() - FREE_REUSE_DAYS * 86_400_000);
  const recent = await prisma.premiumOrder.findMany({
    where: { tier: "SITE_AUDIT", scanUrl: siteUrl, createdAt: { gte: since }, siteAuditId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const own = recent.find((order) => order.email.toLowerCase() === mail && order.auditToken);
  if (own?.auditToken) return { ok: true, token: own.auditToken };

  if (await checkRateLimit("free-audit-email", mail, FREE_PER_EMAIL_PER_DAY, 86_400)) {
    return { ok: false, status: 429, error: `Je kunt ${FREE_PER_EMAIL_PER_DAY} gratis audits per dag aanvragen. Probeer het morgen opnieuw.` };
  }
  if (await checkRateLimit("free-audit-ip", ip, FREE_PER_IP_PER_DAY, 86_400)) {
    return { ok: false, status: 429, error: "Te veel gratis audits vanaf dit netwerk vandaag. Probeer het morgen opnieuw." };
  }

  // Reuse a recent crawl of the same site when it did not fail.
  let siteAuditId: string | null = null;
  for (const order of recent) {
    const audit = order.siteAuditId ? await getSiteAudit(order.siteAuditId) : null;
    if (audit && audit.status !== "failed") {
      siteAuditId = audit.id;
      break;
    }
  }

  const order = await prisma.premiumOrder.create({
    data: {
      email: mail,
      tier: "SITE_AUDIT",
      paymentId: "free",
      priceCents: 0,
      status: "free",
      scanUrl: siteUrl,
      scanMode: null,
      siteAuditId,
      taxDetails: consent as object,
    },
  });
  const token = await ensureOrderAudit(order.id);
  if (!token) return { ok: false, status: 503, error: "De audit kon nu niet worden gestart. Probeer het over een paar minuten opnieuw." };

  try {
    await sendMail({
      to: mail,
      subject: `Je gratis site-audit van ${siteUrl.replace(/^https?:\/\//, "")}`,
      text: [
        "Hallo,",
        "",
        `We controleren nu tot ${AUDIT_PAGES.SITE_AUDIT} pagina's van ${siteUrl}. Over een paar minuten staat je rapport klaar:`,
        auditPageUrl(token),
        "",
        `Gratis zie je alle gevonden problemen en de details van de eerste ${FREE_VISIBLE_PAGES} pagina's.`,
        "Met de volledige site-audit zie je per pagina wat er mis is, krijg je een CSV-export en kun je na het verbeteren 1 keer gratis opnieuw laten controleren.",
        "",
        "Groet,",
        "fajaede",
      ].join("\n"),
    });
  } catch (error) {
    console.warn("Free audit mail could not be sent:", error instanceof Error ? error.message : error);
  }
  return { ok: true, token };
}
