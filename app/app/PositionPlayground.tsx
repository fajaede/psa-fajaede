"use client";

import { useMemo, useState } from "react";
import { ACCENT, GRID, SERIES_COLORS, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY, useMeasuredWidth } from "@/components/chart-theme";
import { rankingText } from "@/lib/ranking-text";
import { cardStyles } from "./card-styles";
import {
  binned, positionIn, valueOf,
  type Distribution, type SimMetric, type SimScores, type ViewMetric,
} from "@/lib/position-sim";

export type NamedSite = { domain: string; scores: Partial<Record<SimMetric, number | null>>; role: string };

const VIEWS: { key: ViewMetric; label: string }[] = [
  { key: "overall", label: "Trust + Visibility" },
  { key: "psa", label: "PSA" },
  { key: "seo", label: "SEO" },
  { key: "geo", label: "GEO" },
  { key: "ai", label: "AI" },
];
const SLIDERS: { key: SimMetric; label: string }[] = [
  { key: "psa", label: "PSA (privacy en security)" },
  { key: "seo", label: "SEO" },
  { key: "geo", label: "GEO (lokale vindbaarheid)" },
  { key: "ai", label: "AI-zichtbaarheid" },
];

const BEATEN = SERIES_COLORS[0];   // sites scoring below you
const ABOVE = "#3a3a3a";           // sites scoring above you (neutral)
const SITE = SERIES_COLORS[3];     // named competitors

const H = 230;
const PAD = { top: 30, right: 12, bottom: 28, left: 34 };

function positionText(p: { rank: number; groupSize: number; percentile: number }): string {
  const r = rankingText(p.percentile);
  return `plek ${p.rank} van ${p.groupSize.toLocaleString("nl-NL")} · ${r.caption} ${r.short}`;
}

