// SEO/GEO benchmark for the scan result page, from the Fajaede benchmark crawl
// (see lib/benchmark-api.ts). No data or no configuration -> status "unavailable".
import { compareWithBenchmark } from "@/lib/benchmark-api";

export type ScanBenchmark = {
  comparableSites: number;
  percentile: number | null;
  topPercent: number | null;
  cohortLabel: string | null;
  status: "available" | "unavailable";
};

const UNAVAILABLE: ScanBenchmark = { comparableSites: 0, percentile: null, topPercent: null, cohortLabel: null, status: "unavailable" };

async function benchmarkFor(url: string, metric: "seo" | "geo", score: number): Promise<ScanBenchmark> {
  const comparison = await compareWithBenchmark(url, { [metric]: score });
  const m = comparison?.metrics[metric];
  if (!m) return UNAVAILABLE;
  return { comparableSites: m.groupSize, percentile: m.percentile, topPercent: m.topPercent, cohortLabel: m.cohortLabel, status: "available" };
}

export function getSeoBenchmark(url: string, score: number): Promise<ScanBenchmark> {
  return benchmarkFor(url, "seo", score);
}

export function getGeoBenchmark(url: string, score: number): Promise<ScanBenchmark> {
  return benchmarkFor(url, "geo", score);
}
