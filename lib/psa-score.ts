// Single source for the PSA trust score (0-100), used by the badge, the report,
// the FajaedeSEO sites API and the dashboard history.
export function psaTrustScore(report: {
  securityScore: string | null;
  privacyScore: string | null;
  ageScore: string | null;
}): number {
  let score = 100;
  if (report.securityScore?.includes("S1")) score -= 30;
  if (report.privacyScore?.includes("P1")) score -= 20;
  if (report.ageScore?.includes("A3")) score -= 10;
  return score;
}
