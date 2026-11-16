import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Inloggen | PSA dashboard" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect("/app");
  const { error } = await searchParams;

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Inloggen</h1>
        <p style={styles.intro}>
          Volg je websites in één dashboard: PSA-, SEO- en GEO-scores over tijd. Je krijgt een inloglink per mail,
          een wachtwoord is niet nodig.
        </p>
        {error === "link" && (
          <p role="alert" style={styles.error}>Deze inloglink is verlopen of al gebruikt. Vraag een nieuwe aan.</p>
        )}
        <LoginForm />
        <p style={styles.legal}>
          Door in te loggen gaat u akkoord met de <Link href="/voorwaarden" style={styles.legalLink}>algemene voorwaarden</Link>.
          Lees ook ons <Link href="/privacy" style={styles.legalLink}>privacybeleid</Link>.
        </p>
        <Link href="/" style={styles.back}>← Terug naar de scanner</Link>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", background: "#050505", color: "#f5f5f5", fontFamily: "system-ui, -apple-system, sans-serif", boxSizing: "border-box" },
  card: { width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 20, padding: 32, background: "#111", border: "1px solid #333", borderRadius: 16, boxSizing: "border-box" },
  title: { margin: 0, fontSize: 28, fontWeight: 800 },
  intro: { margin: 0, color: "#aaa", lineHeight: 1.5 },
  error: { margin: 0, color: "#ff9b9b", fontSize: 14 },
  back: { color: "#888", textDecoration: "none", fontSize: 14 },
  legal: { margin: 0, color: "#888", fontSize: 13, lineHeight: 1.5 },
  legalLink: { color: "#a8a7a0" },
};
