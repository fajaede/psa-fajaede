// app/price/page.tsx
"use client";
import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VatCheckout } from "@/components/VatCheckout";

const tiers = [
  {
    name: "Free scan",
    price: 0,
    description: "Instap – korte controle van de belangrijkste SEO‑punten.",
    tierKey: "FREE",
    button: "Start free scan",
  },
  {
    name: "Re‑scan",
    price: Number(process.env.NEXT_PUBLIC_PREMIUM_PRICE_RESCAN) || 149,
    description: "Site‑audit van maximaal 50 pagina's: foutpagina's en gebroken links, titels en omschrijvingen, dubbele of dunne inhoud, indexatie, sitemap en laadtijd. Met rapport per pagina.",
    tierKey: "RE_SCAN",
    button: "Upgrade – €149",
  },
  {
    name: "Re‑scan + adviezen",
    price: Number(process.env.NEXT_PUBLIC_PREMIUM_PRICE_RESCAN_ADV) || 249,
    description: "Site‑audit van maximaal 100 pagina's met alle verbeterpunten per pagina, plus een advies‑call.",
    tierKey: "RE_SCAN_ADV",
    button: "Upgrade – €249",
  },
];

export default function PricePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [scanMode, setScanMode] = useState<"seo" | "geo" | null>(null);
  const [scanUrl, setScanUrl] = useState("");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setScanMode(searchParams.get("mode") === "geo" ? "geo" : searchParams.get("mode") === "seo" ? "seo" : null);
    setScanUrl(searchParams.get("url") || "");
  }, []);

  return (
    <main style={styles.container}>
      <div style={styles.checkoutBadge}>Fajaede Secure Checkout</div>
      <h1 style={styles.title}>Kies jouw {scanMode === "geo" ? "GEO" : "SEO"}‑her‑scan</h1>
      {scanMode && scanUrl && <p style={styles.context}>Nieuwe live {scanMode.toUpperCase()}-scan voor {scanUrl}</p>}
      <label style={styles.emailLabel}>
        E-mailadres voor de bestelling
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="naam@bedrijf.nl"
          style={styles.emailInput}
        />
      </label>
      <section style={styles.grid}>
        {tiers.map((t) => (
          <div key={t.tierKey} style={styles.card}>
            <h2 style={styles.cardTitle}>{t.name}</h2>
            {t.price > 0 && <p style={styles.price}>€{t.price} <span style={styles.vatNote}>incl. btw</span></p>}
            <p style={styles.desc}>{t.description}</p>
            <button
              style={selectedTier === t.tierKey ? { ...styles.button, ...styles.selectedButton } : styles.button}
              onClick={() => t.tierKey === "FREE" ? router.push("/") : setSelectedTier(t.tierKey)}
            >
              {t.tierKey === "FREE" ? t.button : selectedTier === t.tierKey ? "Geselecteerd" : "Selecteer pakket"}
            </button>
          </div>
        ))}
      </section>
      {selectedTier && (
        <section style={styles.checkout}>
          <h2 style={styles.cardTitle}>Factuurgegevens</h2>
          <p style={styles.desc}>De pakketprijs is inclusief btw. Het exacte btw-bedrag hangt af van je land en klanttype.</p>
          <VatCheckout
            product={selectedTier}
            paymentEndpoint="/api/premium/create-payment"
            paymentData={{
              tier: selectedTier,
              email: email.trim(),
              ...(scanMode && scanUrl ? { scanMode, scanUrl } : {}),
            }}
            buttonLabel="Bereken btw en totaal"
            disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}
          />
        </section>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#050505",
    color: "#f5f5f5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 16px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  title: { fontSize: 32, marginBottom: 24 },
  checkoutBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(0,255,153,0.1)",
    border: "1px solid rgba(0,255,153,0.3)",
    color: "#00ff99",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  context: { width: "100%", maxWidth: 600, color: "#aaa", textAlign: "center", margin: "-12px 0 24px" },
  emailLabel: { width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, color: "#ccc" },
  emailInput: { boxSizing: "border-box", width: "100%", padding: "12px 14px", border: "1px solid #555", borderRadius: 8, background: "#111", color: "#fff", fontSize: 16 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 24,
    width: "100%",
    maxWidth: 900,
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 24,
    textAlign: "center",
    backdropFilter: "blur(8px)",
  },
  cardTitle: { fontSize: 20, marginBottom: 8 },
  price: { fontSize: 28, fontWeight: 600, margin: "12px 0" },
  vatNote: { fontSize: 13, fontWeight: 400, color: "#aaa" },
  desc: { fontSize: 14, marginBottom: 16, color: "#ccc" },
  button: {
    background: "#00ff99",
    color: "#000",
    border: "none",
    padding: "12px 24px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  selectedButton: { background: "#fff", color: "#111" },
  checkout: { width: "100%", maxWidth: 620, marginTop: 32, padding: 24, border: "1px solid #333", borderRadius: 8, background: "#101010" },
};
