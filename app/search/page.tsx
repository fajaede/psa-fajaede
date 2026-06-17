"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // AI LLAMA 3 STATES
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    setAiResponse("");
    
    try {
      // Haal bliksemsnel de websites op uit Meilisearch
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.hits || []);
      const hits = data.hits || [];
      
      // START DE LLAMA 3 AI GENERATOR
      setAiLoading(true);
      
      // Pak de content van de top 3 resultaten om aan de AI te voeren als 'kennis'
      const context = hits.slice(0, 3).map((h: any) => `Bron: ${h.url}\nInhoud: ${h.content?.substring(0, 500)}`).join("\n\n");

      // Vraag het echte antwoord aan Llama 3 via onze bridge
      try {
        const aiRes = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, context })
        });
        
        const aiData = await aiRes.json();
        if (aiData.response) {
          setAiResponse(aiData.response);
        } else {
          setAiResponse("De AI kon op dit moment geen samenvatting genereren.");
        }
      } catch (err) {
        setAiResponse("AI is momenteel niet bereikbaar.");
      }
      setAiLoading(false);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "#050505", color: "#f5f5f5", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 64px 16px" }}>
      
      <header style={{ width: "100%", maxWidth: 1200, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ fontWeight: 900, fontSize: 24, color: "#fff", letterSpacing: -1 }}>
            fajaede<span style={{ color: "#ffdd00" }}>AI</span>
          </div>
        </Link>
        <nav style={{ display: "flex", gap: 32 }}>
          <Link href="/" style={{ color: "#aaa", textDecoration: "none", fontWeight: 600 }}>Scanner</Link>
          <Link href="/search" style={{ color: "#fff", textDecoration: "none", fontWeight: 600 }}>Zoekmachine</Link>
        </nav>
      </header>

      <div style={{ width: "100%", maxWidth: 800, marginTop: hasSearched ? 40 : 120, transition: "all 0.5s ease" }}>
        
        {/* Logo & Titel */}
        <div style={{ textAlign: "center", marginBottom: 40, display: hasSearched ? "none" : "block" }}>
          <h1 style={{ fontSize: 64, fontWeight: 900, letterSpacing: -2, margin: 0 }}>
            fajaede<span style={{ color: "#00aaff" }}>Search</span>
          </h1>
          <p style={{ color: "#888", fontSize: 18, marginTop: 12 }}>Doorzoek 100.000+ geverifieerde Europese domeinen met AI.</p>
        </div>

        {/* Zoekbalk */}
        <form onSubmit={handleSearch} style={{ position: "relative", width: "100%", boxShadow: "0 10px 40px rgba(0, 170, 255, 0.15)" }}>
          <input 
            type="text" 
            placeholder="Zoek naar bedrijven, content of AI rapporten..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", padding: "20px 24px", fontSize: 18, borderRadius: 999, border: "1px solid #333", background: "rgba(20,20,20,0.8)", color: "#fff", outline: "none", boxSizing: "border-box" }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ position: "absolute", right: 8, top: 8, bottom: 8, padding: "0 24px", borderRadius: 999, background: "#00aaff", color: "#000", border: "none", fontWeight: "bold", fontSize: 15, cursor: "pointer" }}
          >
            {loading ? "Zoeken..." : "Zoek"}
          </button>
        </form>

        {/* LLAMA 3 AI SAMENVATTING (De 4 regels erboven!) */}
        {hasSearched && !loading && (
          <div style={{ marginTop: 32, padding: 24, borderRadius: 16, background: "linear-gradient(135deg, rgba(0, 170, 255, 0.1), rgba(0,0,0,0))", border: "1px solid rgba(0, 170, 255, 0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 24, animation: aiLoading ? "spin 2s linear infinite" : "none" }}>{aiLoading ? "⏳" : "✨"}</span>
              <h3 style={{ margin: 0, color: "#00aaff", fontSize: 18 }}>Llama 3 AI Samenvatting</h3>
            </div>
            
            {aiLoading ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 8, height: 8, background: "#00aaff", borderRadius: "50%", animation: "pulse 1.5s infinite" }}></div>
                <div style={{ width: 8, height: 8, background: "#00aaff", borderRadius: "50%", animation: "pulse 1.5s infinite 0.2s" }}></div>
                <div style={{ width: 8, height: 8, background: "#00aaff", borderRadius: "50%", animation: "pulse 1.5s infinite 0.4s" }}></div>
                <span style={{ color: "#888", marginLeft: 8, fontSize: 14 }}>De AI analyseert de resultaten...</span>
              </div>
            ) : (
              <p style={{ color: "#ddd", lineHeight: 1.6, margin: 0, fontSize: 15 }}>
                {aiResponse}
              </p>
            )}
          </div>
        )}

        {/* Resultaten Lijst */}
        {hasSearched && !loading && (
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 24 }}>
            {results.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center", padding: 40 }}>Geen resultaten gevonden voor "{query}".</p>
            ) : (
              results.map((hit, idx) => (
                <div key={idx} style={{ padding: 20, background: "#111", borderRadius: 12, border: "1px solid #222" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <a href={hit.url} target="_blank" rel="noopener noreferrer" style={{ color: "#00aaff", textDecoration: "none", fontSize: 18, fontWeight: 600 }}>
                      {hit.title || hit.pageTitle || hit.url}
                    </a>
                    {hit.trust_score && (
                      <span style={{ background: "rgba(0,255,153,0.1)", color: "#00ff99", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: "bold", border: "1px solid rgba(0,255,153,0.3)" }}>
                        TrustScore: {hit.trust_score}
                      </span>
                    )}
                  </div>
                  <div style={{ color: "#00ff99", fontSize: 13, marginBottom: 12 }}>{hit.url}</div>
                  <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.5, margin: 0 }}>
                    {hit.content ? (hit.content.length > 200 ? hit.content.substring(0, 200) + "..." : hit.content) : "Geen beschrijving beschikbaar voor deze website."}
                  </p>
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #222", display: "flex", gap: 12 }}>
                     <Link href={`/?url=${encodeURIComponent(hit.url)}`} style={{ fontSize: 13, color: "#888", textDecoration: "none", border: "1px solid #333", padding: "6px 12px", borderRadius: 6, background: "#1a1a1a" }}>
                       🔍 Live Audit
                     </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </main>
  );
}
