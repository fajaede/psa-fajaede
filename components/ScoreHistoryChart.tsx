"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type ScorePoint = { t: string; score: number };
export type ScoreSeries = { key: string; label: string; points: ScorePoint[] };

// Categorical slots 1-3 of the reference palette (dark steps), validated on the
// #111111 surface: all-pairs CVD ΔE ≥ 9.4, normal-vision ΔE ≥ 20.9, contrast ≥ 3:1.
// Slot 4 (AI) is a light gold: separated from the orange by lightness, not hue alone.
const SERIES_COLORS = ["#3987e5", "#d95926", "#199e70", "#d4b03a"];

const SURFACE = "#111111";
const GRID = "#2a2a2a";
const TEXT_PRIMARY = "#f0efec";
const TEXT_SECONDARY = "#a8a7a0";

const DEFAULT_WIDTH = 720;
const MIN_WIDTH = 280;
const H = 280;
const PAD = { top: 16, right: 88, bottom: 32, left: 36 };
const Y_TICKS = [0, 25, 50, 75, 100];

const dateFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });
const timeFmt = new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
const dateTimeFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

/** Score (0-100) of each series over time, one y-axis, with crosshair tooltip and a table view. */
export function ScoreHistoryChart({ series }: { series: ScoreSeries[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Draw at the real pixel width so text stays 12px on phones instead of scaling down.
  const [W, setW] = useState(DEFAULT_WIDTH);
  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setW(Math.max(MIN_WIDTH, Math.round(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const prepared = useMemo(
    () =>
      series.map((s, i) => ({
        ...s,
        color: SERIES_COLORS[i % SERIES_COLORS.length],
        pts: s.points
          .map((p) => ({ time: new Date(p.t).getTime(), score: p.score }))
          .filter((p) => Number.isFinite(p.time))
          .sort((a, b) => a.time - b.time),
      })),
    [series],
  );

  // Every distinct measurement moment across all series: the crosshair snaps to these.
  const times = useMemo(
    () => [...new Set(prepared.flatMap((s) => s.pts.map((p) => p.time)))].sort((a, b) => a - b),
    [prepared],
  );

  if (times.length === 0) {
    return <p style={{ color: TEXT_SECONDARY, margin: 0 }}>Nog geen metingen. Klik op &quot;Nu opnieuw scannen&quot; om te beginnen.</p>;
  }

  const minT = times[0];
  const maxT = times[times.length - 1];
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (t: number) => (maxT === minT ? PAD.left + plotW / 2 : PAD.left + ((t - minT) / (maxT - minT)) * plotW);
  const y = (score: number) => PAD.top + (1 - score / 100) * plotH;

  // Latest value of a series at or before time t (series are measured at different moments).
  const valueAt = (pts: { time: number; score: number }[], t: number) => {
    let found: { time: number; score: number } | null = null;
    for (const p of pts) {
      if (p.time <= t) found = p;
      else break;
    }
    return found;
  };

  // Short spans show the time of day; longer spans the date. Duplicate labels are dropped.
  const shortSpan = maxT - minT < 2 * 24 * 60 * 60 * 1000;
  const tickLabel = (t: number) => (shortSpan ? timeFmt.format(t) : dateFmt.format(t));
  const candidateTicks = times.length <= 4 ? times : [times[0], times[Math.floor(times.length / 3)], times[Math.floor((2 * times.length) / 3)], times[times.length - 1]];
  const xTicks: number[] = [];
  for (const t of candidateTicks) {
    const last = xTicks[xTicks.length - 1];
    if (last !== undefined && (tickLabel(last) === tickLabel(t) || x(t) - x(last) < 60)) continue;
    xTicks.push(t);
  }
  const tickAnchor = (t: number) => (x(t) - PAD.left < 30 ? "start" : W - PAD.right - x(t) < 30 ? "end" : "middle");

  const handlePointer = (event: React.PointerEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < times.length; i++) {
      if (Math.abs(x(times[i]) - px) < Math.abs(x(times[best]) - px)) best = i;
    }
    setActiveIndex(best);
  };

  const handleKey = (event: React.KeyboardEvent<SVGRectElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      setActiveIndex((current) => Math.max(0, Math.min(times.length - 1, (current ?? times.length - 1) + delta)));
    } else if (event.key === "Escape") {
      setActiveIndex(null);
    }
  };

  const activeTime = activeIndex !== null ? times[activeIndex] : null;
  const tooltipLeftPct = activeTime !== null ? (x(activeTime) / W) * 100 : 0;

  return (
    <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Legend: identity is never color alone (key + name). */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }} aria-hidden="true">
        {prepared.map((s) => (
          <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: TEXT_SECONDARY, fontSize: 13 }}>
            <span style={{ width: 16, height: 2, background: s.color, borderRadius: 1 }} />
            {s.label}
          </span>
        ))}
      </div>

      <div ref={wrapRef} style={{ position: "relative" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
          role="img"
          aria-label={`Scoreverloop van ${prepared.map((s) => s.label).join(", ")}. Details in de tabel hieronder.`}
        >
          {Y_TICKS.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} stroke={GRID} strokeWidth={1} />
              <text x={PAD.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fill={TEXT_SECONDARY} fontSize={12}>
                {tick}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={t} x={x(t)} y={H - 8} textAnchor={tickAnchor(t)} fill={TEXT_SECONDARY} fontSize={12}>
              {tickLabel(t)}
            </text>
          ))}

          {prepared.map((s) =>
            s.pts.length > 1 ? (
              <polyline
                key={s.key}
                points={s.pts.map((p) => `${x(p.time)},${y(p.score)}`).join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null,
          )}

          {/* End markers with a 2px surface ring + direct end labels in text ink. */}
          {(() => {
            const ends = prepared
              .filter((s) => s.pts.length > 0)
              .map((s) => ({ s, last: s.pts[s.pts.length - 1] }))
              .sort((a, b) => y(a.last.score) - y(b.last.score));
            // Keep end labels at least 16px apart; a thin leader connects shifted labels.
            const labelY: number[] = [];
            ends.forEach((e, i) => {
              const target = y(e.last.score);
              labelY.push(i === 0 ? target : Math.max(target, labelY[i - 1] + 16));
            });
            return ends.map((e, i) => {
              const ex = x(e.last.time);
              const ey = y(e.last.score);
              const ly = labelY[i];
              return (
                <g key={e.s.key}>
                  <circle cx={ex} cy={ey} r={5} fill={e.s.color} stroke={SURFACE} strokeWidth={2} />
                  {Math.abs(ly - ey) > 1 && <line x1={ex + 6} y1={ey} x2={W - PAD.right + 6} y2={ly} stroke={GRID} strokeWidth={1} />}
                  <text x={W - PAD.right + 10} y={ly} dominantBaseline="middle" fill={TEXT_PRIMARY} fontSize={12}>
                    {e.s.label} <tspan fontWeight={700}>{e.last.score}</tspan>
                  </text>
                </g>
              );
            });
          })()}

          {activeTime !== null && (
            <g pointerEvents="none">
              <line x1={x(activeTime)} x2={x(activeTime)} y1={PAD.top} y2={H - PAD.bottom} stroke={TEXT_SECONDARY} strokeWidth={1} />
              {prepared.map((s) => {
                const v = valueAt(s.pts, activeTime);
                return v ? <circle key={s.key} cx={x(activeTime)} cy={y(v.score)} r={5} fill={s.color} stroke={SURFACE} strokeWidth={2} /> : null;
              })}
            </g>
          )}

          {/* Hit target: the whole plot area, larger than the marks; keyboard via arrow keys. */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            tabIndex={0}
            aria-label="Grafiek verkennen: gebruik pijltje links en rechts"
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex((current) => current ?? times.length - 1)}
            onBlur={() => setActiveIndex(null)}
            onKeyDown={handleKey}
            style={{ outline: "none", cursor: "crosshair" }}
          />
        </svg>

        {activeTime !== null && (
          <div
            role="status"
            style={{
              position: "absolute",
              top: 8,
              left: `${tooltipLeftPct}%`,
              transform: tooltipLeftPct > 60 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
              background: "#1c1c1b",
              border: `1px solid ${GRID}`,
              borderRadius: 8,
              padding: "8px 12px",
              pointerEvents: "none",
              fontSize: 13,
              color: TEXT_SECONDARY,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ marginBottom: 4 }}>{dateTimeFmt.format(activeTime)}</div>
            {prepared.map((s) => {
              const v = valueAt(s.pts, activeTime);
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: s.color }} />
                  <strong style={{ color: TEXT_PRIMARY }}>{v ? v.score : "–"}</strong>
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <details>
        <summary style={{ color: TEXT_SECONDARY, fontSize: 13, cursor: "pointer" }}>Toon als tabel</summary>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 13 }}>
          <thead>
            <tr>
              <th style={tableHead}>Moment</th>
              {prepared.map((s) => <th key={s.key} style={tableHead}>{s.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {[...times].reverse().map((t) => (
              <tr key={t}>
                <td style={tableCell}>{dateTimeFmt.format(t)}</td>
                {prepared.map((s) => {
                  const exact = s.pts.find((p) => p.time === t);
                  return <td key={s.key} style={tableCell}>{exact ? exact.score : ""}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

const tableHead: React.CSSProperties = { textAlign: "left", color: TEXT_SECONDARY, fontWeight: 600, padding: "6px 8px", borderBottom: `1px solid ${GRID}` };
const tableCell: React.CSSProperties = { color: TEXT_PRIMARY, padding: "6px 8px", borderBottom: `1px solid ${GRID}` };
