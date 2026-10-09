export type SeoGeoScoringResult = {
  score: number;
  maxScore: number;
  seoScore: number;
  geoScore: number;
  combinedScore: number;
  htmlLength: number;
  breakdown: Array<{
    code: string;
    label: string;
    passed: boolean | null;
    points: number | null;
    maxPoints: number;
    details: string;
  }>;
  issues: Array<{ label: string; details: string }>;
  coverage: number;
  limitations: string[];
};

const SCORING_ENDPOINT = "https://api.fajaede.eu/api/benchmark/seo-geo";

export async function getLiveSeoGeoScore(url: string, mode: "seo" | "geo"): Promise<SeoGeoScoringResult | null> {
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
    const seoScore = data.seo_score;
    const geoScore = data.geo_score;
    const combinedScore = data.seo_geo_score;
    const score = mode === "seo" ? seoScore : geoScore;
    const maxScore = data.max_score;
    const htmlLength = data.html_length;
    const rawBreakdown = data.scoring_breakdown;
    const rawIssues = data.issues;
    const rawCoverage = data.coverage;
    const rawLimitations = data.limitations;

    if (
      typeof score !== "number" || !Number.isFinite(score) ||
      typeof seoScore !== "number" || !Number.isFinite(seoScore) ||
      typeof geoScore !== "number" || !Number.isFinite(geoScore) ||
      typeof combinedScore !== "number" || !Number.isFinite(combinedScore) ||
      typeof maxScore !== "number" || !Number.isFinite(maxScore) || maxScore <= 0 ||
      score < 0 || score > maxScore ||
      typeof htmlLength !== "number" || !Number.isInteger(htmlLength) || htmlLength < 0 ||
      !rawBreakdown || typeof rawBreakdown !== "object" || Array.isArray(rawBreakdown) ||
      !rawIssues || typeof rawIssues !== "object" || Array.isArray(rawIssues) ||
      !rawCoverage || typeof rawCoverage !== "object" || Array.isArray(rawCoverage) ||
      !Array.isArray(rawLimitations) || rawLimitations.some((item) => typeof item !== "string")
    ) {
      throw new Error("SEO/GEO scoring API returned an invalid score");
    }

    const modeBreakdown = (rawBreakdown as Record<string, unknown>)[mode];
    const modeIssues = (rawIssues as Record<string, unknown>)[mode];
    const modeCoverage = (rawCoverage as Record<string, unknown>)[mode];
    if (!Array.isArray(modeBreakdown) || !Array.isArray(modeIssues) || typeof modeCoverage !== "number" || !Number.isFinite(modeCoverage)) {
      throw new Error(`SEO/GEO scoring API omitted the ${mode} audit details`);
    }

    const breakdown = modeBreakdown.map((entry) => {
      if (!entry || typeof entry !== "object") throw new Error("SEO/GEO scoring API returned an invalid check");
      const check = entry as Record<string, unknown>;
      if (
        typeof check.code !== "string" || typeof check.label !== "string" ||
        !(typeof check.passed === "boolean" || check.passed === null) ||
        !(typeof check.points === "number" || check.points === null) ||
        typeof check.max_points !== "number" || !Number.isFinite(check.max_points) ||
        typeof check.details !== "string"
      ) {
        throw new Error("SEO/GEO scoring API returned an invalid check");
      }
      return {
        code: check.code,
        label: check.label,
        passed: check.passed,
        points: check.points,
        maxPoints: check.max_points,
        details: check.details,
      };
    });
    const issues = modeIssues.map((entry) => {
      if (!entry || typeof entry !== "object") throw new Error("SEO/GEO scoring API returned an invalid issue");
      const issue = entry as Record<string, unknown>;
      if (typeof issue.label !== "string" || typeof issue.details !== "string") {
        throw new Error("SEO/GEO scoring API returned an invalid issue");
      }
      return { label: issue.label, details: issue.details };
    });
    if (modeCoverage < 0 || modeCoverage > 100) throw new Error("SEO/GEO scoring API returned invalid coverage");

    return {
      score,
      maxScore,
      seoScore,
      geoScore,
      combinedScore,
      htmlLength,
      breakdown,
      issues,
      coverage: modeCoverage,
      limitations: rawLimitations as string[],
    };
  } catch (error) {
    console.warn("Live SEO/GEO score unavailable; using the local scan score:", error);
    return null;
  }
}
