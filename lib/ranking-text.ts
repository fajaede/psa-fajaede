// Wording for a benchmark percentile (pure; safe in client components).
// "top 18%" only from the median up; below it "beter dan 7%" — "top 93%" is correct maths
// but reads like a compliment for a weak score.
export function rankingText(percentile: number): { short: string; caption: string; phrase: string } {
  if (percentile >= 50) {
    const top = Math.max(1, 100 - percentile);
    return { short: `${top}%`, caption: "top", phrase: `zit je in de top ${top}%` };
  }
  return { short: `${percentile}%`, caption: "beter dan", phrase: `scoor je beter dan ${percentile}%` };
}
