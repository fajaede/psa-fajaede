import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { psaTrustScore } from "@/lib/psa-score";

type Site = {
  id: string;
  url: string;
  score: number;
};

export async function GET() {
  try {
    const scans = await prisma.psaScan.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, url: true, securityScore: true, privacyScore: true, ageScore: true },
    });
    const sites: Site[] = scans.map((scan) => ({
      id: String(scan.id),
      url: scan.url,
      score: psaTrustScore(scan),
    }));

    return NextResponse.json(sites, { status: 200 });
  } catch (error) {
    console.error("FajaedeSEO sites unavailable:", error);
    return NextResponse.json({ error: "Sites kunnen momenteel niet worden geladen." }, { status: 503 });
  }
}
