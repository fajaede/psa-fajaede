// "Trust & Growth" overview for one site: four headline scores and a five-point action plan,
// derived only from measurements we really have (no invented keyword or backlink numbers).
// Pure module: no database imports, so it can be tested on its own.
import type { ScanKind } from "@/lib/scan-history";

export type LatestByKind = Partial<Record<ScanKind, { score: number; details: unknown } | null>>;

export type GrowthScores = {
  trust: number | null;        // PSA: privacy, security, age-safety
  visibility: number | null;   // average of SEO, GEO and AI-zichtbaarheid (measured ones only)
  competitive: number | null;  // benchmark percentile; null until the benchmark exists
  overall: number | null;      // weighted: trust 40%, visibility 40%, competitive 20% (re-weighted when missing)
};

export type Action = { title: string; source: ScanKind; impact: number };

function average(values: (number | null | undefined)[]): number | null {
  const present = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return present.length ? Math.round(present.reduce((a, b) => a + b, 0) / present.length) : null;
}

export function growthScores(latest: LatestByKind, competitive: number | null = null): GrowthScores {
  const trust = latest.psa?.score ?? null;
  const visibility = average([latest.seo?.score, latest.geo?.score, latest.ai?.score]);
  const parts: [number | null, number][] = [[trust, 40], [visibility, 40], [competitive, 20]];
  const present = parts.filter(([value]) => value !== null) as [number, number][];
  const weight = present.reduce((total, [, w]) => total + w, 0);
  const overall = weight ? Math.round(present.reduce((total, [value, w]) => total + value * w, 0) / weight) : null;
  return { trust, visibility, competitive, overall };
}

type PsaDetails = { [K in "privacy" | "security" | "age"]?: { score?: unknown; note?: unknown } };

/** Base impact per source; within SEO, indexing problems weigh more than the rest. */
const INDEXING = /noindex|index|canonical|robots|sitemap|https|redirect|404|statuscode|title|titel/i;

function issuesOf(details: unknown): string[] {
  const issues = (details as { issues?: unknown } | null)?.issues;
  return Array.isArray(issues)
    ? issues.filter((i): i is string => typeof i === "string" && i.trim() !== "" && !/^geen kritieke fouten/i.test(i))
    : [];
}

export function actionPlan(latest: LatestByKind, limit = 5): Action[] {
  const actions: Action[] = [];

  const psa = (latest.psa?.details ?? null) as PsaDetails | null;
  // Only the weak PSA levels are actions (S1, P1, A3); the other notes are compliments.
  for (const [key, bad, impact] of [["security", "S1", 100], ["privacy", "P1", 90], ["age", "A3", 70]] as const) {
    const part = psa?.[key];
    if (typeof part?.score === "string" && part.score.includes(bad) && typeof part.note === "string") {
      actions.push({ title: part.note, source: "psa", impact });
    }
  }
  for (const issue of issuesOf(latest.seo?.details)) {
    actions.push({ title: issue, source: "seo", impact: INDEXING.test(issue) ? 60 : 50 });
  }
  for (const issue of issuesOf(latest.geo?.details)) actions.push({ title: issue, source: "geo", impact: 40 });
  for (const issue of issuesOf(latest.ai?.details)) actions.push({ title: issue, source: "ai", impact: 30 });

  const seen = new Set<string>();
  return actions
    .filter((action) => {
      const key = action.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.impact - a.impact) // stable: keeps scan order within the same impact
    .slice(0, limit);
}
