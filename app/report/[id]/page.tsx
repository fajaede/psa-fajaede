// app/report/[id]/page.tsx
import "server-only";

type ReportPageProps = {
  params: { id: string };
};

function decodeUrl(id: string): string | null {
  try {
    const padded = id.padEnd(id.length + ((4 - (id.length % 4)) % 4), "=");
    const url = Buffer.from(padded, "base64").toString("utf8");
    return url.startsWith("http") ? url : null;
  } catch {
    return null;
  }
}

export default function ReportPage({ params }: ReportPageProps) {
  const decodedUrl = decodeUrl(params.id);

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

        <h1 style={{ fontSize: 28, marginBottom: 8 }}>
          PSA Report link
        </h1>

        <p style={{ fontSize: 14, color: "#ccc", marginBottom: 24 }}>
          This is the public PSA certificate link for a scanned URL.
        </p>

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
            {decodedUrl ?? "Invalid PSA report id"}
          </p>
        </div>
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
