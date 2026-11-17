// Weekly accounting report for psa.fajaede.nl (PSA licenses + SEO/GEO premium re-scans).
//
// Same CSV columns as the weekly report of fajaede.eu and the FajaedeSEO WordPress plugin,
// so the accountant receives every sales channel in one format. From Thursday on (Brussels
// time) a CSV with all paid live payments since the previous report is emailed to
// ACCOUNTANT_EMAIL. Mollie test-mode payments are never included.
import { zipSync } from "fflate";
import { sendMail } from "@/lib/mailer";
import { invoiceFilename, renderInvoicePdf } from "@/lib/invoice-pdf";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { VatDetails } from "@/lib/vat-rates";

const TIME_ZONE = "Europe/Brussels";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const HEADER = [
  "Factuurnummer", "Transactie ID", "Plan", "Land Code", "Land", "Klant Type",
  "EU-consument buiten BE (OSS-drempel)", "Bedrag Excl BTW", "BTW %", "BTW Bedrag", "Totaal",
  "Valuta", "Datum", "Soort", "Klant", "Adres klant", "Btw-nummer klant", "Btw verlegd",
];

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** Text cell safe against spreadsheet formula injection. */
function cell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function money(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function rateLabel(basisPoints: number): string {
  return `${(basisPoints / 100).toLocaleString("nl-NL", { maximumFractionDigits: 2 })}%`;
}

function localParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23",
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  return parts as Record<"year" | "month" | "day" | "hour" | "minute" | "weekday", string>;
}

function formatLocal(date: Date): string {
  const p = localParts(date);
  return `${p.day}-${p.month}-${p.year} ${p.hour}:${p.minute}`;
}

function formatLocalDate(date: Date): string {
  return formatLocal(date).slice(0, 10);
}

type StoredTaxDetails = Partial<VatDetails> & { companyName?: string; companyAddress?: string };

function asVatDetails(value: Prisma.JsonValue | null): StoredTaxDetails | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as StoredTaxDetails) : null;
}

type SaleRow = {
  paymentId: string;
  product: string;
  email: string | null;
  amountCents: number;
  taxDetails: Prisma.JsonValue | null;
  paidAt: Date;
};

function toRow(sale: SaleRow, invoiceNumber = ""): string[] {
  const tax = asVatDetails(sale.taxDetails);
  const hasTax = Boolean(tax && typeof tax.grossAmountCents === "number");
  // Fallback without a stored VAT quote: Belgian 21% included in the paid amount.
  const gross = hasTax ? tax!.grossAmountCents! : sale.amountCents;
  const vat = hasTax ? tax!.vatAmountCents ?? 0 : Math.round(gross - gross / 1.21);
  const net = hasTax ? tax!.netAmountCents ?? gross - vat : gross - vat;
  const basisPoints = hasTax ? tax!.vatRateBasisPoints ?? 0 : 2100;
  const countryCode = tax?.countryCode ?? "";
  const isBusiness = tax?.customerType === "business";
  const reverseCharge = tax?.treatment === "reverse-charge";
  const ossColumn = isBusiness ? "Nee" : !countryCode ? "Onbekend" : tax?.treatment === "oss-b2c" ? "Ja" : "Nee";

  return [
    cell(invoiceNumber), // PSA-YYYY-NNNN (website invoice) or PEPPOL-NNNN (invoice via Peppol)
    cell(sale.paymentId),
    cell(sale.product),
    countryCode,
    countryCode ? regionNames.of(countryCode) ?? countryCode : "Onbekend (Belgische btw)",
    isBusiness ? "onderneming" : "particulier",
    ossColumn,
    money(net),
    rateLabel(reverseCharge ? 0 : basisPoints),
    money(reverseCharge ? 0 : vat),
    money(gross),
    "EUR",
    formatLocal(sale.paidAt),
    "Aankoop",
    cell(isBusiness && tax?.companyName ? tax.companyName : sale.email ?? ""),
    cell((tax?.companyAddress ?? "").replace(/\s*\r?\n\s*/g, ", ")),
    cell(tax?.vatNumber ?? ""),
    reverseCharge ? "Ja" : "Nee",
  ];
}

/** All paid live sales with paidAt in [since, until), oldest first. */
export async function collectRows(since: Date, until: Date): Promise<string[][]> {
  const sales = await prisma.sale.findMany({
    where: { mode: "live", paidAt: { gte: since, lt: until } },
    orderBy: { paidAt: "asc" },
  });
  const invoices = await prisma.invoice.findMany({
    where: { paymentId: { in: sales.map((s) => s.paymentId) } },
    select: { paymentId: true, number: true },
  });
  const numbers = new Map(invoices.map((i) => [i.paymentId, i.number]));
  return sales.map((sale) => toRow(sale, numbers.get(sale.paymentId) ?? ""));
}

/** ZIP with the PDF of every live website invoice (PSA-...) issued in [since, until). */
export async function invoicesZip(since: Date, until: Date): Promise<{ filename: string; content: Buffer; count: number } | null> {
  const invoices = await prisma.invoice.findMany({
    where: { mode: "live", number: { startsWith: "PSA-" }, createdAt: { gte: since, lt: until } },
    orderBy: [{ year: "asc" }, { seq: "asc" }],
  });
  if (invoices.length === 0) return null;
  const files: Record<string, Uint8Array> = {};
  for (const invoice of invoices) {
    files[invoiceFilename(invoice)] = await renderInvoicePdf(invoice);
  }
  const p = localParts(until);
  return { filename: `psa-fajaede-facturen-${p.year}-${p.month}-${p.day}.zip`, content: Buffer.from(zipSync(files)), count: invoices.length };
}