/** The group as a histogram with your position, plus sliders to see where better scores would put you. */
export function PositionPlayground({
  distribution, cohortLabel, current, named,
}: { distribution: Distribution; cohortLabel: string; current: SimScores; named: NamedSite[] }) {
  const [view, setView] = useState<ViewMetric>("overall");
  const [sim, setSim] = useState<SimScores>(current);
  const [activeBin, setActiveBin] = useState<number | null>(null);
  const [wrapRef, W] = useMeasuredWidth(680);

  const counts = distribution[view];
  const bins = useMemo(() => binned(counts), [counts]);
  const nowValue = valueOf(view, current);
  const simValue = valueOf(view, sim);
  const nowPos = nowValue === null ? null : positionIn(counts, nowValue);
  const simPos = simValue === null ? null : positionIn(counts, simValue);
  const changed = SLIDERS.some(({ key }) => sim[key] !== current[key]);

  const sites = named
    .map((site) => {
      const scores: SimScores = { psa: null, seo: null, geo: null, ai: null, ...site.scores } as SimScores;
      return { ...site, value: valueOf(view, scores) };
    })
    .filter((site): site is NamedSite & { value: number } => site.value !== null);
  const passed = nowValue !== null && simValue !== null
    ? sites.filter((s) => s.value > nowValue && s.value <= simValue)   // same score = no longer above you (rank)
    : [];
  const uniquePassed = [...new Map(passed.map((s) => [s.domain, s])).values()];

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const maxCount = Math.max(1, ...bins.map((b) => b.count));
  const x = (score: number) => PAD.left + (score / 100) * plotW;
  const y = (count: number) => PAD.top + (1 - count / maxCount) * plotH;
  const slot = plotW / bins.length;
  const yTicks = [0, Math.round(maxCount / 2), maxCount].filter((v, i, a) => a.indexOf(v) === i);

  // Competitor dots in a strip above the bars; sites on the same score stack upwards.
  const stacked = new Map<number, number>();
  const dots = sites.map((site) => {
    const level = stacked.get(site.value) ?? 0;
    stacked.set(site.value, level + 1);
    return { ...site, cx: x(site.value), cy: PAD.top - 10 - level * 12 };
  });

  const handlePointer = (event: React.PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;
    const px = ((event.clientX - rect.left) / rect.width) * W;
    setActiveBin(Math.max(0, Math.min(bins.length - 1, Math.floor((px - PAD.left) / slot))));
  };
  const handleKey = (event: React.KeyboardEvent<SVGRectElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      setActiveBin((b) => Math.max(0, Math.min(bins.length - 1, (b ?? 0) + delta)));
    } else if (event.key === "Escape") setActiveBin(null);
  };
  const active = activeBin !== null ? bins[activeBin] : null;
  const activeSites = active ? sites.filter((s) => s.value >= active.from && s.value <= active.to) : [];
  const viewLabel = VIEWS.find((v) => v.key === view)?.label ?? "";

  return (
    <section style={styles.card}>
      <h2 style={styles.h2}>Jouw positie en wat als</h2>
      <p style={styles.muted}>
        Alle {counts.reduce((a, b) => a + b, 0).toLocaleString("nl-NL")} {cohortLabel} uit de benchmark. Schuif met je
        scores en zie waar je dan zou staan.
      </p>

      <div role="tablist" aria-label="Score" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {VIEWS.map((v) => (
          <button key={v.key} role="tab" aria-selected={view === v.key} onClick={() => { setView(v.key); setActiveBin(null); }}
            style={{ ...styles.tab, ...(view === v.key ? styles.tabActive : {}) }}>
            {v.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", fontSize: 14 }} aria-live="polite">
        <span style={{ color: TEXT_SECONDARY }}>
          Nu: <strong style={{ color: TEXT_PRIMARY }}>{nowPos ? positionText(nowPos) : "nog niet gemeten"}</strong>
        </span>
        {changed && simPos && (
          <span style={{ color: TEXT_SECONDARY }}>
            Wat als: <strong style={{ color: ACCENT }}>{positionText(simPos)}</strong>
            {nowPos && nowPos.rank !== simPos.rank && (
              <> ({nowPos.rank > simPos.rank ? `${nowPos.rank - simPos.rank} plekken hoger` : `${simPos.rank - nowPos.rank} plekken lager`})</>
            )}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, color: TEXT_SECONDARY, fontSize: 12 }} aria-hidden="true">
        <Legend swatch={<span style={{ width: 10, height: 10, borderRadius: 2, background: BEATEN }} />} label="Sites onder je" />
        <Legend swatch={<span style={{ width: 10, height: 10, borderRadius: 2, background: ABOVE }} />} label="Sites boven je" />
        <Legend swatch={<span style={{ width: 0, height: 12, borderLeft: `2px dashed ${TEXT_PRIMARY}` }} />} label="Nu" />
        {changed && <Legend swatch={<span style={{ width: 2, height: 12, background: ACCENT }} />} label="Wat als" />}
        {dots.length > 0 && <Legend swatch={<span style={{ width: 8, height: 8, borderRadius: 4, background: SITE }} />} label="Concurrenten" />}
      </div>

      <div ref={wrapRef} style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
          role="img" aria-label={`Verdeling van ${viewLabel}-scores in de groep. Details in de tabel hieronder.`}>
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" fill={TEXT_SECONDARY} fontSize={12}>{t}</text>
            </g>
          ))}
          {[0, 25, 50, 75, 100].map((t) => (
            <text key={t} x={x(t)} y={H - 8} textAnchor={t === 0 ? "start" : t === 100 ? "end" : "middle"} fill={TEXT_SECONDARY} fontSize={12}>{t}</text>
          ))}
          {bins.map((bin, i) => {
            if (!bin.count) return null;
            const top = y(bin.count);
            const height = PAD.top + plotH - top;
            const r = Math.min(4, height, (slot - 2) / 2);
            const bx = PAD.left + i * slot + 1;
            const bw = slot - 2;
            const beaten = simValue !== null && bin.to < simValue;
            return (
              <path key={bin.from} fill={beaten ? BEATEN : ABOVE} opacity={activeBin === null || activeBin === i ? 1 : 0.6}
                d={`M${bx},${top + height} V${top + r} Q${bx},${top} ${bx + r},${top} H${bx + bw - r} Q${bx + bw},${top} ${bx + bw},${top + r} V${top + height} Z`} />
            );
          })}
          {nowValue !== null && (
            <g>
              <line x1={x(nowValue)} x2={x(nowValue)} y1={PAD.top - 4} y2={PAD.top + plotH} stroke={TEXT_PRIMARY} strokeWidth={2} strokeDasharray="4 3" />
              <MarkerLabel x={x(nowValue)} y={PAD.top + 12} text="jij" color={TEXT_PRIMARY} flip={nowValue > 85 || (changed && simValue !== null && simValue > nowValue && nowValue > 15)} />
            </g>
          )}
          {changed && simValue !== null && simValue !== nowValue && (
            <g>
              <line x1={x(simValue)} x2={x(simValue)} y1={PAD.top - 4} y2={PAD.top + plotH} stroke={ACCENT} strokeWidth={2} />
              <MarkerLabel x={x(simValue)} y={PAD.top + 12} text="wat als" color={ACCENT} flip={simValue > 85 || (nowValue !== null && simValue < nowValue && simValue > 15)} />
            </g>
          )}
          {dots.map((d) => (
            <circle key={d.domain} cx={d.cx} cy={d.cy} r={5} fill={SITE} stroke={SURFACE} strokeWidth={2}>
              <title>{`${d.domain} (${d.role}): ${viewLabel} ${d.value}`}</title>
            </circle>
          ))}
          <rect x={PAD.left} y={0} width={plotW} height={H - PAD.bottom} fill="transparent" tabIndex={0}
            aria-label="Gebruik de pijltjestoetsen om de groepen te bekijken"
            onPointerMove={handlePointer} onPointerLeave={() => setActiveBin(null)} onKeyDown={handleKey}
            onBlur={() => setActiveBin(null)} style={{ outline: "none", cursor: "crosshair" }} />
        </svg>
        {active && (
          <div role="status" style={{
            ...styles.tooltip,
            left: `${((PAD.left + (activeBin! + 0.5) * slot) / W) * 100}%`,
            transform: activeBin! > bins.length * 0.6 ? "translateX(calc(-100% - 8px))" : "translateX(8px)",
          }}>
            <div style={{ color: TEXT_SECONDARY }}>{viewLabel} {active.from}–{active.to}</div>
            <strong style={{ color: TEXT_PRIMARY }}>{active.count.toLocaleString("nl-NL")} {active.count === 1 ? "site" : "sites"}</strong>
            {activeSites.map((s) => <div key={s.domain} style={{ color: TEXT_SECONDARY }}>● {s.domain} ({s.value})</div>)}
          </div>
        )}
      </div>

      {uniquePassed.length > 0 && (
        <p style={{ ...styles.muted, color: TEXT_PRIMARY }}>
          Je zou voorbij gaan aan: {uniquePassed.map((s) => `${s.domain} (${s.value})`).join(", ")}.
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px 20px" }}>
        {SLIDERS.map(({ key, label }) => {
          const measured = current[key];
          const value = sim[key];
          return (
            <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: TEXT_SECONDARY }}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span>{label}</span>
                <span style={{ color: TEXT_PRIMARY }}>
                  {measured === null ? "niet gemeten" : value === measured ? measured : <>{measured} → <strong style={{ color: ACCENT }}>{value}</strong></>}
                </span>
              </span>
              <input type="range" min={0} max={100} step={1} value={value ?? 0} disabled={measured === null}
                onChange={(e) => setSim((s) => ({ ...s, [key]: Number(e.target.value) }))}
                style={{ accentColor: ACCENT, width: "100%" }} />
            </label>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ ...styles.muted, fontSize: 12 }}>
          Een schatting: andere sites veranderen ook. Hoe je een score verhoogt, staat bij &quot;Belangrijkste acties&quot;.
        </span>
        {changed && (
          <button type="button" onClick={() => setSim(current)} style={styles.reset}>Terug naar mijn scores</button>
        )}
      </div>

      <details>
        <summary style={{ color: TEXT_SECONDARY, fontSize: 13, cursor: "pointer" }}>Toon als tabel</summary>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 13 }}>
          <thead><tr><th style={styles.th}>{viewLabel}-score</th><th style={styles.th}>Aantal sites</th></tr></thead>
          <tbody>
            {bins.map((b) => (
              <tr key={b.from}><td style={styles.td}>{b.from}–{b.to}</td><td style={styles.td}>{b.count}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

/** Text beside a marker line, on a surface backing so bars never run through it. */
function MarkerLabel({ x, y, text, color, flip }: { x: number; y: number; text: string; color: string; flip: boolean }) {
  const width = text.length * 6.5 + 8;
  const left = flip ? x - 4 - width : x + 4;
  return (
    <g>
      <rect x={left} y={y - 11} width={width} height={16} rx={4} fill={SURFACE} opacity={0.9} />
      <text x={left + 4} y={y + 1} fill={color} fontSize={12} fontWeight={700}>{text}</text>
    </g>
  );
}

function Legend({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{swatch}{label}</span>;
}

const styles: Record<string, React.CSSProperties> = {
  ...cardStyles,
  tab: { background: "transparent", color: TEXT_SECONDARY, border: "1px solid #2a2a2a", borderRadius: 999, padding: "5px 12px", fontSize: 13, cursor: "pointer" },
  tabActive: { background: "#1d1d1d", color: TEXT_PRIMARY, borderColor: "#555" },
  tooltip: { position: "absolute", top: 8, pointerEvents: "none", background: "#0b0b0b", border: "1px solid #333", borderRadius: 8, padding: "8px 10px", fontSize: 12, display: "flex", flexDirection: "column", gap: 2, whiteSpace: "nowrap", zIndex: 1 },
  reset: { background: "transparent", color: ACCENT, border: "1px solid #1f4d3a", borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer" },
  th: { textAlign: "left", color: TEXT_SECONDARY, fontWeight: 600, padding: "4px 6px", borderBottom: "1px solid #2a2a2a" },
  td: { color: "#ddd", padding: "4px 6px", borderBottom: "1px solid #1d1d1d" },
};
