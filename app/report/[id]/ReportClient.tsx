"use client";
import React, { useState } from "react";
import Link from "next/link";
import { VatCheckout } from "@/components/VatCheckout";
import { psaImprovements, psaTrustScore } from "@/lib/psa-score";
import { rankingText } from "@/lib/ranking-text";

type ReportData = {
  url: string;
  createdAt: string;
  expiresAt: string | null;
  securityScore?: string | null;
  securityNote?: string | null;
  privacyScore?: string | null;
  urlHash?: string;
  privacyNote?: string | null;
  ageScore?: string | null;
  ageNote?: string | null;
  isPaid?: boolean;
  benchmark?: { total: number; percentile: number; topPercent: number; cohortLabel: string } | null;
  badgeBaseUrl: string;
};

export default function ReportClient({ report }: { report: ReportData }) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");

  // Live berekening van de Trust Score aan de hand van de scores (P1/S1/A1)
  const trustScore = psaTrustScore(report);
  // The scan's own reasons (e.g. a leaked plugin version), not generic texts like "Enable HTTPS".
  const improvements = psaImprovements(report);
  const ranking = report.benchmark ? rankingText(report.benchmark.percentile) : null;

  const isGold = trustScore >= 90;
  const isSilver = trustScore >= 75 && trustScore < 90;
  const badgeId = encodeURIComponent(report.urlHash || "");
  // A plain link + image: visitors who click the badge land on the PSA report at psa.fajaede.nl.
  const embedCode = `<a href="${report.badgeBaseUrl}/report/${badgeId}" target="_blank" rel="noopener" title="PSA Trust Badge - bekijk het rapport"><img src="${report.badgeBaseUrl}/embed/psa?id=${badgeId}" width="140" height="140" alt="PSA Trust Badge" style="border:0;"></a>`;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#f5f5f5",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 16px 64px 16px",
      }}
    >
      {/* the site header comes from the root layout (components/SiteHeader.tsx) */}
      <div style={{ height: 40 }} />

      {/* HET OFFICIELE RAPPORT */}
      <section style={{ maxWidth: 720, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Official PSA Report</h1>
          <p style={{ color: "#aaa", fontSize: 16 }}>
            Security, Privacy & Age status for <strong style={{ color: "#fff" }}>{report.url}</strong>
          </p>
        </div>

        {/* Certificate Box */}
        <div style={{ background: "#111", border: "1px solid #333", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "linear-gradient(135deg, rgba(255,221,0,0.1), rgba(255,0,0,0.1))", padding: "32px 24px", borderRadius: 12, border: "1px solid rgba(255,221,0,0.3)" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#ffdd00", letterSpacing: 2 }}>
              {isGold ? "🏆 PSA GOLD" : isSilver ? "🥈 PSA SILVER" : "⚠️ UNVERIFIED"}
            </div>
            <div style={{ fontSize: 64, fontWeight: 900, color: "#fff", margin: "16px 0" }}>
              {trustScore}<span style={{ fontSize: 24, color: "#888" }}>/100</span>
            </div>
            <div style={{ fontSize: 14, textTransform: "uppercase", color: "#aaa", letterSpacing: 1, marginBottom: 16 }}>
              PSA Trust Rating
            </div>
            <div style={{ fontSize: 12, color: "#777", display: "flex", gap: 16 }}>
              <span>Scanned on: {new Date(report.createdAt).toLocaleDateString("nl-NL")}</span>
              <span>Valid until: {report.expiresAt ? new Date(report.expiresAt).toLocaleDateString("nl-NL") : "N/A"}</span>
            </div>
          </div>

          {/* Resultaten */}
          <div className="scoreGrid">
             <ScoreBox label="Privacy" score={report.privacyScore || "N/A"} note={report.privacyNote || "-"} />
             <ScoreBox label="Security" score={report.securityScore || "N/A"} note={report.securityNote || "-"} />
             <ScoreBox label="Age" score={report.ageScore || "N/A"} note={report.ageNote || "-"} />
          </div>

          {/* Tekortkomingen */}
          {improvements.length > 0 && (
            <div style={{ padding: 20, background: "rgba(255,0,0,0.05)", borderRadius: 12, border: "1px solid rgba(255,0,0,0.2)" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: 16, color: "#ff4d4f" }}>{improvements.length === 1 ? "1 verbeterpunt" : `${improvements.length} verbeterpunten`} voor 100/100:</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {improvements.map((imp, i) => (
                  <li key={i} style={{ color: "#eee", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#ff4d4f" }}>⚠️</span> {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* JIJ VS DE REST (DE HETZNER BENCHMARK) */}
        {report.benchmark && ranking && (
          <div style={{ marginTop: 24, padding: "24px 32px", background: "linear-gradient(135deg, rgba(0, 255, 153, 0.05), rgba(0, 170, 255, 0.05))", borderRadius: 16, border: "1px solid rgba(0, 255, 153, 0.2)", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(0, 255, 153, 0.1)", border: "2px solid #00ff99", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, boxShadow: "0 0 20px rgba(0,255,153,0.3)" }}>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.05, textAlign: "center" }}>
                <span style={{ fontSize: 11, color: "#9fd", textTransform: "uppercase", letterSpacing: 0.5 }}>{ranking.caption}</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#00ff99" }}>{ranking.short}</span>
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 20, color: "#fff", margin: "0 0 8px 0" }}>Jij vs De Rest (Benchmark)</h3>
              <p style={{ color: "#aaa", margin: 0, fontSize: 15, lineHeight: 1.6 }}>
                Jouw TrustScore is <strong>{trustScore}</strong>. Daarmee <strong style={{ color: "#00ff99" }}>{ranking.phrase}</strong> van <strong style={{ color: "#fff" }}>{report.benchmark.total.toLocaleString("nl-NL")}</strong> vergelijkbare {report.benchmark.cohortLabel} in de Fajaede-benchmark.
              </p>
            </div>
          </div>
        )}

        {/* EMBED WIDGET & KASSA */}
        <div style={{ marginTop: 32, padding: 32, background: "#111", borderRadius: 16, border: "1px solid #333", textAlign: "center" }}>
          <h4 style={{ color: "#fff", marginBottom: 12, fontSize: 20 }}>Embed de Trust Badge op jouw website</h4>
          <p style={{ color: "#aaa", fontSize: 15, marginBottom: 20 }}>
            Kopieer de onderstaande HTML-code en plak deze in de footer of sidebar van jouw website.
          </p>

          <div style={{ position: "relative", background: "#000", border: "1px solid #444", padding: "54px 20px 20px 20px", borderRadius: 8, marginBottom: 32, textAlign: "left" }}>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(embedCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              title="Kopieer Code"
              style={{ position: "absolute", top: 12, right: 12, background: copied ? "#00a300" : "#222", color: "#fff", border: "1px solid #444", padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontWeight: "600", fontSize: 13, transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}
              onMouseOver={(e) => { if (!copied) e.currentTarget.style.background = "#333"; }}
              onMouseOut={(e) => { if (!copied) e.currentTarget.style.background = "#222"; }}
            >
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Gekopieerd!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Kopieer
                </>
              )}
            </button>
            <code style={{ color: "#0f0", fontSize: 14, wordBreak: "break-all" }}>
              {embedCode}
            </code>
          </div>

          {typeof window !== "undefined" && window.location.search.includes("payment=success") && !report.isPaid && (
            <div style={{ background: "rgba(0, 255, 153, 0.1)", border: "1px solid #00ff99", color: "#00ff99", padding: "16px", borderRadius: 8, marginBottom: 24, fontWeight: "bold", fontSize: 15 }}>
              Betaling ontvangen. De licentie wordt gecontroleerd; ververs deze pagina zo meteen.
            </div>
          )}

          {report.isPaid ? (
            <p style={{ color: "#00ff00", fontSize: 14, marginBottom: 16, fontWeight: "bold" }}>
              ✅ Actieve licentie: Jouw Trust Badge is geverifieerd en live!
            </p>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 24, borderRadius: 12, border: "1px solid #222" }}>
              <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
                Let op: Zonder actieve licentie toont de badge mogelijk &quot;Unverified&quot; aan je bezoekers.
              </p>
              
              {/* DE GATEKEEPER LOGICA */}
              {trustScore >= 75 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div style={{ width: "100%", maxWidth: 320, textAlign: "left" }}>
                    <label style={{ fontSize: 13, color: "#ccc", fontWeight: 600, display: "block", marginBottom: 8 }}>E-mailadres voor factuur & licentie:</label>
                    <input 
                      type="email" required placeholder="naam@bedrijf.be"
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: 8, border: "1px solid #444", background: "#050505", color: "#fff", outline: "none" }}
                    />
                  </div>
                  <VatCheckout
                    product="PSA_LICENSE"
                    paymentEndpoint="/api/checkout"
                    paymentData={{ urlHash: report.urlHash || "", email: email.trim() }}
                    buttonLabel="Bekijk totaal en ga verder"
                    disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !report.urlHash}
                  />
                  <p style={{ color: "#888", fontSize: 12, margin: 0 }}>€9 per jaar, geen btw (vrijstellingsregeling kleine ondernemingen).</p>
                </div>
              ) : (
                <div style={{ padding: "16px", background: "rgba(255, 77, 79, 0.1)", border: "1px solid rgba(255, 77, 79, 0.3)", borderRadius: 8, color: "#ffcccc", textAlign: "center" }}>
                  <h4 style={{ color: "#ff4d4f", margin: "0 0 8px 0" }}>⚠️ Score te laag voor certificering</h4>
                  <p style={{ margin: 0, fontSize: 14 }}>Jouw TrustScore is <strong>{trustScore}/100</strong>. Om de geloofwaardigheid van het keurmerk te bewaken, vereisen wij een minimale score van 75. Los eerst de kritieke fouten op (bijv. met FajaedeSEO AI) om de kassa te ontgrendelen.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* DE VIRALE LOOP CTA (Lead generator) */}
        <div style={{ marginTop: 48, padding: "48px 32px", background: "linear-gradient(135deg, #1a1a1a, #050505)", borderRadius: 16, border: "1px solid #333", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
          <h3 style={{ fontSize: 26, color: "#fff", marginBottom: 12 }}>Is jouw website al veilig?</h3>
          <p style={{ color: "#aaa", marginBottom: 32, fontSize: 16, lineHeight: 1.6, maxWidth: 500, margin: "0 auto 32px auto" }}>
            Bezoekers vertrouwen websites met een keurmerk sneller. Doe de <strong>gratis FajaedeAI scan</strong> en ontdek of jouw website in aanmerking komt voor de PSA certificering.
          </p>
          <Link href="/" style={{ display: "inline-block", padding: "16px 36px", background: "linear-gradient(135deg, #ffdd00, #d4af37)", color: "#111", borderRadius: 8, fontWeight: 900, textDecoration: "none", fontSize: 15, textTransform: "uppercase", letterSpacing: 1, boxShadow: "0 4px 20px rgba(255,221,0,0.2)" }}>
            Doe de gratis PSA Scan →
          </Link>
        </div>
      </section>
    </main>
  );
}

// --- HULP COMPONENTEN (Voor nu lokaal gehouden om het in één bestand werkend te maken) ---

function ScoreBox({ label, score, note }: { label: string; score: string | number; note: string }) {
  return (
    <div className="scoreBox" style={{ padding: 16, borderRadius: 12, background: "rgba(5,5,5,0.7)", border: "1px solid #333" }}>
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#aaa", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{score}</div>
      <div style={{ fontSize: 13, color: "#ddd", lineHeight: 1.4 }}>{note}</div>
    </div>
  );
}

