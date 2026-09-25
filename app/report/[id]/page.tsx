import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ReportClient from "./ReportClient";

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
  let trustScore = 100;
  if (report.securityScore?.includes("S1")) trustScore -= 30;
  if (report.privacyScore?.includes("P1")) trustScore -= 20;
  if (report.ageScore?.includes("A3")) trustScore -= 10;

  let benchmark: { total: number; percentile: number } | null = null;
  try {
    const meilisearchHost = process.env.MEILISEARCH_HOST;
    const meilisearchApiKey = process.env.MEILISEARCH_API_KEY;
    const indexName = process.env.MEILISEARCH_INDEX || "pages";
    if (!meilisearchHost || !meilisearchApiKey) throw new Error("Benchmark datastore is not configured");

    // 1. Vraag het totale aantal websites in jouw Meilisearch database
    const statsRes = await fetch(`${meilisearchHost}/indexes/${indexName}/stats`, {
      headers: { Authorization: `Bearer ${meilisearchApiKey}` },
      next: { revalidate: 3600 },
    });
    
    if (statsRes.ok) {
      const stats = await statsRes.json();
      if (!Number.isInteger(stats.numberOfDocuments) || stats.numberOfDocuments <= 0) throw new Error("Benchmark datastore returned no document count");
      benchmark = { total: stats.numberOfDocuments, percentile: 1 };
    }

    if (!benchmark) throw new Error("Benchmark stats request failed");

    // 2. Vraag Meilisearch hoeveel websites een LAGERE (slechtere) score hebben
    const searchRes = await fetch(`${meilisearchHost}/indexes/${indexName}/search`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${meilisearchApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ limit: 0, filter: `trust_score < ${trustScore}` })
    });
    
    if (!searchRes.ok) throw new Error("Benchmark search request failed");
    const searchData = await searchRes.json();
    const worseCount = searchData.estimatedTotalHits ?? searchData.totalHits;
    if (!Number.isInteger(worseCount) || worseCount < 0) throw new Error("Benchmark search returned no count");
    benchmark.percentile = Math.min(99, Math.max(1, Math.round((worseCount / benchmark.total) * 100)));
  } catch (error) {
    console.warn("Live benchmark unavailable:", error);
  }

  // Zet dates om naar strings voor de client component
  const safeReport = {
    ...report,
    createdAt: report.createdAt.toISOString(),
    expiresAt: report.expiresAt ? report.expiresAt.toISOString() : null,
    isPaid: report.isPaid || false,
    benchmark,
  };

  return <ReportClient report={safeReport} />;
}