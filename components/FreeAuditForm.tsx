"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Start a free Site-audit (50 pages crawled, the first 10 in full detail). Used after the free scan,
 * on the pricing page and in the dashboard. The private report link is also mailed.
 */
export function FreeAuditForm({ url: presetUrl, email: presetEmail, title, compact }: {
  url?: string;
  email?: string;
  title?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(presetUrl ?? "");
  const [email, setEmail] = useState(presetEmail ?? "");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validUrl = /^(https?:\/\/)?[^\s/.]+\.[^\s]{2,}/i.test(url.trim());

  async function start(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/audit/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), email: email.trim(), acceptTerms }),
      });
      const data = (await response.json().catch(() => ({}))) as { token?: string; error?: string };
      if (!response.ok || !data.token) {
        setError(data.error ?? "De audit kon niet worden gestart.");
        return;
      }
      router.push(`/audit/${data.token}`);
    } catch {
      setError("De audit kon niet worden gestart. Controleer je verbinding en probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={start} style={{ ...styles.box, ...(compact ? { padding: 16 } : {}) }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <strong style={styles.title}>{title ?? "Hoe staan je andere pagina's ervoor?"}</strong>
        <span style={styles.muted}>
          Gratis site-audit: we controleren tot 50 pagina&apos;s op foutpagina&apos;s, gebroken links, titels, omschrijvingen,
          dunne inhoud en indexatie. Je ziet direct alle gevonden problemen en de details van de eerste 10 pagina&apos;s.
        </span>
      </div>
      {!presetUrl && (
        <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://jouwsite.nl" style={styles.input} aria-label="Website" />
      )}
      {!presetEmail && (
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="naam@bedrijf.nl" style={styles.input} aria-label="E-mailadres" />
      )}
      <label style={styles.check}>
        <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
        <span>
          Ik ga akkoord met de <a href="/voorwaarden" target="_blank" rel="noopener" style={styles.link}>voorwaarden</a> en
          de <a href="/privacy" target="_blank" rel="noopener" style={styles.link}>privacyverklaring</a>; de link naar het rapport komt per e-mail.
        </span>
      </label>
      <button type="submit" disabled={busy || !acceptTerms || !validEmail || !validUrl} style={styles.button}>
        {busy ? "Audit wordt gestart…" : "Gratis site-audit starten"}
      </button>
      {error && <p role="alert" style={styles.error}>{error}</p>}
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  box: {
    display: "flex", flexDirection: "column", gap: 12, padding: 24, textAlign: "left",
    background: "linear-gradient(135deg, rgba(0,255,153,0.08), rgba(0,170,255,0.06))",
    border: "1px solid rgba(0,255,153,0.4)", borderRadius: 12,
  },
  title: { color: "#fff", fontSize: 18 },
  muted: { color: "#aaa", fontSize: 14, lineHeight: 1.5 },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid #333", background: "#0b0b0b", color: "#f5f5f5", fontSize: 15 },
  check: { display: "flex", gap: 8, alignItems: "flex-start", color: "#aaa", fontSize: 13, lineHeight: 1.5 },
  link: { color: "#00ff99" },
  button: { padding: "12px 18px", borderRadius: 10, border: "none", background: "#00ff99", color: "#050505", fontWeight: 800, fontSize: 15, cursor: "pointer" },
  error: { margin: 0, color: "#ff4d4f", fontSize: 14 },
};
