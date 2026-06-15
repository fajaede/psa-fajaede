import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>;
}) {
  const params = await searchParams;
  // Simpele beveiliging: Pas deze code aan naar iets unieks voor jezelf!
  const SECRET_KEY = "fajaede_admin";

  if (params.secret !== SECRET_KEY) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center", color: "#ff4d4f", background: "#050505", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: 48, marginBottom: 16 }}>🔒 Toegang Geweigerd</h1>
        <p style={{ color: "#aaa" }}>Je hebt geen geldige sleutel opgegeven om het dashboard te bekijken.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: 24, padding: "10px 20px", background: "#333", color: "#fff", textDecoration: "none", borderRadius: 8 }}>
          Terug naar de homepagina
        </Link>
      </div>
    );
  }

  // De Next.js Server Action om de betaalstatus te togglen
  async function togglePaidStatus(formData: FormData) {
    "use server";
    const urlHash = formData.get("urlHash") as string;
    const currentPaid = formData.get("isPaid") === "true";
    
    await prisma.psaScan.update({
      where: { urlHash },
      data: { isPaid: !currentPaid },
    });
    
    // Wis direct de cache van het rapport én het dashboard zelf!
    revalidatePath(`/report/${urlHash}`);
    revalidatePath(`/admin`);
  }

  // Haal alle scans op uit de database, nieuwste bovenaan
  const scans = await prisma.psaScan.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ minHeight: "100vh", background: "#050505", color: "#f5f5f5", padding: "40px 5%", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, borderBottom: "1px solid #333", paddingBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>FajaedeAI Admin</h1>
          <p style={{ color: "#aaa", margin: "8px 0 0 0" }}>Beheer alle PSA scans ({scans.length} totaal)</p>
        </div>
        <Link href="/" style={{ color: "#fff", textDecoration: "none", background: "#222", border: "1px solid #444", padding: "10px 20px", borderRadius: 8, fontWeight: "bold" }}>
          Naar Scanner →
        </Link>
      </header>

      <div style={{ background: "#111", borderRadius: 16, border: "1px solid #333", overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 800, borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ background: "#1a1a1a", borderBottom: "2px solid #333" }}>
            <tr>
              <th style={{ padding: "16px 24px", color: "#888", fontWeight: 600 }}>Datum</th>
              <th style={{ padding: "16px 24px", color: "#888", fontWeight: 600 }}>Domein</th>
              <th style={{ padding: "16px 24px", color: "#888", fontWeight: 600 }}>Scores (P / S / A)</th>
              <th style={{ padding: "16px 24px", color: "#888", fontWeight: 600 }}>Acties</th>
            </tr>
          </thead>
          <tbody>
            {scans.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#555" }}>Nog geen scans in de database.</td>
              </tr>
            ) : scans.map((scan: {
              urlHash: string;
              createdAt: Date;
              url: string;
              privacyScore: string | null;
              securityScore: string | null;
              ageScore: string | null;
              isPaid: boolean;
            }) => (
              <tr key={scan.urlHash} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "16px 24px", color: "#aaa" }}>
                  {new Date(scan.createdAt).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td style={{ padding: "16px 24px", fontWeight: "bold", color: "#fff" }}>{scan.url}</td>
                <td style={{ padding: "16px 24px" }}>
                  <span style={{ display: "inline-block", width: 30, color: scan.privacyScore?.includes("P2") ? "#00ff00" : "#ff4d4f" }}>{scan.privacyScore?.split(" ")[0]}</span> / {" "}
                  <span style={{ display: "inline-block", width: 30, color: scan.securityScore?.includes("S2") ? "#00ff00" : "#ff4d4f", marginLeft: 8 }}>{scan.securityScore?.split(" ")[0]}</span> / {" "}
                  <span style={{ display: "inline-block", width: 30, color: scan.ageScore?.includes("A1") ? "#00ff00" : "#ff4d4f", marginLeft: 8 }}>{scan.ageScore?.split(" ")[0]}</span>
                </td>
                <td style={{ padding: "16px 24px" }}>
                  <form action={togglePaidStatus} style={{ display: "inline-block", marginRight: 12 }}>
                    <input type="hidden" name="urlHash" value={scan.urlHash} />
                    <input type="hidden" name="isPaid" value={scan.isPaid ? "true" : "false"} />
                    <button type="submit" style={{ background: scan.isPaid ? "rgba(0,255,0,0.1)" : "rgba(255,0,0,0.1)", color: scan.isPaid ? "#00ff00" : "#ff4d4f", border: scan.isPaid ? "1px solid rgba(0,255,0,0.3)" : "1px solid rgba(255,0,0,0.3)", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}>
                      {scan.isPaid ? "✅ Betaald" : "⏳ Niet betaald"}
                    </button>
                  </form>
                  <Link href={`/report/${scan.urlHash}`} target="_blank" style={{ color: "#0070ba", textDecoration: "none", fontWeight: "bold", padding: "6px 12px", background: "rgba(0,112,186,0.1)", borderRadius: 6, border: "1px solid rgba(0,112,186,0.3)" }}>
                    Rapport
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}