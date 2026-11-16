import Link from "next/link";

/** Site-wide footer with the legal pages. */
export function SiteFooter() {
  return (
    <footer style={styles.footer}>
      <nav aria-label="Juridische informatie" style={styles.nav}>
        <Link href="/privacy" style={styles.link}>Privacybeleid</Link>
        <Link href="/cookies" style={styles.link}>Cookiebeleid</Link>
        <Link href="/voorwaarden" style={styles.link}>Algemene voorwaarden</Link>
        <a href="mailto:info@fajaede.nl" style={styles.link}>Contact</a>
      </nav>
      <p style={styles.copy}>© {new Date().getFullYear()} fajaede · BE1032407424</p>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: { background: "#050505", borderTop: "1px solid #1c1c1c", padding: "20px 16px 28px", textAlign: "center", fontFamily: "system-ui, -apple-system, sans-serif" },
  nav: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 20px", marginBottom: 8 },
  link: { color: "#a8a7a0", fontSize: 13, textDecoration: "none" },
  copy: { margin: 0, color: "#6f6e68", fontSize: 12 },
};
