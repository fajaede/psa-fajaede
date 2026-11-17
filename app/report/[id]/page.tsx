import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ReportClient from "./ReportClient";
import { psaTrustScore } from "@/lib/psa-score";
import { compareWithBenchmark } from "@/lib/benchmark-api";

export const dynamic = "force-dynamic"; // Voorkomt database queries tijdens het Vercel bouwproces

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const report = await prisma.psaScan.findUnique({
    where: { urlHash: id }
  });

  if (!report) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center", color: "#fff", background: "#050505", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>Report Not Found</h1>
        <p style={{ color: "#aaa" }}>We konden geen geldig PSA-rapport vinden voor deze URL. Mogelijk is de scan verlopen.</p>
        <Link href="/" style={{ padding: "12px 24px", background: "#ff0000", color: "#fff", borderRadius: 8, marginTop: "24px", display: "inline-block", textDecoration: "none", fontWeight: "bold" }}>
          Terug naar de scanner
        </Link>
      </div>
    );
  }

  // --- BENCHMARK LOGICA ---
  const trustScore = psaTrustScore(report);

  // Fajaede-benchmark: PSA-score vergeleken met vergelijkbare sites (zelfde land en categorie).
  // Geen benchmark beschikbaar -> geen blok, nooit een geschat getal.
  const comparison = await compareWithBenchmark(report.url, { psa: trustScore });
  const psaBenchmark = comparison?.metrics.psa;
  const benchmark = psaBenchmark
    ? { total: psaBenchmark.groupSize, percentile: psaBenchmark.percentile, topPercent: psaBenchmark.topPercent, cohortLabel: psaBenchmark.cohortLabel }
    : null;

  // Zet dates om naar strings voor de client component
  const safeReport = {
    ...report,
    createdAt: report.createdAt.toISOString(),
    expiresAt: report.expiresAt ? report.expiresAt.toISOString() : null,
    isPaid: report.isPaid || false,
    benchmark,
    badgeBaseUrl: (process.env.PSA_APP_URL?.trim() || "https://psa.fajaede.nl").replace(/\/+$/, ""),
  };

  return <ReportClient report={safeReport} />;
}