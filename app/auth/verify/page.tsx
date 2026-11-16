import { signInWithToken } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Inloggen bevestigen | PSA dashboard", robots: { index: false } };

// The token is only used when the user presses the button (POST). Mail security
// scanners that open links automatically can therefore not use up the link.
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;

  return (
    <main style={styles.page}>
      <form action={signInWithToken} style={styles.card}>
        <h1 style={styles.title}>Inloggen bevestigen</h1>
        <p style={styles.intro}>Klik op de knop om in te loggen op je PSA-dashboard.</p>
        <input type="hidden" name="token" value={token} />
        <button type="submit" style={styles.button} disabled={!token}>Inloggen</button>
      </form>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", background: "#050505", color: "#f5f5f5", fontFamily: "system-ui, -apple-system, sans-serif", boxSizing: "border-box" },
  card: { width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 20, padding: 32, background: "#111", border: "1px solid #333", borderRadius: 16, boxSizing: "border-box" },
  title: { margin: 0, fontSize: 28, fontWeight: 800 },
  intro: { margin: 0, color: "#aaa", lineHeight: 1.5 },
  button: { minHeight: 46, padding: "12px 20px", border: 0, borderRadius: 6, background: "#00ff99", color: "#000", fontWeight: 700, cursor: "pointer" },
};
