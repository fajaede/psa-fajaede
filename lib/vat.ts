import * as countries from "i18n-iso-countries";
import { EU_VAT_RATES_BPS, type CustomerType, type VatDetails } from "./vat-rates";
export { EU_VAT_RATES_BPS } from "./vat-rates";
export type { CustomerType, VatDetails, VatTreatment } from "./vat-rates";

export class VatQuoteError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "VatQuoteError";
    this.status = status;
  }
}

export function getGrossPriceCents(product: string): number {
  let amount: number;
  switch (product) {
    case "PSA_LICENSE":
      amount = 9;
      break;
    case "RE_SCAN":
      amount = Number(process.env.PREMIUM_PRICE_RESCAN ?? "149");
      break;
    case "RE_SCAN_ADV":
      amount = Number(process.env.PREMIUM_PRICE_RESCAN_ADV ?? "249");
      break;
    default:
      throw new VatQuoteError("Unknown product", 400);
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new VatQuoteError("Product price is not configured correctly", 500);
  }
  return Math.round(amount * 100);
}

/** Tidy a VAT number for the invoice (no VIES check: under the small-enterprise exemption it has no tax
 * effect). Belgian numbers must look like BE0123456789 / BE1234567890, because the invoice goes via Peppol. */
export function normalizeVatNumber(countryCode: string, input: string): string {
  const prefix = countryCode === "GR" ? "EL" : countryCode;
  const compact = input.toUpperCase().replace(/[\s.-]/g, "");
  const number = compact.startsWith(prefix) ? compact.slice(prefix.length)
    : compact.startsWith(countryCode) ? compact.slice(countryCode.length) : compact;
  if (countryCode === "BE" && !/^[01]\d{9}$/.test(number)) {
    throw new VatQuoteError("Vul een geldig Belgisch btw-nummer in, bijvoorbeeld BE0123456789.", 422);
  }
  if (!/^[0-9A-Z]{2,20}$/.test(number)) {
    throw new VatQuoteError("Vul een geldig btw-nummer in.", 422);
  }
  return `${prefix}${number}`;
}

export async function calculateVatInclusiveQuote(input: {
  product: string;
  countryCode: string;
  customerType: CustomerType;
  vatNumber?: string;
}): Promise<VatDetails> {
  if (typeof input.countryCode !== "string") {
    throw new VatQuoteError("Selecteer een geldig land.", 400);
  }
  const countryCode = input.countryCode.trim().toUpperCase();
  if (!countries.isValid(countryCode) || countryCode.length !== 2) {
    throw new VatQuoteError("Selecteer een geldig land.", 400);
  }
  if (input.customerType !== "consumer" && input.customerType !== "business") {
    throw new VatQuoteError("Selecteer particulier of zakelijk.", 400);
  }

  const grossAmountCents = getGrossPriceCents(input.product);
  // Business details are only for the invoice. A Belgian business needs its VAT number (Peppol);
  // for other businesses it is optional. No VIES check and no IP location: no VAT depends on them.
  let vatNumber: string | null = null;
  if (input.customerType === "business") {
    const given = input.vatNumber?.trim() ?? "";
    if (countryCode === "BE" && !given) {
      throw new VatQuoteError("Vul het btw-nummer van je bedrijf in (nodig voor de factuur via Peppol).", 422);
    }
    if (given) vatNumber = normalizeVatNumber(countryCode, given);
  }

  // Small-enterprise VAT exemption (lib/vat-exemption.ts): no VAT for anyone. The country, the business
  // details are still collected for the invoice and the Peppol route.
  const vatRateBasisPoints = 0;
  const vatAmountCents = 0;

  return {
    countryCode,
    ipCountryCode: null,     // no longer collected (only needed for VAT per country before the exemption)
    customerType: input.customerType,
    vatNumber,
    vatNumberValid: null,    // no VIES check any more
    vatCheckedAt: null,
    vatRequestId: null,
    calculatedAt: new Date().toISOString(),
    vatRateBasisPoints,
    netAmountCents: grossAmountCents - vatAmountCents,
    vatAmountCents,
    grossAmountCents,
    treatment: "exempt",
  };
}