// Weekly accounting report for psa.fajaede.nl (PSA licenses + SEO/GEO premium re-scans).
//
// Same CSV columns as the weekly report of fajaede.eu and the FajaedeSEO WordPress plugin,
// so the accountant receives every sales channel in one format. From Thursday on (Brussels
// time) a CSV with all paid live payments since the previous report is emailed to
// ACCOUNTANT_EMAIL. Mollie test-mode payments are never included.
import { sendMail } from "@/lib/mailer";
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

function toRow(sale: SaleRow): string[] {
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
    "", // No own invoice numbers: B2B invoices are made in the accounting software.
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
  return sales.map(toRow);
}

export function buildCsv(rows: string[][]): string {
  const escape = (value: string) => (/[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const lines = [HEADER, ...rows].map((row) => row.map(escape).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`; // BOM so Excel opens it as UTF-8
}

export function accountantEmail(): string {
  return (
    process.env.ACCOUNTANT_EMAIL?.trim() ||
    process.env.INVOICE_NOTIFY_EMAIL?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    ""
  );
}


/** Email the report for [since, until) to recipient; returns the number of sales. */
export async function sendReport(since: Date, until: Date, recipient: string): Promise<number> {
  const rows = await collectRows(since, until);
  const period = `${formatLocalDate(since)} tot ${formatLocalDate(until)}`;
  if (rows.length === 0) {
    await sendMail({
      to: recipient,
      subject: `psa.fajaede.nl - Weekly Sales Report (No sales this week) (${period})`,
      text: `Geen verkopen op psa.fajaede.nl (PSA-licenties en SEO/GEO re-scans) van ${period}.\n`,
    });
    return 0;
  }

  const p = localParts(until);
  await sendMail({
    to: recipient,
    subject: `psa.fajaede.nl - Weekly Sales Report (${period})`,
    text:
      `In de bijlage de verkopen van psa.fajaede.nl (PSA-licenties en SEO/GEO re-scans) van ${period}.\n\n` +
      "Zelfde kolommen als het weekrapport van fajaede.eu en de FajaedeSEO-plugin.\n" +
      "- Particulieren: geen factuur; de bedragen zijn inclusief btw van het land van de klant (OSS) of Belgische btw.\n" +
      "- Bedrijven: factuur wordt apart opgemaakt; btw-nummer staat in het rapport, bij EU-bedrijven buiten BE is de btw verlegd.\n" +
      "- Testbetalingen (Mollie testmodus) zijn niet opgenomen.\n",
    attachments: [
      { filename: `psa-fajaede-verkopen-${p.year}-${p.month}-${p.day}.csv`, content: buildCsv(rows), contentType: "text/csv; charset=utf-8" },
    ],
  });
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
  const recipient = accountantEmail();
  if (!recipient) return "no recipient";
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
