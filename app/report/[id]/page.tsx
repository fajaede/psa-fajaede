"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setResult(null);

  // Voeg https:// toe als ontbreekt
  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = "https://" + cleanUrl;
  }

  if (!cleanUrl.startsWith("http")) {
    setError("Voer een geldige URL in (bijv. example.com)");
    return;
  }

  setLoading(true);
  try {
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: cleanUrl }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Scan mislukt");
    }

    const data = await res.json();
    setResult(data);
  } catch (err) {
    setError(err.message || "Er is iets misgegaan.");
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
        padding: "40px 16px",
      }}
    >
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
          PSA = Privacy • Security • Age. Paste a URL, let fajaedeAI scan it.
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
          type="text"
          placeholder="example.com of https://example.com"
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
            padding: 20,
            borderRadius: 16,
            background:
              "linear-gradient(135deg, rgba(255,0,0,0.18), rgba(255,221,0,0.16))",
            border: "1px solid #333",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* PSA shield visual */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background:
                  "radial-gradient(circle at 30% 0%, #ffdd00, #ff0000 60%, #330000 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 0 2px #111, 0 0 20px rgba(255,0,0,0.7)",
              }}
            >
              <span
                style={{
                  fontWeight: 900,
                  fontSize: 18,
                  color: "#fff",
                  textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                }}
              >
                PSA
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "#ffdd00",
                  marginBottom: 4,
                }}
              >
                PSA Certified by fajaedeAI
              </div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {result.url}
              </div>
              <div style={{ fontSize: 13, color: "#ddd" }}>
                Status: <strong style={{ color: "#00ff99" }}>
                  {result.status.toUpperCase()}
                </strong>{" "}
                {result.fromCache && "(from cache)"}
              </div>
            </div>
          </div>

          {/* Scores */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
              marginTop: 4,
            }}
          >
            <ScoreBox label="Privacy" score={result.privacy.score} note={result.privacy.note} />
            <ScoreBox label="Security" score={result.security.score} note={result.security.note} />
            <ScoreBox label="Age" score={result.age.score} note={result.age.note} />
          </div>

          {/* Report link */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 8,
              fontSize: 13,
            }}
          >
            <span style={{ color: "#eee" }}>
              View or share the full PSA report:
            </span>
            <a
              href={result.reportUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid #ffdd00",
                color: "#111",
                background: "#ffdd00",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Open PSA report
            </a>
          </div>
        </section>
      )}
console.log("REPORT PARAM ID:", id);

      <footer style={{ marginTop: "auto", paddingTop: 40, fontSize: 12, color: "#777" }}>
        © {new Date().getFullYear()} fajaede.nl · PSA – Privacy Security Age · fajaedeAI
      </footer>
    </main>
  );
}

function ScoreBox({ label, score, note }) {
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

