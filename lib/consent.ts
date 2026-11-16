import { VatQuoteError } from "@/lib/vat";

/** Version (date) of /voorwaarden and /privacy the customer agrees to at checkout. */
export const TERMS_VERSION = "2026-11-16";

/**
 * Checkout consent: terms + privacy accepted, and an explicit request for immediate
 * delivery with acknowledgement that the right of withdrawal is lost
 * (Belgian Code of Economic Law, art. VI.53, 13°). Stored with the order as proof.
 */
export function requireCheckoutConsent(acceptTerms: unknown) {
  if (acceptTerms !== true) {
    throw new VatQuoteError(
      "Ga akkoord met de algemene voorwaarden en de directe levering om verder te gaan.",
      400,
    );
  }
  return { consent: { termsVersion: TERMS_VERSION, acceptedAt: new Date().toISOString(), immediateDeliveryWithdrawalWaiver: true } };
}
