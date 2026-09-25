import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      score: 100 - (scan.securityScore?.includes("S1") ? 30 : 0) - (scan.privacyScore?.includes("P1") ? 20 : 0) - (scan.ageScore?.includes("A3") ? 10 : 0),
    }));

    return NextResponse.json(sites, { status: 200 });
  } catch (error) {
    console.error("FajaedeSEO sites unavailable:", error);
    return NextResponse.json({ error: "Sites kunnen momenteel niet worden geladen." }, { status: 503 });
  }
}
