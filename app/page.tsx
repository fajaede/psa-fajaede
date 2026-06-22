"use client";
import React, { useState, useEffect } from "react";

type ScanResult = {
  trustScore?: number;
  url?: string;
  reportUrl?: string;
  privacy?: { score: string | number; note: string };
  security?: { score: string | number; note: string };
  age?: { score: string | number; note: string };
  improvements?: string[];
  scanMode?: "psa" | "seo" | "geo";
  criticalIssues?: string[];
  fromCache?: boolean;
  cachedAt?: string;
  [key: string]: unknown;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isCoreOpen, setIsCoreOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"psa" | "seo" | "geo">("psa");

  // Terminal Scan Animatie States
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 600);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const getLoadingSteps = () => {
    if (scanMode === "psa") return ["Initiating FajaedeAI Core Engine...", "Analyzing SSL & cryptographic protocols...", "Crawling DOM for GDPR compliance...", "Running semantic vulnerability checks...", "Calculating Final Trust Score..."];
    if (scanMode === "seo") return ["Initiating FajaedeAI SEO Crawler...", "Analyzing Core Web Vitals & LCP...", "Checking Dynamic Schema & AI endpoints...", "Evaluating keyword density...", "Compiling critical issue report..."];
    return ["Initiating GEO-Spatial Engine...", "Locating Google Maps coordinates...", "Analyzing NAP consistency...", "Evaluating local domain authority...", "Generating Market Overview..."];
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setResult(null);

    // Slimme URL-check (voegt automatisch https:// toe als de gebruiker het vergeet)
    let scanUrl = url.trim();
    if (scanUrl && !scanUrl.startsWith("http")) {
      scanUrl = "https://" + scanUrl;
      setUrl(scanUrl); // Update het invoerveld voor de gebruiker
    }

    if (!scanUrl || !scanUrl.startsWith("http")) {
      setError("Please enter a valid URL.");
      return;
    }

    setLoading(true);

    try {
      // Wacht kunstmatig heel even extra (1 seconde) zodat de coole animatie altijd goed zichtbaar is voor de gebruiker
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const endpoint = scanMode === "seo" ? "/api/seo" : scanMode === "geo" ? "/api/geo" : "/api/scan";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scanUrl }),
      });

      if (!res.ok) {
        let errorMessage = "Scan failed. Please try again.";
        try {
          const errData = await res.json();
          if (errData.error) errorMessage = errData.error;
        } catch {} // Negeer fouten als er geen geldige JSON is
        throw new Error(errorMessage);
      }

      const data = await res.json();
      // Koppel de gekozen scanMode aan het resultaat
      setResult({ ...data, scanMode, url: scanUrl });
      // Persist result for the results page
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lastResult', JSON.stringify({ ...data, scanMode, url: scanUrl }));
      }
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
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 16px 40px 16px",
      }}
    >
      {/* Subtiele Rode Gloed op de achtergrond */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 800, height: 600,
        background: "radial-gradient(circle at top center, rgba(255,0,0,0.15) 0%, rgba(5,5,5,0) 70%)",
        pointerEvents: "none", zIndex: 0
      }} />
      
      {/* Dynamische gekleurde gloed voor SEO/GEO */}
      {scanMode === "seo" && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 800, height: 600, background: "radial-gradient(circle at top center, rgba(0,255,153,0.15) 0%, rgba(5,5,5,0) 70%)", pointerEvents: "none", zIndex: 0 }} />}
      {scanMode === "geo" && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 800, height: 600, background: "radial-gradient(circle at top center, rgba(0,170,255,0.15) 0%, rgba(5,5,5,0) 70%)", pointerEvents: "none", zIndex: 0 }} />}

      {/* Global Navigation Bar */}
      <header style={{
        position: "relative",
        zIndex: 100,
        width: "100%", 
        maxWidth: 1200, 
        display: "flex", 
        flexWrap: "wrap",
        gap: "16px",
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
              <div className="coreDropdown" style={{
                position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                background: "rgba(10, 10, 10, 0.95)", border: "1px solid #333", borderRadius: 16, padding: "24px",
                width: "90vw", maxWidth: 820, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.8)", zIndex: 50, backdropFilter: "blur(10px)"
              }}>
                <div>
                  <h4 style={{ color: "#888", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px 16px" }}>Intelligence Engines</h4>
                  <DropdownItem icon="🧠" title="AI & Search Engine" href="https://fajaede-search-frontend.vercel.app" target="_blank" rel="noopener noreferrer" />
                  <DropdownItem icon="🔍" title="SEO & Audit Engine" />
                  <DropdownItem icon="📊" title="SERP Intelligence" />
                  <DropdownItem icon="🛡️" title="PSA Certification" color="#ffdd00" />
                </div>
                <div>
                  <h4 style={{ color: "#888", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px 16px" }}>Tools & Automation</h4>
                  <DropdownItem icon="🚀" title="FajaedeSEO AI" color="#00ff99" href="https://www.fajaede.nl/download" />
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
      <section style={{ position: "relative", zIndex: 10, maxWidth: 800, textAlign: "center", marginBottom: 40, marginTop: 40 }}>
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
          <span style={{ color: "#ffdd00", fontWeight: "bold" }}>FajaedeAI</span>
          <span style={{ color: "#999", fontWeight: 500 }}>The Ultimate Intelligence Layer</span>
        </div>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 900, marginTop: 24, marginBottom: 16, lineHeight: 1.1, letterSpacing: -1 }}>
          The Intelligence Layer <br/>
          for <span style={{ 
            color: scanMode === "psa" ? "#ff0000" : scanMode === "seo" ? "#00ff99" : "#00aaff",
            transition: "color 0.3s"
          }}>
            {scanMode === "psa" && "Digital Trust"}
            {scanMode === "seo" && "Search Dominance"}
            {scanMode === "geo" && "Local Visibility"}
          </span>
        </h1>
        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#aaa", marginBottom: 32, maxWidth: 640, margin: "0 auto 32px auto", lineHeight: 1.5 }}>
          {scanMode === "psa" && "De alles-in-één scan voor Privacy, Security & Age compliance. Scan jouw website gratis en ontdek of je in aanmerking komt voor het onkopieerbare PSA Certificaat."}
          {scanMode === "seo" && "De ultieme SEO Audit Engine voor FajaedeSEO AI klanten. Analyseer direct on-page factoren, backlinks en technische pijnpunten."}
          {scanMode === "geo" && "Domineer jouw lokale markt. Check live je Google Maps posities en lokale autoriteit voor specifieke zoekwoorden en regio's."}
        </p>

        {/* Multi-Tool Tab Switcher */}
        <div style={{ display: "inline-flex", gap: 8, background: "rgba(255,255,255,0.05)", padding: 6, borderRadius: 999, marginBottom: 16, position: "relative", zIndex: 10, border: "1px solid #333", backdropFilter: "blur(10px)" }}>
            <button className="tabBtn" onClick={() => setScanMode("psa")} style={{ padding: "12px 24px", borderRadius: 999, border: "none", background: scanMode === "psa" ? "#ff0000" : "transparent", color: scanMode === "psa" ? "#fff" : "#aaa", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontSize: 14 }}><span>🛡️ PSA Trust</span></button>
            <button className="tabBtn" onClick={() => setScanMode("seo")} style={{ padding: "12px 24px", borderRadius: 999, border: "none", background: scanMode === "seo" ? "#00ff99" : "transparent", color: scanMode === "seo" ? "#000" : "#aaa", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontSize: 14 }}><span>📈 SEO Audit</span></button>
            <button className="tabBtn" onClick={() => setScanMode("geo")} style={{ padding: "12px 24px", borderRadius: 999, border: "none", background: scanMode === "geo" ? "#00aaff" : "transparent", color: scanMode === "geo" ? "#fff" : "#aaa", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontSize: 14 }}><span>🌍 GEO Local</span></button>
        </div>
      </section>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="searchForm" style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        maxWidth: 720,
        marginBottom: 24,
        boxShadow: "0 10px 40px rgba(255,0,0,0.1)"
      }}>
        <div className="searchWrapper" style={{ position: "relative", display: "flex", alignItems: "center", flex: 1 }}>
          <input
            type="url"
            placeholder="https://jouwwebsite.nl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{
              flex: 1,
              padding: "18px 24px",
              paddingRight: "56px",
              borderRadius: 999,
              border: "1px solid #444",
              background: "rgba(10,10,10,0.8)",
              backdropFilter: "blur(10px)",
              color: "#f5f5f5",
              fontSize: 16,
              outline: "none",
              transition: "border 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#ff0000")}
            onBlur={(e) => (e.target.style.borderColor = "#444")}
          />
          <button className="searchBtn" type="submit" disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21 20l-5.6-5.6a7 7 0 10-1.4 1.4L20 21zM10 16a6 6 0 110-12 6 6 0 010 12z"/></svg>
            <span>{loading ? "Scanning..." : `Scan ${scanMode.toUpperCase()}`}</span>
          </button>
        </div>
      </form>

      {/* De Live Terminal Animatie */}
      {loading && (
        <div style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 720,
          background: "#000",
          border: "1px solid #333",
          borderRadius: 12,
          padding: 24,
          marginBottom: 32,
          fontFamily: "monospace",
          boxShadow: "inset 0 0 20px rgba(0,0,0,1)"
        }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff4d4f" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffdd00" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00ff99" }} />
          </div>
          {getLoadingSteps().map((step, index) => (
            <div key={index} style={{ color: index === loadingStep ? (scanMode === "psa" ? "#ffdd00" : scanMode === "seo" ? "#00ff99" : "#00aaff") : index < loadingStep ? "#555" : "transparent", fontSize: 14, marginBottom: 8, transition: "color 0.1s" }}>
              <span style={{ opacity: 0.5, marginRight: 8 }}>{`[${new Date().toISOString().substring(11, 23)}]`}</span> {step}
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            position: "relative",
            zIndex: 10,
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

      {/* Social Proof Counter */}
      {!result && !loading && (
        <div style={{ position: "relative", zIndex: 10, marginTop: 4, display: "flex", alignItems: "center", gap: 10, background: "rgba(0, 255, 153, 0.05)", border: "1px solid rgba(0, 255, 153, 0.2)", padding: "8px 20px", borderRadius: 999, color: "#00ff99", fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>
          {/* De oplichtende neon-stip */}
          <span style={{ display: "inline-block", width: 8, height: 8, background: "#00ff99", borderRadius: "50%", boxShadow: "0 0 10px #00ff99" }}></span>
          <span>1,423 websites beveiligd en geoptimaliseerd deze maand</span>
        </div>
      )}

      {/* Informatie sectie - Alleen zichtbaar als er GEEN zoekresultaat is */}
      {!result && !loading && (
        <section style={{ position: "relative", zIndex: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, width: "100%", maxWidth: 1000, marginTop: 48 }}>
          
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 16, padding: 32, transition: "transform 0.2s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🔒</div>
            <h3 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>Privacy & GDPR</h3>
            <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Zorg dat jouw website voldoet aan de laatste AVG wetgeving. Wij controleren direct op de aanwezigheid van correcte cookie banners en privacy policies.
            </p>
          </div>

          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 16, padding: 32, transition: "transform 0.2s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🛡️</div>
            <h3 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>Technical Security</h3>
            <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Bescherm je bezoekers tegen datalekken. Onze bot controleert of SSL-certificaten aanwezig zijn en je data veilig en versleuteld verstuurd wordt.
            </p>
          </div>

          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 16, padding: 32, transition: "transform 0.2s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🔞</div>
            <h3 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>Age & Content Check</h3>
            <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Voorkom dat je website ten onrechte als schadelijk of adult (18+) gemarkeerd wordt. De AI analyseert je teksten op risico-woorden.
            </p>
          </div>

        </section>
      )}

      {!result && !loading && (
        <div style={{ position: "relative", zIndex: 10, marginTop: 64, textAlign: "center" }}>
          <p style={{ color: "#555", fontSize: 13, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>Trusted by forward-thinking websites</p>
          <div style={{ display: "flex", gap: 32, justifyContent: "center", opacity: 0.3, filter: "grayscale(100%)" }}>
            {/* Fake logo placeholders, you can replace these with real clients later */}
            <div style={{ fontWeight: 900, fontSize: 20 }}>TechCorp</div>
            <div style={{ fontWeight: 900, fontSize: 20 }}>FajaedeSEO</div>
            <div style={{ fontWeight: 900, fontSize: 20 }}>WebSecure</div>
            <div style={{ fontWeight: 900, fontSize: 20 }}>DutchDesign</div>
          </div>
        </div>
      )}


      {/* RESULTAAT: SEO & GEO AUDIT (De Upsell naar de WP Plugin) */}
      {result && (result.scanMode === "seo" || result.scanMode === "geo") && (
        <section
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: 720,
            marginTop: 8,
            padding: 32,
            borderRadius: 16,
            background: "#111",
            border: `1px solid ${result.scanMode === "seo" ? "#00ff99" : "#00aaff"}`,
            boxShadow: `0 10px 40px ${result.scanMode === "seo" ? "rgba(0,255,153,0.1)" : "rgba(0,170,255,0.1)"}`,
            display: "flex",
            flexDirection: "column",
            gap: 24,
            textAlign: "center"
          }}
        >
          <h2 style={{ fontSize: 28, color: "#fff", margin: 0, fontWeight: 900 }}>
            {result.scanMode === "seo" ? "SEO & Privacy Audit Report" : "GEO Local Audit Report"}
          </h2>
          <p style={{ color: "#aaa", margin: 0, fontSize: 16 }}>Geanalyseerd domein: <strong style={{ color: "#fff" }}>{result.url}</strong></p>

          {/* CACHE & PREMIUM UPSELL BANNER ("The Big Boy Way") */}
          {result.fromCache && (
            <div style={{ background: "rgba(255, 221, 0, 0.05)", border: "1px solid rgba(255, 221, 0, 0.4)", borderRadius: 12, padding: 24, textAlign: "left", boxShadow: "0 4px 20px rgba(255, 221, 0, 0.1)", marginTop: 16 }}>
              <h4 style={{ color: "#ffdd00", margin: "0 0 8px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <span>⚡</span> Opgeslagen Rapport (Cache)
              </h4>
              <p style={{ color: "#ccc", margin: "0 0 16px 0", fontSize: 14, lineHeight: 1.5 }}>
                Dit is een eerder gegenereerde scan van <strong>{new Date(result.cachedAt!).toLocaleString("nl-NL")}</strong>. Heb je zojuist aanpassingen gedaan aan je website en wil je een nieuwe, live re-crawl uitvoeren om te zien of je fouten zijn opgelost?
              </p>
              <button 
                style={{ background: "#ffdd00", color: "#000", border: "none", padding: "12px 20px", borderRadius: 8, fontWeight: 800, cursor: "pointer", fontSize: 14, transition: "transform 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'} 
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Upgrade naar Premium voor Live Re-crawls 🚀
              </button>
            </div>
          )}

          {/* De Schokkende Score */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "32px 0" }}>
            <div style={{ width: 140, height: 140, borderRadius: "50%", border: "4px solid #ff4d4f", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "rgba(255,0,0,0.05)", boxShadow: "0 0 30px rgba(255,0,0,0.2)" }}>
                <span style={{ fontSize: 42, fontWeight: 900, color: "#ff4d4f" }}>{result.trustScore}</span>
                <span style={{ fontSize: 14, color: "#aaa" }}>/ 100</span>
            </div>
          </div>

          {/* THE 3D GLOBE / GEO RADAR EFFECT (Alleen voor GEO Scans) */}
          {result.scanMode === "geo" && (
            <div style={{ position: "relative", width: "100%", height: 200, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", borderRadius: 12, background: "#020813", border: "1px solid #003366", marginBottom: 24, boxShadow: "inset 0 0 40px rgba(0,170,255,0.2)" }}>
              {/* CSS Animated Grid/Radar for "AI Citation Platform" feel */}
              <div style={{ position: "absolute", width: 400, height: 400, background: "conic-gradient(from 0deg, transparent 70%, rgba(0, 170, 255, 0.6) 100%)", borderRadius: "50%", animation: "spin 3s linear infinite" }}></div>
              <div style={{ position: "absolute", width: "100%", height: "100%", background: "repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,170,255,0.15) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,170,255,0.15) 20px)" }}></div>
              <div style={{ zIndex: 2, background: "rgba(0,0,0,0.8)", padding: "10px 24px", borderRadius: 999, border: "1px solid #00aaff", color: "#00aaff", fontSize: 15, fontWeight: 900, backdropFilter: "blur(4px)", textTransform: "uppercase", letterSpacing: 1, boxShadow: "0 0 20px rgba(0,170,255,0.4)" }}>
                🌍 AI Global Citation Network Active
              </div>
              <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 100% { transform: rotate(360deg); } }` }} />
            </div>
          )}

          {/* Pijnpunten / Issues benadrukken */}
          <div style={{ background: "rgba(255,0,0,0.05)", border: "1px solid rgba(255,0,0,0.2)", borderRadius: 12, padding: 24, textAlign: "left" }}>
            <h3 style={{ color: "#ff4d4f", margin: "0 0 16px 0", fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <span>⚠️</span> Kritieke {result.scanMode === "seo" ? "Website & Privacy" : "Lokale"} Problemen Gevonden
            </h3>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {result.criticalIssues?.map((issue, idx) => (
                <li key={idx} style={{ color: "#eee", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#ff4d4f" }}>✖</span> {issue}
                </li>
              ))}
            </ul>
          </div>

          {/* DE OPLOSSING: Massive Call To Action naar de Download */}
          <div style={{ background: "linear-gradient(135deg, #1a1a1a, #050505)", padding: 32, borderRadius: 12, border: "1px solid #333", marginTop: 8 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
            <h3 style={{ color: "#fff", fontSize: 22, marginBottom: 12 }}>Fix alles met FajaedeSEO AI</h3>
            <p style={{ color: "#aaa", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              Verlies geen organisch verkeer meer door technische CMS- of privacyfouten in je website. Koppel jouw website aan onze Intelligence Layer en laat de AI alles automatisch optimaliseren.
            </p>
            <a 
              href="https://www.fajaede.nl/download" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ display: "inline-block", width: "100%", padding: "18px 24px", background: result.scanMode === "seo" ? "#00ff99" : "#00aaff", color: "#000", fontWeight: 900, fontSize: 16, textTransform: "uppercase", letterSpacing: 1, borderRadius: 8, textDecoration: "none", boxShadow: `0 4px 20px ${result.scanMode === "seo" ? "rgba(0,255,153,0.3)" : "rgba(0,170,255,0.3)"}`, transition: "transform 0.2s" }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'} 
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Koppel met FajaedeSEO AI (Start Direct)
            </a>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, color: "#888", fontSize: 13, marginTop: 20, flexWrap: "wrap", fontWeight: 500 }}>
              <span>✓ WordPress & Elementor</span>
              <span>✓ Shopify & Wix</span>
              <span>✓ Universele API</span>
            </div>
          </div>
        </section>
      )}


      {/* RESULTAAT: ORIGINELE PSA SCAN CARD */}
      {result && (!result.scanMode || result.scanMode === "psa") && (
        <section
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: 720,
            marginTop: 8,
            padding: 20,
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(255, 0, 0, 0.18), rgba(255, 221, 0, 0.16))",
            border: "1px solid rgb(51, 51, 51)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "radial-gradient(circle at 30% 0%, rgb(255, 221, 0), rgb(255, 0, 0) 60%, rgb(51, 0, 0) 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "rgb(17, 17, 17) 0px 0px 0px 2px, rgba(255, 0, 0, 0.7) 0px 0px 20px" }}>
              <span style={{ fontWeight: 900, fontSize: 18, color: "rgb(255, 255, 255)", textShadow: "rgba(0, 0, 0, 0.7) 0px 1px 3px" }}>PSA</span>
            </div>
            <div>
              <div style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 1, color: "rgb(255, 221, 0)", marginBottom: 4 }}>PSA Certified by fajaedeAI</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Scan result for {result.url}</div>
              <div style={{ fontSize: 13, color: "rgb(221, 221, 221)" }}>Status: <strong style={{ color: "rgb(0, 255, 153)" }}>OK</strong></div>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0px, 1fr))", gap: 12, marginTop: 4 }}>
            <ScoreBox label="Privacy" score={result.privacy?.score || "N/A"} note={result.privacy?.note || "Geen data"} />
            <ScoreBox label="Security" score={result.security?.score || "N/A"} note={result.security?.note || "Geen data"} />
            <ScoreBox label="Age" score={result.age?.score || "N/A"} note={result.age?.note || "Geen data"} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 8, fontSize: 13 }}>
            <span style={{ color: "rgb(238, 238, 238)" }}>View or share the full PSA report:</span>
            <a 
              href={result.reportUrl || `/report?url=${encodeURIComponent(result.url || "")}`} 
              target="_blank" 
              rel="noreferrer" 
              style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid rgb(255, 221, 0)", color: "rgb(17, 17, 17)", background: "rgb(255, 221, 0)", fontWeight: 600, textDecoration: "none" }}
            >
              Open PSA report
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
