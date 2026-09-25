import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function escapeXml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" })[character] || character);
}

function trustScore(report: { securityScore: string | null; privacyScore: string | null; ageScore: string | null }): number {
  let score = 100;
  if (report.securityScore?.includes("S1")) score -= 30;
  if (report.privacyScore?.includes("P1")) score -= 20;
  if (report.ageScore?.includes("A3")) score -= 10;
  return score;
}

export async function GET(request: NextRequest): Promise<Response> {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return new Response("Missing badge id", { status: 400 });

  const report = await prisma.psaScan.findUnique({
    where: { urlHash: id },
    select: { url: true, urlHash: true, securityScore: true, privacyScore: true, ageScore: true },
  });
  if (!report) return new Response("Badge not found", { status: 404 });

  const score = trustScore(report);
  const color = score >= 75 ? "#00d084" : "#ffb347";
  const label = score >= 75 ? "PSA VERIFIED" : "PSA REVIEW";
  const host = escapeXml(new URL(report.url).hostname);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="${label} ${score} out of 100"><rect width="140" height="140" rx="12" fill="#101418"/><circle cx="70" cy="53" r="31" fill="none" stroke="${color}" stroke-width="5"/><text x="70" y="64" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="28" font-weight="700">${score}</text><text x="70" y="105" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="11" font-weight="700">${label}</text><text x="70" y="121" text-anchor="middle" fill="#aab4bf" font-family="Arial,sans-serif" font-size="9">${host}</text></svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}