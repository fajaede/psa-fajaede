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

export type CompetitorEntry = {
  domain: string;
  overall: number | null;
  scores: Partial<Record<BenchmarkMetric, number | null>>;
  aheadOn: { metric: BenchmarkMetric; label: string; theirs: number; yours: number; difference: number }[];
};

export type Competitors = {
  cohortLabel: string | null;
  groupSize: number;
  yourOverall: number | null;
  ahead: CompetitorEntry[];
  leader: CompetitorEntry | null;
  behind: CompetitorEntry | null;
  youLead: boolean;
  distribution: Record<"overall" | BenchmarkMetric, number[]> | null;   // sites per score 0-100, groups of 30+
};

function toEntry(raw: unknown): CompetitorEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { domain?: unknown; overall?: unknown; scores?: unknown; ahead_on?: unknown };
  if (typeof r.domain !== "string") return null;
  return {
    domain: r.domain,
    overall: typeof r.overall === "number" ? r.overall : null,
    scores: (r.scores && typeof r.scores === "object" ? r.scores : {}) as CompetitorEntry["scores"],
    aheadOn: Array.isArray(r.ahead_on) ? (r.ahead_on as CompetitorEntry["aheadOn"]) : [],
  };
}

function toDistribution(raw: unknown): Competitors["distribution"] {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const keys = ["overall", "psa", "seo", "geo", "ai"] as const;
  const valid = (v: unknown): v is number[] =>
    Array.isArray(v) && v.length === 101 && v.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0);
  if (!keys.every((k) => valid(r[k]))) return null;
  return Object.fromEntries(keys.map((k) => [k, r[k]])) as Competitors["distribution"];
}

/** Sites in the same cohort just above you, the leader and where they are ahead; null without data. */
export async function getCompetitors(
  url: string,
  scores: Partial<Record<BenchmarkMetric, number | null | undefined>>,
): Promise<Competitors | null> {
  const key = process.env.BENCHMARK_API_KEY?.trim();
  if (!key) return null;
  let domain: string;
  try {
    domain = new URL(url).hostname;
  } catch {
    return null;
  }
  const endpoint = new URL("/api/benchmark/competitors", process.env.BENCHMARK_API_URL?.trim() || DEFAULT_API);
  endpoint.searchParams.set("domain", domain);
  endpoint.searchParams.set("limit", "3");
  for (const [metric, value] of Object.entries(scores)) {
    if (typeof value === "number" && Number.isFinite(value)) endpoint.searchParams.set(metric, String(Math.round(value)));
  }
  try {
    const response = await fetch(endpoint, {
      headers: { "X-Benchmark-Key": key, Accept: "application/json" },
      signal: AbortSignal.timeout(4_000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`competitors API returned ${response.status}`);
    const data = (await response.json()) as Record<string, unknown>;
    if (!data.cohort) return null;
    return {
      cohortLabel: typeof data.cohort_label === "string" ? data.cohort_label : null,
      groupSize: typeof data.group_size === "number" ? data.group_size : 0,
      yourOverall: typeof data.your_overall === "number" ? data.your_overall : null,
      ahead: (Array.isArray(data.ahead) ? data.ahead : []).map(toEntry).filter((e): e is CompetitorEntry => e !== null),
      leader: toEntry(data.leader),
      behind: toEntry(data.behind),
      youLead: data.you_lead === true,
      distribution: toDistribution(data.distribution),
    };
  } catch (error) {
    console.warn("Competitors unavailable:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Competitive score: the average percentile over the measured metrics (null without data). */
export function competitiveScore(comparison: BenchmarkComparison | null): number | null {
  const values = Object.values(comparison?.metrics ?? {}).map((m) => m.percentile);
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
}
