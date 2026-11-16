import Link from "next/link";
import { requireUser } from "@/lib/session";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard | PSA", robots: { index: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link href="/app" style={styles.brand}>PSA dashboard</Link>
        <div style={styles.right}>
          <span style={styles.email}>{user.email}</span>
          <form action={logout}>
            <button type="submit" style={styles.logout}>Uitloggen</button>
          </form>
        </div>
      </header>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#050505", color: "#f5f5f5", fontFamily: "system-ui, -apple-system, sans-serif" },
  header: { display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", padding: "16px", maxWidth: 1040, margin: "0 auto", borderBottom: "1px solid #222" },
  brand: { color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 18 },
  right: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 },
  email: { color: "#a8a7a0", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 },
  logout: { background: "transparent", color: "#ccc", border: "1px solid #444", borderRadius: 6, padding: "6px 12px", cursor: "pointer" },
  main: { maxWidth: 1040, margin: "0 auto", padding: "24px 16px 48px", boxSizing: "border-box" },
};
