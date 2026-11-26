import type { Metadata } from "next";
import PriceClient from "./PriceClient";
import { OG_BASE } from "@/lib/seo";

const title = "Prijzen: PSA-rapport, Re-scan en site-audit | psa.fajaede.nl";
const description =
  "PSA-rapport met Trust Badge voor €9 per jaar, Site-audit van 50 pagina's voor €49 (eerste 10 gratis), Re-scan met 250 pagina's voor €149, of 500 pagina's met advies-call voor €249. Eindprijzen, geen btw.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/price" },
  openGraph: { ...OG_BASE, url: "/price", title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
};

export default function Page() {
  return <PriceClient />;
}
