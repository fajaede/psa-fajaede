"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

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
  benchmark?: { total: number; percentile: number };
};

export default function ReportClient({ report }: { report: ReportData }) {
  const [isCoreOpen, setIsCoreOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("payment=success")) {
      // eslint-disable-next-line
      setPaymentSuccess(true);
    }
  }, []);

  // Live berekening van de Trust Score aan de hand van de scores (P1/S1/A1)
  let trustScore = 100;
  const improvements: string[] = [];

  if (report.securityScore?.includes("S1")) { trustScore -= 30; improvements.push("Enable HTTPS / SSL Security"); }
  if (report.privacyScore?.includes("P1")) { trustScore -= 20; improvements.push("Add Clear Privacy / Cookie Policy"); }
  if (report.ageScore?.includes("A3")) { trustScore -= 10; improvements.push("Adult content flagged"); }

  const isGold = trustScore >= 90;
  const isSilver = trustScore >= 75 && trustScore < 90;
  const embedCode = `<iframe src="https://psa-fajaede.vercel.app/embed/psa?url=${encodeURIComponent(report.url)}" width="140" height="140" frameborder="0" scrolling="no" style="border:none; overflow:hidden;"></iframe>`;

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
      {/* FajaedeAI Core Header (Exact overgenomen van de homepagina) */}
      <header style={{ position: "relative", zIndex: 100, width: "100%", maxWidth: 1200, display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center", padding: "24px 0 64px 0" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ fontWeight: 900, fontSize: 24, color: "#fff", letterSpacing: -1, cursor: "pointer" }}>
            fajaede<span style={{ color: "#ffdd00" }}>AI</span>
          </div>
        </Link>
        <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <div 
            onMouseEnter={() => setIsCoreOpen(true)}
            onMouseLeave={() => setIsCoreOpen(false)}
            style={{ position: "relative", cursor: "pointer", padding: "10px 0" }}
          >
            <span style={{ color: isCoreOpen ? "#fff" : "#ccc", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s" }}>
              FajaedeAI Core
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isCoreOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><path d="M6 9l6 6 6-6"/></svg>
            </span>
            {isCoreOpen && (
              <div style={{
                position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                background: "rgba(10, 10, 10, 0.95)", border: "1px solid #333", borderRadius: 16, padding: "24px",
                width: "90vw", maxWidth: 820, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.8)", zIndex: 50, backdropFilter: "blur(10px)"
              }}>
                <div>
                  <h4 style={{ color: "#888", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px 16px" }}>Intelligence Engines</h4>
                  <DropdownItem icon="🧠" title="AI & Search Engine" href="/search" />
                  <DropdownItem icon="🔍" title="SEO & Audit Engine" />
                  <DropdownItem icon="📊" title="SERP Intelligence" />
                  <DropdownItem icon="🛡️" title="PSA Certification" color="#ffdd00" />
                </div>
                <div>
                  <h4 style={{ color: "#888", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px 16px" }}>Tools & Automation</h4>
                  <DropdownItem icon="⚡" title="Bulk Meta & Audits" />
                  <DropdownItem icon="🏗️" title="Website & Schema Gen" />
                  <DropdownItem icon="📄" title="White Label Reports" />
                  <DropdownItem icon="📈" title="Multi-site Dashboard" />
                  <DropdownItem icon="🧹" title="Fajaede Privacy Cleaner" href="https://www.fajaede.nl/fajaede-privacy-cleaner-optimale-browser-opschoning/" />
                </div>
                <div>
                  <h4 style={{ color: "#888", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px 16px" }}>Data & Assistants</h4>
                  <DropdownItem icon="🕸️" title="Eigen Crawler & Index" />
                  <DropdownItem icon="⚔️" title="Competitor Analysis" />
                  <DropdownItem icon="🔗" title="Link Manager" />
                  <DropdownItem icon="🤖" title="AI Chatbot Assistant" />
                </div>

              </div>
            )}
          </div>
        </nav>
        <div>
          <button style={{ background: "transparent", color: "#fff", border: "1px solid #555", padding: "10px 20px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Login</button>
        </div>
      </header>

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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
             <ScoreBox label="Privacy" score={report.privacyScore || "N/A"} note={report.privacyNote || "-"} />
             <ScoreBox label="Security" score={report.securityScore || "N/A"} note={report.securityNote || "-"} />
             <ScoreBox label="Age" score={report.ageScore || "N/A"} note={report.ageNote || "-"} />
          </div>

          {/* Tekortkomingen */}
          {improvements.length > 0 && (
            <div style={{ padding: 20, background: "rgba(255,0,0,0.05)", borderRadius: 12, border: "1px solid rgba(255,0,0,0.2)" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: 16, color: "#ff4d4f" }}>{improvements.length} improvements required for 100/100:</h3>
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
        {report.benchmark && (
          <div style={{ marginTop: 24, padding: "24px 32px", background: "linear-gradient(135deg, rgba(0, 255, 153, 0.05), rgba(0, 170, 255, 0.05))", borderRadius: 16, border: "1px solid rgba(0, 255, 153, 0.2)", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(0, 255, 153, 0.1)", border: "2px solid #00ff99", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, boxShadow: "0 0 20px rgba(0,255,153,0.3)" }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#00ff99" }}>{report.benchmark.percentile}%</span>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 20, color: "#fff", margin: "0 0 8px 0" }}>Jij vs De Rest (Benchmark)</h3>
              <p style={{ color: "#aaa", margin: 0, fontSize: 15, lineHeight: 1.6 }}>
                Jouw TrustScore is <strong>{trustScore}</strong>. Hiermee scoor je op dit moment beter dan <strong style={{ color: "#00ff99" }}>{report.benchmark.percentile}%</strong> van de <strong style={{ color: "#fff" }}>{report.benchmark.total.toLocaleString("nl-NL")}</strong> Nederlandse websites in de FajaedeAI Intelligence database!
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

          {paymentSuccess && (
            <div style={{ background: "rgba(0, 255, 153, 0.1)", border: "1px solid #00ff99", color: "#00ff99", padding: "16px", borderRadius: 8, marginBottom: 24, fontWeight: "bold", fontSize: 15 }}>
              🎉 Betaling ontvangen! Je licentie wordt verwerkt. Het kan een minuutje duren voordat de badge op je website updatet.
            </div>
          )}

          {report.isPaid || paymentSuccess ? (
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
                <form action="/api/checkout" method="GET" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <input type="hidden" name="urlHash" value={report.urlHash || ""} />
                  <div style={{ width: "100%", maxWidth: 320, textAlign: "left" }}>
                    <label style={{ fontSize: 13, color: "#ccc", fontWeight: 600, display: "block", marginBottom: 8 }}>E-mailadres voor factuur & licentie:</label>
                    <input 
                      type="email" name="email" required placeholder="naam@bedrijf.nl" 
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", borderRadius: 8, border: "1px solid #444", background: "#050505", color: "#fff", outline: "none" }}
                    />
                  </div>
                  <button type="submit" style={{ display: "inline-block", textDecoration: "none", padding: "14px 32px", background: "#0070ba", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,112,186,0.3)" }}>
                    Koop PSA Licentie (€9/jaar)
                  </button>
                </form>
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
    <div style={{ padding: 16, borderRadius: 12, background: "rgba(5,5,5,0.7)", border: "1px solid #333" }}>
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#aaa", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{score}</div>
      <div style={{ fontSize: 13, color: "#ddd", lineHeight: 1.4 }}>{note}</div>
    </div>
  );
}

function DropdownItem({ icon, title, color = "#eee", href = "#" }: { icon: string; title: string; color?: string; href?: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const isExternal = href.startsWith("http");

  return (
    <a href={href} 
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "10px 20px",
        color, textDecoration: "none", fontSize: 15, fontWeight: 500,
        background: isHovered ? "rgba(255,255,255,0.05)" : "transparent",
        transition: "background 0.2s"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{icon}</span>
      {title}
    </a>
  );
}