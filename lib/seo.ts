// Shared SEO/GEO data: one place for the site URL, the organisation and the JSON-LD helper.
import { COMPANY } from "@/components/LegalPage";

export const SITE_URL = "https://psa.fajaede.nl";
export const SITE_NAME = "FajaedeAI Core";
export const SITE_DESCRIPTION =
  "Gratis scan van je website op privacy, beveiliging, technische SEO, GEO en AI-vindbaarheid, met een vergelijking met vergelijkbare .nl- en .be-sites.";

/** Public pages for the sitemap (redirects, private and per-user pages are left out). */
export const PUBLIC_PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/price", priority: 0.8, changeFrequency: "monthly" },
  { path: "/bot", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
  { path: "/voorwaarden", priority: 0.3, changeFrequency: "yearly" },
];

/** Open Graph fields every page shares; each page adds its own url, title and description. */
export const OG_BASE = { type: "website" as const, siteName: SITE_NAME, locale: "nl_NL" };

export const ORGANIZATION = {
  "@type": "Organization",
  "@id": "https://www.fajaede.nl/#organization",
  name: COMPANY.name,
  url: "https://www.fajaede.nl/",
  email: COMPANY.email,
  vatID: COMPANY.vat,
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY.street,
    postalCode: "2600",
    addressLocality: "Berchem",
    addressRegion: "Antwerpen",
    addressCountry: "BE",
  },
  sameAs: ["https://psa.fajaede.nl/", "https://www.fajaede.eu/", "https://github.com/fajaede"],
};

/** JSON-LD as a safe string for a <script type="application/ld+json"> (no "<" so no tag injection). */
export function jsonLd(data: object): string {
  return JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c");
}
