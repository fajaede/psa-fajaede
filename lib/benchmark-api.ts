// Data from the Fajaede benchmark (api.fajaede.eu/api/benchmark/*): percentiles against similar sites
// (same country and category), competitors, and links from the Common Crawl web graph.
// Every call returns null when the benchmark is not configured, unreachable or has no data:
// callers then show "Nog geen benchmark", never a guess.

export type BenchmarkMetric = "psa" | "seo" | "geo" | "ai";
type Scores = Partial<Record<BenchmarkMetric, number | null | undefined>>;

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

export type CompetitorEntry = {
  domain: string;
  overall: number | null;
  scores: Partial<Record<BenchmarkMetric, number | null>>;
  aheadOn: { metric: BenchmarkMetric; label: string; theirs: number; yours: number; difference: number }[];
  authority: number | null;   // Common Crawl link authority 0-100 (null = unknown)
  referringDomains: number | null;
};

export type Competitors = {
  cohortLabel: string | null;
  groupSize: number;
  yourOverall: number | null;
  yourAuthority: number | null;
  yourReferringDomains: number | null;
  ahead: CompetitorEntry[];
  leader: CompetitorEntry | null;
  behind: CompetitorEntry | null;
  youLead: boolean;
  distribution: Record<"overall" | BenchmarkMetric, number[]> | null;   // sites per score 0-100, groups of 30+
};

export type Backlinks = {
  authority: number | null;          // 0-100: share of same-extension domains with weaker links
  authorityRank: number | null;      // 1 = strongest domain of this extension
  authorityOf: number | null;        // number of domains with this extension in the web graph
  referringDomains: number | null;   // distinct domains linking to this one (any extension)
  referringLocal: number | null;     // of which .nl/.be
  topReferring: { domain: string; authority: number }[];
  release: string | null;            // Common Crawl web graph release, e.g. cc-main-2026-aug-sep-oct
};

const DEFAULT_API = "https://api.fajaede.eu";
const METRICS: readonly BenchmarkMetric[] = ["psa", "seo", "geo", "ai"];

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** GET a benchmark endpoint for the site at `url`; the parsed JSON object, or null on any problem. */
async function benchmarkGet(
  path: string,
  url: string,
  params: Record<string, string> = {},
  scores: Scores = {},
): Promise<Record<string, unknown> | null> {
  const key = process.env.BENCHMARK_API_KEY?.trim();
  if (!key) return null;
  let domain: string;
  try {
    domain = new URL(url).hostname;
  } catch {
    return null;
  }
  const endpoint = new URL(path, process.env.BENCHMARK_API_URL?.trim() || DEFAULT_API);
  endpoint.searchParams.set("domain", domain);
  for (const [name, value] of Object.entries(params)) endpoint.searchParams.set(name, value);
  for (const [metric, value] of Object.entries(scores)) {
    if (typeof value === "number" && Number.isFinite(value)) endpoint.searchParams.set(metric, String(Math.round(value)));
  }
  try {
    const response = await fetch(endpoint, {
      headers: { "X-Benchmark-Key": key, Accept: "application/json" },
      signal: AbortSignal.timeout(4_000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`returned ${response.status}`);
    const data: unknown = await response.json();
    return isObject(data) ? data : null;
  } catch (error) {
    console.warn(`Benchmark ${path} unavailable:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export async function compareWithBenchmark(url: string, scores: Scores): Promise<BenchmarkComparison | null> {
  const data = await benchmarkGet("/api/benchmark/compare", url, {}, scores);
  if (!data) return null;
  const metrics: BenchmarkComparison["metrics"] = {};
  for (const [name, m] of Object.entries(isObject(data.metrics) ? data.metrics : {})) {
    if (!METRICS.includes(name as BenchmarkMetric) || !isObject(m)) continue;
    const percentile = num(m.percentile), groupSize = num(m.group_size), score = num(m.score);
    if (percentile === null || groupSize === null || score === null) continue;
    metrics[name as BenchmarkMetric] = {
      score,
      percentile,
      topPercent: num(m.top_percent) ?? Math.max(1, 100 - percentile),
      rank: num(m.rank) ?? 0,
      groupSize,
      cohortLabel: str(m.cohort_label) ?? "websites",
    };
  }
  return { metrics, dataAsOf: str(data.data_as_of) };
}

function toEntry(raw: unknown): CompetitorEntry | null {
  if (!isObject(raw) || typeof raw.domain !== "string") return null;
  const scores = isObject(raw.scores) ? raw.scores : {};
  return {
    domain: raw.domain,
    overall: num(raw.overall),
    scores: Object.fromEntries(METRICS.map((m) => [m, num(scores[m])])),
    aheadOn: (Array.isArray(raw.ahead_on) ? raw.ahead_on : []).filter(
      (s): s is CompetitorEntry["aheadOn"][number] =>
        isObject(s) && typeof s.label === "string" && typeof s.difference === "number" && METRICS.includes(s.metric as BenchmarkMetric),
    ),
    authority: num(raw.authority),
    referringDomains: num(raw.referring_domains),
  };
}

function toDistribution(raw: unknown): Competitors["distribution"] {
  if (!isObject(raw)) return null;
  const keys = ["overall", ...METRICS] as const;
  const valid = (v: unknown): v is number[] =>
    Array.isArray(v) && v.length === 101 && v.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0);
  if (!keys.every((k) => valid(raw[k]))) return null;
  return Object.fromEntries(keys.map((k) => [k, raw[k]])) as Competitors["distribution"];
}

/** Sites in the same cohort just above you, the leader and where they are ahead; null without data. */
export async function getCompetitors(url: string, scores: Scores): Promise<Competitors | null> {
  const data = await benchmarkGet("/api/benchmark/competitors", url, { limit: "3" }, scores);
  if (!data?.cohort) return null;
  return {
    cohortLabel: str(data.cohort_label),
    groupSize: num(data.group_size) ?? 0,
    yourOverall: num(data.your_overall),
    yourAuthority: num(data.your_authority),
    yourReferringDomains: num(data.your_referring_domains),
    ahead: (Array.isArray(data.ahead) ? data.ahead : []).map(toEntry).filter((e): e is CompetitorEntry => e !== null),
    leader: toEntry(data.leader),
    behind: toEntry(data.behind),
    youLead: data.you_lead === true,
    distribution: toDistribution(data.distribution),
  };
}

/** Link profile from the Common Crawl web graph; null when unavailable or nothing known yet. */
export async function getBacklinks(url: string): Promise<Backlinks | null> {
  const data = await benchmarkGet("/api/benchmark/backlinks", url);
  if (!data) return null;
  const result: Backlinks = {
    authority: num(data.authority),
    authorityRank: num(data.authority_rank),
    authorityOf: num(data.authority_of),
    referringDomains: num(data.referring_domains),
    referringLocal: num(data.referring_local),
    topReferring: (Array.isArray(data.top_referring) ? data.top_referring : []).filter(
      (t): t is { domain: string; authority: number } =>
        isObject(t) && typeof t.domain === "string" && typeof t.authority === "number",
    ),
    release: str(data.release),
  };
  return result.authority === null && result.referringDomains === null ? null : result;
}

/** Competitive score: the average percentile over the measured metrics (null without data). */
export function competitiveScore(comparison: BenchmarkComparison | null): number | null {
  const values = Object.values(comparison?.metrics ?? {}).map((m) => m.percentile);
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
}
