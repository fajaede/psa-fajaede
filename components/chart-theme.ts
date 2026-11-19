"use client";

import { useEffect, useRef, useState } from "react";

// Chart colors for the dark dashboard, shared by all charts.
// Categorical slots 1-3 of the reference palette (dark steps), validated on the
// #111111 surface: all-pairs CVD ΔE ≥ 9.4, normal-vision ΔE ≥ 20.9, contrast ≥ 3:1.
// Slot 4 is a light gold: separated from the orange by lightness, not hue alone.
export const SERIES_COLORS = ["#3987e5", "#d95926", "#199e70", "#d4b03a"];
export const SURFACE = "#111111";
export const GRID = "#2a2a2a";
export const TEXT_PRIMARY = "#f0efec";
export const TEXT_SECONDARY = "#a8a7a0";
export const ACCENT = "#00ff99";

/** Width of the wrapper in real pixels, so SVG text stays 12px on phones instead of scaling down. */
export function useMeasuredWidth(initial: number, min = 280) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(min, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, [min]);
  return [ref, width] as const;
}
