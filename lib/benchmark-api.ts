// Percentiles from the Fajaede benchmark (api.fajaede.eu/api/benchmark/compare).
// Compares a site's scores with similar sites (same country and category), e.g.
// "top 18% van Nederlandse kleine bedrijven / mkb". Returns null when the benchmark
// is not configured or unreachable: callers then show "Nog geen benchmark", never a guess.

export type BenchmarkMetric = "psa" | "seo" | "geo" | "ai";

export type MetricComparison = {
  score: number;
  percentile: number;     // share of the group scoring lower (0-100)
  topPercent: number;     // "top X%"
  rank: number;
  groupSize: number;
  cohortLabel: string;    // "Nederlandse kleine bedrijven / mkb"
};

export type BenchmarkComparison = {
  metrics: Partial<Record<BenchmarkMetric, MetricComparison>>;
  dataAsOf: string | null;
};

const DEFAULT_API = "https://api.fajaede.eu";

export async function compareWithBenchmark(
  url: string,
  scores: Partial<Record<BenchmarkMetric, number | null | undefined>>,
): Promise<BenchmarkComparison | null> {
  const key = process.env.BENCHMARK_API_KEY?.trim();
  if (!key) return null;
  let domain: string;
  try {
    domain = new URL(url).hostname;
  } catch {
    return null;
  }
  const endpoint = new URL("/api/benchmark/compare", process.env.BENCHMARK_API_URL?.trim() || DEFAULT_API);
  endpoint.searchParams.set("domain", domain);
  for (const [metric, value] of Object.entries(scores)) {
    if (typeof value === "number" && Number.isFinite(value)) endpoint.searchParams.set(metric, String(Math.round(value)));
  }
  try {
    const response = await fetch(endpoint, {
      headers: { "X-Benchmark-Key": key, Accept: "application/json" },
      signal: AbortSignal.timeout(4_000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`benchmark API returned ${response.status}`);
    const data = (await response.json()) as { metrics?: Record<string, Record<string, unknown>>; data_as_of?: unknown };
    const metrics: BenchmarkComparison["metrics"] = {};
    for (const [name, m] of Object.entries(data.metrics ?? {})) {
      if (!["psa", "seo", "geo", "ai"].includes(name)) continue;
      if (typeof m.percentile !== "number" || typeof m.group_size !== "number" || typeof m.score !== "number") continue;
      metrics[name as BenchmarkMetric] = {
        score: m.score,
        percentile: m.percentile,
        topPercent: typeof m.top_percent === "number" ? m.top_percent : Math.max(1, 100 - m.percentile),
        rank: typeof m.rank === "number" ? m.rank : 0,
        groupSize: m.group_size,
        cohortLabel: typeof m.cohort_label === "string" ? m.cohort_label : "websites",
      };
    }
    return { metrics, dataAsOf: typeof data.data_as_of === "string" ? data.data_as_of : null };
  } catch (error) {
    console.warn("Benchmark unavailable:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Competitive score: the average percentile over the measured metrics (null without data). */
export function competitiveScore(comparison: BenchmarkComparison | null): number | null {
  const values = Object.values(comparison?.metrics ?? {}).map((m) => m.percentile);
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
}
