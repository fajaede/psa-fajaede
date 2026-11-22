import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { jsonLd, OG_BASE, ORGANIZATION, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...OG_BASE, url: "/", title: "FajaedeAI Core | Gratis privacy-, beveiligings- en SEO-scan", description: SITE_DESCRIPTION },
};

const app = {
  "@type": "WebApplication",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  description: SITE_DESCRIPTION,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  inLanguage: "nl",
  publisher: { "@id": ORGANIZATION["@id"] },
  offers: [
    { "@type": "Offer", name: "Gratis scan", price: "0", priceCurrency: "EUR" },
    { "@type": "Offer", name: "PSA-rapport en Trust Badge (per jaar)", price: "9", priceCurrency: "EUR", url: `${SITE_URL}/price` },
    { "@type": "Offer", name: "Re-scan (site-audit 50 pagina's)", price: "149", priceCurrency: "EUR", url: `${SITE_URL}/price` },
    { "@type": "Offer", name: "Re-scan + adviezen (100 pagina's en advies-call)", price: "249", priceCurrency: "EUR", url: `${SITE_URL}/price` },
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(app) }} />
      <HomeClient />
    </>
  );
}
