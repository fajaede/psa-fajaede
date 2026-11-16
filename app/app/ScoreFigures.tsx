import { KIND_LABELS } from "@/lib/projects";
import type { KindSummary } from "@/lib/dashboard-data";

const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });

/** Headline figures: latest score per scan kind with the change since the previous scan. */
export function ScoreFigures({ summaries }: { summaries: KindSummary[] }) {
  return (
    <div style={styles.grid}>
      {summaries.map(({ kind, latest, previous }) => {
        const delta = latest && previous ? latest.score - previous.score : null;
        return (
          <div key={kind} style={styles.tile}>
            <span style={styles.label}>{KIND_LABELS[kind]}-score</span>
            <span style={styles.value}>{latest ? latest.score : "–"}</span>
            <span style={styles.meta}>
              {!latest
                ? "Nog niet gescand"
                : delta === null
                  ? `Gemeten ${dateFmt.format(latest.createdAt)}`
                  : delta === 0
                    ? "Gelijk aan vorige scan"
                    : `${delta > 0 ? "▲" : "▼"} ${delta > 0 ? "+" : ""}${delta} sinds vorige scan`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 },
  tile: { display: "flex", flexDirection: "column", gap: 4, padding: 16, background: "#111", border: "1px solid #2a2a2a", borderRadius: 12, minWidth: 0 },
  label: { color: "#a8a7a0", fontSize: 13 },
  value: { color: "#f0efec", fontSize: 32, fontWeight: 800, lineHeight: 1.1 },
  meta: { color: "#a8a7a0", fontSize: 12 },
};
