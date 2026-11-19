"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MegaMenu, type ScanMode } from "@/components/MegaMenu";

/**
 * The public top bar: logo back to the homepage, the "Producten" mega menu, Prijzen, Dashboard,
 * Community and Login. `variant="hero"` is the transparent version inside the homepage and report
 * hero; `variant="bar"` is a dark bar for the other public pages (rendered from the root layout).
 */
export function SiteHeader({ onScan, variant = "hero" }: { onScan?: (mode: ScanMode) => void; variant?: "hero" | "bar" }) {
  const inner = (
    <div className="siteHeader-inner" style={variant === "hero" ? { padding: "24px 0 64px 0" } : { padding: "14px 0" }}>
      <Link href="/" className="siteHeader-logo" aria-label="FajaedeAI Core – naar de beginpagina">
        <span style={{ color: "#fff" }}>FajaedeAI</span><span style={{ color: "#ffdd00" }}> Core</span>
      </Link>
      <nav aria-label="Hoofdmenu" className="siteHeader-nav">
        <MegaMenu onScan={onScan} />
        <a href="/price" className="topLink">Prijzen</a>
        <a href="/app" className="topLink">Dashboard</a>
        <a href="https://www.fajaede.nl/welkom-bij-fajaede-lab/" className="topLink" target="_blank" rel="noopener noreferrer">Community</a>
      </nav>
      <a href="/app" className="siteHeader-login">Login</a>
    </div>
  );
  if (variant === "hero") return <header className="siteHeader siteHeader-hero">{inner}</header>;
  return <header className="siteHeader siteHeader-bar">{inner}</header>;
}

// Pages that render their own header (or none): the homepage (hero header), the logged-in dashboard,
// admin pages and the embeddable badge.
const OWN_HEADER = [/^\/$/, /^\/app(\/|$)/, /^\/admin(\/|$)/, /^\/dashboard(\/|$)/, /^\/embed(\/|$)/];

/** Rendered from the root layout: the dark bar on every other public page. */
export function LayoutHeader() {
  const pathname = usePathname() ?? "/";
  if (OWN_HEADER.some((re) => re.test(pathname))) return null;
  return <SiteHeader variant="bar" />;
}
