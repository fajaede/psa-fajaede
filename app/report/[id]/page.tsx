import "server-only";
import { prisma } from "@/lib/prisma";

type ReportPageProps = {
  params: Promise<{ id: string }>;
};

function decodeUrl(id: string): string | null {
  try {
    const decoded = Buffer.from(id, "base64url").toString("utf8");
    console.log(`[Report] Decoded ID "${id}" to URL: "${decoded}"`);
    return decoded.startsWith("http") ? decoded : null;
  } catch (error) {
    console.error(`[Report] Failed to decode ID "${id}":`, error);
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function ReportPage(props: ReportPageProps) {
  let decodedUrl: string | null = null;
  let report = null;
  let error = null;
  let isExpired = false;

  try {
    const { id } = await props.params;
    decodedUrl = decodeUrl(id);
    console.log(`[Report] Looking up URL in database: "${decodedUrl}"`);

    if (decodedUrl) {
      report = await prisma.psaScan.findUnique({
        where: { url: decodedUrl },
      }).catch((err: any) => {
        console.error(`[Report] Database error:`, err);
        error = "Database connection failed";
        return null;
      });

      if (report && report.expiresAt && new Date(report.expiresAt) < new Date()) {
        isExpired = true;
        console.log(`[Report] Certificate expired for ${decodedUrl}`);
      }
    }

    console.log(`[Report] Database lookup result:`, report ? "Found" : "Not found");
  } catch (err) {
    console.error(`[Report] Unexpected error:`, err);
    error = "An error occurred while loading the report";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#050505",
        color: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 16px",
      }}
    >
      <section style={{ maxWidth: 720, width: "100%" }}>
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
            marginBottom: 16,
          }}
        >
          <span style={{ color: "#ffdd00" }}>PSA</span>
          <span style={{ color: "#999" }}>Certified by fajaedeAI</span>
        </div>

        <h1 style={{ fontSize: 28, marginBottom: 8 }}>PSA Report link</h1>

        <p style={{ fontSize: 14, color: "#ccc", marginBottom: 24 }}>
          This is the public PSA certificate link for a scanned URL.
        </p>

        {isExpired && (
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(255,100,0,0.2), rgba(255,150,0,0.2))",
              border: "1px solid #ff6600",
              marginBottom: 24,
              color: "#ffb366",
            }}
          >
            <h2 style={{ fontSize: 16, margin: "0 0 8px 0", color: "#ff9933" }}>
              ⚠ Certificate Expired
            </h2>
            <p style={{ margin: 0, fontSize: 13 }}>
              This certificate expired on {report?.expiresAt && new Date(report.expiresAt).toLocaleDateString()}.
              <br />
                <a href={`/api/paypal/create-subscription?url=${encodeURIComponent(report?.url || '')}`} style={{ color: "#ffb366", textDecoration: "underline" }}>
                  Renew certificate (€1/year via PayPal)
                </a>
            </p>
          </div>
        )}

        <div
          style={{
            padding: 20,
            borderRadius: 16,
            background:
              "linear-gradient(135deg, rgba(255,0,0,0.18), rgba(255,221,0,0.16))",
            border: "1px solid #333",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Scanned URL</h2>
          <p
            style={{
              wordBreak: "break-all",
              background: "#111",
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            {error ? `Error: ${error}` : (report?.url ?? "Invalid PSA report id")}
          </p>
        </div>

        {report && (
          <>
            <div
              style={{
                padding: 20,
                borderRadius: 16,
                background: "linear-gradient(135deg, rgba(0,255,0,0.1), rgba(100,200,100,0.1))",
                border: "1px solid #333",
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: 18, marginBottom: 16 }}>Analysis Results</h2>
              
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, marginBottom: 4, color: "#ccc" }}>Privacy</h3>
                <p style={{ margin: 0, fontSize: 13 }}><strong>{report.privacyScore}</strong> - {report.privacyNote}</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, marginBottom: 4, color: "#ccc" }}>Security</h3>
                <p style={{ margin: 0, fontSize: 13 }}><strong>{report.securityScore}</strong> - {report.securityNote}</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, marginBottom: 4, color: "#ccc" }}>Age Appropriateness</h3>
                <p style={{ margin: 0, fontSize: 13 }}><strong>{report.ageScore}</strong> - {report.ageNote}</p>
              </div>

              <div style={{ borderTop: "1px solid #333", paddingTop: 12, fontSize: 12, color: "#888" }}>
                <p style={{ margin: "0 0 4px 0" }}>
                  Issued: {new Date(report.createdAt).toLocaleDateString()}
                </p>
                <p style={{ margin: 0 }}>
                  Expires: {new Date(report.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </>
        )}
      </section>

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
