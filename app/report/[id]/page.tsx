import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ReportClient from "./ReportClient";

export default async function ReportPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Zoek het rapport op basis van de veilige URL Hash in de database
  const report = await prisma.psaScan.findFirst({
    where: { urlHash: id },
  });

  if (!report) {
    return (
      <div style={{ padding: "80px 20px", color: "white", textAlign: "center", fontFamily: "sans-serif", background: "#050505", minHeight: "100vh" }}>
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>Report Not Found</h1>
        <p style={{ color: "#aaa" }}>We konden geen geldig PSA-rapport vinden voor deze URL. Mogelijk is de scan verlopen.</p>
        <Link href="/" style={{ padding: "12px 24px", background: "#ff0000", color: "#fff", borderRadius: 8, marginTop: "24px", display: "inline-block", textDecoration: "none", fontWeight: "bold" }}>
          Terug naar de scanner
        </Link>
      </div>
    );
  }

  // Converteer DateTime objecten naar strings, zodat de Client Component ze begrijpt
  const safeReport = {
    ...report,
    expiresAt: report.expiresAt ? report.expiresAt.toISOString() : null,
    createdAt: report.createdAt ? report.createdAt.toISOString() : new Date().toISOString(),
  };

  return <ReportClient report={safeReport} />;
}