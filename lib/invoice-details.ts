import { VatQuoteError } from "@/lib/vat";

export type BusinessInvoiceDetails = { companyName: string; companyAddress: string };

/** Company name and address are required for business (B2B) customers, for the invoice. */
export function parseBusinessInvoiceDetails(
  customerType: unknown,
  companyName: unknown,
  companyAddress: unknown,
): BusinessInvoiceDetails | Record<string, never> {
  if (customerType !== "business") return {};
  const name = typeof companyName === "string" ? companyName.trim() : "";
  const address = typeof companyAddress === "string" ? companyAddress.trim() : "";
  if (name.length < 2 || name.length > 200) {
    throw new VatQuoteError("Vul de bedrijfsnaam in.", 400);
  }
  if (address.length < 5 || address.length > 500) {
    throw new VatQuoteError("Vul het factuuradres van het bedrijf in.", 400);
  }
  return { companyName: name, companyAddress: address };
}
