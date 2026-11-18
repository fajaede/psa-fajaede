// Site audit at api.fajaede.eu (/api/site-audit, same key as the benchmark).
// Paid re-scans get a crawl of up to 50 (Re-scan) or 100 (Re-scan + adviezen) pages.
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { appBaseUrl } from "@/lib/login-mail";

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

export const AUDIT_PAGES: Record<string, number> = { RE_SCAN: 50, RE_SCAN_ADV: 100 };

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
  if (!order || order.status !== "paid" || !order.scanUrl) return null;
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
