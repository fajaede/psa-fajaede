import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Public pages are open to every crawler, AI crawlers included (GEO). Private, per-user and
// technical routes stay out of search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/app/", "/dashboard", "/admin", "/audit/", "/auth/", "/verify", "/login", "/premium/", "/results", "/embed/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
