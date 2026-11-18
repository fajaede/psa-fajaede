import { prisma } from "@/lib/prisma";
import { getSiteAudit } from "@/lib/site-audit-api";

// All issues and affected URLs of an audit as CSV (Excel-friendly: semicolons, UTF-8 BOM).
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const notFound = () => new Response("Niet gevonden", { status: 404 });
  if (!/^[a-f0-9]{32}$/.test(token)) return notFound();
  const order = await prisma.premiumOrder.findUnique({ where: { auditToken: token } });
  if (!order || order.status !== "paid" || !order.siteAuditId) return notFound();
  const audit = await getSiteAudit(order.siteAuditId);
  if (!audit?.result) return notFound();

  const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = [["Ernst", "Verbeterpunt", "Pagina", "Doel (bij links)", "Opgelost?"].map(cell).join(";")];
  for (const issue of audit.result.issues) {
    for (const entry of issue.urls) {
      const [page, target = ""] = entry.split(" → ");
      rows.push([issue.severity, issue.title, page, target, ""].map(cell).join(";"));
    }
  }
  const host = (order.scanUrl ?? "site").replace(/^https?:\/\//, "").replace(/[^a-z0-9.-]/gi, "_");
  return new Response("﻿" + rows.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="site-audit-${host}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
