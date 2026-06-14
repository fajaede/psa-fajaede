"use client";
import React, { useState } from "react";
import Link from "next/link";

type ReportData = {
  url: string;
  createdAt: string;
  expiresAt: string | null;
  securityScore?: string | null;
  securityNote?: string | null;
  privacyScore?: string | null;
  privacyNote?: string | null;
  ageScore?: string | null;
  ageNote?: string | null;
};

export default function ReportClient({ report }: { report: ReportData }) {
  const [isCoreOpen, setIsCoreOpen] = useState(false);

  // Live berekening van de Trust Score aan de hand van de scores (P1/S1/A1)
  let trustScore = 100;
  const improvements: string[] = [];

  if (report.securityScore?.includes("S1")) { trustScore -= 30; improvements.push("Enable HTTPS / SSL Security"); }
  if (report.privacyScore?.includes("P1")) { trustScore -= 20; improvements.push("Add Clear Privacy / Cookie Policy"); }
  if (report.ageScore?.includes("A3")) { trustScore -= 10; improvements.push("Adult content flagged"); }

  const isGold = trustScore >= 90;

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
      <header style={{ width: "100%", maxWidth: 1200, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0 64px 0" }}>
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
                position: "absolute", top: "100%", left: "50%", transform: "translateX(-35%)",
                background: "rgba(10, 10, 10, 0.95)", border: "1px solid #333", borderRadius: 16, padding: "24px",
                width: 820, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.8)", zIndex: 50, backdropFilter: "blur(10px)"
              }}>
                <div>
                  <h4 style={{ color: "#888", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px 16px" }}>Intelligence Engines</h4>
                  <DropdownItem icon="🧠" title="AI & Search Engine" />
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
              {isGold ? "PSA GOLD" : "PSA CERTIFIED"}
            </div>
            <div style={{ fontSize: 64, fontWeight: 900, color: "#fff", margin: "16px 0" }}>
              {trustScore}<span style={{ fontSize: 24, color: "#888" }}>/100</span>
            </div>
            <div style={{ fontSize: 14, textTransform: "uppercase", color: "#aaa", letterSpacing: 1, marginBottom: 16 }}>
              PSA Trust Rating
            </div>
            <div style={{ fontSize: 12, color: "#777", display: "flex", gap: 16 }}>
              <span>Scanned on: {new Date(report.createdAt).toLocaleDateString()}</span>
              <span>Valid until: {report.expiresAt ? new Date(report.expiresAt).toLocaleDateString() : "N/A"}</span>
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