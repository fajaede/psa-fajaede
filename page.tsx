import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export const dynamic = "force-dynamic"; // Voorkomt database queries tijdens het Vercel bouwproces

export default async function EmbedBadge({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const params = await searchParams;
  const url = params.url;
  let trustScore = 100;
  let isCertified = false;
  let urlHash = "";

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
      // Check of deze klant daadwerkelijk de factuur betaald heeft
      isCertified = report.isPaid === true;
      urlHash = report.urlHash;
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
        background: isCertified ? "transparent" : "#330000",
        borderRadius: "16px",
        border: isCertified ? "none" : "2px solid #ff4d4f",
        boxShadow: "none",
        color: "#fff",
        textAlign: "center",
        userSelect: "none", // Maakt tekst niet selecteerbaar
        overflow: "hidden",
      }}>
        {isCertified ? (
           <a 
             href={`/report/${urlHash}`} 
             target="_blank" 
             rel="noopener noreferrer" 
             title="Bekijk officieel PSA Certificaat"
             style={{ position: "relative", width: "100%", height: "100%", display: "block", textDecoration: "none" }}
           >
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img 
               src={isGold ? "/fajaede-privacy-badge-gold.jpg" : "/fajaede-privacy-badge-silver.jpg"} 
               alt={isGold ? "PSA Gold Badge" : "PSA Silver Badge"} 
               draggable={false}
               onContextMenu={(e) => e.preventDefault()}
               style={{ width: "100%", height: "100%", objectFit: "contain" }} 
             />
             {/* Dynamische Score Overlay bovenop jouw afbeelding! */}
             <div style={{ 
               position: "absolute", 
               top: "58%", /* Iets onder het midden voor het visuele zwaartepunt van een schild */
               left: "50%", 
               transform: "translate(-50%, -50%)", 
               width: 48,
               height: 48,
               display: "flex",
               justifyContent: "center",
               alignItems: "center",
               background: "linear-gradient(135deg, rgba(20,20,20,0.95), rgba(5,5,5,0.98))", /* Strak donker rondje */
               border: isGold ? "2px solid rgba(255, 221, 0, 0.7)" : "2px solid rgba(200, 200, 200, 0.5)", /* Goud of zilver randje */
               borderRadius: "50%",
               boxShadow: "0 4px 12px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.15)", /* Prachtig 3D effect */
               fontSize: 22, 
               fontWeight: 900, 
               color: isGold ? "#ffdd00" : "#ffffff", 
               textShadow: "0 2px 4px rgba(0,0,0,0.8)",
               letterSpacing: -0.5
             }}>
               {trustScore}
             </div>
           </a>
        ) : (
           <div style={{ padding: 12, fontSize: 12, fontWeight: 700, color: "#ffcccc" }}>
             UNVERIFIED DOMAIN
           </div>
        )}
      </div>
    </main>
  );
}