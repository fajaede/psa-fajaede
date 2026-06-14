import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export default async function EmbedBadge({ searchParams }: { searchParams: { url?: string } }) {
  const url = searchParams.url;
  let trustScore = 100;
  let isCertified = false;

  if (url) {
    // Zoek de meest recente scan voor dit domein
    const report = await prisma.psaScan.findFirst({
      where: { url },
      orderBy: { createdAt: "desc" },
    });

    if (report) {
      if (report.securityScore?.includes("S1")) trustScore -= 30;
      if (report.privacyScore?.includes("P1")) trustScore -= 20;
      if (report.ageScore?.includes("A3")) trustScore -= 10;
      isCertified = true;
    }
  }

  const isGold = trustScore >= 90;

  // Referer check: Checken of de widget wel op het juiste domein staat!
  if (isCertified && url) {
    const referer = (await headers()).get("referer") || "";
    const cleanUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    
    // Als de referer niet leeg is, en niet overeenkomt met de geregistreerde URL, dan blokkeren we de badge
    if (referer && !referer.includes(cleanUrl)) {
      isCertified = false;
    }
  }

  return (
    <main style={{ 
      width: "100%", 
      height: "100vh", 
      display: "flex", 
      justifyContent: "center",
      alignItems: "center",
      margin: 0,
      padding: 0,
      overflow: "hidden",
      background: "transparent" // Laat de website-achtergrond van de klant intact
    }}>
      {/* Globale style om de standaard Next.js body marge weg te halen */}
      <style dangerouslySetInnerHTML={{ __html: `body { margin: 0; background: transparent !important; }` }} />
      
      <div style={{
        width: 136, // Iets kleiner dan 140 ivm de border
        height: 136,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: isCertified ? "linear-gradient(135deg, #1a1a1a, #050505)" : "#330000",
        borderRadius: "16px",
        border: isCertified ? (isGold ? "2px solid #ffdd00" : "1px solid #555") : "2px solid #ff4d4f",
        boxShadow: isCertified ? "0 4px 12px rgba(0,0,0,0.5)" : "none",
        color: "#fff",
        textAlign: "center",
        userSelect: "none", // Maakt tekst niet selecteerbaar
      }}>
        {isCertified ? (
           <>
             <div style={{ fontSize: 13, fontWeight: 900, color: isGold ? "#ffdd00" : "#fff", letterSpacing: 1, textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                {isGold ? "PSA GOLD" : "CERTIFIED"}
             </div>
             <div style={{ fontSize: 36, fontWeight: 900, margin: "6px 0", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                {trustScore}<span style={{ fontSize: 14, color: "#888" }}>/100</span>
             </div>
             <div style={{ fontSize: 10, textTransform: "uppercase", color: "#aaa", letterSpacing: 0.5 }}>
               fajaedeAI
             </div>
           </>
        ) : (
           <div style={{ padding: 12, fontSize: 12, fontWeight: 700, color: "#ffcccc" }}>
             UNVERIFIED DOMAIN
           </div>
        )}
      </div>
    </main>
  );
}