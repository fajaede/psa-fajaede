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

async function validateVatNumber(countryCode: string, input: string) {
  const viesCountryCode = countryCode === "GR" ? "EL" : countryCode;
  const normalized = input.toUpperCase().replace(/[\s.-]/g, "");
  const number = normalized.startsWith(viesCountryCode)
    ? normalized.slice(viesCountryCode.length)
    : normalized.startsWith(countryCode)
      ? normalized.slice(countryCode.length)
      : normalized;
  if (!number || number.length > 20) {
    throw new VatQuoteError("Vul een geldig btw-nummer in.", 422);
  }

  let response: Response;
  try {
    response = await fetch("https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode: viesCountryCode, vatNumber: number }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new VatQuoteError("VIES is tijdelijk niet bereikbaar. Probeer het later opnieuw.", 503);
  }

  if (!response.ok) {
    throw new VatQuoteError("VIES is tijdelijk niet bereikbaar. Probeer het later opnieuw.", 503);
  }

  const result = await response.json();
  const valid = typeof result.valid === "boolean" ? result.valid : result.isValid;
  if (typeof valid !== "boolean") {
    throw new VatQuoteError("VIES kon het btw-nummer nu niet bevestigen. Probeer het later opnieuw.", 503);
  }
  if (!valid) {
    throw new VatQuoteError("Dit btw-nummer is niet geldig volgens VIES.", 422);
  }

  return {
    vatNumber: `${viesCountryCode}${number}`,
    vatNumberValid: true,
    vatCheckedAt: typeof result.requestDate === "string" ? result.requestDate : new Date().toISOString(),
    vatRequestId: typeof result.requestIdentifier === "string" ? result.requestIdentifier : null,
  };
}

export async function calculateVatInclusiveQuote(input: {
  product: string;
  countryCode: string;
  ipCountryCode?: string | null;
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
  const isEuCountry = Object.hasOwn(EU_VAT_RATES_BPS, countryCode);
  const detectedIpCountry = input.ipCountryCode?.trim().toUpperCase() ?? "";
  const ipCountryCode = countries.isValid(detectedIpCountry) && detectedIpCountry.length === 2
    ? detectedIpCountry
    : null;

  let vatNumber: string | null = null;
  let vatNumberValid: boolean | null = null;
  let vatCheckedAt: string | null = null;
  let vatRequestId: string | null = null;

  if (input.customerType === "business" && isEuCountry) {
    if (!input.vatNumber?.trim()) {
      throw new VatQuoteError("Een EU-btw-nummer is verplicht voor zakelijke EU-bestellingen.", 422);
    }
    const validation = await validateVatNumber(countryCode, input.vatNumber);
    vatNumber = validation.vatNumber;
    vatNumberValid = validation.vatNumberValid;
    vatCheckedAt = validation.vatCheckedAt;
    vatRequestId = validation.vatRequestId;
  }

  // Small-enterprise VAT exemption (lib/vat-exemption.ts): no VAT for anyone. The country, the business
  // details and the VIES-checked VAT number are still collected for the invoice and the Peppol route.
  const vatRateBasisPoints = 0;
  const vatAmountCents = 0;

  return {
    countryCode,
    ipCountryCode,
    customerType: input.customerType,
    vatNumber,
    vatNumberValid,
    vatCheckedAt,
    vatRequestId,
    calculatedAt: new Date().toISOString(),
    vatRateBasisPoints,
    netAmountCents: grossAmountCents - vatAmountCents,
    vatAmountCents,
    grossAmountCents,
    treatment: "exempt",
  };
}