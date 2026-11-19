// "What if" maths for the position chart (pure; safe in client components).
// Same rules as fajaede.eu backend/benchmark: overall = 50% PSA + 50% average(SEO, GEO, AI),
// re-weighted when a score is missing; percentile = share of the group scoring lower, ties half.

export type SimMetric = "psa" | "seo" | "geo" | "ai";
export type ViewMetric = "overall" | SimMetric;
export type SimScores = Record<SimMetric, number | null>;
export type Distribution = Record<ViewMetric, number[]>;   // sites per score 0-100

export function overallOf(scores: SimScores): number | null {
  const visibility = [scores.seo, scores.geo, scores.ai].filter((v): v is number => v !== null);
  const parts: [number | null, number][] = [
    [scores.psa, 50],
    [visibility.length ? visibility.reduce((a, b) => a + b, 0) / visibility.length : null, 50],
  ];
  const present = parts.filter((p): p is [number, number] => p[0] !== null);
  const total = present.reduce((sum, [, w]) => sum + w, 0);
  return total ? Math.round(present.reduce((sum, [v, w]) => sum + v * w, 0) / total) : null;
}

export function valueOf(metric: ViewMetric, scores: SimScores): number | null {
  const value = metric === "overall" ? overallOf(scores) : scores[metric];
  return value === null ? null : Math.max(0, Math.min(100, Math.round(value)));
}

export type Position = { rank: number; groupSize: number; percentile: number };

/** Your position if you scored `score` in a group with these counts per score (you are not in it). */
export function positionIn(counts: number[], score: number): Position {
  let lower = 0, ties = 0, higher = 0;
  counts.forEach((n, s) => {
    if (s < score) lower += n;
    else if (s === score) ties += n;
    else higher += n;
  });
  const groupSize = lower + ties + higher;
  return {
    rank: higher + 1,
    groupSize,
    percentile: groupSize ? Math.round(((lower + ties / 2) * 100) / groupSize) : 0,
  };
}

/** Counts per score grouped into bins of `size` points (the last bin includes 100). */
export function binned(counts: number[], size = 5): { from: number; to: number; count: number }[] {
  const bins: { from: number; to: number; count: number }[] = [];
  for (let from = 0; from < 100; from += size) {
    const to = from + size >= 100 ? 100 : from + size - 1;
    let count = 0;
    for (let s = from; s <= to; s++) count += counts[s] ?? 0;
    bins.push({ from, to, count });
  }
  return bins;
}
