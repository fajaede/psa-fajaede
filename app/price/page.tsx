// app/price/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    description: "Volledige her‑scan van de site met technische SEO, content, titles, descriptions en indexatie.",
    tierKey: "RE_SCAN",
    button: "Upgrade – €149",
  },
  {
    name: "Re‑scan + adviezen",
    price: Number(process.env.NEXT_PUBLIC_PREMIUM_PRICE_RESCAN_ADV) || 249,
    description: "Uitgebreide her‑scan plus concrete verbeterpunten en advies‑call.",
    tierKey: "RE_SCAN_ADV",
    button: "Upgrade – €249",
  },
];

export default function PricePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const handleUpgrade = async (tierKey: string) => {
    if (!email.trim()) {
      alert("Vul eerst uw e-mailadres in.");
      return;
    }
    setLoading(tierKey);
    try {
      const res = await fetch("/api/premium/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierKey, email: email.trim() }),
      });
      if (!res.ok) throw new Error("Payment creation failed");
      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl; // redirect to Mollie checkout
    } catch (e) {
      console.error(e);
      alert("Er is een fout opgetreden bij het starten van de betaling.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main style={styles.container}>
      <h1 style={styles.title}>Kies jouw SEO‑her‑scan</h1>
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
            {t.price > 0 && <p style={styles.price}>€{t.price}</p>}
            <p style={styles.desc}>{t.description}</p>
            <button
              style={styles.button}
              disabled={loading === t.tierKey}
              onClick={() => handleUpgrade(t.tierKey)}
            >
              {loading === t.tierKey ? "Redirecting…" : t.button}
            </button>
          </div>
        ))}
      </section>
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
};
