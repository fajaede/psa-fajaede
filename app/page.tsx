"use client";
import React, { useState } from "react";
import Image from "next/image";

type ScanResult = {
  trustScore?: number;
  url?: string;
  reportUrl?: string;
  privacy?: { score: string | number; note: string };
  security?: { score: string | number; note: string };
  age?: { score: string | number; note: string };
  improvements?: string[];
  [key: string]: unknown;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isCoreOpen, setIsCoreOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setResult(null);

    // simpele URL-check
    if (!url || !url.startsWith("http")) {
      setError("Please enter a valid URL starting with http or https.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        throw new Error("Scan failed. Please try again.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#050505",
        color: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 16px 40px 16px",
      }}
    >
      {/* Global Navigation Bar */}
      <header style={{ 
        width: "100%", 
        maxWidth: 1200, 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "24px 0 64px 0" 
      }}>
        <div style={{ fontWeight: 900, fontSize: 24, color: "#fff", letterSpacing: -1, cursor: "pointer" }}>
          fajaede<span style={{ color: "#ffdd00" }}>AI</span>
        </div>
        
        <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {/* FajaedeAI Core Dropdown */}
          <div 
            onMouseEnter={() => setIsCoreOpen(true)}
            onMouseLeave={() => setIsCoreOpen(false)}
            style={{ position: "relative", cursor: "pointer", padding: "10px 0" }}
          >
            <span style={{ color: isCoreOpen ? "#fff" : "#ccc", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s" }}>
              FajaedeAI Core
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isCoreOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><path d="M6 9l6 6 6-6"/></svg>
            </span>
            
            {/* Dropdown Menu */}
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
          
          <a href="#" style={{ color: "#ccc", textDecoration: "none", fontWeight: 500 }}>Pricing</a>
          <a href="#" style={{ color: "#ccc", textDecoration: "none", fontWeight: 500 }}>Agency</a>
        </nav>
        
        <div>
          <button style={{ background: "transparent", color: "#fff", border: "1px solid #555", padding: "10px 20px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Login</button>
        </div>
      </header>

      {/* Hero & PSA shield brand */}
      <section style={{ maxWidth: 720, textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 10px",
            borderRadius: 999,
            background: "#111",
            border: "1px solid #333",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          <span style={{ color: "#ffdd00" }}>PSA</span>
          <span style={{ color: "#999" }}>Certified by fajaedeAI</span>
        </div>
        <h1 style={{ fontSize: 32, marginTop: 16, marginBottom: 8 }}>
          Check the PSA of any website or app
        </h1>
        <p style={{ fontSize: 16, color: "#ccc", marginBottom: 24 }}>
          PSA = Privacy • Security • Age.{" "}
          Paste a URL, let fajaedeAI scan it, and get a shareable{" "}
          <strong>“PSA Certified by fajaedeAI”</strong> shield.
        </p>
      </section>

      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 640,
          display: "flex",
          gap: 8,
          marginBottom: 24,
        }}
      >
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 999,
            border: "1px solid #333",
            background: "#111",
            color: "#f5f5f5",
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 22px",
            borderRadius: 999,
            border: "none",
            background: loading ? "#555" : "#ff0000",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            textTransform: "uppercase",
            letterSpacing: 1,
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Scanning..." : "Scan PSA"}
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div
          style={{
            maxWidth: 640,
            width: "100%",
            marginBottom: 16,
            padding: "10px 12px",
            borderRadius: 8,
            background: "#330000",
            border: "1px solid #ff4d4f",
            color: "#ffcccc",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Result card */}
      {result && (
        <section
          style={{
            width: "100%",
            maxWidth: 720,
            marginTop: 8,
            padding: 24,
            borderRadius: 16,
            background: "#111",
            border: "1px solid #333",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* NEW PSA BADGE */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "linear-gradient(135deg, rgba(255,221,0,0.1), rgba(255,0,0,0.1))",
              padding: "32px 24px",
              borderRadius: "12px",
              border: "1px solid rgba(255,221,0,0.3)",
            }}
          >
            <div
              style={{ fontSize: 24, fontWeight: 900, color: "#ffdd00", letterSpacing: 2 }}
            >
              {(result.trustScore ?? 0) >= 90 ? "PSA GOLD" : "PSA CERTIFIED"}
            </div>
            
            <div style={{ fontSize: 56, fontWeight: 900, color: "#fff", margin: "16px 0" }}>
              {result.trustScore || 84}<span style={{ fontSize: 24, color: "#888" }}>/100</span>
            </div>
            <div style={{ fontSize: 14, textTransform: "uppercase", color: "#aaa", letterSpacing: 1, marginBottom: 16 }}>
              PSA Trust Rating
            </div>

            <div style={{ display: "flex", gap: "24px", fontSize: 16, color: "#ddd", marginBottom: "24px", fontWeight: 600 }}>
              <span>Privacy {result.privacy?.score === "A" || Number(result.privacy?.score) >= 80 ? "✓" : "⚠️"}</span>
              <span>Security {result.security?.score === "A" || Number(result.security?.score) >= 80 ? "✓" : "⚠️"}</span>
              <span>Age {result.age?.score === "A" || Number(result.age?.score) >= 80 ? "✓" : "⚠️"}</span>
            </div>

            <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>
              Verified by fajaedeAI
            </div>
          </div>

        {/* Detailed Scores Breakdown */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <ScoreBox
            label="Privacy"
            score={result.privacy?.score || "N/A"}
            note={result.privacy?.note || "Geen data"}
          />
          <ScoreBox
            label="Security"
            score={result.security?.score || "N/A"}
            note={result.security?.note || "Geen data"}
          />
          <ScoreBox
            label="Age"
            score={result.age?.score || "N/A"}
            note={result.age?.note || "Geen data"}
          />
        </div>

          {/* Actionable Improvements & Lead Gen Funnel */}
          <div
            style={{
              padding: 20,
              background: "rgba(255,0,0,0.05)",
              borderRadius: 12,
              border: "1px solid rgba(255,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: "#ff4d4f" }}>
              {(result.improvements || ["Add Cookie Consent", "Improve Security Headers", "Update Privacy Policy"]).length} improvements found:
            </h3>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {(result.improvements || ["Add Cookie Consent", "Improve Security Headers", "Update Privacy Policy"]).map((imp: string, i: number) => (
                <li key={i} style={{ color: "#eee", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#ff4d4f" }}>⚠️</span> {imp}
                </li>
              ))}
            </ul>
            
            {/* Strategic Lead Gen Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
              <button
                onClick={() => alert("Opening PDF Report...")}
                style={{
                  flex: "1 1 auto",
                  padding: "14px",
                  background: "transparent",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Download Report
              </button>
              <button
                onClick={() => alert("Redirecting to FajaedeSEO AI+...")}
                style={{
                  flex: "1 1 auto",
                  padding: "14px",
                  background: "#ff0000",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Fix with FajaedeSEO AI+
              </button>
              <button
                onClick={() => alert("Opening PayPal checkout for €9/yr...")}
                style={{
                  flex: "1 1 100%",
                  padding: "14px",
                  background: "linear-gradient(135deg, #ffdd00, #d4af37)",
                  color: "#111",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontSize: 15,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Get PSA Certified (€9/yr)
              </button>
            </div>
          </div>

          {/* Embed Your Trust Badge (Shown conditionally if certified or high score) */}
          <div
              style={{
              padding: 24,
              background: "#1a1a1a",
              borderRadius: 12,
              border: "1px solid #333",
              }}
            >
            <h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "#fff" }}>Display your PSA Trust Badge</h3>
            <p style={{ color: "#aaa", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Show visitors your site is safe. Use this embed code to place your un-copyable, domain-verified PSA badge on your website.
            </p>
            
            <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
              {/* Visual Preview of the actual badge URL you provided */}
              <div style={{ width: 140, flexShrink: 0, pointerEvents: "none", userSelect: "none" }}>
                <Image 
                  src="/PSA-fajaede-AI.png" 
                  alt="PSA Certified" 
                  width={140}
                  height={140}
                  style={{ width: "100%", height: "auto", filter: "drop-shadow(0px 4px 12px rgba(0,0,0,0.5))" }} 
                />
              </div>

              {/* Embed Snippet generator */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ 
                  background: "#050505", 
                  padding: 12, 
                  borderRadius: 8, 
                  fontFamily: "monospace", 
                  fontSize: 12, 
                  color: "#00ff99", 
                  wordBreak: "break-all",
                  border: "1px solid #222"
                }}>
                  {`<iframe src="https://fajaede.nl/embed/psa?url=${encodeURIComponent(result.url || 'yoursite.com')}" width="140" height="140" style="border:none; pointer-events:none;" scrolling="no"></iframe>`}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`<iframe src="https://fajaede.nl/embed/psa?url=${encodeURIComponent(result.url || 'yoursite.com')}" width="140" height="140" style="border:none; pointer-events:none;" scrolling="no"></iframe>`);
                    alert("Code copied!");
                  }}
                  style={{ 
                    marginTop: 12, 
                    padding: "8px 16px", 
                    background: "#333", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: 6, 
                    cursor: "pointer", 
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  Copy HTML Code
                </button>
              </div>
            </div>
          </div>

          {/* Report link */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 8,
            }}
          >
            <a
              href={result.reportUrl || `/report?url=${encodeURIComponent(result.url || "")}`}
              target="_blank"
              rel="noreferrer"
              style={{
                fontWeight: 600,
                textDecoration: "none",
                color: "#ffdd00",
                fontSize: 14,
                textDecorationLine: "underline"
              }}
            >
              Open full PSA Report →
            </a>
          </div>
        </section>
      )}

      {/* Simple footer */}
      <footer
        style={{
          marginTop: "auto",
          paddingTop: 40,
          fontSize: 12,
          color: "#777",
        }}
      >
        © {new Date().getFullYear()} fajaede.nl · PSA – Privacy Security Age ·
        fajaedeAI
      </footer>
    </main>
  );
}

function ScoreBox({
  label,
  score,
  note,
}: {
  label: string;
  score: string | number;
  note: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: "rgba(5,5,5,0.7)",
        border: "1px solid #333",
      }}
    >
      <div
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "#aaa",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        {score}
      </div>
      <div style={{ fontSize: 12, color: "#ddd" }}>{note}</div>
    </div>
  );
}

function DropdownItem({ icon, title, color = "#eee", href = "#" }: { icon: string; title: string; color?: string; href?: string }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Check of de link extern is, zodat we hem veilig in een nieuw tabblad kunnen openen
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
