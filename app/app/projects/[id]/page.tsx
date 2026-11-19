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
import { actionPlan, growthScores, type LatestByKind } from "@/lib/growth-overview";
import { compareWithBenchmark, competitiveScore, getBacklinks, getCompetitors } from "@/lib/benchmark-api";
import { CompetitorsCard } from "../../CompetitorsCard";
import { PositionPlayground } from "../../PositionPlayground";
import { BacklinksCard } from "../../BacklinksCard";
import { rankingText } from "@/lib/ranking-text";
import { normalizeSiteUrl } from "@/lib/url-normalize";

type AiCheck = { label: string; status: string; details: string };

function aiChecks(details: unknown): AiCheck[] {
  const checks = (details as { checks?: unknown } | null)?.checks;
  return Array.isArray(checks)
    ? checks.filter((c): c is AiCheck => !!c && typeof c.label === "string" && typeof c.status === "string" && typeof c.details === "string")
    : [];
}

const AI_STATUS: Record<string, { icon: string; color: string }> = {
  pass: { icon: "✓", color: "#00ff99" },
  warning: { icon: "⚠", color: "#ffb347" },
  unknown: { icon: "?", color: "#a8a7a0" },
  "not-measured": { icon: "–", color: "#a8a7a0" },
};

const OVERVIEW: { key: "trust" | "visibility" | "competitive" | "overall"; label: string; hint: string }[] = [
  { key: "trust", label: "Trust", hint: "PSA: privacy, security, age-safety" },
  { key: "visibility", label: "Visibility", hint: "SEO + GEO + AI-zichtbaarheid" },
  { key: "competitive", label: "Competitive", hint: "Benchmark tegen vergelijkbare sites" },
  { key: "overall", label: "Overall", hint: "Gecombineerde Fajaede-score" },
];

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

  const [summaries, history, psaReport, paidOrders] = await Promise.all([
    latestScores(project.url),
    scoreHistory(project.url),
    prisma.psaScan.findUnique({ where: { url: project.url }, select: { urlHash: true, isPaid: true } }),
    // Only audits this user paid for (same e-mail address), never someone else's report.
    prisma.premiumOrder.findMany({
      where: { status: "paid", auditToken: { not: null }, email: { equals: user.email, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      select: { scanUrl: true, auditToken: true, createdAt: true },
      take: 50,
    }),
  ]);
  const siteAudit = paidOrders.find((o) => o.scanUrl && normalizeSiteUrl(o.scanUrl) === project.url);

  const latest: LatestByKind = Object.fromEntries(summaries.map(({ kind, latest: l }) => [kind, l]));
  const measured = { psa: latest.psa?.score, seo: latest.seo?.score, geo: latest.geo?.score, ai: latest.ai?.score };
  const [comparison, competitors, backlinks] = await Promise.all([
    compareWithBenchmark(project.url, measured),
    getCompetitors(project.url, measured),
    getBacklinks(project.url),
  ]);
  const extension = `.${project.url.replace(/^https?:\/\//, "").split(/[/:?#]/)[0].split(".").pop() || "nl"}`;
  const scores = growthScores(latest, competitiveScore(comparison));
  const actions = actionPlan(latest);
  const anyCohort = Object.values(comparison?.metrics ?? {})[0];
  const tileHint = (key: (typeof OVERVIEW)[number]["key"], hint: string): string => {
    if (key === "trust" && comparison?.metrics.psa) {
      const m = comparison.metrics.psa;
      const text = rankingText(m.percentile);
      return `${text.caption === "top" ? "Top" : "Beter dan"} ${text.short} van ${m.groupSize} ${m.cohortLabel}`;
    }
    if (key === "competitive" && anyCohort) return `Gemiddeld percentiel t.o.v. vergelijkbare ${anyCohort.cohortLabel}`;
    return hint;
  };

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
            {siteAudit?.auditToken && (
              <> · <Link href={`/audit/${siteAudit.auditToken}`} style={{ color: "#00ff99" }}>Volledige site-audit</Link></>
            )}
          </p>
        </div>
        <RescanButton projectId={project.id} />
      </section>

      <section style={styles.card}>
        <h2 style={styles.h2}>Trust & Growth</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {OVERVIEW.map(({ key, label, hint }) => (
            <div key={key} style={styles.tile}>
              <span style={styles.muted}>{label}</span>
              <span style={{ fontSize: 30, fontWeight: 800, color: key === "overall" ? "#00ff99" : "#f0efec" }}>
                {scores[key] ?? "–"}
              </span>
              <span style={{ color: "#a8a7a0", fontSize: 12 }}>
                {scores[key] === null ? (key === "competitive" ? "Nog geen benchmark" : "Nog niet gemeten") : tileHint(key, hint)}
              </span>
            </div>
          ))}
        </div>
        <h3 style={{ ...styles.h2, marginTop: 8 }}>Belangrijkste acties</h3>
        {actions.length === 0 ? (
          <p style={styles.muted}>Geen verbeterpunten gevonden in de laatste scans.</p>
        ) : (
          <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6, color: "#ddd", fontSize: 14 }}>
            {actions.map((action) => (
              <li key={action.title}>
                <span style={{ color: "#a8a7a0", fontSize: 12 }}>[{KIND_LABELS[action.source]}]</span> {action.title}
              </li>
            ))}
          </ol>
        )}
      </section>

      <CompetitorsCard competitors={competitors} />

      {competitors?.distribution && (
        <PositionPlayground
          distribution={competitors.distribution}
          cohortLabel={competitors.cohortLabel ?? "websites"}
          current={{ psa: measured.psa ?? null, seo: measured.seo ?? null, geo: measured.geo ?? null, ai: measured.ai ?? null }}
          named={[
            ...competitors.ahead.map((c) => ({ domain: c.domain, scores: c.scores, role: "net boven je" })),
            ...(competitors.leader ? [{ domain: competitors.leader.domain, scores: competitors.leader.scores, role: "koploper" }] : []),
            ...(competitors.behind ? [{ domain: competitors.behind.domain, scores: competitors.behind.scores, role: "net onder je" }] : []),
          ]}
        />
      )}

      <BacklinksCard backlinks={backlinks} extension={extension} />

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
          if (kind === "ai") {
            const checks = latest ? aiChecks(latest.details) : [];
            return (
              <div key={kind} style={styles.card}>
                <h2 style={styles.h2}>AI-zichtbaarheid</h2>
                {checks.length === 0 ? (
                  <p style={styles.muted}>Nog niet gemeten. Doe een nieuwe scan; de GEO-scan meet ook de AI-zichtbaarheid.</p>
                ) : (
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
                    {checks.map((check) => {
                      const s = AI_STATUS[check.status] ?? AI_STATUS.unknown;
                      return (
                        <li key={check.label} style={{ display: "flex", gap: 8 }}>
                          <span style={{ color: s.color, fontWeight: 700, width: 14, flexShrink: 0 }}>{s.icon}</span>
                          <span style={{ color: "#ddd" }}><strong>{check.label}</strong> <span style={{ color: "#a8a7a0" }}>{check.details}</span></span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          }
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
  tile: { display: "flex", flexDirection: "column", gap: 4, padding: 14, background: "#0b0b0b", border: "1px solid #2a2a2a", borderRadius: 12, minWidth: 0 },
};