export function buildCsv(rows: string[][]): string {
  const escape = (value: string) => (/[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const lines = [HEADER, ...rows].map((row) => row.map(escape).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`; // BOM so Excel opens it as UTF-8
}

const EMAIL_RE = /^[^@\s<>"',;]+@[^@\s<>"',;]+\.[^@\s<>"',;]+$/;

/**
 * ACCOUNTANT_EMAIL may hold several addresses separated by commas or semicolons
 * (e.g. accountant + owner). Accepts a@b.c, <a@b.c> and "Name <a@b.c>" forms.
 */
export function accountantRecipients(): string[] {
  return parseEmailList(
    process.env.ACCOUNTANT_EMAIL?.trim() ||
    process.env.INVOICE_NOTIFY_EMAIL?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    "",
  );
}

/** Addresses separated by commas or semicolons; a@b.c, <a@b.c> and "Name <a@b.c>" forms. */
export function parseEmailList(raw: string): string[] {
  const out: string[] = [];
  for (const part of raw.split(/[,;]/)) {
    const bracketed = part.match(/<([^<>]+)>/);
    const address = (bracketed ? bracketed[1] : part).trim().replace(/^[<>"' ]+|[<>"' ]+$/g, "");
    if (EMAIL_RE.test(address) && !out.some((a) => a.toLowerCase() === address.toLowerCase())) out.push(address);
  }
  return out;
}

/** All report recipients as one readable string (empty when none is configured). */
export function accountantEmail(): string {
  return accountantRecipients().join(", ");
}

/** Email the report for [since, until) to every recipient (one mail each); returns the number of sales. */
export async function sendReport(since: Date, until: Date, recipients: string[] | string): Promise<number> {
  const to = Array.isArray(recipients)
    ? recipients
    : recipients.split(",").map((r) => r.trim()).filter(Boolean);
  const rows = await collectRows(since, until);
  const period = `${formatLocalDate(since)} tot ${formatLocalDate(until)}`;
  if (rows.length === 0) {
    for (const recipient of to) {
      await sendMail({
        to: recipient,
        subject: `psa.fajaede.nl - Weekly Sales Report (No sales this week) (${period})`,
        text: `Geen verkopen op psa.fajaede.nl (PSA-licenties en SEO/GEO re-scans) van ${period}.\n`,
      });
    }
    return 0;
  }

  const p = localParts(until);
  const zip = await invoicesZip(since, until);
  const attachments = [
    { filename: `psa-fajaede-verkopen-${p.year}-${p.month}-${p.day}.csv`, content: buildCsv(rows), contentType: "text/csv; charset=utf-8" },
    ...(zip ? [{ filename: zip.filename, content: zip.content, contentType: "application/zip" }] : []),
  ];
  const text =
    `In de bijlage de verkopen van psa.fajaede.nl (PSA-licenties en SEO/GEO re-scans) van ${period}.\n\n` +
    (zip ? `Alle ${zip.count} facturen van deze periode zitten als PDF in het zip-bestand.\n\n` : "") +
    "Zelfde kolommen als het weekrapport van fajaede.eu en de FajaedeSEO-plugin.\n" +
    "- PSA-JJJJ-NNNN: factuur die de website zelf verstuurt (particulieren, buitenlandse bedrijven, buiten de EU).\n" +
    "- PEPPOL-NNNN: Belgisch bedrijf; die factuur wordt via Peppol vanuit het boekhoudprogramma verstuurd.\n" +
    "- Bij EU-bedrijven buiten België is de btw verlegd.\n" +
    "- Testbetalingen (Mollie testmodus) zijn niet opgenomen.\n";
  for (const recipient of to) {
    await sendMail({
      to: recipient,
      subject: `psa.fajaede.nl - Weekly Sales Report (${period})`,
      text,
      attachments,
    });
  }
  return rows.length;
}

/** ISO week key (e.g. 2026-W46) of the Brussels date, or null before Thursday. */
export function thursdayWeekKey(now: Date): string | null {
  const p = localParts(now);
  const weekdayIndex = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday);
  if (weekdayIndex < 3) return null;
  // ISO week: the week's Thursday decides the year.
  const local = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day));
  const thursday = new Date(local + (3 - weekdayIndex) * 86400000);
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  const week = Math.floor((thursday.getTime() - yearStart) / 86400000 / 7) + 1;
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Send the weekly report once per ISO week, from Thursday on (Brussels time).
 * Safe to call daily or concurrently: the week is claimed in the database first.
 */
export async function maybeSendWeeklyReport(now = new Date()): Promise<string> {
  const recipient = accountantRecipients();
  if (recipient.length === 0) return "no recipient";
  const weekKey = thursdayWeekKey(now);
  if (!weekKey) return "not thursday yet";

  const last = await prisma.accountingReportRun.findFirst({
    where: { status: "sent" },
    orderBy: { periodEnd: "desc" },
  });
  const since = last?.periodEnd ?? new Date(now.getTime() - WEEK_MS); // no gaps between reports

  let runId: string;
  try {
    const run = await prisma.accountingReportRun.create({
      data: { weekKey, periodStart: since, periodEnd: now, status: "sending" },
    });
    runId = run.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return "already sent";
    }
    throw error;
  }

  try {
    const sales = await sendReport(since, now, recipient);
    await prisma.accountingReportRun.update({ where: { id: runId }, data: { status: "sent", sales } });
    return `sent (${sales} sales)`;
  } catch (error) {
    console.error("Weekly accounting report failed; will retry", error);
    await prisma.accountingReportRun.delete({ where: { id: runId } });
    return "failed";
  }
}
