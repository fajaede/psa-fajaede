import { prisma } from "@/lib/prisma";

export type ScanBenchmark = {
  totalScans: number;
  percentile: number | null;
  minimumSampleSize: number;
};

const MINIMUM_SAMPLE_SIZE = 5;

async function buildBenchmark(
  countScans: () => Promise<number>,
  countLowerScores: () => Promise<number>,
  label: string,
): Promise<ScanBenchmark> {
  try {
    const [totalScans, lowerScoreCount] = await Promise.all([
      countScans(),
      countLowerScores(),
    ]);

    return {
      totalScans,
      percentile: totalScans >= MINIMUM_SAMPLE_SIZE
        ? Math.round((lowerScoreCount / totalScans) * 100)
        : null,
      minimumSampleSize: MINIMUM_SAMPLE_SIZE,
    };
  } catch (error) {
    console.warn(`${label} benchmark unavailable:`, error);
    return {
      totalScans: 0,
      percentile: null,
      minimumSampleSize: MINIMUM_SAMPLE_SIZE,
    };
  }
}

export function getSeoBenchmark(trustScore: number): Promise<ScanBenchmark> {
  return buildBenchmark(
    () => prisma.seoScan.count(),
    () => prisma.seoScan.count({ where: { trustScore: { lt: trustScore } } }),
    "SEO",
  );
}

export function getGeoBenchmark(trustScore: number): Promise<ScanBenchmark> {
  return buildBenchmark(
    () => prisma.geoScan.count(),
    () => prisma.geoScan.count({ where: { trustScore: { lt: trustScore } } }),
    "GEO",
  );
}
