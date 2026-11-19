import type { CompetitorEntry, Competitors } from "@/lib/benchmark-api";

const METRIC_SHORT: Record<string, string> = { psa: "PSA", seo: "SEO", geo: "GEO", ai: "AI" };
const AUTHORITY_AHEAD = 10;   // same threshold as the other scores ("voor op" = at least 10 points)

/** Sites in the same group that score just above you, the leader, and where they are ahead. */
export function CompetitorsCard({ competitors }: { competitors: Competitors | null }) {
  if (!competitors) {
    return (
      <section style={styles.card}>
        <h2 style={styles.h2}>Concurrenten</h2>
        <p style={styles.muted}>Nog geen vergelijking: scan de site (PSA, SEO en GEO) zodra er benchmarkgegevens zijn.</p>
      </section>
    );
  }
  const { ahead, leader, behind, youLead, cohortLabel, groupSize, yourOverall, yourAuthority } = competitors;
  return (
    <section style={styles.card}>
      <h2 style={styles.h2}>Concurrenten</h2>
      <p style={styles.muted}>
        Vergeleken met {groupSize.toLocaleString("nl-NL")} {cohortLabel ?? "websites"} in de Fajaede-benchmark
        {yourOverall !== null && <> · jouw score: <strong style={{ color: "#f0efec" }}>{yourOverall}</strong></>}.
        Sites die net boven je staan zijn haalbare voorbeelden.
      </p>
      {yourAuthority !== null && (
        <p style={styles.muted}>
          Jouw autoriteit (links van andere sites): <strong style={{ color: "#f0efec" }}>{yourAuthority}</strong>
          {" "}· sterker dan {yourAuthority}% van alle domeinen met dezelfde extensie.
        </p>
      )}
      {youLead && <p style={{ ...styles.muted, color: "#00ff99" }}>Je staat bovenaan in deze groep.</p>}
      {ahead.length > 0 && (
        <>
          <h3 style={styles.h3}>Net boven je</h3>
          <ul style={styles.list}>{ahead.map((c) => <Row key={c.domain} entry={c} yourAuthority={yourAuthority} />)}</ul>
        </>
      )}
      {leader && (
        <>
          <h3 style={styles.h3}>{youLead ? "Sterkste andere site" : "Koploper"}</h3>
          <ul style={styles.list}><Row entry={leader} yourAuthority={yourAuthority} /></ul>
        </>
      )}
      {behind && !youLead && (
        <p style={styles.muted}>Net onder je: {behind.domain} ({behind.overall ?? "–"}).</p>
      )}
      <p style={{ ...styles.muted, fontSize: 12 }}>
        Scores van de homepage, gemeten door onze benchmark-crawler; &quot;voor op&quot; betekent minstens 10 punten hoger.
        Autoriteit komt uit de openbare linkkaart van Common Crawl.
      </p>
    </section>
  );
}

function Row({ entry, yourAuthority }: { entry: CompetitorEntry; yourAuthority: number | null }) {
  const ahead = entry.aheadOn.map((s) => `${s.label} (+${s.difference})`);
  if (entry.authority !== null && yourAuthority !== null && entry.authority - yourAuthority >= AUTHORITY_AHEAD) {
    ahead.push(`Autoriteit / links (+${entry.authority - yourAuthority})`);
  }
  return (
    <li style={styles.row}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <a href={`https://${entry.domain}`} target="_blank" rel="noopener noreferrer nofollow" style={styles.domain}>
          {entry.domain}
        </a>
        <span style={styles.score}>{entry.overall ?? "–"}</span>
      </div>
      <span style={styles.muted}>
        {[
          ...Object.entries(entry.scores).map(([k, v]) => `${METRIC_SHORT[k] ?? k} ${v ?? "–"}`),
          ...(entry.authority !== null ? [`Autoriteit ${entry.authority}`] : []),
        ].join(" · ")}
      </span>
      {ahead.length > 0 && (
        <span style={{ ...styles.muted, color: "#ffb347" }}>
          Voor op: {ahead.join(", ")}
        </span>
      )}
    </li>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { display: "flex", flexDirection: "column", gap: 10, padding: 20, background: "#111", border: "1px solid #2a2a2a", borderRadius: 16, minWidth: 0 },
  h2: { margin: 0, fontSize: 16 },
  h3: { margin: "6px 0 0", fontSize: 14, color: "#f0efec" },
  muted: { margin: 0, color: "#a8a7a0", fontSize: 14, lineHeight: 1.5 },
  list: { margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 },
  row: { display: "flex", flexDirection: "column", gap: 2, padding: "10px 12px", background: "#0b0b0b", border: "1px solid #222", borderRadius: 10 },
  domain: { color: "#f0efec", fontWeight: 700, textDecoration: "none", overflowWrap: "anywhere" },
  score: { color: "#00ff99", fontWeight: 800 },
};
