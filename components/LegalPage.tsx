import Link from "next/link";

export const COMPANY = {
  name: "fajaede",
  street: "Lodewijk de Koninckstraat 31",
  city: "2600 Berchem, Antwerpen",
  country: "België",
  vat: "BE1032407424",
  email: "info@fajaede.nl",
};

/** Shared layout for /privacy, /cookies and /voorwaarden. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main style={styles.page}>
      <article style={styles.article}>
        <Link href="/" style={styles.back}>← Terug naar psa.fajaede.nl</Link>
        <h1 style={styles.h1}>{title}</h1>
        <p style={styles.updated}>Laatst bijgewerkt: {updated}</p>
        {children}
      </article>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>{title}</h2>
      {children}
    </section>
  );
}

export function CompanyBlock() {
  return (
    <p style={styles.company}>
      {COMPANY.name}<br />
      {COMPANY.street}<br />
      {COMPANY.city}<br />
      {COMPANY.country}<br />
      Ondernemings- en btw-nummer: {COMPANY.vat}<br />
      E-mail: <a href={`mailto:${COMPANY.email}`} style={legalStyles.link}>{COMPANY.email}</a>
    </p>
  );
}

export const legalStyles: Record<string, React.CSSProperties> = {
  p: { margin: "0 0 12px" },
  ul: { margin: "0 0 12px", paddingLeft: 22, display: "flex", flexDirection: "column", gap: 6 },
  link: { color: "#00ff99" },
  tableWrap: { overflowX: "auto", margin: "0 0 12px" },
  table: { width: "100%", minWidth: 560, borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #333", color: "#f0efec", verticalAlign: "top" },
  td: { padding: "8px 10px", borderBottom: "1px solid #222", verticalAlign: "top" },
};

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#050505", color: "#d6d5cf", fontFamily: "system-ui, -apple-system, sans-serif", padding: "32px 16px 64px", boxSizing: "border-box" },
  article: { maxWidth: 820, margin: "0 auto", lineHeight: 1.7, fontSize: 16 },
  back: { color: "#a8a7a0", textDecoration: "none", fontSize: 14 },
  h1: { color: "#fff", fontSize: 32, margin: "20px 0 4px", lineHeight: 1.2 },
  updated: { color: "#a8a7a0", fontSize: 14, margin: "0 0 28px" },
  section: { margin: "0 0 28px" },
  h2: { color: "#fff", fontSize: 20, margin: "0 0 10px" },
  company: { margin: "0 0 12px", padding: "12px 16px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 10 },
};
