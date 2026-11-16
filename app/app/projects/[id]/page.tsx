import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { latestScores, scoreHistory } from "@/lib/dashboard-data";
import { KIND_LABELS } from "@/lib/projects";
import { ScoreHistoryChart } from "@/components/ScoreHistoryChart";
import { RescanButton } from "../../DashboardForms";
import { ScoreFigures } from "../../ScoreFigures";
import { deleteProject } from "../../actions";

export const dynamic = "force-dynamic";

type Details = {
  issues?: unknown;
  privacy?: { note?: string };
  security?: { note?: string };
  age?: { note?: string };
};

function findings(kind: string, details: unknown): string[] {
  const d = (details && typeof details === "object" ? details : {}) as Details;
  if (kind === "psa") {
    return [d.privacy?.note, d.security?.note, d.age?.note].filter((note): note is string => typeof note === "string");
  }
  return Array.isArray(d.issues) ? d.issues.filter((issue): issue is string => typeof issue === "string").slice(0, 8) : [];
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) notFound();

  const [summaries, history, psaReport] = await Promise.all([
    latestScores(project.url),
    scoreHistory(project.url),
    prisma.psaScan.findUnique({ where: { url: project.url }, select: { urlHash: true, isPaid: true } }),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <Link href="/app" style={{ color: "#a8a7a0", textDecoration: "none", fontSize: 14 }}>← Alle websites</Link>

      <section style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 26, overflowWrap: "anywhere" }}>{project.url.replace(/^https?:\/\//, "")}</h1>
          <p style={{ margin: "6px 0 0", color: "#a8a7a0", fontSize: 14 }}>
            PSA-licentie: {psaReport?.isPaid ? "actief (Trust Badge geverifieerd)" : "niet actief"}
            {psaReport && (
              <> · <Link href={`/report/${psaReport.urlHash}`} style={{ color: "#00ff99" }}>PSA-rapport en Trust Badge</Link></>
            )}
          </p>
        </div>
        <RescanButton projectId={project.id} />
      </section>

      <ScoreFigures summaries={summaries} />

      <section style={styles.card}>
        <h2 style={styles.h2}>Scoreverloop</h2>
        <ScoreHistoryChart
          series={history.map((h) => ({ key: h.kind, label: KIND_LABELS[h.kind], points: h.points }))}
        />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {summaries.map(({ kind, latest }) => {
          const items = latest ? findings(kind, latest.details) : [];
          return (
            <div key={kind} style={styles.card}>
              <h2 style={styles.h2}>Laatste {KIND_LABELS[kind]}-bevindingen</h2>
              {items.length === 0 ? (
                <p style={styles.muted}>{latest ? "Geen problemen gevonden." : "Nog niet gescand."}</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6, color: "#ddd", fontSize: 14 }}>
                  {items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <form action={deleteProject}>
        <input type="hidden" name="projectId" value={project.id} />
        <button type="submit" style={{ background: "transparent", color: "#ff9b9b", border: "1px solid #5a2a2a", borderRadius: 6, padding: "8px 14px", cursor: "pointer" }}>
          Website niet meer volgen
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { display: "flex", flexDirection: "column", gap: 12, padding: 20, background: "#111", border: "1px solid #2a2a2a", borderRadius: 16, minWidth: 0 },
  h2: { margin: 0, fontSize: 16 },
  muted: { margin: 0, color: "#a8a7a0", fontSize: 14 },
};
