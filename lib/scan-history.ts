import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeSiteUrl } from "@/lib/url-normalize";

/** Kinds with their own scan route. */
export type ScannedKind = "psa" | "seo" | "geo";
export const SCANNED_KINDS: ScannedKind[] = ["psa", "seo", "geo"];
/** All measured kinds: "ai" (AI-zichtbaarheid) is recorded by the GEO scan. */
export type ScanKind = ScannedKind | "ai";
export const SCAN_KINDS: ScanKind[] = ["psa", "seo", "geo", "ai"];

/**
 * Store one measurement for the dashboard history. Never throws: a failing
 * history write must not break the scan response.
 */
export async function recordScanSnapshot(
  url: string,
  kind: ScanKind,
  score: number,
  details?: Prisma.InputJsonValue,
): Promise<void> {
  const normalized = normalizeSiteUrl(url);
  if (!normalized || !Number.isFinite(score)) return;
  try {
    await prisma.scanSnapshot.create({
      data: { url: normalized, kind, score: Math.max(0, Math.min(100, Math.round(score))), details },
    });
  } catch (error) {
    console.warn("Scan snapshot could not be stored:", error instanceof Error ? error.message : error);
  }
}
