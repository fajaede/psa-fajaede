export type ScanBenchmark = {
  indexDocuments: number;
  comparableSites: number;
  percentile: number | null;
  status: "available" | "insufficient-data" | "score-field-missing" | "no-score-variance" | "unavailable";
};

const MINIMUM_SAMPLE_SIZE = 5;
const EMPTY_BENCHMARK: ScanBenchmark = {
  indexDocuments: 0,
  comparableSites: 0,
  percentile: null,
  status: "unavailable",
};

async function getIndexBenchmark(score: number, scoreField: "seo_score" | "geo_score", label: string): Promise<ScanBenchmark> {
  const host = process.env.MEILISEARCH_HOST?.replace(/\/$/, "");
  const apiKey = process.env.MEILISEARCH_API_KEY || process.env.MEILISEARCH_KEY;
  const indexName = process.env.MEILISEARCH_INDEX || "pages";

  if (!host || !apiKey || !Number.isFinite(score)) return EMPTY_BENCHMARK;

  let indexDocuments = 0;
  let comparableSites = 0;

  try {
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    const statsResponse = await fetch(`${host}/indexes/${encodeURIComponent(indexName)}/stats`, {
      headers,
      cache: "no-store",
    });
    if (!statsResponse.ok) throw new Error(`MeiliSearch stats failed: ${statsResponse.status}`);

    const stats = await statsResponse.json();
    indexDocuments = Number.isInteger(stats.numberOfDocuments) ? stats.numberOfDocuments : 0;
    const fieldDistribution = stats.fieldDistribution as Record<string, number> | undefined;
    if (!fieldDistribution?.[scoreField]) {
      return { indexDocuments, comparableSites, percentile: null, status: "score-field-missing" };
    }

    const scoreResponse = await fetch(`${host}/indexes/${encodeURIComponent(indexName)}/search`, {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({
        limit: 0,
        facets: [scoreField],
        maxValuesPerFacet: 101,
        filter: `${scoreField} >= 0 AND ${scoreField} <= 100`,
      }),
    });
    if (!scoreResponse.ok) throw new Error(`MeiliSearch ${scoreField} query failed: ${scoreResponse.status}`);

    const scoreResult = await scoreResponse.json();
    comparableSites = scoreResult.estimatedTotalHits ?? scoreResult.totalHits;
    if (!Number.isInteger(comparableSites) || comparableSites < 0) {
      throw new Error("MeiliSearch returned an invalid comparable-score count");
    }
    if (comparableSites < MINIMUM_SAMPLE_SIZE) {
      return { indexDocuments, comparableSites, percentile: null, status: "insufficient-data" };
    }

    const distribution = scoreResult.facetDistribution?.[scoreField] as Record<string, number> | undefined;
    if (!distribution) throw new Error(`MeiliSearch omitted the ${scoreField} distribution`);

    const distributionEntries = Object.entries(distribution).map(([value, count]) => [Number(value), count] as const);
    const distributionCount = distributionEntries.reduce((total, [, count]) => total + count, 0);
    if (distributionCount !== comparableSites || distributionEntries.some(([value, count]) => !Number.isFinite(value) || !Number.isInteger(count) || count < 0)) {
      throw new Error("MeiliSearch returned an invalid benchmark count");
    }
    if (distributionEntries.length < 2) {
      return { indexDocuments, comparableSites, percentile: null, status: "no-score-variance" };
    }

    const lowerScores = distributionEntries.reduce(
      (total, [indexedScore, count]) => total + (indexedScore < score ? count : 0),
      0,
    );

    return {
      indexDocuments,
      comparableSites,
      percentile: Math.round((lowerScores / comparableSites) * 100),
      status: "available",
    };
  } catch (error) {
    console.warn(`${label} Fajaede.eu benchmark unavailable:`, error);
    return { indexDocuments, comparableSites, percentile: null, status: "unavailable" };
  }
}

export function getSeoBenchmark(trustScore: number): Promise<ScanBenchmark> {
  return getIndexBenchmark(trustScore, "seo_score", "SEO");
}

export function getGeoBenchmark(trustScore: number): Promise<ScanBenchmark> {
  return getIndexBenchmark(trustScore, "geo_score", "GEO");
}
