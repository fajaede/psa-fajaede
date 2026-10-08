export type SeoGeoScoringResult = {
  score: number;
  maxScore: number;
  htmlLength: number;
  breakdown: Record<string, number>;
};

const SCORING_ENDPOINT = "https://api.fajaede.eu/api/benchmark/seo-geo";

export async function getLiveSeoGeoScore(url: string): Promise<SeoGeoScoringResult | null> {
  const endpoint = new URL(SCORING_ENDPOINT);
  endpoint.searchParams.set("url", url);

  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(8_500),
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`SEO/GEO scoring API returned ${response.status}`);
    }

    const result: unknown = await response.json();
    if (!result || typeof result !== "object") {
      throw new Error("SEO/GEO scoring API returned an invalid response");
    }

    const data = result as Record<string, unknown>;
    const score = data.seo_geo_score;
    const maxScore = data.max_score;
    const htmlLength = data.html_length;
    const rawBreakdown = data.scoring_breakdown;

    if (
      typeof score !== "number" || !Number.isFinite(score) ||
      typeof maxScore !== "number" || !Number.isFinite(maxScore) || maxScore <= 0 ||
      score < 0 || score > maxScore ||
      typeof htmlLength !== "number" || !Number.isInteger(htmlLength) || htmlLength < 0 ||
      !rawBreakdown || typeof rawBreakdown !== "object" || Array.isArray(rawBreakdown)
    ) {
      throw new Error("SEO/GEO scoring API returned an invalid score");
    }

    const breakdown = Object.fromEntries(
      Object.entries(rawBreakdown).filter(
        (entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]),
      ),
    );
    if (Object.keys(breakdown).length !== Object.keys(rawBreakdown).length) {
      throw new Error("SEO/GEO scoring API returned an invalid scoring breakdown");
    }

    return { score, maxScore, htmlLength, breakdown };
  } catch (error) {
    console.warn("Live SEO/GEO score unavailable; using the local scan score:", error);
    return null;
  }
}
