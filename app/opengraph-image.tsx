import { ImageResponse } from "next/og";

// Share image for links on LinkedIn, WhatsApp, Slack, ... (1200x630).
export const alt = "FajaedeAI Core: gratis privacy-, beveiligings- en SEO-scan voor je website";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "72px 80px", color: "#eef1fb",
          background: "radial-gradient(120% 140% at 0% 0%, #1c2450 0%, #0b1020 60%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: "#a5f3fc", textTransform: "uppercase" }}>psa.fajaede.nl</div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, marginTop: 18, lineHeight: 1.05 }}>FajaedeAI Core</div>
        <div style={{ display: "flex", fontSize: 38, marginTop: 22, color: "#c7d2fe", lineHeight: 1.3, maxWidth: 1060 }}>
          Gratis scan op privacy, beveiliging, SEO en AI-vindbaarheid
        </div>
        <div style={{ display: "flex", marginTop: 44, gap: 16, fontSize: 26 }}>
          {["Privacy", "Beveiliging", "SEO", "GEO", "AI"].map((label) => (
            <div key={label} style={{ display: "flex", padding: "10px 22px", borderRadius: 999, border: "2px solid #6366f1", color: "#e0e7ff" }}>
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
