// Invoices for psa.fajaede.nl: one per paid Mollie payment, in gapless series.
//   PSA-YYYY-NNNN  invoices sent by the website (consumers, foreign businesses, non-EU)
//   PEPPOL-NNNN    Belgian businesses: the legal invoice is sent via Peppol from the
//                  accounting software (Octopus), so no PSA number is used for them
//   TEST-NNNN      Mollie test-mode payments (never in the books)
import { Prisma } from "@prisma/client";
import type { Invoice } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { VatDetails } from "@/lib/vat-rates";

export const TEST_YEAR = 0;
export const PEPPOL_YEAR = 1;
const NUMBERING_LOCK = 4_242_001; // pg_advisory_xact_lock key: serialises number assignment

type StoredTaxDetails = Partial<VatDetails> & { companyName?: string; companyAddress?: string };

export type IssueInvoiceInput = {
  paymentId: string;
  mode: string; // "live" | "test"
  description: string;
  email: string | null;
  taxDetails: Prisma.JsonValue | null;
  paidAmountCents: number;
};

function asTax(value: Prisma.JsonValue | null): StoredTaxDetails | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as StoredTaxDetails) : null;
}

function brusselsYear(date: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", year: "numeric" }).format(date));
}

/** Belgian business customer: the invoice goes via Peppol. Decided by the customer, not the
 * number, so Mollie test payments (TEST-NNNN) follow the same route as live ones. */
export function isPeppolInvoice(invoice: Pick<Invoice, "number" | "customerType" | "countryCode">): boolean {
  return invoice.number.startsWith("PEPPOL-")
    || (invoice.customerType === "onderneming" && invoice.countryCode === "BE");
}

/** Invoice fields from the stored quote. Every invoice issued now falls under the small-enterprise VAT
 * exemption (lib/vat-exemption.ts): no VAT, also for orders quoted with VAT before the exemption. */
export function invoiceFields(input: IssueInvoiceInput) {
  const tax = asTax(input.taxDetails);
  const hasQuote = Boolean(tax && typeof tax.grossAmountCents === "number");
  const gross = hasQuote ? tax!.grossAmountCents! : input.paidAmountCents;
  const isBusiness = tax?.customerType === "business";
  const countryCode = tax?.countryCode ?? null;
  return {
    isBusiness,
    peppol: isBusiness && countryCode === "BE",
    customerType: isBusiness ? "onderneming" : "particulier",
    customerName: isBusiness && tax?.companyName ? tax.companyName : input.email,
    customerAddress: isBusiness ? (tax?.companyAddress ?? "").replace(/\s*\r?\n\s*/g, ", ") || null : null,
    customerVat: isBusiness ? tax?.vatNumber ?? null : null,
    countryCode,
    grossCents: gross,
    vatCents: 0,
    netCents: gross,
    vatRateBasisPoints: 0,
    reverseCharge: false,
    treatment: "exempt",
  };
}

/**
 * Create the invoice for a paid payment exactly once. Returns created=false when it
 * already existed (Mollie may call the webhook more than once).
 */
export async function issueInvoice(input: IssueInvoiceInput): Promise<{ invoice: Invoice; created: boolean }> {
  const existing = await prisma.invoice.findUnique({ where: { paymentId: input.paymentId } });
  if (existing) return { invoice: existing, created: false };

  const fields = invoiceFields(input);
  const isTest = input.mode !== "live";
  const year = isTest ? TEST_YEAR : fields.peppol ? PEPPOL_YEAR : brusselsYear(new Date());

  try {
    return await prisma.$transaction(async (tx) => {
      // One writer at a time: the next number is always max + 1, so no gaps and no duplicates.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${NUMBERING_LOCK})`;
      const again = await tx.invoice.findUnique({ where: { paymentId: input.paymentId } });
      if (again) return { invoice: again, created: false };
      const last = await tx.invoice.aggregate({ where: { year }, _max: { seq: true } });
      const seq = (last._max.seq ?? 0) + 1;
      const pad = String(seq).padStart(4, "0");
      const number = isTest ? `TEST-${pad}` : fields.peppol ? `PEPPOL-${pad}` : `PSA-${year}-${pad}`;
      const invoice = await tx.invoice.create({
        data: {
          paymentId: input.paymentId,
          number,
          year,
          seq,
          mode: isTest ? "test" : "live",
          description: input.description.slice(0, 300),
          customerType: fields.customerType,
          customerName: fields.customerName,
          customerEmail: input.email,
          customerAddress: fields.customerAddress,
          customerVat: fields.customerVat,
          countryCode: fields.countryCode,
          netCents: fields.netCents,
          vatCents: fields.vatCents,
          grossCents: fields.grossCents,
          vatRateBasisPoints: fields.vatRateBasisPoints,
          reverseCharge: fields.reverseCharge,
          treatment: fields.treatment,
        },
      });
      return { invoice, created: true };
    });
  } catch (error) {
    // A concurrent webhook for the same payment won the race: use its invoice.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const winner = await prisma.invoice.findUnique({ where: { paymentId: input.paymentId } });
      if (winner) return { invoice: winner, created: false };
    }
    throw error;
  }
}
