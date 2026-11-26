// Rules of the site audit without database or network (free view, re-runs, payment status),
// so they can be tested with plain Node.
import type { AuditIssue, AuditPage, AuditResult } from "./site-audit-api";

/** A free Site-audit shows everything about its first pages; the rest only as numbers until paid. */
export const FREE_VISIBLE_PAGES = 10;

export type LockedAuditIssue = AuditIssue & { hiddenCount: number };
export type LockedAuditResult = Omit<AuditResult, "issues" | "pages"> & {
  issues: LockedAuditIssue[];
  pages: AuditPage[];
  hiddenPages: number;
  hiddenFindings: number;
};

/**
 * The free view of a finished audit: score, totals and every issue type with its real count stay,
 * but the pages behind the counts are only named for the first FREE_VISIBLE_PAGES pages.
 * Site-wide issues (not tied to a crawled page, e.g. the sitemap) show up to 3 of their URLs.
 * Hidden URLs are left out of the data entirely, so they never reach the browser.
 */
export function lockAuditResult(result: AuditResult, visible = FREE_VISIBLE_PAGES): LockedAuditResult {
  const pages = result.pages.slice(0, visible);
  const visibleUrls = new Set(pages.map((page) => page.url));
  const crawledUrls = new Set(result.pages.map((page) => page.url));
  // Link issues list "page → target"; the page part decides whether the entry is visible.
  const pageOf = (entry: string) => entry.split(" → ")[0];
  let hiddenFindings = 0;
  const issues = result.issues.map((issue) => {
    const pageLevel = issue.urls.some((entry) => crawledUrls.has(pageOf(entry)));
    const urls = pageLevel ? issue.urls.filter((entry) => visibleUrls.has(pageOf(entry))) : issue.urls.slice(0, 3);
    const hiddenCount = Math.max(0, issue.count - urls.length);
    hiddenFindings += hiddenCount;
    return { ...issue, urls, hiddenCount };
  });
  return { ...result, issues, pages, hiddenPages: Math.max(0, result.pages.length - pages.length), hiddenFindings };
}

/** A Site-audit that has not been paid (yet): the report is partly locked. */
export function isFreeAudit(order: { tier: string; status: string }): boolean {
  return order.tier === "SITE_AUDIT" && order.status === "free";
}

/**
 * Status update from a Mollie payment. A Site-audit only changes when it is paid: an open, cancelled
 * or failed payment leaves a free audit free (its report stays readable) and a direct order pending.
 */
export function orderPaymentUpdate(order: { tier: string; paidAt: Date | null }, mollieStatus: string): { status?: string; paidAt?: Date } {
  if (mollieStatus === "paid") return { status: "paid", ...(order.paidAt ? {} : { paidAt: new Date() }) };
  return order.tier === "SITE_AUDIT" ? {} : { status: mollieStatus };
}

// After fixing issues the customer may check again: a few re-runs within a month of the purchase,
// so a one-off audit does not turn into free ongoing monitoring.
const RERUNS: Record<string, number> = { RE_SCAN: 3, RE_SCAN_ADV: 3, SITE_AUDIT: 1 };
export const RERUN_DAYS = 30;

export function maxReruns(tier: string): number {
  return RERUNS[tier] ?? 3;
}

type RerunOrder = { auditReruns: number; createdAt: Date; paidAt?: Date | null; status?: string; tier?: string };

/** Re-runs left: only for paid audits, counted from the payment (a free audit may be paid later). */
export function rerunsLeft(order: RerunOrder, now = new Date()): number {
  if (order.status !== undefined && order.status !== "paid") return 0;
  const since = order.paidAt ?? order.createdAt;
  const expired = now.getTime() - since.getTime() > RERUN_DAYS * 86_400_000;
  return expired ? 0 : Math.max(0, maxReruns(order.tier ?? "") - order.auditReruns);
}
