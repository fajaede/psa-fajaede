import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { latestScores } from "@/lib/dashboard-data";
import { MAX_PROJECTS_PER_USER } from "@/lib/projects";
import { AddProjectForm } from "./DashboardForms";
import { ScoreFigures } from "./ScoreFigures";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const user = await requireUser();
  const projects = await prisma.project.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const summaries = await Promise.all(projects.map((project) => latestScores(project.url)));
  const full = projects.length >= MAX_PROJECTS_PER_USER;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Mijn websites</h1>
        <p style={{ margin: 0, color: "#a8a7a0" }}>
          Volg tot {MAX_PROJECTS_PER_USER} websites. Elke scan wordt bewaard, zodat je ziet of je PSA-, SEO- en GEO-score vooruitgaat.
        </p>
        <AddProjectForm disabled={full} />
        {full && <p style={{ margin: 0, color: "#a8a7a0", fontSize: 14 }}>Je volgt het maximale aantal websites. Verwijder er één om een andere toe te voegen.</p>}
      </section>

      {projects.length === 0 ? (
        <p style={{ color: "#a8a7a0" }}>Je volgt nog geen websites. Voeg hierboven je eerste site toe.</p>
      ) : (
        projects.map((project, i) => (
          <section key={project.id} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 20, background: "#0b0b0b", border: "1px solid #222", borderRadius: 16 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, overflowWrap: "anywhere" }}>{project.url.replace(/^https?:\/\//, "")}</h2>
              <Link href={`/app/projects/${project.id}`} style={{ color: "#00ff99", textDecoration: "none", fontWeight: 700 }}>
                Details en grafiek →
              </Link>
            </div>
            <ScoreFigures summaries={summaries[i]} />
          </section>
        ))
      )}
    </div>
  );
}
