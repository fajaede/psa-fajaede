"use server";

import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { POST as runPsaScanRoute } from "@/app/api/scan/route";
import { POST as runSeoScanRoute } from "@/app/api/seo/route";
import { POST as runGeoScanRoute } from "@/app/api/geo/route";
import { markTrustedInternalRequest } from "@/lib/internal-request";
import { prisma } from "@/lib/prisma";
import { SCANNED_KINDS, type ScannedKind } from "@/lib/scan-history";
import { checkRateLimit, clientIpFromHeaders, validatePublicScanUrl } from "@/lib/scan-guard";
import { destroyCurrentSession, requireUser } from "@/lib/session";
import { normalizeSiteUrl } from "@/lib/url-normalize";
import { KIND_LABELS, MAX_PROJECTS_PER_USER } from "@/lib/projects";

const ROUTES: Record<ScannedKind, (request: NextRequest) => Promise<Response>> = {
  psa: runPsaScanRoute,
  seo: runSeoScanRoute,
  geo: runGeoScanRoute,
};

export type ActionState = { status: "idle" | "ok" | "error"; message?: string; errors?: string[] };

/** Runs the public scan route handlers on the server for a logged-in user (skips Turnstile, keeps the rate limit). */
async function runScans(url: string): Promise<string[]> {
  const ip = clientIpFromHeaders(await headers());
  const results = await Promise.all(
    SCANNED_KINDS.map(async (kind) => {
      const request = markTrustedInternalRequest(
        new NextRequest(`https://internal.psa/api/${kind}`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": ip },
          body: JSON.stringify({ url }),
        }),
      );
      try {
        const response = await ROUTES[kind](request);
        if (response.ok) return null;
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        return `${KIND_LABELS[kind]}: ${body?.error ?? `scan mislukt (status ${response.status})`}`;
      } catch {
        return `${KIND_LABELS[kind]}: scan mislukt`;
      }
    }),
  );
  return results.filter((message): message is string => message !== null);
}

async function ownedProject(userId: string, projectId: unknown) {
  if (typeof projectId !== "string" || !projectId) notFound();
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) notFound();
  return project;
}

export async function addProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const url = normalizeSiteUrl(String(formData.get("url") ?? ""));
  if (!url) return { status: "error", message: "Vul een geldige website-URL in, bijvoorbeeld https://jouwsite.nl." };

  const urlError = await validatePublicScanUrl(url);
  if (urlError) return { status: "error", message: urlError };

  const count = await prisma.project.count({ where: { userId: user.id } });
  if (count >= MAX_PROJECTS_PER_USER) {
    return { status: "error", message: `Je kunt maximaal ${MAX_PROJECTS_PER_USER} websites volgen.` };
  }

  const project = await prisma.project.upsert({
    where: { userId_url: { userId: user.id, url } },
    update: {},
    create: { userId: user.id, url },
  });
  revalidatePath("/app");
  redirect(`/app/projects/${project.id}`);
}

export async function rescanProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const project = await ownedProject(user.id, formData.get("projectId"));

  try {
    const wait = await checkRateLimit("rescan-user", user.id, 10, 60 * 60);
    if (wait !== null) {
      return { status: "error", message: `Te veel herscans. Probeer het over ${Math.ceil(wait / 60)} minuten opnieuw.` };
    }
  } catch {
    return { status: "error", message: "Scanservice tijdelijk niet beschikbaar." };
  }

  const errors = await runScans(project.url);
  revalidatePath(`/app/projects/${project.id}`);
  revalidatePath("/app");
  return errors.length === 0
    ? { status: "ok", message: "Scan klaar. De grafiek is bijgewerkt." }
    : { status: "error", message: "Niet alle scans zijn gelukt.", errors };
}

export async function deleteProject(formData: FormData): Promise<void> {
  const user = await requireUser();
  const project = await ownedProject(user.id, formData.get("projectId"));
  await prisma.project.delete({ where: { id: project.id } });
  revalidatePath("/app");
  redirect("/app");
}

export async function logout(): Promise<void> {
  await destroyCurrentSession();
  redirect("/login");
}
