import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { LayoutHeader } from "@/components/SiteHeader";
import { jsonLd, OG_BASE, ORGANIZATION, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "FajaedeAI Core | Privacy-, beveiligings- en SEO-scan voor je website",
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: OG_BASE,
  twitter: { card: "summary_large_image" },
};

const siteGraph = {
  "@graph": [
    ORGANIZATION,
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      inLanguage: "nl",
      description: SITE_DESCRIPTION,
      publisher: { "@id": ORGANIZATION["@id"] },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(siteGraph) }} />
        <LayoutHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
