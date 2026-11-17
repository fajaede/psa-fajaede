import type { ScanKind } from "@/lib/scan-history";

export const MAX_PROJECTS_PER_USER = 3;

export const KIND_LABELS: Record<ScanKind, string> = { psa: "PSA", seo: "SEO", geo: "GEO", ai: "AI" };
