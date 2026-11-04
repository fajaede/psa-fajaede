export const EU_VAT_RATES_BPS: Record<string, number> = {
  AT: 2000,
  BE: 2100,
  BG: 2000,
  HR: 2500,
  CY: 1900,
  CZ: 2100,
  DK: 2500,
  EE: 2400,
  FI: 2550,
  FR: 2000,
  DE: 1900,
  GR: 2400,
  HU: 2700,
  IE: 2300,
  IT: 2200,
  LV: 2100,
  LT: 2100,
  LU: 1700,
  MT: 1800,
  NL: 2100,
  PL: 2300,
  PT: 2300,
  RO: 2100,
  SK: 2300,
  SI: 2200,
  ES: 2100,
  SE: 2500,
};

export type CustomerType = "consumer" | "business";
export type VatTreatment = "domestic-vat" | "oss-b2c" | "reverse-charge" | "outside-eu";

export interface VatDetails {
  countryCode: string;
  ipCountryCode: string | null;
  customerType: CustomerType;
  vatNumber: string | null;
  vatNumberValid: boolean | null;
  vatCheckedAt: string | null;
  vatRequestId: string | null;
  calculatedAt: string;
  vatRateBasisPoints: number;
  netAmountCents: number;
  vatAmountCents: number;
  grossAmountCents: number;
  treatment: VatTreatment;
}