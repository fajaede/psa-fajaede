import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  AUDIT_PAGES, ensureOrderAudit, FREE_VISIBLE_PAGES, getSiteAudit, isFreeAudit, lockAuditResult, rerunsLeft, type AuditIssue,
} from "@/lib/site-audit-api";
import { getGrossPriceCents } from "@/lib/vat";
import { RerunButton } from "./RerunButton";
import { COMPANY } from "@/components/LegalPage";
import { AutoRefresh } from "./AutoRefresh";

export const dynamic = "force-dynamic";
// Private report behind a secret link: keep it out of search engines.
export const metadata: Metadata = { title: "Site-audit | psa.fajaede.nl", robots: { index: false, follow: false } };

const SHOWN = 20; // URLs shown per issue before "Toon alle"

const SEVERITY: Record<AuditIssue["severity"], { label: string; color: string }> = {
  kritiek: { label: "Kritiek", color: "#ff4d4f" },
  belangrijk: { label: "Belangrijk", color: "#ffb347" },
  tip: { label: "Tip", color: "#7aa7ff" },
};

export default async function AuditPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) notFound();
  let order = await prisma.premiumOrder.findUnique({ where: { auditToken: token } });
  if (!order || !(order.status === "paid" || isFreeAudit(order))) notFound();
  if (!order.siteAuditId) {
    await ensureOrderAudit(order.id);                       // retry a start that failed at payment time
    order = await prisma.premiumOrder.findUnique({ where: { id: order.id } });
    if (!order) notFound();
  }
  const audit = order.siteAuditId ? await getSiteAudit(order.siteAuditId) : null;
  const pages = AUDIT_PAGES[order.tier] ?? 50;
  const running = !audit || audit.status === "queued" || audit.status === "running";
  const fullResult = audit?.status === "done" ? audit.result : null;
  // Free Site-audit: real totals, details of the first pages only; hidden URLs never leave the server.
  const locked = isFreeAudit(order);
  const lockedResult = locked && fullResult ? lockAuditResult(fullResult) : null;
  const result = lockedResult ?? fullResult;
  const unlockUrl = `/price?tier=SITE_AUDIT&audit=${token}&url=${encodeURIComponent(order.scanUrl ?? "")}`;
  const unlockPrice = locked ? Math.round(getGrossPriceCents("SITE_AUDIT") / 100) : 0;
  const unlockCard = lockedResult && (lockedResult.hiddenPages > 0 || lockedResult.hiddenFindings > 0) ? (
    <section style={styles.unlock}>
      <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 6 }}>
        <h2 style={{ ...styles.h2, margin: 0 }}>
          🔒 Nog {lockedResult.hiddenFindings} {lockedResult.hiddenFindings === 1 ? "probleem" : "problemen"} op {lockedResult.hiddenPages} andere pagina&apos;s
        </h2>
        <p style={styles.muted}>
          Gratis zie je alle soorten problemen en de details van de eerste {FREE_VISIBLE_PAGES} pagina&apos;s. Ontgrendel de
          volledige audit: per pagina wat er mis is, CSV-export om af te vinken en 1 keer gratis opnieuw controleren binnen 30 dagen.
        </p>
      </div>
      <a href={unlockUrl} style={styles.unlockButton}>Ontgrendel alle {pages} pagina&apos;s – €{unlockPrice}</a>
    </section>
  ) : null;

  return (
    <main style={styles.page}>
      <article style={styles.article}>
        <p style={styles.muted}>
          Site-audit · tot {pages} pagina&apos;s{locked ? ` · gratis versie: details van ${FREE_VISIBLE_PAGES} pagina's` : ""}
        </p>
        <h1 style={styles.h1}>{(order.scanUrl ?? "").replace(/^https?:\/\//, "")}</h1>

        {running && (
          <section style={styles.card}>
            <AutoRefresh seconds={10} />
            <h2 style={styles.h2}>{audit ? "De audit loopt…" : "De audit wordt gestart…"}</h2>
            <p style={styles.muted}>
              We bekijken je site pagina voor pagina. Dat duurt meestal 1 tot 5 minuten; deze pagina ververst vanzelf.
              {!audit && " Blijft dit langer dan 10 minuten staan, mail dan " + COMPANY.email + "."}
            </p>
          </section>
        )}

        {audit?.status === "failed" && (
          <section style={styles.card}>
            <h2 style={styles.h2}>De audit is niet gelukt</h2>
            <p style={styles.muted}>{audit.error ?? "Onbekende fout."}</p>
            <p style={styles.muted}>
              Blokkeert je website bots (bijvoorbeeld met Cloudflare)? Zie <a href="/bot" style={styles.link}>psa.fajaede.nl/bot</a>,
              pas dat aan en controleer opnieuw. Lukt het niet, mail dan {COMPANY.email}.
            </p>
            {!locked && (
              <div style={{ marginTop: 12 }}>
                <RerunButton token={token} left={rerunsLeft(order)} />
              </div>
            )}
          </section>
        )}

        {result && (
          <>
            <section style={styles.tiles}>
              <Tile label="Site-score" value={result.score ?? "–"} accent />
              <Tile label="Pagina's bekeken" value={result.summary.pages_crawled} />
              <Tile label="Kritiek" value={result.summary.issues.kritiek} color={SEVERITY.kritiek.color} />
              <Tile label="Belangrijk" value={result.summary.issues.belangrijk} color={SEVERITY.belangrijk.color} />
              <Tile label="Tips" value={result.summary.issues.tip} color={SEVERITY.tip.color} />
            </section>
            {result.summary.average_response_ms !== null && (
              <p style={styles.muted}>Gemiddelde laadtijd van de HTML: {(result.summary.average_response_ms / 1000).toFixed(1)} s.</p>
            )}

            {unlockCard}

            <section style={{ ...styles.card, display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 8 }}>
                <h2 style={{ ...styles.h2, margin: 0 }}>Zo werk je de punten af</h2>
                <p style={styles.muted}>
                  Begin bij <strong>Kritiek</strong>, dan Belangrijk, dan de tips. Klik een punt open voor de uitleg en de
                  pagina&apos;s. Download de lijst als CSV om af te vinken wat je hebt opgelost. Gebroken links in je
                  menu of footer pas je in WordPress aan onder <em>Weergave → Menu&apos;s</em> (of Widgets).
                </p>
                {locked
                  ? <a href={unlockUrl} style={styles.link}>CSV-export en opnieuw controleren: ontgrendel de volledige audit</a>
                  : <a href={`/audit/${token}/csv`} style={styles.link}>Download alle punten als CSV</a>}
              </div>
              {!locked && <RerunButton token={token} left={rerunsLeft(order)} />}
            </section>

            <section style={styles.card}>
              <h2 style={styles.h2}>Verbeterpunten</h2>
              {result.issues.length === 0 ? (
                <p style={styles.muted}>Geen problemen gevonden. Netjes!</p>
              ) : (
                result.issues.map((issue) => (
                  <details key={issue.code} style={styles.issue}>
                    <summary style={styles.summary}>
                      <span style={{ ...styles.badge, background: SEVERITY[issue.severity].color }}>{SEVERITY[issue.severity].label}</span>
                      <strong>{issue.title}</strong> <span style={styles.muted}>({issue.count})</span>
                    </summary>
                    <p style={{ ...styles.muted, margin: "8px 0" }}>{issue.explanation}</p>
                    <ul style={styles.urls}>
                      {issue.urls.slice(0, SHOWN).map((url) => <li key={url} style={styles.url}>{url}</li>)}
                    </ul>
                    {issue.urls.length > SHOWN && (
                      <details style={{ marginTop: 6 }}>
                        <summary style={{ ...styles.muted, cursor: "pointer" }}>Toon alle {issue.urls.length}</summary>
                        <ul style={{ ...styles.urls, marginTop: 6 }}>
                          {issue.urls.slice(SHOWN).map((url) => <li key={url} style={styles.url}>{url}</li>)}
                        </ul>
                      </details>
                    )}
                    {issue.count > issue.urls.length && (locked ? (
                      <p style={styles.muted}>
                        🔒 …en nog {issue.count - issue.urls.length} andere. <a href={unlockUrl} style={styles.link}>Ontgrendel om te zien welke</a>
                      </p>
                    ) : (
                      <p style={styles.muted}>…en nog {issue.count - issue.urls.length} andere (zie de CSV).</p>
                    ))}
                  </details>
                ))
              )}
            </section>

            <section style={styles.card}>
              <h2 style={styles.h2}>Per pagina</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Pagina</th><th style={styles.th}>Status</th><th style={styles.th}>SEO</th>
                      <th style={styles.th}>Woorden</th><th style={styles.th}>Punten</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.pages.map((p) => (
                      <tr key={p.url}>
                        <td style={styles.td}><span style={styles.url}>{p.url.replace(/^https?:\/\/[^/]+/, "") || "/"}</span></td>
                        <td style={{ ...styles.td, color: p.status && p.status < 400 ? "#d6d5cf" : "#ff4d4f" }}>{p.status ?? "fout"}</td>
                        <td style={styles.td}>{p.seo_score ?? "–"}</td>
                        <td style={styles.td}>{p.word_count ?? "–"}</td>
                        <td style={styles.td}>{p.issues.length}</td>
                      </tr>
                    ))}
                    {lockedResult && lockedResult.hiddenPages > 0 && (
                      <tr>
                        <td colSpan={5} style={{ ...styles.td, color: "#a8a7a0" }}>
                          🔒 Nog {lockedResult.hiddenPages} pagina&apos;s. <a href={unlockUrl} style={styles.link}>Ontgrendel de volledige audit</a>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            <p style={styles.muted}>
              Gemeten op {audit?.finished_at ? new Date(audit.finished_at).toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" }) : "–"} door
              onze scanner FajaedeScan, die robots.txt volgt. Dit is een technische controle van de HTML; echte laadsnelheid
              (Core Web Vitals) en backlinks worden niet gemeten.
            </p>
            {unlockCard}
          </>
        )}
      </article>
    </main>
  );
}

function Tile({ label, value, accent, color }: { label: string; value: number | string; accent?: boolean; color?: string }) {
  return (
    <div style={styles.tile}>
      <span style={styles.muted}>{label}</span>
      <span style={{ fontSize: 30, fontWeight: 800, color: color ?? (accent ? "#00ff99" : "#f0efec") }}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#050505", color: "#d6d5cf", fontFamily: "system-ui, -apple-system, sans-serif", padding: "32px 16px 64px", boxSizing: "border-box" },
  article: { maxWidth: 960, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 },
  h1: { margin: 0, fontSize: 28, color: "#f0efec", overflowWrap: "anywhere" },
  h2: { margin: "0 0 10px", fontSize: 18, color: "#f0efec" },
  muted: { margin: 0, color: "#a8a7a0", fontSize: 14, lineHeight: 1.6 },
  link: { color: "#00ff99" },
  card: { padding: 20, background: "#111", border: "1px solid #2a2a2a", borderRadius: 16 },
  tiles: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 },
  tile: { display: "flex", flexDirection: "column", gap: 4, padding: 16, background: "#111", border: "1px solid #2a2a2a", borderRadius: 12 },
  issue: { borderTop: "1px solid #222", padding: "10px 0" },
  summary: { cursor: "pointer", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", color: "#eee" },
  badge: { color: "#050505", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 999 },
  urls: { margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 },
  url: { fontSize: 13, color: "#ccc", overflowWrap: "anywhere" },
  table: { width: "100%", minWidth: 560, borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #333", color: "#f0efec" },
  td: { padding: "8px 10px", borderBottom: "1px solid #222", verticalAlign: "top" },
  unlock: { padding: 20, background: "linear-gradient(135deg, rgba(0,255,153,0.10), rgba(0,170,255,0.08))", border: "1px solid rgba(0,255,153,0.45)",
    borderRadius: 16, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" },
  unlockButton: { background: "#00ff99", color: "#050505", fontWeight: 800, padding: "12px 20px", borderRadius: 10, textDecoration: "none",
    whiteSpace: "nowrap" },
};
