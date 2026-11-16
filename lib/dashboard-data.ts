import { prisma } from "@/lib/prisma";
import { SCAN_KINDS, type ScanKind } from "@/lib/scan-history";

export type KindSummary = {
  kind: ScanKind;
  latest: { score: number; createdAt: Date; details: unknown } | null;
  previous: { score: number; createdAt: Date } | null;
};

/** Latest and previous measurement per scan kind for one site. */
export async function latestScores(url: string): Promise<KindSummary[]> {
  return Promise.all(
    SCAN_KINDS.map(async (kind) => {
      const [latest, previous] = await prisma.scanSnapshot.findMany({
        where: { url, kind },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: { score: true, createdAt: true, details: true },
      });
      return { kind, latest: latest ?? null, previous: previous ?? null };
    }),
  );
}

/** Up to the last 200 measurements per kind, oldest first, for the history chart. */
export async function scoreHistory(url: string) {
  const rows = await Promise.all(
    SCAN_KINDS.map((kind) =>
      prisma.scanSnapshot.findMany({
        where: { url, kind },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: { score: true, createdAt: true },
      }),
    ),
  );
  return SCAN_KINDS.map((kind, i) => ({
    kind,
    points: rows[i].reverse().map((r) => ({ t: r.createdAt.toISOString(), score: r.score })),
  }));
}
