import type { Backlinks } from "@/lib/benchmark-api";
import { cardStyles } from "./card-styles";

const MONTHS: Record<string, string> = {
  jan: "jan", feb: "feb", mar: "mrt", apr: "apr", may: "mei", jun: "jun",
  jul: "jul", aug: "aug", sep: "sep", oct: "okt", nov: "nov", dec: "dec",
};

/** "cc-main-2026-aug-sep-oct" -> "aug–okt 2026" */
export function releaseLabel(release: string | null): string | null {
  const match = release?.match(/^cc-main-(\d{4})-([a-z]{3})(?:-[a-z]{3})*-([a-z]{3})$/);
  if (!match) return null;
  const [, year, first, last] = match;
  return `${MONTHS[first] ?? first}–${MONTHS[last] ?? last} ${year}`;
}

const nf = (n: number) => n.toLocaleString("nl-NL");

/** Referring domains and link authority from the open Common Crawl web graph. */
export function BacklinksCard({ backlinks, extension }: { backlinks: Backlinks | null; extension: string }) {
  if (!backlinks) return null;
  const { authority, authorityRank, authorityOf, referringDomains, referringLocal, topReferring, release } = backlinks;
  const period = releaseLabel(release);
  return (
    <section style={styles.card}>
      <h2 style={styles.h2}>Links naar je site</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <div style={styles.tile}>
          <span style={styles.muted}>Verwijzende domeinen</span>
          <span style={styles.big}>{referringDomains === null ? "–" : nf(referringDomains)}</span>
          <span style={styles.hint}>
            {referringDomains === null ? "Nog niet berekend"
              : referringLocal !== null ? `waarvan ${nf(referringLocal)} .nl/.be` : "unieke websites die naar je linken"}
          </span>
        </div>
        <div style={styles.tile}>
          <span style={styles.muted}>Autoriteit</span>
          <span style={styles.big}>{authority ?? "–"}</span>
          <span style={styles.hint}>
            {authority === null ? "Nog niet bekend"
              : authorityRank !== null && authorityOf !== null
                ? `Plek ${nf(authorityRank)} van ${nf(authorityOf)} ${extension}-sites met links`
                : authority === 0 ? "Nog geen links gevonden" : `Schaal 0–100; 100 = sterkste ${extension}-site`}
          </span>
        </div>
      </div>
      {topReferring.length > 0 && (
        <>
          <h3 style={styles.h3}>Sterkste .nl/.be-sites die naar je linken</h3>
          <ul style={styles.list}>
            {topReferring.map((t) => (
              <li key={t.domain} style={styles.row}>
                <a href={`https://${t.domain}`} target="_blank" rel="noopener noreferrer nofollow" style={styles.domain}>{t.domain}</a>
                <span style={styles.hint}>autoriteit {t.authority}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {referringDomains === 0 && (
        <p style={styles.muted}>
          Er zijn nog geen links van andere sites gevonden. Links van brancheorganisaties, leveranciers, lokale
          gidsen en partners zijn een goed begin.
        </p>
      )}
      <p style={{ ...styles.muted, fontSize: 12 }}>
        Bron: de openbare linkkaart van Common Crawl{period ? ` (${period})` : ""}, op domeinniveau. Autoriteit
        is logaritmisch, net als bij bekende SEO-tools: elke stap omhoog is moeilijker. Nieuwe links
        verschijnen pas bij de volgende uitgave, eens per paar maanden.
      </p>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  ...cardStyles,
  big: { fontSize: 30, fontWeight: 800, color: "#f0efec" },
  tile: { display: "flex", flexDirection: "column", gap: 4, padding: 14, background: "#0b0b0b", border: "1px solid #2a2a2a", borderRadius: 12, minWidth: 0 },
  list: { ...cardStyles.list, gap: 6 },
  row: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "8px 12px", background: "#0b0b0b", border: "1px solid #222", borderRadius: 10 },
};
