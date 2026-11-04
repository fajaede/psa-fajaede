"use client";

import * as countries from "i18n-iso-countries";
import nlLocale from "i18n-iso-countries/langs/nl.json";
import { useState } from "react";
import { EU_VAT_RATES_BPS, type CustomerType, type VatDetails } from "@/lib/vat-rates";

countries.registerLocale(nlLocale);

const countryOptions = Object.entries(countries.getNames("nl"))
  .filter(([code]) => code.length === 2)
  .sort((left, right) => left[1].localeCompare(right[1], "nl"));

export function VatCheckout({
  product,
  paymentEndpoint,
  paymentData,
  buttonLabel,
  disabled = false,
}: {
  product: string;
  paymentEndpoint: string;
  paymentData: Record<string, string>;
  buttonLabel: string;
  disabled?: boolean;
}) {
  const [countryCode, setCountryCode] = useState("BE");
  const [customerType, setCustomerType] = useState<CustomerType>("consumer");
  const [vatNumber, setVatNumber] = useState("");
  const [quote, setQuote] = useState<{ fingerprint: string; details: VatDetails } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fingerprint = JSON.stringify([product, countryCode, customerType, vatNumber.trim()]);
  const currentQuote = quote?.fingerprint === fingerprint ? quote.details : null;
  const euCountry = Object.hasOwn(EU_VAT_RATES_BPS, countryCode);

  const handleContinue = async () => {
    setBusy(true);
    setError("");
    try {
      if (!currentQuote) {
        const response = await fetch("/api/tax/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product, countryCode, customerType, vatNumber }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Btw-berekening mislukt.");
        setQuote({ fingerprint, details: result as VatDetails });
        return;
      }

      const response = await fetch(paymentEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...paymentData, countryCode, customerType, vatNumber }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Betaling starten is mislukt.");
      if (typeof result.checkoutUrl !== "string") throw new Error("Mollie gaf geen betaallink terug.");
      window.location.assign(result.checkoutUrl);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Er is een fout opgetreden.");
    } finally {
      setBusy(false);
    }
  };

  const money = (cents: number) => new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
  const vatRate = currentQuote ? currentQuote.vatRateBasisPoints / 100 : 0;

  return (
    <section style={styles.container}>
      <div style={styles.fields}>
        <label style={styles.label}>
          Factuurland
          <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} style={styles.input}>
            {countryOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
        <label style={styles.label}>
          Klanttype
          <select value={customerType} onChange={(event) => setCustomerType(event.target.value as CustomerType)} style={styles.input}>
            <option value="consumer">Particulier (B2C)</option>
            <option value="business">Bedrijf (B2B)</option>
          </select>
        </label>
        {customerType === "business" && euCountry && (
          <label style={styles.label}>
            EU-btw-nummer
            <input
              autoComplete="off"
              value={vatNumber}
              onChange={(event) => setVatNumber(event.target.value)}
              placeholder={countryCode === "BE" ? "BE0123456789" : `${countryCode === "GR" ? "EL" : countryCode}...`}
              style={styles.input}
            />
          </label>
        )}
      </div>

      {currentQuote && (
        <dl style={styles.breakdown} aria-live="polite">
          <div style={styles.row}><dt>Prijs exclusief btw</dt><dd>{money(currentQuote.netAmountCents)}</dd></div>
          <div style={styles.row}>
            <dt>{currentQuote.treatment === "reverse-charge" ? "Btw verlegd" : `Btw (${vatRate.toLocaleString("nl-BE")}%)`}</dt>
            <dd>{money(currentQuote.vatAmountCents)}</dd>
          </div>
          <div style={{ ...styles.row, ...styles.total }}><dt>Totaal inclusief btw</dt><dd>{money(currentQuote.grossAmountCents)}</dd></div>
          {currentQuote.vatNumberValid && <div style={styles.validation}>Btw-nummer gevalideerd via VIES</div>}
          {currentQuote.treatment === "outside-eu" && <div style={styles.note}>Geen EU-btw toegepast</div>}
        </dl>
      )}

      {error && <p role="alert" style={styles.error}>{error}</p>}
      <button type="button" onClick={handleContinue} disabled={disabled || busy} style={styles.button}>
        {busy ? "Even controleren..." : currentQuote
          ? `Naar Mollie · ${money(currentQuote.grossAmountCents)}`
          : buttonLabel}
      </button>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { width: "100%", maxWidth: 620, display: "flex", flexDirection: "column", gap: 16, textAlign: "left" },
  fields: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 },
  label: { display: "flex", flexDirection: "column", gap: 6, color: "#ccc", fontSize: 14 },
  input: { boxSizing: "border-box", width: "100%", minHeight: 44, padding: "10px 12px", border: "1px solid #555", borderRadius: 6, background: "#111", color: "#fff", fontSize: 16 },
  breakdown: { margin: 0, padding: "12px 0", borderTop: "1px solid #333", color: "#ddd" },
  row: { display: "flex", justifyContent: "space-between", gap: 16, padding: "4px 0" },
  total: { marginTop: 6, paddingTop: 10, borderTop: "1px solid #444", color: "#fff", fontWeight: 700 },
  validation: { marginTop: 8, color: "#77e6aa", fontSize: 13 },
  note: { marginTop: 8, color: "#aaa", fontSize: 13 },
  error: { margin: 0, color: "#ff9b9b", fontSize: 14 },
  button: { minHeight: 46, padding: "12px 20px", border: 0, borderRadius: 6, background: "#00ff99", color: "#000", fontWeight: 700, cursor: "pointer" },
};
